-- Add technician app completion fields to daily schedule tasks.
ALTER TABLE "daily_schedule_tasks"
ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "summary" TEXT,
ADD COLUMN IF NOT EXISTS "photos" JSONB;
