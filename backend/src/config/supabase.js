const { createClient } = require('@supabase/supabase-js');
const { env } = require('./env');
const { ApiError } = require('../utils/ApiError');

let supabase = null;

function getSupabaseClient() {
  if (supabase) return supabase;

  if (!env.supabase.url || !env.supabase.serviceRoleKey) {
    throw new ApiError(
      500,
      'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env.'
    );
  }

  supabase = createClient(
    env.supabase.url,
    env.supabase.serviceRoleKey
  );

  return supabase;
}

module.exports = { getSupabaseClient };
