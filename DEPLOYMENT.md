# EQP Production Deployment

## Backend on Render

Use `backend` as the service root.

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Required environment variables:

```env
PORT=5000
DB_HOST=...
DB_PORT=5432
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_REPORTS_BUCKET=reports
APP_SECRET=replace-with-a-long-random-secret
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,https://*.vercel.app
```

`APP_SECRET` must be a long random value and must never be exposed to Vercel.

## Frontend on Vercel

Use `frontend` as the project root.

Required environment variables:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-render-backend.onrender.com
```

After changing `NEXT_PUBLIC_BACKEND_URL`, redeploy the Vercel project because this value is bundled into the client build.

If Vercel preview deployments need to call the backend, include `https://*.vercel.app` in `ALLOWED_ORIGINS`.

## Supabase

The app expects:

- PostgreSQL tables: `users`, `machines`, `reports`, `report_comments`, `machine_history`.
- Storage bucket: `reports`.
- Database hardening and analytics SQL are in `backend/db`.
