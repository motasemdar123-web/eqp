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
    { userNumber: 1001, email: 'technician.1001@daralhai.com', fullName: 'Nasser Al Harbi', employeeCode: 'TECH-1001', region: 'Riyadh North', shiftName: 'Morning Shift', skills: [['HVAC', 'SENIOR'], ['Electrical Safety', 'INTERMEDIATE']] },
    { userNumber: 1002, email: 'technician.1002@daralhai.com', fullName: 'Ahmad Al Harbi', employeeCode: 'TECH-1002', region: 'Riyadh North', shiftName: 'Morning Shift', skills: [['Plumbing', 'SENIOR'], ['Leak Detection', 'SENIOR']] },
    { userNumber: 1003, email: 'technician.1003@daralhai.com', fullName: 'Omar Al Qahtani', employeeCode: 'TECH-1003', region: 'Riyadh East', shiftName: 'Morning Shift', skills: [['Electrical', 'SENIOR'], ['Generator', 'INTERMEDIATE']] },
    { userNumber: 1004, email: 'technician.1004@daralhai.com', fullName: 'Khaled Mansour', employeeCode: 'TECH-1004', region: 'Riyadh Central', shiftName: 'Afternoon Shift', skills: [['HVAC', 'INTERMEDIATE'], ['BMS', 'INTERMEDIATE']] },
    { userNumber: 1005, email: 'technician.1005@daralhai.com', fullName: 'Yousef Nasser', employeeCode: 'TECH-1005', region: 'Riyadh Central', shiftName: 'Afternoon Shift', skills: [['Civil Works', 'SENIOR'], ['Painting', 'INTERMEDIATE']] },
    { userNumber: 1006, email: 'technician.1006@daralhai.com', fullName: 'Fahad Al Mutairi', employeeCode: 'TECH-1006', region: 'Riyadh South', shiftName: 'Afternoon Shift', skills: [['Fire Safety', 'SENIOR'], ['Pump Systems', 'INTERMEDIATE']] },
    { userNumber: 1007, email: 'technician.1007@daralhai.com', fullName: 'Saeed Al Otaibi', employeeCode: 'TECH-1007', region: 'Riyadh West', shiftName: 'Night Shift', skills: [['Electrical', 'INTERMEDIATE'], ['Emergency Response', 'SENIOR']] },
    { userNumber: 1008, email: 'technician.1008@daralhai.com', fullName: 'Nawaf Saleh', employeeCode: 'TECH-1008', region: 'Riyadh West', shiftName: 'Night Shift', skills: [['HVAC', 'INTERMEDIATE'], ['Refrigeration', 'INTERMEDIATE']] },
    { userNumber: 1009, email: 'technician.1009@daralhai.com', fullName: 'Bader Al Dosari', employeeCode: 'TECH-1009', region: 'Riyadh South', shiftName: 'Night Shift', skills: [['Plumbing', 'INTERMEDIATE'], ['Water Treatment', 'SENIOR']] },
  ];

  const client = await prisma.client.upsert({
    where: { code: 'DAH' },
    update: {},
    create: { code: 'DAH', name: 'Dar Al HAI', nameAr: 'دار الحي' },
  });

  const branch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      code: 'HQ',
      name: 'Head Office',
      nameAr: 'المقر الرئيسي',
      clientId: client.id,
      address: 'Riyadh, Saudi Arabia',
    },
  });

  const property = await prisma.property.upsert({
    where: { code: 'HQ-BLDG' },
    update: {},
    create: {
      code: 'HQ-BLDG',
      name: 'Head Office Building',
      type: 'Commercial',
      clientId: client.id,
      branchId: branch.id,
    },
  });

  const location = await prisma.location.upsert({
    where: { code: 'HQ-F2-MECH' },
    update: {},
    create: {
      code: 'HQ-F2-MECH',
      name: 'Mechanical Room - Floor 2',
      type: 'Mechanical',
      floor: '2',
      branchId: branch.id,
      propertyId: property.id,
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
