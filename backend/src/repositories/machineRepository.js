const db = require('../config/database');

async function findAll() {
  const result = await db.query(`
    SELECT *
    FROM machines
    ORDER BY machine_number
  `);

  return result.rows;
}

async function findByIds(machineIds) {
  const result = await db.query(
    `
      SELECT *
      FROM machines
      WHERE id = ANY($1)
      ORDER BY machine_number
    `,
    [machineIds]
  );

  return result.rows;
}

async function updateCounters(machineId, values) {
  await db.query(
    `
      UPDATE machines
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
