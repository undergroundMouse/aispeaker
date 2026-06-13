## Context

The `refactor-assist-information-architecture` change split the client into four surfaces (Assist, Settings, Operator, Dev Debug) and introduced `AssistShell` with a dashboard-style layout: hero header, four status pills, a two-column grid (camera + side panel), and conversation strip beside talk controls. That structure satisfies engineering validation but still feels like an admin console rather than a voice companion.

The dialogue pipeline already produces `DialogueResponseSegment` streams, `SpeechPlaybackState`, proactive prompt candidates, and visual evidence regions. The UI collapses this into `buildConversationEntries()`, which renders only the latest turn and mixes proactive prompts into the same strip as assistant answers. Operator entry, cloud-path labels, and the development debug panel remain visible or adjacent to the default Assist view.

## Goals / Non-Goals

**Goals:**

- Present Assist as an immersive voice-companion overlay: full-bleed camera, floating caption layer, centered talk FAB, and minimal chrome.
- Separate proactive prompts into a dedicated `ProactiveBanner` that does not compete with assistant captions.
- Show scrollable turn history and streaming assistant text on the caption layer using existing dialogue segment events.
- Add camera interaction feedback for object selection, teaching, and evidence highlights.
- Hide operator entry, cloud-path labels, proactive on/off pills, and debug panels from the default Assist chrome; retain access via `/admin`, `?debug`, and environment gates.
- Route transient system failures (network, budget) through toasts when they do not need to occupy the primary caption area.
- Preserve Settings drawer, Operator dashboard, Debug panel components, and all `useRealtimeVisionVoice` business logic.

**Non-Goals:**

- Dedicated mobile portrait one-handed layout redesign; existing `<900px` single-column stacking is sufficient.
- Real-time ASR subtitle integration (user-side captions remain "listening" placeholder until ASR ships).
- Word-level karaoke highlighting during TTS playback.
- Full multi-session chat inbox or persistent transcript export.
- Branding or design-system pass beyond overlay hierarchy and motion primitives.

## Decisions

### 1. Overlay layout replaces dashboard grid

**Decision:** Restructure `AssistShell` as a single full-viewport stage. `CameraStage` fills the container; `CaptionLayer`, `ProactiveBanner`, `TalkFab`, and ambient chrome are absolutely positioned overlays.

**Rationale:** Matches voice-assistant mental model (Siri, ChatGPT voice mode) and removes hero header and side-panel dashboard affordances without new routes.

**Alternatives considered:**

- Keep two-column grid, only shrink hero — rejected; side panel still reads as dashboard.
- Separate `/voice` route — rejected; unnecessary navigation split for the same pipeline.

### 2. Presentation adapter for turn history and streaming

**Decision:** Introduce `useAssistPresentation` (or equivalent module) that subscribes to hook outputs and maintains `ConversationTurn[]` plus `streamingAssistantText`. The hook exposes `dialogueSegments` (or a callback) without changing dialogue routing.

**Rationale:** UI turn history is distinct from `conversationMemory` (AI follow-up resolution). Keeping history in a presentation adapter avoids polluting multimodal dialogue logic.

**Alternatives considered:**

- Extend `conversationMemory` for UI history — rejected; different retention model and semantics.
- Store history only in React component state — rejected; harder to test and reuse across Assist subcomponents.

### 3. ProactiveBanner is a separate component and state path

**Decision:** Remove proactive entries from the caption layer builder. `ProactiveBanner` renders when `lastProactivePrompt` is active and speech is queued or playing; dismisses on user talk start, prompt completion, or explicit dismiss.

**Rationale:** Proactive prompts are interruptions, not replies. Mixing them into `ConversationStrip` caused proactive turns to replace assistant captions.

**Alternatives considered:**

- Styled variant inside caption layer — rejected per product direction from exploration.

### 4. Ambient chrome replaces status pill row

**Decision:** Default Assist chrome shows only a settings icon and a network ambient dot (color/shape for online, weak, offline). Cloud path, proactive on/off, and speech status move to Settings, Operator, or `?debug`.

**Rationale:** Four pills read as telemetry dashboard. Users infer connectivity from ambient cues; operators retain cloud path on Operator surface.

**Alternatives considered:**

- Collapsible status row — rejected; still discoverable clutter on every session.
- Long-press settings for operator — deferred; `/admin` direct navigation is enough for prototype.

### 5. System failures use toast-first presentation

**Decision:** Network and budget failures trigger `SystemToast` with distinct styling. Caption layer shows the failure only if no other assistant turn is active; toasts auto-dismiss after a short interval.

**Rationale:** Failures are ephemeral signals; occupying the main caption area displaces the last useful answer.

**Alternatives considered:**

- Caption-only failures (current behavior) — rejected for voice-companion clarity.

### 6. Camera feedback: DOM transitions first, Canvas animation second

**Decision:** Apply CSS transitions to `.selection-box` (expand, pulse). Teaching success/failure uses overlay toasts and brief selection color change. Evidence highlights fade in via Canvas alpha interpolation in a `requestAnimationFrame` loop (single pass, no stagger in MVP).

**Rationale:** Selection overlay is already DOM-based; cheapest path to perceived responsiveness. Canvas animation is isolated to `VisualEvidenceOverlay`.

**Alternatives considered:**

- Move all overlays to DOM — rejected; multi-region evidence is already Canvas-based and performant.

### 7. Operator and Debug entry demotion

**Decision:** Remove Operator button from default Assist chrome. Debug panel renders only when `isDebugMode()` and not as a child of the Assist overlay stack (sibling route overlay or bottom sheet behind `?debug` gate). Operator remains at `/admin` when backend admin is configured.

**Rationale:** Exploration goal is a cleaner default user path. Operators and developers already know URLs or env flags.

**Alternatives considered:**

- Hidden gesture (triple-tap) — rejected as undiscoverable for operators.

### 8. Talk FAB replaces side-panel talk controls

**Decision:** Center a floating action button at the bottom of the stage. Retain object-selection as a secondary ghost control in the caption overlay footer or long-press FAB menu (MVP: secondary button above FAB).

**Rationale:** Push-to-talk is the primary action; FAB matches voice-assistant convention.

**Alternatives considered:**

- Keep side-panel buttons — rejected for overlay layout.

## Risks / Trade-offs

- **[Risk] Streaming segments arrive faster than render** → Mitigation: batch segment updates per animation frame; cap caption layer re-renders with `useMemo` on turn id.
- **[Risk] Turn history grows unbounded** → Mitigation: cap UI history at 10 turns; oldest entries drop from visible list but remain in debug export if needed later.
- **[Risk] Toast + banner + captions compete visually** → Mitigation: z-index stack (banner top, captions mid, toast above FAB); only one toast at a time.
- **[Risk] Removing cloud-path pill hides operator debugging on Assist** → Mitigation: Operator surface retains full cloud path label; `?debug` restores pills.
- **[Risk] Overlay text unreadable on bright camera frames** → Mitigation: semi-opaque blurred caption background and text shadow per `CaptionLayer` styles.

## Migration Plan

1. **Phase 1 — Chrome cleanup:** Remove hero, ambient indicators, hide operator/debug entry, extract `ProactiveBanner` shell (can still read from old entry builder temporarily).
2. **Phase 2 — Layout overlay:** Restructure `AssistShell` CSS and component tree; migrate talk controls to FAB.
3. **Phase 3 — Caption layer:** Replace `ConversationStrip` with `CaptionLayer`, wire turn history and streaming segments.
4. **Phase 4 — Camera motion:** Selection/teaching toasts and evidence fade-in.
5. **Verify:** Run existing hook and dialogue tests unchanged; add Assist presentation component tests.

Rollback: revert `AssistShell` and CSS to pre-overlay structure; presentation adapter is additive and can be deleted without touching the hook core.

## Open Questions

- Default visible history depth: show only the latest turn enlarged vs. always show the last three turns collapsed (default proposal: **latest turn prominent**, earlier turns collapsed above).
- Proactive banner position: top floating strip vs. upper-third card (default proposal: **top strip** to minimize camera occlusion).
- Whether memory warnings stay as inline text or move to a settings badge only (default proposal: **badge on settings icon** with detail in drawer).
