-- Optional analytics helpers for operational dashboards.
-- These views are read-only conveniences and do not modify existing rows.

CREATE OR REPLACE VIEW vw_report_volume_by_day AS
SELECT
  DATE(created_at) AS report_day,
  COUNT(*)::int AS report_count,
  COUNT(DISTINCT machine_id)::int AS machine_count
FROM reports
GROUP BY DATE(created_at)
ORDER BY report_day DESC;

CREATE OR REPLACE VIEW vw_report_volume_by_service AS
SELECT
  service_type,
  COUNT(*)::int AS report_count,
  COUNT(DISTINCT machine_id)::int AS machine_count
FROM reports
GROUP BY service_type
ORDER BY report_count DESC;

CREATE OR REPLACE VIEW vw_machine_operational_summary AS
SELECT
  m.id,
  m.machine_number,
  m.machine_type,
  m.engine_number,
  m.last_smr,
  m.smr_step,
  m.report_counter,
  COUNT(r.id)::int AS generated_reports,
  MAX(r.created_at) AS latest_report_at
FROM machines m
LEFT JOIN reports r
  ON r.machine_id = m.id
GROUP BY
  m.id,
  m.machine_number,
  m.machine_type,
  m.engine_number,
  m.last_smr,
  m.smr_step,
  m.report_counter;

CREATE INDEX IF NOT EXISTS idx_reports_service_type
  ON reports(service_type);

CREATE INDEX IF NOT EXISTS idx_reports_machine_type
  ON reports(machine_type);

CREATE INDEX IF NOT EXISTS idx_reports_report_type
  ON reports(report_type);
