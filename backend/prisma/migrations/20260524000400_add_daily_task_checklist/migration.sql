ALTER TABLE "daily_schedule_tasks"
ADD COLUMN IF NOT EXISTS "checklist" JSONB,
ADD COLUMN IF NOT EXISTS "checklist_reports" JSONB;
