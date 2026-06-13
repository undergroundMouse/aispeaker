## Why

The assistant already captures live video and audio, stores personalized memories locally, and routes complex visual questions to cloud models, but it lacks explicit governance for ephemeral media handling, unified memory export controls, gateway-level token accounting, operational cost visibility, resilient cloud retries, measurable edge-cloud call reduction, and constrained object-recognition uncertainty wording. FR-52 through FR-58 define the privacy, cost, reliability, and recognition-quality boundaries needed before scaling cloud usage in production.

## What Changes

- Enforce ephemeral video and audio handling: no permanent storage of raw media; discard buffers after processing; require explicit user authorization before capture or cloud transmission.
- Strengthen personalized memory privacy: keep object features and long-term memory local-only by default; block cloud access without consent; add user export for both memory types alongside existing view and delete controls.
- Add a cloud API gateway layer that estimates tokens before each request (images counted at 85 tokens per 1024px edge), accumulates per-request totals, retries failed calls up to 2 times, and surfaces "网络不佳，请重试" when all attempts fail.
- Add an operations admin backend to view per-conversation token consumption and cost estimates, and to configure daily budget caps that block or throttle over-budget cloud calls.
- Require edge-cloud collaboration to reduce overall cloud LLM invocations by at least 70% compared with a cloud-only baseline, measured across dialogue sessions.
- Add an object-recognition LLM constraint that instructs the model to respond with "看不清楚" when uncertain instead of guessing.

## Capabilities

### New Capabilities
- `ephemeral-media-privacy`: Defines consent-gated capture, in-memory-only video/audio processing, immediate discard after use, and prohibition of permanent raw media storage.
- `cloud-gateway-cost-governance`: Defines pre-request token estimation, gateway accumulation, retry policy, failure messaging, daily budget enforcement, and operations admin visibility for token and cost telemetry.

### Modified Capabilities
- `local-long-term-memory`: Add export of locally stored memories and tighten requirements that cloud services cannot access personalized memory without explicit user consent.
- `local-custom-object-learning`: Add export of learned object records and align cloud-access restrictions with FR-53 personalized memory privacy.
- `realtime-vision-voice-ai-input`: Add measurable 70% cloud-call reduction target for edge-cloud routing, gateway-integrated retry behavior for all cloud requests, and object-recognition uncertainty prompt constraint ("看不清楚").

## Impact

- Affected app areas: media capture pipeline, consent settings UI, memory management UI (export), cloud request gateway, token estimator, retry middleware, budget guard, operations admin dashboard, edge routing metrics, and object-recognition prompt assembly.
- Backend/API: new gateway middleware for token estimation and accumulation; admin APIs for conversation cost views and budget configuration; telemetry storage for per-turn token and cost records.
- Privacy/compliance: stronger ephemeral media guarantees and explicit consent flows; no silent cloud access to personalized local memory.
- Operations: daily budget caps and per-conversation cost visibility for capacity planning and abuse prevention.
