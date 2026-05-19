ALTER TABLE "shop_manuals"
  ADD COLUMN IF NOT EXISTS "original_pdf" BYTEA,
  ADD COLUMN IF NOT EXISTS "original_pdf_size" INTEGER,
  ADD COLUMN IF NOT EXISTS "original_pdf_content_type" TEXT,
  ADD COLUMN IF NOT EXISTS "original_stored_at" TIMESTAMP(3);
