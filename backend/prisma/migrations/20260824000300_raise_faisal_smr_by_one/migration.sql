-- Increment last_smr by 1 for all machines assigned to Faisal Inaya
UPDATE "eqp_machines"
SET "last_smr" = "last_smr" + 1,
    "updated_at" = CURRENT_TIMESTAMP
WHERE "responsible_engineer" = 'Faisal Inaya';
