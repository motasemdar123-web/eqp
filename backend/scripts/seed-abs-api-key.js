const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { getPrisma } = require('../src/config/prisma');
const { createApiKey } = require('../src/services/apiKeyService');

async function seedAbsApiKey() {
  const prisma = getPrisma();
  if (!prisma) {
    console.error('Cannot connect to database.');
    process.exit(1);
  }

  const existing = await prisma.apiKey.findFirst({
    where: { name: 'ABS SAP Integration Service' },
  });

  if (existing) {
    console.log(`API Key for 'ABS SAP Integration Service' already exists (Prefix: ${existing.keyPrefix}, Active: ${existing.isActive})`);
    process.exit(0);
  }

  const newKey = await createApiKey({
    name: 'ABS SAP Integration Service',
    scopes: ['sap:read', 'sap:write'],
    allowedIps: [], // empty allows all IPs initially or can be configured
    role: 'SAP_INTEGRATION_SERVICE',
  });

  console.log('Successfully generated initial ABS API Key:');
  console.log(`ID: ${newKey.id}`);
  console.log(`Name: ${newKey.name}`);
  console.log(`Role: ${newKey.role}`);
  console.log(`Key Prefix: ${newKey.keyPrefix}`);
  console.log(`Raw API Key: ${newKey.rawKey}`);
  console.log(`(Save this token; it is hashed in the database and cannot be retrieved again)`);
}

seedAbsApiKey()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error generating ABS key:', err);
    process.exit(1);
  });
