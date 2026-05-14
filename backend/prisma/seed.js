const { PrismaClient, RoleCode, PermissionCode } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const rolePermissions = {
  SUPER_ADMIN: Object.values(PermissionCode),
  GENERAL_MANAGER: ['REPORTS_READ'],
  OPERATIONS_MANAGER: ['REQUESTS_READ', 'REQUESTS_ASSIGN', 'WORK_ORDERS_MANAGE', 'SCHEDULE_MANAGE', 'REPORTS_READ'],
  MAINTENANCE_SUPERVISOR: ['REQUESTS_READ', 'REQUESTS_ASSIGN', 'WORK_ORDERS_MANAGE', 'WORK_ORDERS_CLOSE', 'REPORTS_READ', 'EQP_MANAGE'],
  FIELD_TECHNICIAN: ['REQUESTS_READ', 'WORK_ORDERS_CLOSE'],
  CALL_CENTER: ['REQUESTS_CREATE', 'REQUESTS_READ'],
  WAREHOUSE_OFFICER: ['INVENTORY_MANAGE'],
  FINANCE: ['REPORTS_READ'],
  CLIENT: ['REQUESTS_CREATE', 'REQUESTS_READ'],
  SYSTEM_ADMIN: ['USERS_MANAGE', 'SYSTEM_CONFIGURE'],
};

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

  const activeWorkOrderStatuses = ['DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'PENDING_APPROVAL'];

  await prisma.workOrder.updateMany({
    where: {
      teamLeadTechnicianId: technician.id,
      status: { in: activeWorkOrderStatuses },
    },
    data: { teamLeadTechnicianId: null },
  });
  await prisma.workOrderAssignment.deleteMany({
    where: {
      technicianId: technician.id,
      workOrder: { status: { in: activeWorkOrderStatuses } },
    },
  });
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

function businessDateTime(dateText, timeText) {
  return new Date(`${dateText}T${timeText}:00+03:00`);
}

async function ensureWorkOrderAssignment(workOrderId, technicianId) {
  await prisma.workOrderAssignment.upsert({
    where: { workOrderId_technicianId: { workOrderId, technicianId } },
    update: {},
    create: { workOrderId, technicianId },
  });
}

async function main() {
  const roles = {};
  const permissions = {};

  for (const code of Object.values(RoleCode)) {
    roles[code] = await upsertRole(code);
  }

  for (const code of Object.values(PermissionCode)) {
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

  const hvacCategory = await prisma.assetCategory.upsert({
    where: { code: 'HVAC' },
    update: {},
    create: { code: 'HVAC', name: 'HVAC Equipment', nameAr: 'معدات التكييف' },
  });

  const asset = await prisma.asset.upsert({
    where: { assetCode: 'DAH-HVAC-0001' },
    update: {},
    create: {
      assetCode: 'DAH-HVAC-0001',
      name: 'Rooftop AC Unit 1',
      serialNumber: 'AC-778899',
      branchId: branch.id,
      locationId: location.id,
      categoryId: hvacCategory.id,
      lifecycleStatus: 'ACTIVE',
    },
  });

  await prisma.qrAsset.upsert({
    where: { assetId: asset.id },
    update: {},
    create: {
      assetId: asset.id,
      qrValue: `ASSET:${asset.assetCode}`,
    },
  });

  const shiftSeeds = [
    { name: 'Morning Shift', startsAt: '08:00', endsAt: '16:00' },
    { name: 'Afternoon Shift', startsAt: '14:00', endsAt: '22:00' },
    { name: 'Night Shift', startsAt: '22:00', endsAt: '06:00' },
  ];
  const shifts = {};

  for (const shiftSeed of shiftSeeds) {
    shifts[shiftSeed.name] = await prisma.shift.upsert({
      where: { branchId_name: { branchId: branch.id, name: shiftSeed.name } },
      update: {
        startsAt: shiftSeed.startsAt,
        endsAt: shiftSeed.endsAt,
      },
      create: {
        ...shiftSeed,
        branchId: branch.id,
      },
    });
  }

  const technicians = [];
  const scheduleDateText = todayDateText();
  const scheduleWorkDate = dateOnly(scheduleDateText);

  for (const technicianSeed of technicianSeeds) {
    const user = await upsertSeedUser({
      email: technicianSeed.email,
      userNumber: technicianSeed.userNumber,
      fullName: technicianSeed.fullName,
      passwordHash,
      locale: 'ar',
    });
    await ensureUserRole(user.id, roles.FIELD_TECHNICIAN.id);
    await removeUserRole(user.id, roles.MAINTENANCE_SUPERVISOR.id);

    const assignedShift = shifts[technicianSeed.shiftName];
    const technician = await prisma.technicianProfile.upsert({
      where: { userId: user.id },
      update: {
        employeeCode: technicianSeed.employeeCode,
        region: technicianSeed.region,
        shiftId: assignedShift.id,
        isAvailable: true,
        deletedAt: null,
      },
      create: {
        userId: user.id,
        employeeCode: technicianSeed.employeeCode,
        region: technicianSeed.region,
        shiftId: assignedShift.id,
      },
    });

    await prisma.technicianSkill.createMany({
      data: technicianSeed.skills.map(([skill, level]) => ({
        technicianId: technician.id,
        skill,
        level,
      })),
      skipDuplicates: true,
    });

    await prisma.technicianSchedule.upsert({
      where: { technicianId_workDate: { technicianId: technician.id, workDate: scheduleWorkDate } },
      update: {
        shiftId: assignedShift.id,
        branchId: branch.id,
        startsAt: assignedShift.startsAt,
        endsAt: assignedShift.endsAt,
        status: 'CONFIRMED',
        notes: `${technicianSeed.region} coverage`,
        deletedAt: null,
      },
      create: {
        technicianId: technician.id,
        shiftId: assignedShift.id,
        branchId: branch.id,
        workDate: scheduleWorkDate,
        startsAt: assignedShift.startsAt,
        endsAt: assignedShift.endsAt,
        status: 'CONFIRMED',
        notes: `${technicianSeed.region} coverage`,
      },
    });

    technicians.push({ ...technicianSeed, user, profile: technician, shift: assignedShift });
  }

  const leadTechnician = technicians[0].profile;
  const hvacSupportTechnician = technicians[3].profile;
  const plumbingLead = technicians[1].profile;
  const electricalLead = technicians[2].profile;

  const request = await prisma.maintenanceRequest.upsert({
    where: { requestNumber: 'REQ-20260514-1001' },
    update: {
      status: 'ASSIGNED',
      branchId: branch.id,
      locationId: location.id,
      assetId: asset.id,
    },
    create: {
      requestNumber: 'REQ-20260514-1001',
      title: 'AC not cooling - Admin Building',
      description: 'Temperature is above set point in the admin office.',
      category: 'HVAC',
      priority: 'HIGH',
      status: 'ASSIGNED',
      source: 'CALL_CENTER',
      branchId: branch.id,
      locationId: location.id,
      assetId: asset.id,
      createdByUserId: manager.id,
      slaTargetAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    },
  });

  const workOrder = await prisma.workOrder.upsert({
    where: { workOrderNumber: 'WO-20260514-1001' },
    update: {
      requestId: request.id,
      assetId: asset.id,
      priority: 'HIGH',
      status: 'ASSIGNED',
      jobType: 'Corrective Maintenance',
      workScope: 'Diagnose cooling performance, inspect filters, verify refrigerant pressure, and restore normal operation.',
      safetyNotes: 'Lock out electrical panel before opening the rooftop unit. Use roof access harness.',
      requiredTools: 'Multimeter, manifold gauge, hand tools, filter kit',
      requiredParts: 'AC filter 24x24 if replacement is required',
      permitRequired: true,
      customerContact: 'Facilities Desk +966500000001',
      estimatedDurationMinutes: 120,
      teamLeadTechnicianId: leadTechnician.id,
      scheduledStartAt: businessDateTime(scheduleDateText, '09:00'),
      scheduledEndAt: businessDateTime(scheduleDateText, '11:00'),
    },
    create: {
      workOrderNumber: 'WO-20260514-1001',
      title: 'Inspect and repair AC cooling issue',
      description: 'AC unit is not reaching the required set point in the admin office.',
      requestId: request.id,
      assetId: asset.id,
      priority: 'HIGH',
      status: 'ASSIGNED',
      jobType: 'Corrective Maintenance',
      workScope: 'Diagnose cooling performance, inspect filters, verify refrigerant pressure, and restore normal operation.',
      safetyNotes: 'Lock out electrical panel before opening the rooftop unit. Use roof access harness.',
      requiredTools: 'Multimeter, manifold gauge, hand tools, filter kit',
      requiredParts: 'AC filter 24x24 if replacement is required',
      permitRequired: true,
      customerContact: 'Facilities Desk +966500000001',
      estimatedDurationMinutes: 120,
      teamLeadTechnicianId: leadTechnician.id,
      scheduledStartAt: businessDateTime(scheduleDateText, '09:00'),
      scheduledEndAt: businessDateTime(scheduleDateText, '11:00'),
    },
  });

  await ensureWorkOrderAssignment(workOrder.id, leadTechnician.id);
  await ensureWorkOrderAssignment(workOrder.id, hvacSupportTechnician.id);

  const plumbingJobCard = await prisma.workOrder.upsert({
    where: { workOrderNumber: 'JC-DAH-DEMO-1002' },
    update: {
      status: 'ASSIGNED',
      jobType: 'Inspection',
      workScope: 'Inspect domestic water pump set, check pressure fluctuation, verify valve position, and submit findings.',
      safetyNotes: 'Use eye protection and isolate pump before opening any casing.',
      requiredTools: 'Pressure gauge, pipe wrench, inspection light',
      requiredParts: 'Valve gasket set if needed',
      customerContact: 'Operations Supervisor +966500000002',
      estimatedDurationMinutes: 90,
      teamLeadTechnicianId: plumbingLead.id,
      scheduledStartAt: businessDateTime(scheduleDateText, '10:30'),
      scheduledEndAt: businessDateTime(scheduleDateText, '12:00'),
    },
    create: {
      workOrderNumber: 'JC-DAH-DEMO-1002',
      title: 'Water pump pressure inspection',
      description: 'Pump pressure fluctuation reported by facilities team.',
      assetId: asset.id,
      priority: 'MEDIUM',
      status: 'ASSIGNED',
      jobType: 'Inspection',
      workScope: 'Inspect domestic water pump set, check pressure fluctuation, verify valve position, and submit findings.',
      safetyNotes: 'Use eye protection and isolate pump before opening any casing.',
      requiredTools: 'Pressure gauge, pipe wrench, inspection light',
      requiredParts: 'Valve gasket set if needed',
      customerContact: 'Operations Supervisor +966500000002',
      estimatedDurationMinutes: 90,
      teamLeadTechnicianId: plumbingLead.id,
      scheduledStartAt: businessDateTime(scheduleDateText, '10:30'),
      scheduledEndAt: businessDateTime(scheduleDateText, '12:00'),
    },
  });

  await ensureWorkOrderAssignment(plumbingJobCard.id, plumbingLead.id);
  await ensureWorkOrderAssignment(plumbingJobCard.id, technicians[8].profile.id);

  const electricalJobCard = await prisma.workOrder.upsert({
    where: { workOrderNumber: 'JC-DAH-DEMO-1003' },
    update: {
      status: 'ASSIGNED',
      jobType: 'Preventive Maintenance',
      workScope: 'Inspect DB panel, tighten terminals, check load balance, and record thermal readings.',
      safetyNotes: 'Follow LOTO procedure and verify absence of voltage before contact.',
      requiredTools: 'Thermal camera, insulated screwdriver set, clamp meter',
      requiredParts: 'Cable lugs and labels',
      permitRequired: true,
      estimatedDurationMinutes: 120,
      teamLeadTechnicianId: electricalLead.id,
      scheduledStartAt: businessDateTime(scheduleDateText, '13:00'),
      scheduledEndAt: businessDateTime(scheduleDateText, '15:00'),
    },
    create: {
      workOrderNumber: 'JC-DAH-DEMO-1003',
      title: 'Electrical panel preventive inspection',
      description: 'Routine preventive inspection for the floor distribution board.',
      assetId: asset.id,
      priority: 'MEDIUM',
      status: 'ASSIGNED',
      jobType: 'Preventive Maintenance',
      workScope: 'Inspect DB panel, tighten terminals, check load balance, and record thermal readings.',
      safetyNotes: 'Follow LOTO procedure and verify absence of voltage before contact.',
      requiredTools: 'Thermal camera, insulated screwdriver set, clamp meter',
      requiredParts: 'Cable lugs and labels',
      permitRequired: true,
      estimatedDurationMinutes: 120,
      teamLeadTechnicianId: electricalLead.id,
      scheduledStartAt: businessDateTime(scheduleDateText, '13:00'),
      scheduledEndAt: businessDateTime(scheduleDateText, '15:00'),
    },
  });

  await ensureWorkOrderAssignment(electricalJobCard.id, electricalLead.id);
  await ensureWorkOrderAssignment(electricalJobCard.id, technicians[6].profile.id);

  const supplier = await prisma.supplier.upsert({
    where: { code: 'SUP-HVAC-01' },
    update: {},
    create: { code: 'SUP-HVAC-01', name: 'Riyadh HVAC Supplies', phone: '+966500000000' },
  });

  const filter = await prisma.inventoryItem.upsert({
    where: { sku: 'FILTER-24X24' },
    update: {},
    create: {
      sku: 'FILTER-24X24',
      name: 'AC Filter 24x24',
      unit: 'PCS',
      quantity: 25,
      reorderThreshold: 10,
      averageCost: 35,
      supplierId: supplier.id,
    },
  });

  await prisma.stockMovement.upsert({
    where: { itemId_reference: { itemId: filter.id, reference: 'SEED-STOCK' } },
    update: {
      quantity: 25,
      unitCost: 35,
    },
    create: {
      itemId: filter.id,
      type: 'PURCHASE_RECEIPT',
      quantity: 25,
      unitCost: 35,
      reference: 'SEED-STOCK',
    },
  });

  const pmPlan = await prisma.preventiveMaintenancePlan.upsert({
    where: { assetId_name: { assetId: asset.id, name: 'Monthly HVAC Filter Inspection' } },
    update: {
      frequency: 'MONTHLY',
      isActive: true,
    },
    create: {
      name: 'Monthly HVAC Filter Inspection',
      assetId: asset.id,
      frequency: 'MONTHLY',
      isActive: true,
    },
  });

  const nextPmDueAt = new Date('2026-06-01T08:00:00.000Z');
  await prisma.preventiveMaintenanceSchedule.upsert({
    where: { planId_dueAt: { planId: pmPlan.id, dueAt: nextPmDueAt } },
    update: {},
    create: {
      planId: pmPlan.id,
      dueAt: nextPmDueAt,
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
