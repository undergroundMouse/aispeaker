## Why

The Assist client still mixes privacy decisions, durable memory data, and engineering debug tooling in settings and development-only surfaces. Long-term memories are seeded at startup rather than learned from real dialogue, local voice commands do not always appear in the dialogue panel, and the debug panel exposes implementation detail that judges and end users should never see. Users need a cleaner product IA with memory authorization in Settings, learned data on a dedicated `/memory` page, full voice transcript history in the dialogue panel, automatic long-term memory extraction from conversation, and complete removal of the debug surface.

## What Changes

- Split **privacy authorization** from **memory data management**: Settings keeps camera, microphone, cloud media, and long-term memory consent toggles; learned custom objects and long-term memory lists move to a dedicated **`/memory`** surface.
- Add a **Memory surface** at `/memory` with learned-object and long-term-memory lists, export, delete, forget-all, and stale-memory warnings; expose entry from Assist chrome with badge for memory health issues.
- **Remove the development debug surface entirely** from the client UI, including dev-mode and `?debug=1` rendering; do not add a user-facing local-processing page.
- Ensure **every committed voice input** appears in the dialogue panel, including local commands, teaching outcomes, and system replies, not only multimodal Q&A turns.
- Add **dialogue-driven long-term memory creation**: after eligible dialogue turns, persist durable facts locally via `longTermMemoryStore.create()` using memory candidates returned in the same backend Qwen3-VL response when cloud reasoning runs, plus local heuristics for offline or local-short-circuit turns.
- **Remove startup seeding** of demo long-term memories; the memory list reflects only user-derived records plus any records created during dialogue.
- Preserve Assist split layout, Operator `/admin`, realtime ASR/TTS, custom-object teaching, and existing privacy/cost governance behavior outside the removed debug surface.

## Capabilities

### New Capabilities

_None. This change extends existing surfaces and memory behavior without introducing a new top-level capability._

### Modified Capabilities

- `assist-information-architecture`: Move memory lists to `/memory`; keep memory authorization in Settings; remove development debug surface requirements; add memory navigation and badge behavior on Assist chrome.
- `local-long-term-memory`: Require durable memories to be created from dialogue turns; remove default seeded memories; define boundaries between long-term memory and custom-object teaching.
- `realtime-vision-voice-ai-input`: Require all committed voice transcripts to appear in the dialogue panel; extend cloud visual-language responses with optional memory candidates for local persistence.

## Impact

- Client routing: extend `AppRoute` with `memory`; add `MemoryPage` surface; remove `DebugPanel`, debug routing helpers, and related `App.tsx` state.
- Client UI: slim `SettingsDrawer`; update `AmbientChrome` / Assist chrome with memory entry and badge; migrate list/export/delete controls to `MemoryPage`.
- Client hook/presentation: centralize dialogue turn recording for local commands and teaching; invoke long-term memory persistence after dialogue completion.
- Client AI: parse and apply `memoryCandidates` from visual answers; add local fallback extraction for non-cloud turns where appropriate.
- Server: extend `QwenVisualLanguageProvider` structured response schema and prompt to emit memory candidates; pass candidates through existing visual-answer API unchanged for unauthorized clients.
- Tests: update App/Assist/Settings tests for removed debug UI; add Memory page, dialogue-history, and dialogue-to-LTM coverage.
- Specs: delta updates to assist IA, local long-term memory, and realtime voice input requirements.
