-- Update report_counter to 9 for HM400 machines 9753 through 9720
UPDATE "eqp_machines"
SET "report_counter" = 9,
    "updated_at" = CURRENT_TIMESTAMP
WHERE "machine_number" IN (
  '9720',
  '9724',
  '9725',
  '9726',
  '9732',
  '9737',
  '9741',
  '9751',
  '9752',
  '9753'
);
