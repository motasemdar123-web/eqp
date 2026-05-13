const { getSupabaseClient } = require('../config/supabase');
const { env } = require('../config/env');

async function uploadReport(fileName, buffer) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage
    .from(env.supabase.reportsBucket)
    .upload(fileName, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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

  const { error } = await supabase.storage
    .from(env.supabase.reportsBucket)
    .remove([fileName]);

  if (error) throw error;
}

module.exports = {
  uploadReport,
  deleteReport,
};
