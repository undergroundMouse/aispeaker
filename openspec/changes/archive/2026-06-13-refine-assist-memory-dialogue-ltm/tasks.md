## 1. Routing and surface scaffolding

- [x] 1.1 Extend `AppRoute`, `readAppRoute`, and `navigateToRoute` with a `memory` route at `/memory`.
- [x] 1.2 Add `MemoryPage` surface component with back navigation to Assist.
- [x] 1.3 Wire `App.tsx` route switch for `/memory` while reusing the existing `useRealtimeVisionVoice` hook state.
- [x] 1.4 Remove `DebugPanel`, debug shell markup, `isDebugMode`, and related `App.tsx` debug state.

## 2. Settings and Assist chrome IA

- [x] 2.1 Slim `SettingsDrawer` to privacy, memory authorization, and dialogue preferences only.
- [x] 2.2 Move learned-object and long-term-memory list/export/delete/forget controls from Settings to `MemoryPage`.
- [x] 2.3 Add memory entry control to Assist chrome and move memory-health badge from settings to memory entry.
- [x] 2.4 Add i18n keys for Memory surface titles, empty states, and navigation labels in zh/en.
- [x] 2.5 Update `App.css` for Memory page layout and remove unused debug-shell styles.

## 3. Dialogue history for all voice input

- [x] 3.1 Add a `recordDialogueTurn` helper in `useRealtimeVisionVoice` for transcript + reply archival.
- [x] 3.2 Route all `executeLocalCommand` outcomes through `recordDialogueTurn`.
- [x] 3.3 Verify teaching, network-failure, and multimodal answer paths use the same dialogue recording helper.
- [x] 3.4 Add DialoguePanel or hook tests asserting local commands and teaching appear in session history.

## 4. Shared and server memory-candidate schema

- [x] 4.1 Add `memoryCandidates` types to shared visual-answer contracts and client `VisualAnswer` types.
- [x] 4.2 Extend `QwenVisualLanguageProvider` prompt and JSON parsing to emit optional `memoryCandidates`.
- [x] 4.3 Pass memory candidates through backend visual-answer route and HTTP client provider unchanged for older clients.
- [x] 4.4 Add server unit tests for Qwen memory-candidate parsing and normalization.

## 5. Dialogue-driven long-term memory persistence

- [x] 5.1 Implement `persistDialogueMemoryCandidates` to map candidates into `longTermMemoryStore.create()`.
- [x] 5.2 Invoke persistence after cloud multimodal turns when candidates are present.
- [x] 5.3 Add `extractLocalMemoryCandidates` for explicit offline/local memory-intent phrases.
- [x] 5.4 Skip LTM creation for custom-object teaching transcripts and one-off visual Q&A turns.
- [x] 5.5 Remove startup `createDefaultLongTermMemory()` seeding from `useRealtimeVisionVoice`.
- [x] 5.6 Add long-term memory unit/integration tests for cloud candidates, local heuristics, merge behavior, and no-seed startup.

## 6. Tests and cleanup

- [x] 6.1 Update `App.test.tsx`, Assist tests, and Settings tests for removed debug UI and new memory route.
- [x] 6.2 Add `MemoryPage` tests for list rendering, export buttons, and stale-memory warnings.
- [x] 6.3 Delete or refactor debug-only tests that assert `DebugPanel` rendering.
- [x] 6.4 Run app and server test suites and fix regressions.

## 7. OpenSpec

- [x] 7.1 Review change artifacts against implementation and confirm IA, dialogue, and LTM behavior match specs.
- [x] 7.2 Sync delta specs into main `openspec/specs/` after implementation is complete.
