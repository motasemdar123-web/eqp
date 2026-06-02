CREATE TABLE IF NOT EXISTS "planner_task_pushes" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "suggested_date" DATE,
  "suggested_time" TEXT,
  "expected_duration_minutes" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "planned_date" DATE,
  "planned_time" TEXT,
  "assignee_id" TEXT NOT NULL,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "planner_task_pushes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "planner_task_pushes_assignee_id_status_idx"
  ON "planner_task_pushes"("assignee_id", "status");

CREATE INDEX IF NOT EXISTS "planner_task_pushes_created_by_idx"
  ON "planner_task_pushes"("created_by");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'planner_task_pushes_assignee_id_fkey'
      AND table_name = 'planner_task_pushes'
  ) THEN
    ALTER TABLE "planner_task_pushes"
      ADD CONSTRAINT "planner_task_pushes_assignee_id_fkey"
      FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'planner_task_pushes_created_by_fkey'
      AND table_name = 'planner_task_pushes'
  ) THEN
    ALTER TABLE "planner_task_pushes"
      ADD CONSTRAINT "planner_task_pushes_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
