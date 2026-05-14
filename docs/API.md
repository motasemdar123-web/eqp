# API Documentation

## Authentication

### POST `/api/auth/login`

Body:

```json
{
  "email": "admin@daralhai.com",
  "password": "ChangeMe123!"
}
```

Returns a JWT for Dar Al HAI platform APIs.

## Maintenance Requests

### GET `/api/maintenance-requests`

Requires `REQUESTS_READ`.

### POST `/api/maintenance-requests`

Requires `REQUESTS_CREATE`.

Canonical status values are English:

- `NEW`
- `TRIAGED`
- `ASSIGNED`
- `IN_PROGRESS`
- `ON_HOLD`
- `COMPLETED`
- `CLOSED`
- `REOPENED`
- `CANCELLED`
- `MERGED`

Arabic UI labels are mapped before persistence.

## Work Orders

### GET `/api/work-orders`

Requires `WORK_ORDERS_MANAGE`.

### POST `/api/work-orders`

Creates manual or request-linked work orders.

### POST `/api/work-orders/:id/close`

Stores closure notes, root cause, corrective action, and preventive action.

## EQP Compatibility

New module routes:

- `/api/eqp/machines`
- `/api/eqp/machine-history`
- `/api/eqp/reports`
- `/api/eqp/generate-reports`

Legacy routes remain:

- `/machines`
- `/machine-history`
- `/reports`
- `/generate-reports`
