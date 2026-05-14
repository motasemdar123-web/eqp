const { PrismaClient, Role, Permission } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const rolePermissions = {
  SUPER_ADMIN: Object.values(Permission),
  GENERAL_MANAGER: ['REPORTS_READ'],
  OPERATIONS_MANAGER: ['REQUESTS_READ', 'REQUESTS_ASSIGN', 'WORK_ORDERS_MANAGE', 'SCHEDULE_MANAGE', 'REPORTS_READ'],
  MAINTENANCE_SUPERVISOR: ['REQUESTS_READ', 'REQUESTS_ASSIGN', 'WORK_ORDERS_MANAGE', 'WORK_ORDERS_CLOSE', 'REPORTS_READ'],
  FIELD_TECHNICIAN: ['REQUESTS_READ', 'WORK_ORDERS_CLOSE'],
  CALL_CENTER: ['REQUESTS_CREATE', 'REQUESTS_READ'],
  WAREHOUSE_OFFICER: ['INVENTORY_MANAGE'],
  FINANCE: ['REPORTS_READ'],
  CLIENT: ['REQUESTS_CREATE', 'REQUESTS_READ'],
  SYSTEM_ADMIN: ['USERS_MANAGE', 'SYSTEM_CONFIGURE'],
};

async function main() {
  for (const [role, permissions] of Object.entries(rolePermissions)) {
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { role_permission: { role, permission } },
        update: {},
        create: { role, permission },
      });
    }
  }

  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!', 12);
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@daralhai.com';

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      fullName: 'Dar Al HAI System Administrator',
      passwordHash,
      roles: { create: [{ role: Role.SUPER_ADMIN }] },
    },
  });

  await prisma.warehouse.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: { code: 'MAIN', name: 'Main Warehouse' },
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
