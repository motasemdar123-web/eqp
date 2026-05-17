-- Add grouped daily scheduling tasks.
CREATE TABLE "daily_schedule_tasks" (
    "id" TEXT NOT NULL,
    "work_date" DATE NOT NULL,
    "task" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "starts_at" TEXT NOT NULL,
    "ends_at" TEXT NOT NULL,
    "status" "TechnicianScheduleStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "daily_schedule_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_schedule_task_technicians" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "daily_schedule_task_technicians_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "daily_schedule_tasks_work_date_idx" ON "daily_schedule_tasks"("work_date");
CREATE INDEX "daily_schedule_tasks_status_idx" ON "daily_schedule_tasks"("status");
CREATE INDEX "daily_schedule_task_technicians_technician_id_idx" ON "daily_schedule_task_technicians"("technician_id");
CREATE UNIQUE INDEX "daily_schedule_task_technicians_task_id_technician_id_key" ON "daily_schedule_task_technicians"("task_id", "technician_id");

ALTER TABLE "daily_schedule_task_technicians"
ADD CONSTRAINT "daily_schedule_task_technicians_task_id_fkey"
FOREIGN KEY ("task_id") REFERENCES "daily_schedule_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_schedule_task_technicians"
ADD CONSTRAINT "daily_schedule_task_technicians_technician_id_fkey"
FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
