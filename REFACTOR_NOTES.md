# EQP Refactor Notes

## Backend

- `backend/app.js` is now only responsible for loading environment variables, connecting to PostgreSQL, and starting Express.
- API behavior is split into `controllers`, `services`, `repositories`, `routes`, `config`, and `middleware`.
- Report generation keeps the same Excel/Supabase behavior while isolating template handling, storage upload, database writes, and validation.
- API errors now flow through one error middleware with stable JSON responses.

## Frontend

- Backend calls are centralized in `frontend/lib/api.js`.
- Local auth storage helpers live in `frontend/lib/auth.js`.
- Reusable UI elements live in `frontend/components`.
- Dashboard, verification, and reports pages keep the same user flow with cleaner loading, error, empty, and table states.

## Database

- Suggested constraints and indexes are in `backend/db/schema-hardening.sql`.
- Apply this file only after confirming existing production data satisfies the constraints.
