# Programmer Manual

## Architecture

The backend follows layered architecture:

- `routes`: HTTP routing
- `controllers`: request/response shape
- `services`: business logic
- `repositories`: data access for existing EQP SQL
- `prisma`: new Dar Al HAI domain model
- `middleware`: auth, RBAC, CORS, rate limits, errors

The frontend uses Next.js App Router and separates:

- reusable components in `frontend/components`
- API helpers in `frontend/lib`
- management pages in `frontend/app/management`
- EQP module pages in `frontend/app/eqp`
- Microsoft callback page in `frontend/app/auth/microsoft/callback`

## EQP Preservation Rule

Do not remove or rename existing EQP endpoints unless wrappers are retained.

Current compatibility routes:

- legacy: `/machines`, `/reports`, `/generate-reports`
- module: `/api/eqp/*`

## Prisma

New Dar Al HAI models are canonical Prisma models.

EQP module tables use mapped Prisma models:

```prisma
model EqpMachine {
  @@map("eqp_machines")
}
```

Repository adapters can still fall back to the legacy `machines`, `reports`, `machine_history`, and `report_comments` tables during transition.

## Scheduling Domain

Scheduling uses:

- `technician_profiles` for technician identity and default shift
- `shifts` for reusable work-hour templates
- `technician_schedules` for daily technician schedules
- `work_orders` as job cards
- `work_order_assignments` for one or more assigned technicians
- `activity_timelines` for dispatch and operational audit events

Job card fields on `work_orders` include `job_type`, `work_scope`, `safety_notes`, `required_tools`, `required_parts`, `permit_required`, `customer_contact`, `estimated_duration_minutes`, and `team_lead_technician_id`.

## Fresh Database Bootstrap

```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
```

No manual table creation is required.

## Security

- Authentication is Microsoft Entra ID only.
- The backend implements the OAuth authorization-code callback and exchanges the code with Microsoft.
- The backend reads the signed-in user through Microsoft Graph `/me`.
- The frontend receives only a one-time backend login code, then exchanges it for the internal platform JWT.
- Platform auth uses JWT after Microsoft verification.
- EQP compatibility uses a signed session token generated after Microsoft verification.
- RBAC permissions are represented by English canonical values.
- API middleware enforces permission gates.
- Helmet, rate limiting, and CORS are enabled.

Required Microsoft environment variables:

- `MICROSOFT_TENANT_ID`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_REDIRECT_URI`
- `MICROSOFT_FRONTEND_CALLBACK_URL`
- `MICROSOFT_ALLOWED_DOMAINS`
- `MICROSOFT_ADMIN_EMAILS`
