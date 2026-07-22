ALTER TABLE "eqp_machines"
  ADD COLUMN IF NOT EXISTS "report_template_group" TEXT;

UPDATE "eqp_machines"
SET "report_template_group" = CASE
  WHEN "machine_number" IN ('77149', '77150', '77151', '77152', '77153', '77175', '77177', '77178', '77322') THEN 'SAMA'
  WHEN "machine_number" IN ('77321', '77323', '77324', '77325', '77326', '77327', '77336', '77338', '77339') THEN 'REZ'
  ELSE "report_template_group"
END,
"updated_at" = CURRENT_TIMESTAMP
WHERE "machine_type" = 'PC400'
  AND "machine_number" IN (
    '77149', '77150', '77151', '77152', '77153', '77175', '77177', '77178', '77322',
    '77321', '77323', '77324', '77325', '77326', '77327', '77336', '77338', '77339'
  );

CREATE INDEX IF NOT EXISTS "eqp_machines_report_template_group_idx"
  ON "eqp_machines"("report_template_group");
