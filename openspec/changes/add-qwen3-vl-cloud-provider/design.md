## Context

The app implements `CloudVisualLanguageProvider` with a mock adapter and wraps all cloud visual-language calls in `GatewayCloudVisualLanguageProvider` for token estimation, retries, and budget enforcement. Complex visual turns already require user-authorized frame transmission and normalize answers through `visualEvidence.ts`. The selected production model is **Qwen3-VL-8B-Thinking** accessed through **WaveSpeed AI** using an OpenAI-compatible `chat/completions` API.

## Goals / Non-Goals

**Goals:**

- Replace the mock cloud provider with a real Qwen3-VL adapter when API credentials are configured.
- Preserve existing local-first routing, object-recognition uncertainty wording ("看不清楚"), visual evidence normalization, and gateway telemetry.
- Keep provider selection declarative via environment variables with safe gitignored local secrets.
- Expose which provider is active in the UI for operator debugging.

**Non-Goals:**

- Building a server-side API proxy for secrets management.
- Replacing local vision, ASR, or TTS with Qwen services.
- Supporting multiple simultaneous cloud VLM vendors beyond Qwen + mock fallback in this change.
- Streaming partial thinking tokens to the UI.

## Decisions

1. **WaveSpeed OpenAI-compatible endpoint**
   - Use `POST /v1/chat/completions` at `https://llm.wavespeed.ai/v1` with model id `qwen/qwen3-vl-8b-thinking`.
   - Alternative considered: DashScope native SDK. Rejected to keep a single fetch-based adapter compatible with the current browser prototype.

2. **Environment-based provider factory**
   - `createCloudVisualLanguageProvider()` reads `VITE_QWEN_API_KEY`, `VITE_QWEN_BASE_URL`, and `VITE_QWEN_MODEL`.
   - Missing key → `MockCloudVisualLanguageProvider`.
   - Alternative considered: hard-coded runtime toggle in UI. Rejected because deployment environments should control credentials.

3. **Structured JSON answer contract**
   - Prompt requires a single JSON object with `kind`, `answer`, `explanation`, `confidence`, `label`, and normalized `regions`.
   - Parser tolerates markdown fences and uses `reasoning_content` as fallback explanation for thinking models.
   - Alternative considered: free-form text only. Rejected because visual evidence overlay requires normalized regions.

4. **Gateway token accounting**
   - `GatewayCloudVisualLanguageProvider` accepts optional `extractActualTokens` and records `usage.total_tokens` from Qwen responses.
   - Keeps pre-request estimates when actual usage is unavailable.

5. **Prototype secret handling**
   - Store credentials in `.env.local` (gitignored). Ship `.env.example` without secrets.
   - Document that `VITE_` variables are embedded in client bundles and are not production-safe.

## Risks / Trade-offs

- [Client-exposed API keys] → Use `.env.local` for development only; plan backend proxy before production.
- [Simple questions may never reach cloud due to local short-circuit] → Document test utterances for cloud routing; unchanged from existing edge-cloud design.
- [Thinking models may return non-JSON content] → Parser falls back to plain-text answers without invented regions.
- [CORS or provider outages] → Existing gateway retry policy and "网络不佳，请重试" messaging remain in effect.

## Migration Plan

1. Add provider modules and tests.
2. Add `.env.example` and document required variables.
3. Configure `.env.local` on developer machines.
4. Verify dashboard shows `Cloud VLM: Qwen3-VL-8B-Thinking` and complex visual questions invoke the remote model with cloud media consent enabled.
5. Roll back by removing `VITE_QWEN_API_KEY` to restore mock behavior.

## Open Questions

- Whether production should standardize on WaveSpeed or switch to DashScope direct billing.
- Whether thinking-token usage should be priced separately in gateway cost estimates.
