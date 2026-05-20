#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const { getDatabaseUrl } = require('../src/config/prisma');

const databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  console.error(
    'Cannot run Prisma migrations: set DATABASE_URL or DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD.',
  );
  process.exit(1);
}

process.env.DATABASE_URL = databaseUrl;

const prismaBinary = process.platform === 'win32'
  ? path.resolve(__dirname, '..', 'node_modules', '.bin', 'prisma.cmd')
  : path.resolve(__dirname, '..', 'node_modules', '.bin', 'prisma');

const result = spawnSync(prismaBinary, ['migrate', 'deploy'], {
  cwd: path.resolve(__dirname, '..'),
  env: process.env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (result.error) {
  console.error('Failed to start Prisma migrate deploy', result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
