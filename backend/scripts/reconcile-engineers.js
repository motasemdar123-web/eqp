const path = require('path');
const { randomUUID } = require('crypto');
const { PrismaClient, PermissionCode } = require('@prisma/client');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const prisma = new PrismaClient();

const defaultEngineers = [
  { email: 'motasem.ghanem@daralhai.com', fullName: 'Motasem Ghanem' },
  { email: 'abdelrahman@daralhai.com', fullName: 'Abdelrahman' },
  { email: 'faisal@daralhai.com', fullName: 'Faisal' },
];

const replacementTechnicians = [
  {
    email: 'technician.1001@daralhai.com',
    userNumber: 1001,
    employeeCode: 'TECH-1001',
    fullName: 'Nasser Al Harbi',
    region: 'Riyadh North',
    shiftName: 'Morning Shift',
    skills: [['HVAC', 'SENIOR'], ['Electrical Safety', 'INTERMEDIATE']],
  },
  {
    email: 'technician.1002@daralhai.com',
    userNumber: 1002,
    employeeCode: 'TECH-1002',
    fullName: 'Ahmad Al Harbi',
    region: 'Riyadh North',
    shiftName: 'Morning Shift',
    skills: [['Plumbing', 'SENIOR'], ['Leak Detection', 'SENIOR']],
  },
  {
    email: 'technician.1003@daralhai.com',
    userNumber: 1003,
    employeeCode: 'TECH-1003',
    fullName: 'Omar Al Qahtani',
    region: 'Riyadh East',
    shiftName: 'Morning Shift',
    skills: [['Electrical', 'SENIOR'], ['Generator', 'INTERMEDIATE']],
  },
];

const engineerPermissionCodes = [
  PermissionCode.REPORTS_READ,
  PermissionCode.EQP_MANAGE,
];

const technicianPermissionCodes = [
  PermissionCode.SCHEDULE_MANAGE,
];

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function displayNameFromEmail(email) {
  return email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function normalizedNameParts(value) {
  return String(value || '')
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function configuredEngineers() {
  const fromEnv = parseList(process.env.MICROSOFT_ENGINEER_EMAILS).map((email) => ({
    email: normalizeEmail(email),
    fullName: displayNameFromEmail(email),
  }));

  const seen = new Set();
  return [...defaultEngineers, ...fromEnv]
    .map((engineer) => ({
      email: normalizeEmail(engineer.email),
      fullName: engineer.fullName,
    }))
    .filter((engineer) => {
      if (!engineer.email || seen.has(engineer.email)) return false;
      seen.add(engineer.email);
      return true;
    });
}

function configuredEngineerNames(engineers) {
  const explicitNames = parseList(process.env.MICROSOFT_ENGINEER_NAMES);
  return [...engineers.map((engineer) => engineer.fullName), ...explicitNames]
    .flatMap((name) => normalizedNameParts(name))
    .filter((part, index, parts) => part.length >= 3 && parts.indexOf(part) === index);
}

async function ensureRole(code) {
  return prisma.role.upsert({
    where: { code },
    update: {},
    create: {
      code,
      name: code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
    },
  });
}

async function ensurePermission(code) {
  return prisma.permission.upsert({
    where: { code },
    update: {},
    create: {
      code,
      name: code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
    },
  });
}

async function ensureRolePermission(roleId, permissionId) {
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId, permissionId } },
    update: {},
    create: { roleId, permissionId },
  });
}

async function ensureUserRole(userId, roleId) {
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: {},
    create: { userId, roleId },
  });
}

async function ensureEngineerPermissions(roleId) {
  for (const permissionCode of engineerPermissionCodes) {
    const permission = await ensurePermission(permissionCode);
    await ensureRolePermission(roleId, permission.id);
  }
}

async function ensureTechnicianPermissions(roleId) {
  for (const permissionCode of technicianPermissionCodes) {
    const permission = await ensurePermission(permissionCode);
    await ensureRolePermission(roleId, permission.id);
  }
}

async function findExistingEngineerUser(engineer) {
  const byEmail = await prisma.user.findUnique({ where: { email: engineer.email } });
  if (byEmail) return byEmail;

  const parts = normalizedNameParts(engineer.fullName);
  if (parts.length === 0) return null;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      userNumber: true,
      fullName: true,
      status: true,
    },
  });

  return users.find((user) => {
    const candidate = `${user.fullName || ''} ${user.email || ''}`.toLowerCase();
    return parts.some((part) => candidate.includes(part));
  }) || null;
}

async function upsertEngineerUser(engineer) {
  const existing = await findExistingEngineerUser(engineer);

  if (!existing) {
    return prisma.user.create({
      data: {
        email: engineer.email,
        fullName: engineer.fullName,
        passwordHash: `MICROSOFT_SSO_ONLY:${randomUUID()}`,
        locale: 'en',
        status: 'ACTIVE',
        userNumber: null,
      },
    });
  }

  const emailOwner = await prisma.user.findUnique({ where: { email: engineer.email } });
  const canTakeConfiguredEmail = !emailOwner || emailOwner.id === existing.id;

  return prisma.user.update({
    where: { id: existing.id },
    data: {
      email: canTakeConfiguredEmail ? engineer.email : existing.email,
      fullName: engineer.fullName || existing.fullName,
      locale: 'en',
      status: 'ACTIVE',
      userNumber: null,
    },
  });
}

async function softRemoveTechnicianProfile(userId) {
  const technician = await prisma.technicianProfile.findUnique({ where: { userId } });

  if (!technician) return;

  await prisma.technicianSchedule.updateMany({
    where: {
      technicianId: technician.id,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
  await prisma.technicianProfile.update({
    where: { id: technician.id },
    data: {
      isAvailable: false,
      deletedAt: new Date(),
    },
  });
}

async function promoteExistingNameMatches(engineerRole, technicianRole, names, assignedUserIds) {
  if (names.length === 0) return;

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    include: {
      roles: { include: { role: true } },
    },
  });

  const matches = users.filter((user) => {
    if (assignedUserIds.has(user.id)) return false;
    if (String(user.email || '').toLowerCase().startsWith('technician.')) return false;
    if (user.userNumber) return false;
    const text = `${user.fullName || ''} ${user.email || ''}`.toLowerCase();
    return names.some((name) => text.includes(name));
  });

  for (const user of matches) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        locale: 'en',
        status: 'ACTIVE',
        userNumber: null,
      },
    });
    await ensureUserRole(user.id, engineerRole.id);

    if (technicianRole) {
      await prisma.userRole.deleteMany({
        where: {
          userId: user.id,
          roleId: technicianRole.id,
        },
      });
    }

    await softRemoveTechnicianProfile(user.id);
    assignedUserIds.add(user.id);
    console.log(`Promoted engineer by name match: ${user.fullName} <${user.email}>`);
  }
}

async function ensureReplacementTechnician(seed, engineerRole, technicianRole) {
  const existingNumberOwner = await prisma.user.findUnique({ where: { userNumber: seed.userNumber } });
  if (existingNumberOwner && existingNumberOwner.email !== seed.email) {
    await prisma.user.update({
      where: { id: existingNumberOwner.id },
      data: { userNumber: null },
    });
  }

  const user = await prisma.user.upsert({
    where: { email: seed.email },
    update: {
      userNumber: seed.userNumber,
      fullName: seed.fullName,
      locale: 'ar',
      status: 'ACTIVE',
      deletedAt: null,
    },
    create: {
      email: seed.email,
      userNumber: seed.userNumber,
      fullName: seed.fullName,
      passwordHash: `MICROSOFT_SSO_ONLY:${randomUUID()}`,
      locale: 'ar',
      status: 'ACTIVE',
    },
  });

  await ensureUserRole(user.id, technicianRole.id);
  await prisma.userRole.deleteMany({
    where: {
      userId: user.id,
      roleId: engineerRole.id,
    },
  });

  const morningShift = await prisma.shift.findFirst({
    where: { name: seed.shiftName, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });

  const existingCodeOwner = await prisma.technicianProfile.findFirst({
    where: {
      employeeCode: seed.employeeCode,
      userId: { not: user.id },
    },
  });

  if (existingCodeOwner) {
    await prisma.technicianProfile.update({
      where: { id: existingCodeOwner.id },
      data: {
        employeeCode: null,
        deletedAt: existingCodeOwner.deletedAt || new Date(),
        isAvailable: false,
      },
    });
  }

  const technicianProfile = await prisma.technicianProfile.upsert({
    where: { userId: user.id },
    update: {
      employeeCode: seed.employeeCode,
      region: seed.region,
      shiftId: morningShift?.id || null,
      isAvailable: true,
      deletedAt: null,
    },
    create: {
      userId: user.id,
      employeeCode: seed.employeeCode,
      region: seed.region,
      shiftId: morningShift?.id || null,
      isAvailable: true,
    },
  });

  for (const [skill, level] of seed.skills) {
    await prisma.technicianSkill.upsert({
      where: {
        technicianId_skill: {
          technicianId: technicianProfile.id,
          skill,
        },
      },
      update: { level },
      create: {
        technicianId: technicianProfile.id,
        skill,
        level,
      },
    });
  }

  console.log(`Restored technician replacement: ${seed.employeeCode} ${seed.fullName}`);
}

async function main() {
  const engineers = configuredEngineers();
  const engineerNames = configuredEngineerNames(engineers);
  const engineerRole = await ensureRole('MAINTENANCE_SUPERVISOR');
  const technicianRole = await ensureRole('FIELD_TECHNICIAN');
  const assignedUserIds = new Set();

  await ensureEngineerPermissions(engineerRole.id);
  await ensureTechnicianPermissions(technicianRole.id);

  for (const engineer of engineers) {
    const user = await upsertEngineerUser(engineer);

    await ensureUserRole(user.id, engineerRole.id);

    if (technicianRole) {
      await prisma.userRole.deleteMany({
        where: {
          userId: user.id,
          roleId: technicianRole.id,
        },
      });
    }

    await softRemoveTechnicianProfile(user.id);
    assignedUserIds.add(user.id);
    console.log(`Reconciled engineer: ${engineer.email}`);
  }

  await promoteExistingNameMatches(engineerRole, technicianRole, engineerNames, assignedUserIds);

  for (const replacementTechnician of replacementTechnicians) {
    await ensureReplacementTechnician(replacementTechnician, engineerRole, technicianRole);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
