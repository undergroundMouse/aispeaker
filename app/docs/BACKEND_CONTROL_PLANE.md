# Backend Control Plane Setup

Use the server control plane for authoritative cloud visual-language execution, token telemetry, and budget enforcement.

## Start the server

1. Copy `server/.env.example` to `server/.env` and set:
   - `QWEN_API_KEY` for upstream Qwen access
   - `DEVICE_API_TOKEN` and `ADMIN_API_TOKEN`
2. Run `npm install` in `server/`.
3. Start with `npm run dev` in `server/` (default `http://localhost:3000`).

## Configure the client

1. Copy `app/.env.example` values into `app/.env.local`.
2. Set `VITE_BACKEND_BASE_URL=http://localhost:3000`.
3. Match `VITE_DEVICE_API_TOKEN` and `VITE_ADMIN_API_TOKEN` with the server tokens.
4. Use `VITE_CLOUD_AUTHORITY_MODE=server` for backend-authoritative budgeting.

## Operations admin

1. Open the app Operations Admin panel.
2. Conversation telemetry and daily spend are read from `/api/v1/admin/*` when backend mode is enabled.
3. Budget cap updates are persisted server-side through `PUT /api/v1/admin/budget`.

## Migration modes

| Mode | Behavior |
|------|----------|
| `server` | Backend enforces budget and records telemetry |
| `shadow` | Client gateway still enforces budget; backend also records requests |
| `client` | Legacy direct Qwen path when `VITE_QWEN_API_KEY` is set |

## Rollback

1. Remove `VITE_BACKEND_BASE_URL` from the client env.
2. Optionally set `VITE_CLOUD_AUTHORITY_MODE=client`.
3. The app falls back to mock or direct Qwen configuration.
