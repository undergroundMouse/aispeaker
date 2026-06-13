## Why

The Assist surface refactor established a four-surface information architecture, but the default view still reads like an engineering dashboard—hero header, status pills, side-panel conversation card, and visible operator/debug chrome. Users interacting through voice and camera need an immersive companion experience where the live preview is the stage, captions float over the scene, and engineering telemetry stays out of the primary path. The dialogue pipeline already emits streaming response segments and proactive prompts; the UI should expose that richness instead of collapsing everything into a single latest-turn strip.

## What Changes

- Reshape the Assist layout from a dashboard grid to a **voice-companion overlay**: full-bleed camera stage with floating caption layer, talk FAB, and minimal chrome.
- Remove or demote the Assist hero header and multi-pill status bar from the default user view; replace with ambient indicators (network dot, settings icon).
- Introduce a **ProactiveBanner** surface distinct from the main conversation captions so proactive prompts do not compete with assistant answers.
- Introduce a **CaptionLayer** with scrollable turn history and streaming assistant text driven by existing `DialogueResponseSegment` events.
- Add camera interaction feedback: selection expand/pulse animations, teaching success/failure toasts, and fade-in evidence highlights.
- Hide operator entry, cloud-path labels, and debug panels from the default Assist chrome; retain access via `/admin`, `?debug`, and environment gates.
- Route system failures (network, budget) through transient toasts rather than occupying the primary caption area when possible.
- Preserve Settings drawer, Operator dashboard, Debug panel components, and all `useRealtimeVisionVoice` business logic; this change refines presentation and derived UI state only.
- **Out of scope**: dedicated mobile portrait one-handed layout redesign; existing responsive stacking remains sufficient.

## Capabilities

### New Capabilities

_None — requirements extend the existing assist information architecture rather than introducing a separate capability._

### Modified Capabilities

- `assist-information-architecture`: Redefine Assist default layout as voice-companion overlay; add ProactiveBanner, CaptionLayer with history and streaming captions, cleaner chrome visibility rules, and camera interaction feedback requirements.
- `realtime-vision-voice-ai-input`: Add UI requirements for streaming caption presentation, proactive banner separation, selection/teaching visual feedback, and demoted engineering status visibility on Assist.

## Impact

- Client UI: refactor `AssistShell`, `CameraStage`, `ConversationStrip` (or successors), `StatusBar`, `TalkControls`, and `App.css` overlay styles.
- New presentation modules under `app/src/surfaces/assist/` (e.g. `ProactiveBanner`, `CaptionLayer`, `TalkFab`, `SystemToast`).
- Hook/presentation boundary: expose streaming segments and append UI turn history from `useRealtimeVisionVoice` or a thin presentation adapter without changing dialogue, gateway, or memory logic.
- Update `app/src/surfaces/conversationEntry.ts` or replace with turn-history builder supporting streaming partial text.
- Extend `app/src/i18n.ts` for caption, banner, toast, and chrome labels.
- Add component tests for overlay layout, proactive banner isolation, streaming caption updates, and hidden operator/debug chrome in production mode.
- No server, shared contract, or backend API changes.
