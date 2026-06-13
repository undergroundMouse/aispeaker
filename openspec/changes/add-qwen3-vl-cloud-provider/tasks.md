## 1. Qwen Provider Module

- [x] 1.1 Add `cloudProviderConfig.ts` with WaveSpeed defaults and `VITE_QWEN_*` env resolution.
- [x] 1.2 Implement `QwenCloudVisualLanguageProvider` with OpenAI-compatible `chat/completions`, image payload encoding, structured JSON prompt, and answer normalization.
- [x] 1.3 Add `createCloudVisualLanguageProvider()` factory with mock fallback and actual-token extraction hook.

## 2. Application Wiring

- [x] 2.1 Wire the provider factory into `useRealtimeVisionVoice` behind `GatewayCloudVisualLanguageProvider`.
- [x] 2.2 Extend `GatewayCloudVisualLanguageProvider` to pass `extractActualTokens` into the cloud gateway.
- [x] 2.3 Expose `cloudProviderKind` from the hook and show `Cloud VLM` status in `App.tsx`.

## 3. Configuration and Documentation

- [x] 3.1 Add `.env.example` with Qwen variables and gitignore rules for `.env` / `.env.local`.
- [x] 3.2 Add `vite-env.d.ts` typings for Qwen environment variables.

## 4. Tests

- [x] 4.1 Add unit tests for env config resolution and provider factory selection.
- [x] 4.2 Add unit tests for Qwen prompt assembly, JSON parsing, region normalization, and token usage capture with mocked fetch.

## 5. OpenSpec

- [x] 5.1 Create change `add-qwen3-vl-cloud-provider` with proposal, design, delta specs, and tasks.
- [x] 5.2 Sync delta specs into main `openspec/specs/` capabilities.
