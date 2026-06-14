## Context

`refactor-assist-information-architecture` and `refine-assist-split-dialogue-asr` established a four-surface model (Assist, Settings drawer, Operator, Debug) with a split Assist layout and realtime ASR in `DialoguePanel`. Settings still hosts learned-object and long-term-memory lists alongside privacy and memory-consent toggles. `DebugPanel` renders in development and `?debug=1`, including local-processing event cards and transcript simulation. Long-term memory currently seeds two demo records on first launch via `createDefaultLongTermMemory()` and only evolves through retrieval reinforcement and stale weakening; `longTermMemoryStore.correct()` is unused. Local voice commands routed through `executeLocalCommand()` update `feedback` but often skip `lastDialogueEvent` / dialogue history. Cloud visual answers come from backend `Qwen3-VL-8B-Thinking` without memory-extraction fields.

## Goals / Non-Goals

**Goals:**

- Present memory authorization in Settings and memory data management on `/memory`.
- Remove all client debug-surface UI and routing; do not introduce a replacement local-processing page.
- Record every committed voice transcript and its mapped system/assistant reply in `DialoguePanel` history.
- Persist durable long-term memories from dialogue using Qwen memory candidates on cloud turns and local heuristics on offline/local-short-circuit turns.
- Stop seeding demo long-term memories at startup.
- Keep custom-object teaching (`记住这个叫…` + region selection) separate from long-term semantic memory.

**Non-Goals:**

- Cloud streaming ASR/TTS changes.
- New operator/admin features.
- Uploading raw long-term memory records or custom-object vectors to cloud services.
- Reintroducing engineering telemetry, transcript simulation, or weak-network simulation in any user-visible surface.
- Full natural-language memory correction UI beyond existing delete/forget-all controls.

## Decisions

### 1. Three user-facing surfaces plus Operator

**Decision:** Product IA becomes Assist (`/`), Settings drawer (privacy + dialogue prefs + memory authorization), Memory (`/memory`), and Operator (`/admin`). Debug is deleted.

**Rationale:** Matches the explored split between privacy decisions and durable data, and removes engineering clutter from demo/judge flows.

**Alternatives considered:**

- Keep debug in dev only — rejected; user explicitly wants no debug UI at all.
- Add hidden `/local` for local processing — rejected; no product entry and no page.

### 2. Memory page owns lists; Settings owns consent

**Decision:** `SettingsDrawer` retains `cloudMemoryAccess` and `cloudSummarySync` toggles under privacy/memory authorization. `MemoryPage` hosts learned-object list, long-term-memory list, export, delete, forget-all, and stale warnings. Assist chrome adds a memory button linking to `/memory`; move `settingsBadgeCount` logic to the memory entry.

**Rationale:** Authorization is a privacy decision; list management is a data-management task with more UI density.

### 3. Central `recordDialogueTurn` helper in the hook

**Decision:** Add a small helper in `useRealtimeVisionVoice` that sets `lastDialogueEvent`, `dialogueSegments`, and triggers presentation archival for any committed transcript + reply pair. Call it from `executeLocalCommand`, teaching paths, network failures, and existing multimodal answer flow.

**Rationale:** Fixes the local-command dialogue gap without duplicating presentation wiring in each branch.

**Alternatives considered:**

- Patch each `executeLocalCommand` branch individually — rejected; easy to miss paths and harder to test.

### 4. Qwen same-turn memory candidates (Option B)

**Decision:** Extend backend structured Qwen output with optional `memoryCandidates[]` (`type`, `summary`, `subject`, `value`, `tags`, `syncEligible`). Thread candidates through shared visual-answer types and client `VisualAnswer` / dialogue result handling. After a cloud turn completes, map candidates to `LongTermMemoryCreateInput` and call `longTermMemoryStore.create()`, relying on existing merge logic for duplicates.

**Rationale:** Reuses the single multimodal Qwen model already in production; avoids a second cloud extraction call.

**Alternatives considered:**

- Separate post-turn extraction API — rejected for latency/cost.
- Rules-only extraction — kept only as fallback for local-short-circuit/offline turns.

### 5. Local fallback extraction for non-cloud turns

**Decision:** Add `extractLocalMemoryCandidates(transcript, language)` with a small phrase set for explicit memory intents (`我喜欢…`, `记住我喜欢…`, `…一般在…`, `I like…`, `I usually…`). Apply only when the turn does not invoke cloud visual-language processing and does not match custom-object teaching syntax.

**Rationale:** Allows offline or local-short-circuit dialogue to still create memories without a second model.

### 6. Remove demo LTM seeding

**Decision:** Delete the startup loop that calls `createDefaultLongTermMemory()` when the store is empty. Existing seeded records remain until the user deletes them; tests may insert fixtures explicitly.

**Rationale:** Memory list should reflect real interaction, not fabricated demo content.

### 7. Custom-object teaching boundary unchanged

**Decision:** Phrases parsed by `parseTeachingName()` continue to create custom-object records only. Long-term memory extraction ignores teaching phrases and instead relies on semantic preference/location/habit/fact patterns or Qwen candidates.

**Rationale:** Preserves vector-based object recognition as a distinct memory type from semantic long-term facts.

### 8. Delete debug surface code paths

**Decision:** Remove `DebugPanel`, `isDebugMode`, debug shell CSS, transcript simulator state in `App.tsx`, and tests asserting debug rendering. Keep internal types/metrics in hooks if still used by Operator or tests, but do not render them.

**Rationale:** Simplest compliance with “debug deleted entirely.”

## Risks / Trade-offs

- **[Risk] Qwen over-extracts ephemeral facts** → Constrain prompt to durable preferences, habits, locations, and stable facts; cap candidates per turn to 1–2; use merge/correct logic to update rather than duplicate.
- **[Risk] Local heuristic extraction is brittle** → Limit to explicit memory-intent phrases; cloud turns remain primary source of truth when online.
- **[Risk] Memory page and Assist hook share live state** → Reuse the same `useRealtimeVisionVoice` instance via route-level composition in `App.tsx`, same pattern as Operator dashboard.
- **[Risk] Removing debug hurts developer troubleshooting** → Rely on tests, Operator telemetry, and browser devtools; transcript simulation can be reintroduced only in test mocks.
- **[Risk] Users with existing seeded memories see stale demo entries** → Document that forget-all clears them; optional one-time migration note in Memory page empty state only if list contains known seed summaries.

## Migration Plan

1. Land routing + Memory page + Settings slim-down first so IA is demonstrable without LTM extraction changes.
2. Add dialogue turn recording for local commands and verify DialoguePanel tests.
3. Extend shared/server Qwen schema and client persistence path.
4. Remove debug UI and seed initialization.
5. Update tests and sync specs after implementation.

Rollback: revert client/server changes together; no database migration beyond stopping seed writes. IndexedDB and localStorage data remain compatible.

## Open Questions

- None blocking implementation. Optional follow-up: voice-driven memory correction (`不对，在厨房`) using `longTermMemoryStore.correct()`.
