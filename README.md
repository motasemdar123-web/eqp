# Dar Al HAI Maintenance Management System

This repository is being transformed from the original EQP reporting app into the main internal maintenance management platform for Dar Al HAI.

The existing EQP functionality is preserved as a dedicated module:

- Equipment preventive maintenance Excel report generation
- Machine and report history
- Supabase report storage
- Download, rename, and delete report archive
- Backward-compatible legacy endpoints

## Applications

- `backend`: Node.js / Express API with PostgreSQL, Prisma schema, security middleware, RBAC foundations, and EQP compatibility routes.
- `frontend`: Next.js application with:
  - English-first management dashboard
  - Arabic-first RTL technician interface
  - EQP module routes

## Main Routes

Frontend:

- `/` platform entry
- `/management` admin/operations dashboard
- `/technician/login` Arabic technician login
- `/technician/tasks` Arabic technician tasks
- `/eqp` EQP module landing
- `/eqp/generate-reports` preserved EQP report generation
- `/eqp/reports` preserved EQP report archive

Backend:

- `/api/auth/login`
- `/api/dashboard`
- `/api/maintenance-requests`
- `/api/work-orders`
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

## Language Rules

- Management dashboards are English-first.
- Technician pages are Arabic-first with RTL layout.
- Internal enums and API values use English canonical values.
- Arabic technician labels map to English internal statuses.

Example:

- `قيد التنفيذ` maps to `IN_PROGRESS`
- `تم الإنجاز` maps to `COMPLETED`
