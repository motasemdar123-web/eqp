CREATE TABLE IF NOT EXISTS "workspace_notes" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" JSONB,
  "type" TEXT NOT NULL DEFAULT 'note',
  "status" TEXT NOT NULL DEFAULT 'active',
  "tags" JSONB,
  "category" TEXT,
  "is_pinned" BOOLEAN NOT NULL DEFAULT false,
  "visibility" TEXT NOT NULL DEFAULT 'private',
  "linked_machine_id" INTEGER,
  "linked_technician_id" TEXT,
  "linked_report_id" INTEGER,
  "created_by" TEXT NOT NULL,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "workspace_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "workspace_tasks" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'todo',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "due_date" TIMESTAMP(3),
  "assigned_to" TEXT,
  "tags" JSONB,
  "linked_note_id" TEXT,
  "linked_machine_id" INTEGER,
  "linked_technician_id" TEXT,
  "linked_report_id" INTEGER,
  "created_by" TEXT NOT NULL,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "workspace_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "workspace_templates" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "content" JSONB,
  "tags" JSONB,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "created_by" TEXT,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "workspace_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "workspace_activities" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workspace_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "workspace_notes_created_by_idx" ON "workspace_notes"("created_by");
CREATE INDEX IF NOT EXISTS "workspace_notes_type_idx" ON "workspace_notes"("type");
CREATE INDEX IF NOT EXISTS "workspace_notes_status_idx" ON "workspace_notes"("status");
CREATE INDEX IF NOT EXISTS "workspace_notes_is_pinned_idx" ON "workspace_notes"("is_pinned");

CREATE INDEX IF NOT EXISTS "workspace_tasks_created_by_idx" ON "workspace_tasks"("created_by");
CREATE INDEX IF NOT EXISTS "workspace_tasks_assigned_to_idx" ON "workspace_tasks"("assigned_to");
CREATE INDEX IF NOT EXISTS "workspace_tasks_status_idx" ON "workspace_tasks"("status");
CREATE INDEX IF NOT EXISTS "workspace_tasks_priority_idx" ON "workspace_tasks"("priority");
CREATE INDEX IF NOT EXISTS "workspace_tasks_due_date_idx" ON "workspace_tasks"("due_date");

CREATE INDEX IF NOT EXISTS "workspace_templates_category_idx" ON "workspace_templates"("category");
CREATE INDEX IF NOT EXISTS "workspace_templates_is_system_idx" ON "workspace_templates"("is_system");

CREATE INDEX IF NOT EXISTS "workspace_activities_entity_type_entity_id_idx" ON "workspace_activities"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "workspace_activities_user_id_idx" ON "workspace_activities"("user_id");
CREATE INDEX IF NOT EXISTS "workspace_activities_created_at_idx" ON "workspace_activities"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_notes_created_by_fkey') THEN
    ALTER TABLE "workspace_notes"
      ADD CONSTRAINT "workspace_notes_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_tasks_created_by_fkey') THEN
    ALTER TABLE "workspace_tasks"
      ADD CONSTRAINT "workspace_tasks_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_tasks_assigned_to_fkey') THEN
    ALTER TABLE "workspace_tasks"
      ADD CONSTRAINT "workspace_tasks_assigned_to_fkey"
      FOREIGN KEY ("assigned_to") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_templates_created_by_fkey') THEN
    ALTER TABLE "workspace_templates"
      ADD CONSTRAINT "workspace_templates_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_activities_user_id_fkey') THEN
    ALTER TABLE "workspace_activities"
      ADD CONSTRAINT "workspace_activities_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
