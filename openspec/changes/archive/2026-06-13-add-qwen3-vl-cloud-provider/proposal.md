## Why

The realtime vision and voice prototype already defines cloud visual-language processing and gateway cost governance, but production dialogue still uses `MockCloudVisualLanguageProvider` with no path to a real multimodal backend. Operators need a configurable Qwen3-VL provider so complex visual questions can be answered by an actual vision-language model while preserving local-first routing, visual evidence normalization, gateway retries, and budget telemetry.

## What Changes

- Add a `QwenCloudVisualLanguageProvider` adapter that calls an OpenAI-compatible WaveSpeed endpoint for `qwen/qwen3-vl-8b-thinking`.
- Add environment-driven provider selection: when `VITE_QWEN_API_KEY` is configured, use Qwen; otherwise fall back to the existing mock provider.
- Send authorized camera frames as base64 image payloads with transcript, local vision hints, and optional long-term memory context in a structured JSON prompt.
- Parse model output into normalized `VisualAnswer` fields (`answer`, `explanation`, `regions`, `confidence`) and preserve thinking-model `reasoning_content` as explanation when present.
- Route all Qwen calls through the existing `CloudGateway`, recording actual token usage from provider responses when available.
- Surface the active cloud provider in the operations dashboard (`Qwen3-VL-8B-Thinking` vs `mock`).
- Document prototype-only API key handling via `.env.local` / `.env.example` with gitignored secrets.

## Capabilities

### New Capabilities

- `qwen-cloud-visual-language`: Defines Qwen3-VL provider configuration, OpenAI-compatible request/response handling, structured answer parsing, gateway integration, and mock fallback behavior.

### Modified Capabilities

- `realtime-vision-voice-ai-input`: Extend cloud visual-language processing to support a configured Qwen3-VL backend and operator-visible provider status.

## Impact

- Affected app modules: `qwenCloudVisualLanguage.ts`, `cloudProviderConfig.ts`, `createCloudVisualLanguageProvider.ts`, `useRealtimeVisionVoice.ts`, `cloudGateway.ts`, `App.tsx`, `.env.example`, `.gitignore`.
- External dependency: WaveSpeed AI OpenAI-compatible API (`https://llm.wavespeed.ai/v1`) and Qwen3-VL-8B-Thinking model id `qwen/qwen3-vl-8b-thinking`.
- Security: prototype stores API keys in Vite client env; production should proxy cloud calls through a backend.
- Testing: unit tests for config resolution, provider factory, prompt assembly, and structured response parsing with mocked fetch.
