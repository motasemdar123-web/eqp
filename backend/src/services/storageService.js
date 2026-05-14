const { getSupabaseClient } = require('../config/supabase');
const { env } = require('../config/env');

let reportBucketReady = false;

async function ensureReportBucket(supabase) {
  if (reportBucketReady) return;

  const bucketName = env.supabase.reportsBucket;
  const { data: bucket, error } = await supabase.storage.getBucket(bucketName);

  if (error) {
    const notFound = String(error.message || '').toLowerCase().includes('not found');

    if (!notFound) throw error;

    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
    });

    if (createError) throw createError;
    reportBucketReady = true;
    return;
  }

  if (bucket && bucket.public !== true) {
    const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
      public: true,
    });

    if (updateError) throw updateError;
  }

  reportBucketReady = true;
}

async function uploadReport(fileName, buffer, contentType = 'application/pdf') {
  const supabase = getSupabaseClient();
  await ensureReportBucket(supabase);

  const { error } = await supabase.storage
    .from(env.supabase.reportsBucket)
    .upload(fileName, buffer, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(env.supabase.reportsBucket)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

async function deleteReport(fileName) {
  const supabase = getSupabaseClient();
  await ensureReportBucket(supabase);

  const { error } = await supabase.storage
    .from(env.supabase.reportsBucket)
    .remove([fileName]);

  if (error) throw error;
}

module.exports = {
  ensureReportBucket,
  uploadReport,
  deleteReport,
};
