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

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      fullName: 'Dar Al HAI System Administrator',
      passwordHash,
      roles: {
        create: [{ roleId: roles.SUPER_ADMIN.id }],
      },
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'operations.manager@daralhai.com' },
    update: {},
    create: {
      email: 'operations.manager@daralhai.com',
      fullName: 'Operations Manager',
      passwordHash,
      roles: { create: [{ roleId: roles.OPERATIONS_MANAGER.id }] },
    },
  });

  const technicianUser = await prisma.user.upsert({
    where: { email: 'technician.ahmad@daralhai.com' },
    update: {},
    create: {
      email: 'technician.ahmad@daralhai.com',
      userNumber: 1001,
      fullName: 'Ahmad Field Technician',
      passwordHash,
      locale: 'ar',
      roles: { create: [{ roleId: roles.FIELD_TECHNICIAN.id }] },
    },
  });

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

  const shift = await prisma.shift.create({
    data: {
      name: 'Morning Shift',
      startsAt: '08:00',
      endsAt: '16:00',
      branchId: branch.id,
    },
  });

  const technician = await prisma.technicianProfile.upsert({
    where: { userId: technicianUser.id },
    update: { shiftId: shift.id },
    create: {
      userId: technicianUser.id,
      employeeCode: 'TECH-1001',
      region: 'Riyadh',
      shiftId: shift.id,
    },
  });

  await prisma.technicianSkill.createMany({
    data: [
      { technicianId: technician.id, skill: 'HVAC', level: 'SENIOR' },
      { technicianId: technician.id, skill: 'Electrical Safety', level: 'INTERMEDIATE' },
    ],
    skipDuplicates: true,
  });

  const request = await prisma.maintenanceRequest.upsert({
    where: { requestNumber: 'REQ-20260514-1001' },
    update: {},
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
    update: {},
    create: {
      workOrderNumber: 'WO-20260514-1001',
      title: 'Inspect and repair AC cooling issue',
      requestId: request.id,
      assetId: asset.id,
      priority: 'HIGH',
      status: 'ASSIGNED',
      scheduledStartAt: new Date(Date.now() + 60 * 60 * 1000),
      scheduledEndAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
    },
  });

  await prisma.workOrderAssignment.upsert({
    where: { workOrderId_technicianId: { workOrderId: workOrder.id, technicianId: technician.id } },
    update: {},
    create: { workOrderId: workOrder.id, technicianId: technician.id },
  });

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

  await prisma.stockMovement.create({
    data: {
      itemId: filter.id,
      type: 'PURCHASE_RECEIPT',
      quantity: 25,
      unitCost: 35,
      reference: 'SEED-STOCK',
    },
  });

  const pmPlan = await prisma.preventiveMaintenancePlan.create({
    data: {
      name: 'Monthly HVAC Filter Inspection',
      assetId: asset.id,
      frequency: 'MONTHLY',
      isActive: true,
    },
  });

  await prisma.preventiveMaintenanceSchedule.create({
    data: {
      planId: pmPlan.id,
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
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
