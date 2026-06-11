const db = require('../config/database');
const { resolveEqpTable } = require('./eqpTableResolver');

async function findAll() {
  const table = await resolveEqpTable('eqp_machines', 'machines');
  const result = await db.query(`
    SELECT *
    FROM ${table}
    ORDER BY machine_number
  `);

  return result.rows;
}

async function findByIds(machineIds) {
  const table = await resolveEqpTable('eqp_machines', 'machines');
  const result = await db.query(
    `
      SELECT *
      FROM ${table}
      WHERE id = ANY($1)
      ORDER BY machine_number
    `,
    [machineIds]
  );

  return result.rows;
}

async function findById(machineId) {
  const table = await resolveEqpTable('eqp_machines', 'machines');
  const result = await db.query(
    `
      SELECT *
      FROM ${table}
      WHERE id = $1
    `,
    [Number(machineId)]
  );

  return result.rows[0] || null;
}

async function updateCounters(machineId, values) {
  const table = await resolveEqpTable('eqp_machines', 'machines');
  const updatedAtClause = table === 'eqp_machines' ? ', updated_at = CURRENT_TIMESTAMP' : '';
  await db.query(
    `
      UPDATE ${table}
      SET
        last_smr = $1,
        smr_step = $2,
        report_counter = $3
        ${updatedAtClause}
      WHERE id = $4
    `,
    [
      values.lastSmr,
      values.smrStep,
      values.reportCounter,
      Number(machineId),
    ]
  );
}

module.exports = {
  findAll,
  findById,
  findByIds,
  updateCounters,
};
