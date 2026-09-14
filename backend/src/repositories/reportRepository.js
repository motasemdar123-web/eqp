const db = require('../config/database');
const { resolveEqpTable } = require('./eqpTableResolver');

async function findAll() {
  const table = await resolveEqpTable('eqp_reports', 'reports');
  const mainResult = await db.query(`
    SELECT *
    FROM ${table}
    ORDER BY created_at DESC
  `);

  // Include successfully uploaded reports from eqp_machine_history
  try {
    const historyTable = await resolveEqpTable('eqp_machine_history', 'machine_history');
    const machineTable = await resolveEqpTable('eqp_machines', 'machines');
    const historyResult = await db.query(`
      SELECT 
        emh.id::text as id,
        ('EQPC-' || emh.id) as report_no,
        em.machine_type,
        emh.machine_id,
        em.engine_number,
        emh.smr,
        to_char(emh.operation_date, 'YYYY-MM-DD') as service_date,
        '-' as comments,
        emh.created_at,
        emh.performed_by as created_by,
        em.machine_number,
        emh.service_type as report_type,
        emh.report_type as service_type,
        null as file_name,
        null as file_url
      FROM ${historyTable} emh
      JOIN ${machineTable} em ON em.id = emh.machine_id
      WHERE emh.operation_type LIKE 'EQP Care Upload%'
      ORDER BY emh.operation_date DESC
    `);

    // Combine avoiding duplicate records if a report exists in both tables
    const existingKeys = new Set(
      mainResult.rows.map((r) => {
        const mNum = String(r.machine_number || '').trim();
        const d = r.service_date ? String(r.service_date).slice(0, 10) : '';
        const code = String(r.report_type || '').trim().toUpperCase();
        return `${mNum}_${code}_${d}`;
      })
    );

    const merged = [...mainResult.rows];
    for (const hr of historyResult.rows) {
      const mNum = String(hr.machine_number || '').trim();
      const d = hr.service_date ? String(hr.service_date).slice(0, 10) : '';
      const code = String(hr.report_type || '').trim().toUpperCase();
      const key = `${mNum}_${code}_${d}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        merged.push(hr);
      }
    }

    return merged;
  } catch (err) {
    console.warn('[reportRepository.findAll] Notice loading history reports:', err.message);
    return mainResult.rows;
  }
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

async function countByMachineAndReportType({ machineId, machineNumber, reportType }) {
  const table = await resolveEqpTable('eqp_reports', 'reports');
  const result = await db.query(
    `
      SELECT COUNT(*)::int AS count
      FROM ${table}
      WHERE report_type = $1
        AND (
          machine_id = $2
          OR (machine_id IS NULL AND machine_number = $3)
        )
    `,
    [reportType, Number(machineId), machineNumber]
  );

  return result.rows[0]?.count || 0;
}

async function findByMachineAndMonth(machineNumber, monthKey) {
  try {
    const table = await resolveEqpTable('eqp_reports', 'reports');
    const result = await db.query(
      `
        SELECT *
        FROM ${table}
        WHERE machine_number = $1
          AND TO_CHAR(service_date, 'YYYY-MM') = $2
        LIMIT 1
      `,
      [String(machineNumber).trim(), String(monthKey).trim()]
    );
    if (result.rows[0]) return result.rows[0];

    // Check history table as well
    const historyTable = await resolveEqpTable('eqp_machine_history', 'machine_history');
    const machineTable = await resolveEqpTable('eqp_machines', 'machines');
    const histResult = await db.query(
      `
        SELECT 
          emh.id::text as id,
          ('EQPC-' || emh.id) as report_no,
          em.machine_type,
          emh.machine_id,
          emh.smr,
          to_char(emh.operation_date, 'YYYY-MM-DD') as service_date,
          em.machine_number,
          emh.service_type as report_type
        FROM ${historyTable} emh
        JOIN ${machineTable} em ON em.id = emh.machine_id
        WHERE em.machine_number = $1
          AND TO_CHAR(emh.operation_date, 'YYYY-MM') = $2
        LIMIT 1
      `,
      [String(machineNumber).trim(), String(monthKey).trim()]
    );
    return histResult.rows[0] || null;
  } catch {
    return null;
  }
}

module.exports = {
  findAll,
  findByOwner,
  findById,
  findByIdForOwner,
  rename,
  remove,
  create,
  countByMachineAndReportType,
  findByMachineAndMonth,
};
