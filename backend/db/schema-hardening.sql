-- Optional production hardening for the existing EQP database.
-- Review table/column names and existing data before applying.

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_number_unique
  ON users(user_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_machines_machine_number_unique
  ON machines(machine_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_report_no_unique
  ON reports(report_no);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'machines_last_smr_non_negative'
  ) THEN
    ALTER TABLE machines
      ADD CONSTRAINT machines_last_smr_non_negative CHECK (last_smr >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'machines_smr_step_range'
  ) THEN
    ALTER TABLE machines
      ADD CONSTRAINT machines_smr_step_range CHECK (smr_step >= 0 AND smr_step <= 3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'machines_report_counter_non_negative'
  ) THEN
    ALTER TABLE machines
      ADD CONSTRAINT machines_report_counter_non_negative CHECK (report_counter >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_machine_id_fk'
  ) THEN
    ALTER TABLE reports
      ADD CONSTRAINT reports_machine_id_fk FOREIGN KEY (machine_id) REFERENCES machines(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'machine_history_machine_id_fk'
  ) THEN
    ALTER TABLE machine_history
      ADD CONSTRAINT machine_history_machine_id_fk FOREIGN KEY (machine_id) REFERENCES machines(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_machines_type
  ON machines(machine_type);

CREATE INDEX IF NOT EXISTS idx_machines_responsible_engineer
  ON machines(responsible_engineer);

CREATE INDEX IF NOT EXISTS idx_reports_created_at
  ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_machine_id
  ON reports(machine_id);

CREATE INDEX IF NOT EXISTS idx_machine_history_created_at
  ON machine_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_machine_history_machine_id
  ON machine_history(machine_id);
