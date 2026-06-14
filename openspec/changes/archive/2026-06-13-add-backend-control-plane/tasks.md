## 1. Server Scaffold

- [x] 1.1 Create `server/` package with TypeScript runtime, health endpoint, and environment configuration loading.
- [x] 1.2 Add persistence layer with `conversation_telemetry`, `daily_spend`, and `budget_config` models (JSON file dev store, Postgres-ready interfaces).
- [x] 1.3 Add device auth and admin auth middleware for separated API namespaces.

## 2. Gateway and Provider Migration

- [x] 2.1 Port `tokenEstimator` logic into the server gateway service.
- [x] 2.2 Port `CloudGateway` invoke/retry/budget enforcement into the server with durable telemetry writes.
- [x] 2.3 Port Qwen adapter logic into a server-side provider using `QWEN_API_KEY` and WaveSpeed defaults.
- [x] 2.4 Implement `POST /api/v1/cloud/visual-answer` with consent validation, ephemeral frame handling, and normalized `VisualAnswer` responses.
- [x] 2.5 Return distinct budget-exceeded messaging separate from weak-network retry messaging.

## 3. Operations Admin API

- [x] 3.1 Port `OperationsAdminApi` to HTTP routes for list/get conversation telemetry.
- [x] 3.2 Add HTTP routes for budget config read/update and daily spend read.
- [x] 3.3 Replace prototype `ops-admin-token` checks with server-configured admin credentials.
- [x] 3.4 Document operator setup for server-backed admin usage.

## 4. Shared Contracts

- [x] 4.1 Extract or mirror shared request/response types for visual answer, telemetry, and budget APIs between `app/` and `server/`.
- [x] 4.2 Define OpenAPI or typed client contract for `/api/v1/cloud/visual-answer` and `/api/v1/admin/*`.

## 5. Client Integration

- [x] 5.1 Implement `HttpCloudVisualLanguageProvider` that calls the backend visual answer API.
- [x] 5.2 Update `createCloudVisualLanguageProvider()` to prefer backend HTTP adapter when backend base URL is configured.
- [x] 5.3 Update operations admin panel to read/write budget and telemetry through backend admin APIs.
- [x] 5.4 Update dashboard provider status to show `backend+Qwen3-VL-8B-Thinking` versus `mock`.
- [x] 5.5 Replace client `.env.example` backend variables and remove production dependence on `VITE_QWEN_API_KEY`.

## 6. Migration Phases

- [x] 6.1 Add shadow-mode configuration that records server telemetry while client gateway enforcement remains active.
- [x] 6.2 Add authority-flip configuration that makes backend responses the sole budget and telemetry source.
- [x] 6.3 Document rollback steps to mock/local providers if backend execution is disabled.

## 7. Tests

- [x] 7.1 Add server unit tests for token estimation, retry policy, budget blocking, and telemetry persistence.
- [x] 7.2 Add server integration tests for `/api/v1/cloud/visual-answer` with mocked upstream Qwen responses.
- [x] 7.3 Add server auth tests for unauthorized device and admin requests.
- [x] 7.4 Add client tests for `HttpCloudVisualLanguageProvider` request mapping and failure reason handling.
- [x] 7.5 Add end-to-end test for budget-exceeded response messaging and operations panel budget updates.

## 8. OpenSpec

- [x] 8.1 Review change artifacts with stakeholders and resolve open questions for device auth and admin UI placement.
- [x] 8.2 Sync delta specs into main `openspec/specs/` after implementation is complete.
