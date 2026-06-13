## 1. Presentation scaffolding

- [x] 1.1 Create `app/src/surfaces/` (or `components/`) module structure for Assist, Settings, Operator, and Debug surfaces.
- [x] 1.2 Add lightweight route switching for default Assist (`/`) and Operator (`/admin`) without changing backend APIs.
- [x] 1.3 Introduce `ConversationEntry` view-model helper mapping hook state to `user | assistant | system | proactive` roles.

## 2. Assist surface

- [x] 2.1 Implement `AssistShell` composing camera stage, status bar, conversation strip, and talk controls.
- [x] 2.2 Implement `StatusBar` with network, cloud path, proactive, and speech indicators.
- [x] 2.3 Implement `ConversationStrip` with distinct styling for assistant, system, and proactive messages.
- [x] 2.4 Implement `TalkControls` with push-to-talk, object selection, and teaching hint copy.
- [x] 2.5 Wire `AssistShell` to existing `useRealtimeVisionVoice` props and preserve visual evidence overlay behavior.

## 3. Settings drawer

- [x] 3.1 Implement `SettingsDrawer` with Privacy, Dialogue Preferences, and Memory sections.
- [x] 3.2 Move media privacy toggles, watch-only, proactive enablement, and memory consent controls from `App.tsx` into Settings.
- [x] 3.3 Move learned custom object and long-term memory lists with export/delete actions into Settings Memory section.
- [x] 3.4 Add open/close Settings entry point from Assist chrome.

## 4. Operator surface

- [x] 4.1 Implement `OperatorDashboard` with daily spend summary, telemetry list, and budget cap controls.
- [x] 4.2 Connect Operator dashboard to existing backend admin client APIs used by the hook.
- [x] 4.3 Hide Operator navigation and route when admin backend configuration is unavailable.
- [x] 4.4 Remove operations admin card and budget buttons from default Assist layout.

## 5. Dev debug surface

- [x] 5.1 Extract existing `event-log` grid into `DebugPanel` unchanged for engineering visibility.
- [x] 5.2 Show `DebugPanel` only in development builds or when `?debug=1` is present; default collapsed.
- [x] 5.3 Move transcript simulator and simulate-weak-network controls into `DebugPanel`.

## 6. Internationalization and styling

- [x] 6.1 Add i18n keys for Assist chrome, Settings sections, conversation strip labels, and Operator headings in `app/src/i18n.ts`.
- [x] 6.2 Replace hardcoded English user-facing labels on Assist and Settings with i18n messages.
- [x] 6.3 Adjust `App.css` layout rules for Assist-first hierarchy and mobile single-column behavior.

## 7. Tests

- [x] 7.1 Add component tests for `ConversationStrip` role styling and system failure variants.
- [x] 7.2 Add tests verifying Operator controls are absent from default Assist render.
- [x] 7.3 Add tests verifying `DebugPanel` is hidden in production-mode render configuration.
- [x] 7.4 Update `App.test.tsx` expectations for new Assist layout while preserving media and dialogue integration coverage.

## 8. OpenSpec

- [x] 8.1 Review change artifacts and confirm four-surface IA matches implementation.
- [x] 8.2 Sync delta specs into main `openspec/specs/` after implementation is complete.
