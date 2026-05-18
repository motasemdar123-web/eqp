ALTER TABLE "daily_schedule_tasks"
  ADD COLUMN IF NOT EXISTS "machine_model" TEXT,
  ADD COLUMN IF NOT EXISTS "manual_advice" JSONB;

CREATE TABLE IF NOT EXISTS "shop_manuals" (
  "id" TEXT NOT NULL,
  "machine_model" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "file_name" TEXT,
  "source_type" TEXT NOT NULL DEFAULT 'PDF',
  "status" TEXT NOT NULL DEFAULT 'INDEXED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  "updated_by" TEXT,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "shop_manuals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "shop_manual_chunks" (
  "id" TEXT NOT NULL,
  "manual_id" TEXT NOT NULL,
  "machine_model" TEXT NOT NULL,
  "page_number" INTEGER,
  "section" TEXT,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shop_manual_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "shop_manuals_machine_model_idx" ON "shop_manuals"("machine_model");
CREATE INDEX IF NOT EXISTS "shop_manual_chunks_manual_id_idx" ON "shop_manual_chunks"("manual_id");
CREATE INDEX IF NOT EXISTS "shop_manual_chunks_machine_model_idx" ON "shop_manual_chunks"("machine_model");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shop_manual_chunks_manual_id_fkey'
  ) THEN
    ALTER TABLE "shop_manual_chunks"
      ADD CONSTRAINT "shop_manual_chunks_manual_id_fkey"
      FOREIGN KEY ("manual_id") REFERENCES "shop_manuals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
