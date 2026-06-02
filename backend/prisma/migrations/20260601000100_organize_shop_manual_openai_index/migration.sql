ALTER TABLE "shop_manuals"
  ADD COLUMN IF NOT EXISTS "manual_type" TEXT,
  ADD COLUMN IF NOT EXISTS "serial_range" TEXT,
  ADD COLUMN IF NOT EXISTS "revision" TEXT,
  ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS "openai_file_id" TEXT,
  ADD COLUMN IF NOT EXISTS "openai_vector_store_id" TEXT,
  ADD COLUMN IF NOT EXISTS "openai_vector_file_id" TEXT,
  ADD COLUMN IF NOT EXISTS "openai_index_status" TEXT NOT NULL DEFAULT 'LOCAL_ONLY',
  ADD COLUMN IF NOT EXISTS "openai_last_error" TEXT,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE INDEX IF NOT EXISTS "shop_manuals_openai_vector_store_idx" ON "shop_manuals"("openai_vector_store_id");
CREATE INDEX IF NOT EXISTS "shop_manuals_manual_type_idx" ON "shop_manuals"("manual_type");
