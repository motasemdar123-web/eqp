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
- Arabic technician pages in `frontend/app/technician`
- EQP module pages in `frontend/app/eqp`

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

## Fresh Database Bootstrap

```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
```

No manual table creation is required.

## Security

- Platform auth uses JWT.
- EQP auth uses signed technician session tokens.
- RBAC permissions are represented by English canonical values.
- API middleware enforces permission gates.
- Helmet, rate limiting, and CORS are enabled.
