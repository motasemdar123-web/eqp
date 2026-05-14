const db = require('../config/database');

const cache = new Map();

async function tableExists(tableName) {
  if (cache.has(tableName)) return cache.get(tableName);

  const result = await db.query('SELECT to_regclass($1) AS table_name', [`public.${tableName}`]);
  const exists = Boolean(result.rows[0]?.table_name);
  cache.set(tableName, exists);
  return exists;
}

async function resolveEqpTable(newTableName, legacyTableName) {
  if (await tableExists(newTableName)) return newTableName;
  return legacyTableName;
}

module.exports = { resolveEqpTable };
