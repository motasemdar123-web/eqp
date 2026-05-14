let prisma = null;

function getPrisma() {
  if (prisma) return prisma;

  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { PrismaClient } = require('@prisma/client');

  prisma = new PrismaClient();
  return prisma;
}

module.exports = { getPrisma };
