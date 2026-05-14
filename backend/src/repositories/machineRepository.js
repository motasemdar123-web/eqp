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

async function updateCounters(machineId, values) {
  const table = await resolveEqpTable('eqp_machines', 'machines');
  await db.query(
    `
      UPDATE ${table}
      SET
        last_smr = $1,
        smr_step = $2,
        report_counter = $3
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
  findByIds,
  updateCounters,
};
