ALTER TABLE "eqp_machines"
  ADD COLUMN IF NOT EXISTS "customer_name" TEXT,
  ADD COLUMN IF NOT EXISTS "location" TEXT;

UPDATE "eqp_machines"
SET
  "customer_name" = 'Laala Al-Kuwait Real Estate Co.',
  "location" = CASE
    WHEN "machine_number" IN ('9485', '9501', '9522', '9548', '9557', '9576', '9577', '9578', '9580', '9581')
      THEN 'Sabah Al-Ahmad Sea City'
    ELSE 'AlJahra'
  END,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "responsible_engineer" = 'Faisal Inaya'
  AND "machine_type" = 'HM400'
  AND "machine_number" IN (
    '9485', '9501', '9522', '9548', '9557', '9576', '9577', '9578', '9580', '9581',
    '9757', '9758', '9761', '9762', '9765', '9769', '9771', '9773', '9777', '9780', '9782'
  );

UPDATE "eqp_machines"
SET
  "customer_name" = CASE
    WHEN "report_template_group" = 'REZ' THEN 'ARIZONA NATIONAL GENERAL TRADING & CONTRACTING CO.'
    WHEN "report_template_group" = 'SAMA' THEN 'Sama International General Trading & Contracting Co'
    ELSE "customer_name"
  END,
  "location" = 'AlJahra',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "responsible_engineer" = 'Faisal Inaya'
  AND "machine_type" = 'PC400';
