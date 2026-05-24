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
    manualsBucket: process.env.SUPABASE_MANUALS_BUCKET || 'shop-manuals',
  },
  security: {
    appSecret: process.env.APP_SECRET,
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,https://*.vercel.app')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  microsoft: {
    tenantId: process.env.MICROSOFT_TENANT_ID,
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI,
    frontendCallbackUrl: process.env.MICROSOFT_FRONTEND_CALLBACK_URL || process.env.FRONTEND_URL,
    allowedDomains: (process.env.MICROSOFT_ALLOWED_DOMAINS || 'daralhai.com')
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean),
    adminEmails: (process.env.MICROSOFT_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
    engineerEmails: (process.env.MICROSOFT_ENGINEER_EMAILS || 'motasem.ghanem@daralhai.com,abdelrahman@daralhai.com,faisal@daralhai.com')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
    engineerNames: (process.env.MICROSOFT_ENGINEER_NAMES || 'motasem,abdelrahman,faisal,mahmoud qaddour')
      .split(',')
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean),
    autoProvision: process.env.MICROSOFT_AUTO_PROVISION === 'true',
    defaultRole: process.env.MICROSOFT_DEFAULT_ROLE || 'CLIENT',
  },
};

module.exports = { env };
