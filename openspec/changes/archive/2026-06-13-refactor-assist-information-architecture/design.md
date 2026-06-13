## Context

The client application renders all `useRealtimeVisionVoice` state in a single `App.tsx` file with three vertical sections: hero header, dashboard (video + control card), and a 13-card `event-log` grid. The control card mixes runtime telemetry, privacy toggles, transcript simulation, and primary talk controls. Operations admin budget controls and conversation telemetry appear as one card inside the event grid alongside engineering debug fields such as `samplingMode`, `lastFrame`, and `latencyMetrics`.

Backend control plane integration is complete. The underlying hook and dialogue pipeline are stable. The bottleneck is presentation: end users cannot quickly see what the AI said, operators cannot manage budgets without scrolling through debug cards, and developers have no isolated debug surface.

## Goals / Non-Goals

**Goals:**

- Establish a four-surface IA: Assist (default), Settings (drawer), Operator (`/admin`), Dev Debug (development-only).
- Make camera preview, current AI response, and push-to-talk the dominant elements on Assist.
- Move privacy, memory, and dialogue preferences into Settings grouped by user mental model.
- Move operations telemetry and budget controls to Operator, hidden from default Assist.
- Preserve all existing hook capabilities and backend integrations.
- Add i18n coverage for user-facing Assist and Settings labels.

**Non-Goals:**

- Real ASR or streaming transcript UI (transcript simulator stays in Dev Debug).
- New backend APIs or authentication flows beyond existing admin token configuration.
- Full chat history or multi-session inbox UX (Assist shows recent turns only).
- Visual redesign / branding pass beyond layout and information hierarchy.
- Mobile-native app shell; responsive layout improvements are in scope but not a separate app.

## Decisions

### 1. Four surfaces with separate entry points

**Decision:** Use Assist as `/`, Settings as a right drawer, Operator as `/admin`, and Dev Debug as a collapsible panel enabled by `import.meta.env.DEV` or `?debug=1`.

**Rationale:** Keeps the camera immersive while avoiding top-level tabs that compete with the preview. Operator and Debug have different audiences and must not share one panel.

**Alternatives considered:**

- Single page with accordion sections — rejected; still buries operator tools and encourages scrolling.
- Top navigation tabs for all surfaces — rejected; breaks vision-first layout.

### 2. Presentation-only refactor; hook unchanged

**Decision:** `useRealtimeVisionVoice` remains the single state source. New components receive props derived from the hook return value.

**Rationale:** Minimizes regression risk to dialogue routing, cloud gateway, and memory flows already covered by tests.

**Alternatives considered:**

- Split hook into `useAssistState` / `useOperatorState` — rejected as unnecessary coupling churn.

### 3. Conversation strip as unified user feedback model

**Decision:** Introduce a lightweight `ConversationEntry` view model in the UI layer mapping `feedback`, `lastVisualAnswer`, `lastProactivePrompt`, and system failures into one strip with `role: user | assistant | system | proactive`.

**Rationale:** Users currently read AI output from `feedback` text below buttons while answers also appear in a distant event card. One strip aligns spoken and visible responses.

**Alternatives considered:**

- Full chat transcript — deferred; recent 1–3 entries are enough for prototype validation.

### 4. Operator surface gated by configuration

**Decision:** Render Operator navigation entry and `/admin` route only when `VITE_ADMIN_API_TOKEN` and `VITE_BACKEND_BASE_URL` are configured. Unconfigured builds hide operator chrome entirely.

**Rationale:** Matches existing backend admin auth model without inventing a login screen.

**Alternatives considered:**

- Inline operator card with token prompt — rejected; keeps cost controls off Assist.

### 5. Dev Debug retains existing event grid

**Decision:** Move the current `event-log` section verbatim into `DebugPanel` with collapse-by-default behavior in development.

**Rationale:** Zero loss of engineering visibility during migration.

### 6. Lightweight routing without new dependency

**Decision:** Use `window.location.pathname` check or existing app entry pattern for `/admin`; avoid adding `react-router` unless already present.

**Rationale:** Prototype scope; operator is one additional view.

**Alternatives considered:**

- `react-router-dom` — acceptable follow-up if more routes are added later.

## Component Structure

```
App
├── AssistShell                     # Surface 1 — default route
│   ├── StatusBar                   # network, cloud path, proactive, speech
│   ├── CameraStage                 # video + overlays + selection
│   ├── ConversationStrip           # recent entries
│   ├── ProactiveBanner             # optional urgent/normal prompt
│   └── TalkControls                # push-to-talk + select object
│
├── SettingsDrawer                  # Surface 2 — overlay
│   ├── PrivacySection
│   ├── DialoguePrefsSection
│   └── MemorySection
│
├── OperatorDashboard               # Surface 3 — /admin
│   ├── SpendOverview
│   ├── TelemetryTable
│   └── BudgetControls
│
└── DebugPanel                      # Surface 4 — dev only
    └── EventGrid                   # migrated from current App.tsx
```

## Migration Plan

1. Extract `DebugPanel` + `EventGrid` from `App.tsx` without changing visible Assist layout (immediate de-clutter option).
2. Introduce `AssistShell` subcomponents; wire existing hook props.
3. Move toggles and memory lists into `SettingsDrawer`.
4. Add `/admin` route with `OperatorDashboard`; remove operations card from Assist.
5. Add i18n keys; replace hardcoded English labels on user surfaces.
6. Hide `DebugPanel` in production builds.

**Rollback:** Revert to monolithic `App.tsx` layout; no server or data migration required.

## Risks / Trade-offs

- **[Risk] Operators lose one-click budget access on main page** → Mitigation: persistent small admin icon in Assist status bar when configured.
- **[Risk] Developers forget debug panel when collapsed** → Mitigation: `?debug=1` forces expand; dev build shows collapsed bar label.
- **[Risk] Conversation strip duplicates TTS content** → Mitigation: strip shows same `buildSpeakableAnswerText` output; optional auto-hide after evidence expires.
- **[Risk] Partial i18n leaves mixed-language UI** → Mitigation: task gate requiring zh/en coverage for Assist + Settings before archive.

## Open Questions

- Whether to add `react-router-dom` now or defer pathname routing (default: defer).
- Whether Assist shows last one or last three conversation entries (default: one primary + optional expandable history).
- Whether Operator requires explicit token entry UI or env-only gate (default: env-only for prototype).
