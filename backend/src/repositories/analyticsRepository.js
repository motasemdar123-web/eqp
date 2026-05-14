const db = require('../config/database');
const { resolveEqpTable } = require('./eqpTableResolver');

async function getOverview() {
  const machineTable = await resolveEqpTable('eqp_machines', 'machines');
  const reportTable = await resolveEqpTable('eqp_reports', 'reports');
  const [machineCount, reportCount, latestReports, reportsByType, reportsByService] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS count FROM ${machineTable}`),
    db.query(`SELECT COUNT(*)::int AS count FROM ${reportTable}`),
    db.query(`
      SELECT id, report_no, machine_number, machine_type, service_type, created_at, file_name, file_url
      FROM ${reportTable}
      ORDER BY created_at DESC
      LIMIT 8
    `),
    db.query(`
      SELECT machine_type, COUNT(*)::int AS count
      FROM ${reportTable}
      GROUP BY machine_type
      ORDER BY count DESC
    `),
    db.query(`
      SELECT service_type, COUNT(*)::int AS count
      FROM ${reportTable}
      GROUP BY service_type
      ORDER BY count DESC
    `),
  ]);

  return {
    machineCount: machineCount.rows[0].count,
    reportCount: reportCount.rows[0].count,
    latestReports: latestReports.rows,
    reportsByType: reportsByType.rows,
    reportsByService: reportsByService.rows,
  };
}

module.exports = { getOverview };
