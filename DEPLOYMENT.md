# EQP Production Deployment

## Backend on Render

The backend must run as a Docker service because EQP report generation exports populated Excel workbooks with LibreOffice/`soffice`.

Use the repository `render.yaml` blueprint, or configure the existing Render web service manually:

- Runtime / Language: `Docker`
- Dockerfile path: `./backend/Dockerfile`
- Docker context: `./backend`
- Start command: leave empty so Render uses the Dockerfile `CMD`

Do not use Render's native Node runtime for the backend. Native Node does not include LibreOffice, so Excel-to-PDF conversion will fail.

The Docker image installs:

- `libreoffice`
- `fonts-dejavu`
- `fontconfig`

You can confirm the deployed backend has conversion support with:

```bash
curl https://your-render-backend.onrender.com/health/pdf-converter
```

The response must include `"available": true`.

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
LIBREOFFICE_BIN=soffice
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
