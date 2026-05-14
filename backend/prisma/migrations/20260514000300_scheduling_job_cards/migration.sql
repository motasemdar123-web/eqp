CREATE TYPE "TechnicianScheduleStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'ON_DUTY', 'OFF_DUTY', 'LEAVE', 'COMPLETED', 'CANCELLED');

ALTER TABLE "work_orders" ADD COLUMN "job_type" TEXT;
ALTER TABLE "work_orders" ADD COLUMN "work_scope" TEXT;
ALTER TABLE "work_orders" ADD COLUMN "safety_notes" TEXT;
ALTER TABLE "work_orders" ADD COLUMN "required_tools" TEXT;
ALTER TABLE "work_orders" ADD COLUMN "required_parts" TEXT;
ALTER TABLE "work_orders" ADD COLUMN "permit_required" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "work_orders" ADD COLUMN "customer_contact" TEXT;
ALTER TABLE "work_orders" ADD COLUMN "estimated_duration_minutes" INTEGER;
ALTER TABLE "work_orders" ADD COLUMN "team_lead_technician_id" TEXT;

CREATE TABLE "technician_schedules" (
    "id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "shift_id" TEXT,
    "branch_id" TEXT,
    "work_date" DATE NOT NULL,
    "starts_at" TEXT NOT NULL,
    "ends_at" TEXT NOT NULL,
    "status" "TechnicianScheduleStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "technician_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "work_orders_team_lead_technician_id_idx" ON "work_orders"("team_lead_technician_id");
CREATE INDEX "technician_schedules_work_date_idx" ON "technician_schedules"("work_date");
CREATE INDEX "technician_schedules_branch_id_work_date_idx" ON "technician_schedules"("branch_id", "work_date");
CREATE INDEX "technician_schedules_shift_id_idx" ON "technician_schedules"("shift_id");
CREATE UNIQUE INDEX "technician_schedules_technician_id_work_date_key" ON "technician_schedules"("technician_id", "work_date");

ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_team_lead_technician_id_fkey" FOREIGN KEY ("team_lead_technician_id") REFERENCES "technician_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "technician_schedules" ADD CONSTRAINT "technician_schedules_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "technician_schedules" ADD CONSTRAINT "technician_schedules_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "technician_schedules" ADD CONSTRAINT "technician_schedules_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
