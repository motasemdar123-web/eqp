const crypto = require('crypto');
const { query } = require('../config/database');
const { env } = require('../config/env');
const { getSupabaseClient } = require('../config/supabase');

let tableInitialized = false;
let mediaBucketReady = false;

/**
 * Ensures the media_assets table exists in PostgreSQL without modifying schema.prisma
 */
async function ensureMediaAssetTable() {
  if (tableInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INT NOT NULL,
        file_data BYTEA,
        public_url TEXT,
        concept_id TEXT,
        publish_date TEXT,
        uploaded_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_media_assets_concept ON media_assets (concept_id);
    `);
    tableInitialized = true;
  } catch (err) {
    console.error('[mediaAssetService] Failed to initialize media_assets table:', err);
    throw err;
  }
}

/**
 * Try to ensure public bucket on Supabase Storage if configured
 */
async function ensureSupabaseBucket(supabase) {
  if (mediaBucketReady) return;
  const bucketName = process.env.SUPABASE_MEDIA_BUCKET || 'media-assets';
  try {
    const { data: bucket, error } = await supabase.storage.getBucket(bucketName);
    if (error) {
      const notFound = String(error.message || '').toLowerCase().includes('not found');
      if (notFound) {
        const { error: createError } = await supabase.storage.createBucket(bucketName, { public: true });
        if (!createError) {
          mediaBucketReady = true;
          return;
        }
      }
    } else if (bucket && !bucket.public) {
      await supabase.storage.updateBucket(bucketName, { public: true });
    }
    mediaBucketReady = true;
  } catch (e) {
    console.warn('[mediaAssetService] Supabase bucket check notice:', e.message);
  }
}

/**
 * Save an uploaded media asset
 */
async function saveMediaAsset({
  fileName,
  mimeType,
  fileSize,
  buffer,
  conceptId,
  publishDate,
  uploadedBy,
}) {
  await ensureMediaAssetTable();

  const assetId = `med_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const cleanName = (fileName || 'asset').replace(/[^a-zA-Z0-9._-]/g, '_');
  let publicUrl = null;

  // 1. Attempt Supabase Storage upload if credentials are provided
  if (env.supabase.url && env.supabase.serviceRoleKey) {
    try {
      const supabase = getSupabaseClient();
      await ensureSupabaseBucket(supabase);
      const bucketName = process.env.SUPABASE_MEDIA_BUCKET || 'media-assets';
      const storagePath = `${publishDate || 'general'}/${assetId}_${cleanName}`;
      
      const { error: uploadErr } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, buffer, {
          contentType: mimeType || 'application/octet-stream',
          upsert: true,
        });

      if (!uploadErr) {
        const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
        if (data && data.publicUrl) {
          publicUrl = data.publicUrl;
        }
      }
    } catch (sbErr) {
      console.warn('[mediaAssetService] Supabase upload failed, falling back to PostgreSQL:', sbErr.message);
    }
  }

  // 2. Persist in PostgreSQL (BYTEA ensures guaranteed availability across all environments)
  const fallbackUrl = `/api/media/files/${assetId}`;
  const finalUrl = publicUrl || fallbackUrl;

  await query(
    `INSERT INTO media_assets (id, file_name, mime_type, file_size, file_data, public_url, concept_id, publish_date, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      assetId,
      fileName,
      mimeType || 'application/octet-stream',
      fileSize || buffer.length,
      buffer,
      finalUrl,
      conceptId ? String(conceptId) : null,
      publishDate ? String(publishDate) : null,
      uploadedBy || 'Designer',
    ]
  );

  return {
    id: assetId,
    name: fileName,
    size: fileSize || buffer.length,
    type: mimeType || 'application/octet-stream',
    url: finalUrl,
    uploadedAt: new Date().toISOString(),
    uploadedBy: uploadedBy || 'Designer',
  };
}

/**
 * Fetch asset metadata and binary data
 */
async function getMediaAssetById(id) {
  await ensureMediaAssetTable();
  const res = await query(
    `SELECT id, file_name, mime_type, file_size, file_data, public_url, concept_id, publish_date, uploaded_by, created_at
     FROM media_assets WHERE id = $1`,
    [id]
  );
  if (!res.rows || res.rows.length === 0) {
    return null;
  }
  return res.rows[0];
}

/**
 * Delete an asset
 */
async function deleteMediaAssetById(id) {
  await ensureMediaAssetTable();
  await query(`DELETE FROM media_assets WHERE id = $1`, [id]);
  return true;
}

module.exports = {
  ensureMediaAssetTable,
  saveMediaAsset,
  getMediaAssetById,
  deleteMediaAssetById,
};
