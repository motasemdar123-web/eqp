const { PrismaClient, RoleCode } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const rolePermissions = {
  SUPER_ADMIN: ['USERS_MANAGE', 'SCHEDULE_MANAGE', 'REPORTS_READ', 'EQP_MANAGE', 'SYSTEM_CONFIGURE'],
  GENERAL_MANAGER: ['REPORTS_READ'],
  OPERATIONS_MANAGER: ['SCHEDULE_MANAGE', 'REPORTS_READ'],
  MAINTENANCE_SUPERVISOR: ['SCHEDULE_MANAGE', 'REPORTS_READ', 'EQP_MANAGE'],
  FIELD_TECHNICIAN: ['SCHEDULE_MANAGE'],
  CALL_CENTER: [],
  WAREHOUSE_OFFICER: [],
  FINANCE: ['REPORTS_READ'],
  CLIENT: [],
  SYSTEM_ADMIN: ['USERS_MANAGE', 'SYSTEM_CONFIGURE'],
};

const activePermissionCodes = [
  'USERS_MANAGE',
  'SCHEDULE_MANAGE',
  'REPORTS_READ',
  'EQP_MANAGE',
  'SYSTEM_CONFIGURE',
];

async function upsertRole(code) {
  return prisma.role.upsert({
    where: { code },
    update: {},
    create: {
      code,
      name: code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
    },
  });
}

async function upsertPermission(code) {
  return prisma.permission.upsert({
    where: { code },
    update: {},
    create: {
      code,
      name: code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
    },
  });
}

async function ensureUserRole(userId, roleId) {
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: {},
    create: { userId, roleId },
  });
}

async function removeUserRole(userId, roleId) {
  await prisma.userRole.deleteMany({
    where: { userId, roleId },
  });
}

async function removeTechnicianProfileForUser(userId) {
  const technician = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technician) return;

  await prisma.technicianSchedule.updateMany({
    where: { technicianId: technician.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  await prisma.technicianProfile.update({
    where: { id: technician.id },
    data: {
      isAvailable: false,
      deletedAt: new Date(),
    },
  });
}

async function upsertSeedUser({ email, userNumber, fullName, passwordHash, locale = 'en' }) {
  if (userNumber) {
    const existingByNumber = await prisma.user.findUnique({ where: { userNumber } });
    if (existingByNumber) {
      return prisma.user.update({
        where: { id: existingByNumber.id },
        data: {
          email,
          fullName: existingByNumber.fullName || fullName,
          passwordHash,
          locale,
          status: 'ACTIVE',
        },
      });
    }
  }

  return prisma.user.upsert({
    where: { email },
    update: {
      ...(userNumber ? { userNumber } : {}),
      fullName,
      passwordHash,
      locale,
      status: 'ACTIVE',
    },
    create: {
      email,
      ...(userNumber ? { userNumber } : {}),
      fullName,
      passwordHash,
      locale,
    },
  });
}

function todayDateText() {
  return new Date().toISOString().slice(0, 10);
}

function dateOnly(dateText) {
  return new Date(`${dateText}T00:00:00.000Z`);
}

async function main() {
  const roles = {};
  const permissions = {};

  for (const code of Object.values(RoleCode)) {
    roles[code] = await upsertRole(code);
  }

  for (const code of activePermissionCodes) {
    permissions[code] = await upsertPermission(code);
  }

  for (const [roleCode, permissionCodes] of Object.entries(rolePermissions)) {
    for (const permissionCode of permissionCodes) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roles[roleCode].id,
            permissionId: permissions[permissionCode].id,
          },
        },
        update: {},
        create: {
          roleId: roles[roleCode].id,
          permissionId: permissions[permissionCode].id,
        },
      });
    }
  }

  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!', 12);
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@daralhai.com';

  const admin = await upsertSeedUser({
    email: adminEmail,
    fullName: 'Dar Al HAI System Administrator',
    passwordHash,
  });
  await ensureUserRole(admin.id, roles.SUPER_ADMIN.id);

  const manager = await upsertSeedUser({
    email: 'operations.manager@daralhai.com',
    fullName: 'Operations Manager',
    passwordHash,
  });
  await ensureUserRole(manager.id, roles.OPERATIONS_MANAGER.id);

  const engineerSeeds = [
    { email: 'motasem.ghanem@daralhai.com', fullName: 'Motasem Ghanem' },
    { email: 'abdelrahman@daralhai.com', fullName: 'Abdelrahman' },
    { email: 'faisal@daralhai.com', fullName: 'Faisal' },
  ];

  for (const engineerSeed of engineerSeeds) {
    const engineer = await upsertSeedUser({
      email: engineerSeed.email,
      fullName: engineerSeed.fullName,
      passwordHash,
      locale: 'en',
    });
    await ensureUserRole(engineer.id, roles.MAINTENANCE_SUPERVISOR.id);
    await removeUserRole(engineer.id, roles.FIELD_TECHNICIAN.id);
    await prisma.user.update({
      where: { id: engineer.id },
      data: { userNumber: null },
    });
    await removeTechnicianProfileForUser(engineer.id);
  }

  const technicianSeeds = [
    { userNumber: 1001, email: 'alikomatsu223@gmail.com', fullName: 'Ali Sabri', employeeCode: 'TECH-1001', region: null, skills: [] },
    { userNumber: 1002, email: 'mhmaad600042@gmail.com', fullName: 'Mohammad Alharsa', employeeCode: 'TECH-1002', region: null, skills: [] },
    { userNumber: 1003, email: 'smm198071@gmail.com', fullName: 'Sameer Almuji', employeeCode: 'TECH-1003', region: null, skills: [] },
    { userNumber: 1004, email: 'ahmadaljawawdi99@gmail.com', fullName: 'Ahmad Jawawdeh', employeeCode: 'TECH-1004', region: null, skills: [] },
    { userNumber: 1005, email: 'lutfimutaz@gmail.com', fullName: 'Mutazz Lutfi', employeeCode: 'TECH-1005', region: null, skills: [] },
    { userNumber: 1006, email: 'aliaboalheki@gmail.com', fullName: 'Ali Sayed Alheki', employeeCode: 'TECH-1006', region: null, skills: [] },
    { userNumber: 1007, email: 'barh507@gmail.com', fullName: 'Ibrahim Abdulrazzaq', employeeCode: 'TECH-1007', region: null, skills: [] },
  ];

  const branch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      code: 'HQ',
      name: 'Head Office',
      nameAr: 'Dar Al HAI HQ',
      address: 'Riyadh, Saudi Arabia',
    },
  });

  for (const technicianSeed of technicianSeeds) {
    const technicianUser = await upsertSeedUser({
      email: technicianSeed.email,
      userNumber: technicianSeed.userNumber,
      fullName: technicianSeed.fullName,
      passwordHash,
      locale: 'en',
    });

    await ensureUserRole(technicianUser.id, roles.FIELD_TECHNICIAN.id);

    const technician = await prisma.technicianProfile.upsert({
      where: { userId: technicianUser.id },
      update: {
        employeeCode: technicianSeed.employeeCode,
        region: technicianSeed.region || null,
        shiftId: null,
        isAvailable: true,
        deletedAt: null,
      },
      create: {
        userId: technicianUser.id,
        employeeCode: technicianSeed.employeeCode,
        region: technicianSeed.region,
        isAvailable: true,
      },
    });

    await prisma.technicianSkill.deleteMany({
      where: { technicianId: technician.id },
    });

    await prisma.technicianSkill.createMany({
      data: technicianSeed.skills.map(([skill, level]) => ({
        technicianId: technician.id,
        skill,
        level,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.technicianProfile.updateMany({
    where: {
      deletedAt: null,
      employeeCode: {
        notIn: technicianSeeds.map((technician) => technician.employeeCode),
      },
    },
    data: {
      isAvailable: false,
      deletedAt: new Date(),
    },
  });

  await prisma.eqpMachine.upsert({
    where: { machineNumber: '9582' },
    update: {},
    create: {
      machineNumber: '9582',
      engineNumber: '639925',
      machineType: 'W30',
      lastSmr: 32,
      smrStep: 1,
      reportCounter: 4,
      responsibleEngineer: 'Motasem Ghanem',
    },
  });

  await prisma.eqpReportComment.createMany({
    data: [
      { commentText: 'Machine checked and found in good operating condition.', frequency: 3 },
      { commentText: 'Preventive maintenance completed successfully.', frequency: 2 },
      { commentText: 'No abnormal noise or leakage observed.', frequency: 1 },
    ],
    skipDuplicates: true,
  });

  console.log(`Seed complete. Admin user: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
