const db = require('../config/database');
const { resolveEqpTable } = require('./eqpTableResolver');

async function findAll() {
  const table = await resolveEqpTable('eqp_reports', 'reports');
  const result = await db.query(`
    SELECT *
    FROM ${table}
    ORDER BY created_at DESC
  `);

  return result.rows;
}

async function findByOwner(ownerId, ownerName) {
  const table = await resolveEqpTable('eqp_reports', 'reports');
  if (table !== 'eqp_reports') return [];

  const result = await db.query(
    `
      SELECT *
      FROM ${table}
      WHERE created_by_user = $1
        OR (created_by_user IS NULL AND created_by = $2)
      ORDER BY created_at DESC
    `,
    [ownerId, ownerName]
  );

  return result.rows;
}

async function findById(id) {
  const table = await resolveEqpTable('eqp_reports', 'reports');
  const result = await db.query(
    `
      SELECT *
      FROM ${table}
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function findByIdForOwner(id, ownerId, ownerName) {
  const table = await resolveEqpTable('eqp_reports', 'reports');
  if (table !== 'eqp_reports') return null;

  const result = await db.query(
    `
      SELECT *
      FROM ${table}
      WHERE id = $1
        AND (
          created_by_user = $2
          OR (created_by_user IS NULL AND created_by = $3)
        )
    `,
    [id, ownerId, ownerName]
  );

  return result.rows[0] || null;
}

async function rename(id, fileName, ownerId, ownerName) {
  const table = await resolveEqpTable('eqp_reports', 'reports');
  const ownerClause = table === 'eqp_reports' ? 'AND (created_by_user = $3 OR (created_by_user IS NULL AND created_by = $4))' : '';
  const params = table === 'eqp_reports' ? [fileName, id, ownerId, ownerName] : [fileName, id];
  const result = await db.query(
    `
      UPDATE ${table}
      SET file_name = $1
      ${table === 'eqp_reports' ? ', updated_at = CURRENT_TIMESTAMP' : ''}
      WHERE id = $2
      ${ownerClause}
      RETURNING *
    `,
    params
  );

  return result.rows[0] || null;
}

async function remove(id, ownerId, ownerName) {
  const table = await resolveEqpTable('eqp_reports', 'reports');
  const ownerClause = table === 'eqp_reports' ? 'AND (created_by_user = $2 OR (created_by_user IS NULL AND created_by = $3))' : '';
  const params = table === 'eqp_reports' ? [id, ownerId, ownerName] : [id];
  await db.query(
    `
      DELETE FROM ${table}
      WHERE id = $1
      ${ownerClause}
    `,
    params
  );
}

async function create(report) {
  const table = await resolveEqpTable('eqp_reports', 'reports');
  const timestampColumns = table === 'eqp_reports' ? ', updated_at' : '';
  const timestampValues = table === 'eqp_reports' ? ', CURRENT_TIMESTAMP' : '';
  const ownerColumn = table === 'eqp_reports' ? ', created_by_user' : '';
  const ownerValue = table === 'eqp_reports' ? ', $14' : '';
  const values = [
    report.reportNo,
    report.machineType,
    report.machineId,
    report.engineNumber,
    report.smr,
    report.serviceDate,
    report.comments,
    report.createdBy,
    report.machineNumber,
    report.reportType,
    report.serviceType,
    report.fileName,
    report.fileUrl,
  ];

  if (table === 'eqp_reports') {
    values.push(report.createdById);
  }

  await db.query(
    `
      INSERT INTO ${table}
      (
        report_no,
        machine_type,
        machine_id,
        engine_number,
        smr,
        service_date,
        comments,
        created_by,
        machine_number,
        report_type,
        service_type,
        file_name,
        file_url
        ${ownerColumn}
        ${timestampColumns}
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
        ${ownerValue}
        ${timestampValues}
      )
    `,
    values
  );
}

module.exports = {
  findAll,
  findByOwner,
  findById,
  findByIdForOwner,
  rename,
  remove,
  create,
};
