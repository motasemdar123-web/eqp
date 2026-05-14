const env = {
  port: process.env.PORT || 5000,
  db: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    reportsBucket: process.env.SUPABASE_REPORTS_BUCKET || 'reports',
  },
  security: {
    appSecret: process.env.APP_SECRET,
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,https://*.vercel.app')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
};

module.exports = { env };
