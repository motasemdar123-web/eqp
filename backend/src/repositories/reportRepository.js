const db = require('../config/database');

async function findAll() {
  const result = await db.query(`
    SELECT *
    FROM reports
    ORDER BY created_at DESC
  `);

  return result.rows;
}

async function findById(id) {
  const result = await db.query(
    `
      SELECT *
      FROM reports
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function rename(id, fileName) {
  const result = await db.query(
    `
      UPDATE reports
      SET file_name = $1
      WHERE id = $2
      RETURNING *
    `,
    [fileName, id]
  );

  return result.rows[0] || null;
}

async function remove(id) {
  await db.query(
    `
      DELETE FROM reports
      WHERE id = $1
    `,
    [id]
  );
}

async function create(report) {
  await db.query(
    `
      INSERT INTO reports
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
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      )
    `,
    [
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
    ]
  );
}

module.exports = {
  findAll,
  findById,
  rename,
  remove,
  create,
};
