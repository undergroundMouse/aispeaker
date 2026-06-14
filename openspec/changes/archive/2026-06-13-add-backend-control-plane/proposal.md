## Why

The prototype implements cloud gateway budgeting, retry policy, operations admin APIs, and Qwen3-VL integration entirely inside the browser. OpenSpec already requires authoritative server-side token accounting and an operations admin backend, but the current code uses in-memory stores and client-exposed `VITE_QWEN_API_KEY` values that can be bypassed or leaked. Production needs a backend control plane that owns cloud credentials, enforces budgets, records telemetry, and proxies visual-language requests while preserving the existing local-first dialogue routing on the device.

## What Changes

- Add a `server/` backend control plane with device-facing and admin-facing HTTP APIs.
- Move authoritative `CloudGateway` enforcement (token estimation, retry, budget checks, telemetry writes) from the browser to the server.
- Add `POST /api/v1/cloud/visual-answer` as the sole production path for cloud-bound visual-language requests.
- Move Qwen3-VL provider credentials and upstream calls to the server; replace browser `VITE_QWEN_API_KEY` usage in production paths.
- Add `HttpCloudVisualLanguageProvider` on the client as a transport adapter to the backend API.
- Persist conversation telemetry, daily spend, and budget configuration in a server datastore instead of in-memory maps.
- Expose operations admin list/read/budget APIs over HTTP with authorization checks.
- Keep `MultimodalDialogueService`, local vision, local memory, custom object learning, media privacy, and TTS on the client.
- Return a distinct budget-exceeded message instead of reusing the weak-network retry phrase.
- Support a shadow-mode migration path before flipping budget authority to the server.

## Capabilities

### New Capabilities

- `backend-control-plane`: Defines the server process, device/admin API surfaces, authentication boundaries, persistence model, and migration phases for authoritative cloud governance.
- `cloud-gateway-cost-governance`: Promotes gateway token estimation, retry policy, telemetry storage, budget enforcement, and operations admin visibility from prototype client code into production server requirements.

### Modified Capabilities

- `qwen-cloud-visual-language`: Shift Qwen credentials and upstream invocation to the server; client uses an HTTP adapter while preserving structured answer normalization.
- `realtime-vision-voice-ai-input`: Require production cloud visual-language calls to go through the backend control plane; update provider-status and configuration requirements away from browser API keys.

## Impact

- New code area: `server/` service with routes, gateway service, Qwen adapter, operations admin service, and persistence layer.
- Client changes: replace direct/browser gateway authority with `HttpCloudVisualLanguageProvider`; operations panel reads admin HTTP APIs.
- Shared contracts: extract or mirror `VisualAnswer`, telemetry, and request types between `app/` and `server/`.
- Configuration: server-side secrets such as `QWEN_API_KEY`, `ADMIN_API_TOKEN`, database URL; remove production dependence on `VITE_QWEN_API_KEY`.
- Operations: deploy and monitor an additional service; SQLite acceptable for development, Postgres recommended for production.
- Privacy: server receives only authorized frame payloads and optional memory summaries for a single request; raw media and personalized memory stores remain device-local by default.
