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

async function findForReport({ machineModel, documentType, serviceStage }) {
  const table = await resolveEqpTable('eqp_report_comments', 'report_comments');

  if (table !== 'eqp_report_comments') {
    return findAll();
  }

  const result = await db.query(
    `
      SELECT *
      FROM ${table}
      WHERE machine_model = $1
        AND document_type = $2
        AND service_stage = $3
        AND is_active = true
      ORDER BY id
    `,
    [machineModel, documentType, serviceStage]
  );

  return result.rows;
}

module.exports = { findAll, findForReport };
