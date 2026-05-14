const db = require('../config/database');
const { resolveEqpTable } = require('./eqpTableResolver');

async function findAll() {
  const table = await resolveEqpTable('eqp_report_comments', 'report_comments');
  const result = await db.query(`
    SELECT *
    FROM ${table}
  `);

  return result.rows;
}

module.exports = { findAll };
