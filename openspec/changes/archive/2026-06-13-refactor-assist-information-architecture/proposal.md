## Why

The realtime vision voice prototype exposes every hook state field—runtime metrics, operations telemetry, privacy toggles, memory lists, and debug cards—in one long scrolling page. That layout works for engineering validation but obscures the primary user tasks of seeing the camera, asking a question, and understanding the AI response. As backend control plane, cloud governance, proactive prompts, and memory features accumulate, the UI needs a layered information architecture that separates assist, settings, operator, and developer surfaces without changing the underlying dialogue pipeline.

## What Changes

- Introduce a four-surface information architecture: **Assist** (default), **Settings** (drawer), **Operator** (`/admin` route), and **Dev Debug** (development-only panel).
- Replace the monolithic `App.tsx` debug dashboard with focused presentation components for camera stage, conversation strip, status bar, and talk controls.
- Move operations admin budget and telemetry UI out of the main assist view into a dedicated operator surface gated by admin configuration.
- Consolidate user-visible AI responses into a single conversation strip that distinguishes assistant, system, and proactive messages with distinct styling.
- Relocate privacy consent, memory management, and dialogue preferences into a settings drawer grouped by user mental model.
- Preserve all existing `useRealtimeVisionVoice` capabilities; this change reorganizes presentation only.
- Retain the voice transcript simulator and runtime debug cards behind a development-only debug surface.
- Extend i18n coverage for user-facing labels currently hardcoded in English.

## Capabilities

### New Capabilities

- `assist-information-architecture`: Defines the four-surface UI model, navigation boundaries, conversation presentation, status indicators, and role-based visibility rules for the assist experience.

### Modified Capabilities

- `realtime-vision-voice-ai-input`: Add UI presentation requirements for assist shell, conversation strip, settings drawer, operator dashboard separation, and distinct system-message styling for network versus budget failures.
- `cloud-gateway-cost-governance`: Relocate operations admin cost visibility from the main assist event grid to the operator surface while preserving HTTP-backed telemetry access.

## Impact

- Client UI only: refactor `app/src/App.tsx` into surface-specific components under `app/src/components/` or `app/src/surfaces/`.
- Add client-side routing for `/admin` (e.g. lightweight route param or router) without new backend APIs.
- Update `app/src/i18n.ts` with settings, status bar, conversation strip, and operator labels.
- Existing tests for dialogue, gateway, and hooks should remain valid; add UI/component tests for new presentation layers.
- No changes to `server/`, `shared/` contracts, or `useRealtimeVisionVoice` business logic unless minor derived-state helpers are extracted for presentation.
