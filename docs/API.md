# API Documentation

## Authentication

The platform has one unified authentication entry point. After login, the client routes users by role and renders role-based UI.

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

## Scheduling and Job Cards

### GET `/api/scheduling/board?date=YYYY-MM-DD`

Requires `SCHEDULE_MANAGE`.

Returns the daily dispatch board:

- technicians
- shifts
- technician schedules
- job cards scheduled for the selected date
- open requests
- assets
- dispatch KPIs

### POST `/api/shifts`

Requires `SCHEDULE_MANAGE`.

Creates or updates a shift.

```json
{
  "name": "Morning Shift",
  "startsAt": "08:00",
  "endsAt": "16:00",
  "branchId": "optional-branch-id"
}
```

### POST `/api/scheduling/technician-schedules`

Requires `SCHEDULE_MANAGE`.

Creates or updates a technician daily schedule.

```json
{
  "technicianId": "technician-profile-id",
  "shiftId": "shift-id",
  "branchId": "branch-id",
  "workDate": "2026-05-14",
  "startsAt": "08:00",
  "endsAt": "16:00",
  "status": "CONFIRMED",
  "notes": "North zone coverage"
}
```

Schedule statuses are English canonical values:

- `PLANNED`
- `CONFIRMED`
- `ON_DUTY`
- `OFF_DUTY`
- `LEAVE`
- `COMPLETED`
- `CANCELLED`

### POST `/api/scheduling/job-cards`

Requires `WORK_ORDERS_MANAGE`.

Creates a dispatch-ready job card as a work order with one or more assigned technicians.

```json
{
  "title": "Water pump pressure inspection",
  "jobType": "Inspection",
  "priority": "MEDIUM",
  "workDate": "2026-05-14",
  "startsAt": "10:30",
  "endsAt": "12:00",
  "teamLeadTechnicianId": "technician-profile-id",
  "technicianIds": ["technician-profile-id"],
  "workScope": "Inspect pump pressure and submit findings.",
  "safetyNotes": "Isolate pump before opening casing.",
  "requiredTools": "Pressure gauge, wrench",
  "requiredParts": "Valve gasket set",
  "permitRequired": false
}
```

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
