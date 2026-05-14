const db = require('../config/database');
const { resolveEqpTable } = require('./eqpTableResolver');

async function findAll() {
  const historyTable = await resolveEqpTable('eqp_machine_history', 'machine_history');
  const machineTable = await resolveEqpTable('eqp_machines', 'machines');
  const result = await db.query(`
    SELECT
      mh.*,
      m.machine_number,
      m.machine_type
    FROM ${historyTable} mh
    JOIN ${machineTable} m
      ON mh.machine_id = m.id
    ORDER BY mh.created_at DESC
  `);

  return result.rows;
}

module.exports = { findAll };
