-- CreateTable
CREATE TABLE IF NOT EXISTS "media_campaigns" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "media_campaigns_pkey" PRIMARY KEY ("id")
);
