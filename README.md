# Dar Al HAI Maintenance Management System

This repository is being transformed from the original EQP reporting app into the main internal maintenance management platform for Dar Al HAI.

The existing EQP functionality is preserved as a dedicated module:

- Equipment preventive maintenance Excel template population
- Final PDF report export from populated EQP workbooks
- Machine and report history
- Supabase report storage
- Download, rename, and delete report archive
- Backward-compatible legacy endpoints

## Applications

- `backend`: Node.js / Express API with PostgreSQL, Prisma schema, security middleware, RBAC foundations, Microsoft authentication, and EQP compatibility routes.
- `frontend`: Next.js application with:
  - English-first management dashboard
  - Microsoft-only sign-in
  - EQP module routes

## Main Routes

Frontend:

- `/` platform entry
- `/engineer` engineer approval workspace
- `/technician` Arabic technician schedule and completion evidence page
- `/management` admin/operations dashboard
- `/auth/microsoft/callback` Microsoft sign-in callback
- `/eqp` EQP module landing
- `/eqp/generate-reports` preserved EQP report generation
- `/eqp/reports` preserved EQP PDF report archive

Backend:

- `/api/auth/microsoft/start`
- `/api/auth/microsoft/callback`
- `/api/auth/microsoft/session`
- `/auth/microsoft/start` compatibility alias
- `/auth/microsoft/callback` compatibility alias
- `/auth/microsoft/session` compatibility alias
- `/api/dashboard`
- `/api/maintenance-requests`
- `/api/work-orders`
- `/api/technician/schedule`
- `/api/technician/work-orders/:id/finish`
- `/api/engineer/completion-requests`
- `/api/engineer/completion-requests/:id/review`
- `/api/scheduling/board`
- `/api/scheduling/technician-schedules`
- `/api/scheduling/job-cards`
- `/api/assets`
- `/api/spare-parts`
- `/api/clients`
- `/api/notifications`
- `/api/eqp/*`
- Legacy EQP endpoints such as `/machines`, `/reports`, `/generate-reports` remain available.

## Local Setup

```bash
docker compose up --build
```

Or run manually:

```bash
cd backend
npm install
npm run prisma:generate
npm start
```

```bash
cd frontend
npm install
npm run dev
```

## Microsoft Authentication

Interactive sign-in is handled exclusively through Microsoft Entra ID.

Create an App Registration in Microsoft Entra and configure this backend redirect URI:

```text
https://your-backend-domain.com/api/auth/microsoft/callback
```

The backend also accepts `/auth/microsoft/callback` as a compatibility alias, but `/api/auth/microsoft/callback` is the recommended URI.

Set these backend environment variables:

```bash
MICROSOFT_TENANT_ID=your-entra-tenant-id
MICROSOFT_CLIENT_ID=your-app-registration-client-id
MICROSOFT_CLIENT_SECRET=your-app-registration-client-secret
MICROSOFT_REDIRECT_URI=https://your-backend-domain.com/api/auth/microsoft/callback
MICROSOFT_FRONTEND_CALLBACK_URL=https://your-frontend-domain.com/auth/microsoft/callback
MICROSOFT_ALLOWED_DOMAINS=daralhai.com
MICROSOFT_ADMIN_EMAILS=motasem.ghanem@daralhai.com
MICROSOFT_ENGINEER_EMAILS=motasem.ghanem@daralhai.com,abdelrahman@daralhai.com,faisal@daralhai.com
MICROSOFT_ENGINEER_NAMES=motasem,abdelrahman,faisal
```

The Microsoft app needs delegated access for `openid`, `profile`, `email`, and Microsoft Graph `User.Read`.

Engineer accounts listed in `MICROSOFT_ENGINEER_EMAILS` are automatically assigned the `MAINTENANCE_SUPERVISOR` role on Microsoft sign-in. Motasem, Abdelrahman, and Faisal are treated as engineers, not technicians, and the EQP module is restricted to engineer/management permissions.

To reconcile an existing live database after changing engineer ownership:

```bash
cd backend
npm run reconcile:engineers
```

## Database

Prisma schema is in `backend/prisma/schema.prisma`.

The database can be created from scratch with no manual SQL:

```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
```

The initial migration creates all platform tables, enums, indexes, constraints, and EQP module tables.

The scheduling module includes:

- 9 seeded field technicians
- reusable shifts
- daily technician schedules
- dispatch-ready job cards
- multi-technician job assignment
- job scope, safety notes, tools, parts, permit, and team lead fields

EQP is now represented by first-class Prisma-managed tables:

- `eqp_machines`
- `eqp_reports`
- `eqp_machine_history`
- `eqp_report_comments`

The backend EQP repositories include compatibility adapters that can read legacy table names if a deployment has not migrated yet.

EQP report generation still populates the existing Excel templates first, then exports the exact workbook result as PDF before uploading to Supabase. Docker installs LibreOffice for workbook-to-PDF conversion. If `LIBREOFFICE_BIN` or a system `soffice` binary is unavailable, generation fails with a clear configuration error instead of producing a different-looking PDF.

## Language Rules

- Management dashboards are English-first.
- Engineer approval pages are English-first.
- Technician pages are Arabic-first with RTL layout.
- Internal enums and API values use English canonical values.
- Arabic notes can be stored as free text where operationally needed.
