## Context

The current app is a React/Vite prototype with local-first multimodal routing in `MultimodalDialogueService`. Cloud visual-language calls are wrapped by `GatewayCloudVisualLanguageProvider` and `CloudGateway`, but both run in the browser with `InMemoryConversationTelemetryStore` and `InMemoryOperationsAdmin`. Qwen3-VL is integrated through `QwenCloudVisualLanguageProvider`, which reads `VITE_QWEN_API_KEY` and calls WaveSpeed directly from the client.

OpenSpec changes `add-privacy-cost-cloud-governance` and `add-qwen3-vl-cloud-provider` define the intended behavior, but production authority for budgeting and credential management was deferred. Option B establishes a single backend control plane that becomes the trusted executor for all cloud visual-language traffic.

## Goals / Non-Goals

**Goals:**

- Deploy one backend service with device and admin API routes.
- Make the server the authoritative source for token estimation, retries, budget enforcement, telemetry, and Qwen credentials.
- Preserve client-side edge routing so simple visual questions and local memory matches still short-circuit before any network call.
- Reuse existing domain types and gateway algorithms where possible by migrating `tokenEstimator`, `cloudGateway`, `operationsAdmin`, and Qwen adapter logic into `server/`.
- Provide a phased migration: shadow logging, authority flip, then hardening.
- Return distinct user-facing messages for budget exhaustion versus transport failure.

**Non-Goals:**

- Moving `MultimodalDialogueService`, local vision, long-term memory, or custom object stores to the server.
- Cross-device memory sync or server-side storage of personalized memory exports.
- Streaming thinking tokens to the client.
- Multi-provider routing beyond Qwen plus mock/dev fallback in the first release.
- Invoice-grade reconciliation with provider billing systems.

## Decisions

1. **Single control-plane process with two API surfaces**
   - Device API for `/api/v1/cloud/visual-answer`
   - Admin API for conversation telemetry and budget configuration
   - Alternative considered: separate admin microservice. Rejected for prototype-to-production simplicity.

2. **Client keeps routing; server owns execution**
   - `MultimodalDialogueService` continues deciding whether a turn needs cloud processing.
   - Only approved cloud turns call the backend.
   - Alternative considered: server-side dialogue orchestration. Rejected because it conflicts with local-first privacy and existing architecture.

3. **Transport adapter on the client**
   - Introduce `HttpCloudVisualLanguageProvider` implementing `CloudVisualLanguageProvider`.
   - Production path calls the backend; development may still use mock/local providers.
   - Alternative considered: keep `GatewayCloudVisualLanguageProvider` as budget authority on the client. Rejected because budgets would remain bypassable.

4. **Reuse gateway algorithms server-side**
   - Port `estimateRequestTokens`, retry/backoff, and telemetry merge logic from `app/src/gateway`.
   - Server gateway invokes the Qwen adapter directly instead of using an injected `invoke` callback.
   - Alternative considered: rewrite governance logic from scratch. Rejected due to higher regression risk.

5. **Persistence model**
   - Tables or collections for `conversation_telemetry`, `daily_spend`, and `budget_config`.
   - SQLite for local development; Postgres for production.
   - Alternative considered: Redis-only counters. Rejected because operations review needs durable conversation records.

6. **Authentication boundaries**
   - Device requests use a lightweight device/session credential for `/api/v1/cloud/*`.
   - Admin requests use a separate bearer token for `/api/v1/admin/*`.
   - Prototype hard-coded `ops-admin-token` is replaced by server-configured admin credentials.
   - Alternative considered: no device auth in v1. Rejected because public deployments would allow unbounded proxy abuse.

7. **Budget scope**
   - Phase 1 uses a single global daily budget per deployment.
   - Schema reserves optional `tenant_id` for later per-tenant caps.
   - Alternative considered: per-user budgets immediately. Rejected as unnecessary for first backend release.

8. **Failure messaging**
   - Transport/provider exhaustion returns "网络不佳，请重试".
   - Budget exhaustion returns a distinct message such as "今日云端预算已用尽".
   - Alternative considered: one message for all failures. Rejected because operations need clear user feedback.

9. **Secret handling**
   - `QWEN_API_KEY` and provider base URL live only in server environment variables.
   - Client `.env` documents backend base URL, not model API keys.
   - Alternative considered: keep `VITE_QWEN_API_KEY` alongside server proxy. Rejected because it preserves key leakage.

## Risks / Trade-offs

- [Extra network hop] → Acceptable relative to VLM latency; monitor p95 end-to-end dialogue timing.
- [Type drift between app and server] → Mitigation: shared types package or generated OpenAPI client.
- [Shadow mode complexity] → Mitigation: time-box to one release cycle and remove dual-write after authority flip.
- [Server receives sensitive frames] → Mitigation: require `cloudMediaTransmission` consent, do not persist frame payloads, log only metadata.
- [Budget message UX change] → Mitigation: update client UI and specs together during authority flip.

## Migration Plan

1. **Phase 0 – Document and scaffold**
   - Add `server/` project, health route, and empty persistence layer.

2. **Phase 1 – Shadow mode**
   - Deploy backend with visual-answer and telemetry APIs.
   - Client keeps existing in-browser gateway for enforcement but also posts shadow requests or logs server responses for comparison.
   - Budget still enforced locally.

3. **Phase 2 – Authority flip**
   - Switch `createCloudVisualLanguageProvider()` production path to `HttpCloudVisualLanguageProvider`.
   - Move budget enforcement and telemetry writes to server responses only.
   - Operations panel reads admin HTTP APIs.
   - Remove production use of `VITE_QWEN_API_KEY`.

4. **Phase 3 – Hardening**
   - Add rate limits, structured audit logs, optional standalone admin UI, and tenant-scoped budgets.

Rollback: point the client adapter back to mock/local providers and disable server budget enforcement while keeping read-only telemetry.

## Open Questions

- Should device auth be a signed deviceId in v1 or a full user session system?
- Should the admin UI remain embedded in `App.tsx` or move to a separate `admin/` frontend in Phase 3?
- Should WaveSpeed remain the default upstream or switch to DashScope direct billing after the control plane exists?
