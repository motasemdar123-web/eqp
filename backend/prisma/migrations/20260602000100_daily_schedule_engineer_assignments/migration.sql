CREATE TABLE IF NOT EXISTS "daily_schedule_task_engineers" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "engineer_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  CONSTRAINT "daily_schedule_task_engineers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_schedule_task_engineers_task_id_engineer_id_key"
  ON "daily_schedule_task_engineers"("task_id", "engineer_id");

CREATE INDEX IF NOT EXISTS "daily_schedule_task_engineers_engineer_id_idx"
  ON "daily_schedule_task_engineers"("engineer_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'daily_schedule_task_engineers_task_id_fkey'
      AND table_name = 'daily_schedule_task_engineers'
  ) THEN
    ALTER TABLE "daily_schedule_task_engineers"
      ADD CONSTRAINT "daily_schedule_task_engineers_task_id_fkey"
      FOREIGN KEY ("task_id") REFERENCES "daily_schedule_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'daily_schedule_task_engineers_engineer_id_fkey'
      AND table_name = 'daily_schedule_task_engineers'
  ) THEN
    ALTER TABLE "daily_schedule_task_engineers"
      ADD CONSTRAINT "daily_schedule_task_engineers_engineer_id_fkey"
      FOREIGN KEY ("engineer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "user_roles" ("id", "user_id", "role_id", "created_at")
SELECT
  CONCAT('user-role-service-engineer-manager-', "users"."id"),
  "users"."id",
  "roles"."id",
  CURRENT_TIMESTAMP
FROM "users"
JOIN "roles" ON "roles"."code" = 'SERVICE_ENGINEER'
WHERE (
    LOWER("users"."email") IN ('mahmoud.qaddour@daralhai.com', 'motasem.ghanem@daralhai.com')
    OR LOWER("users"."full_name") IN ('mahmoud qaddour', 'motasem ghanem')
  )
  AND NOT EXISTS (
    SELECT 1 FROM "user_roles"
    WHERE "user_roles"."user_id" = "users"."id"
      AND "user_roles"."role_id" = "roles"."id"
  );
