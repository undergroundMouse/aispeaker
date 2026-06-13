## Context

The project already defines real-time multimodal capture, local custom object learning, local long-term memory, edge-side vision pre-processing, and weak-network fallback messaging. FR-52 through FR-58 add production governance layers that are only partially covered today: raw media is processed in memory but not explicitly governed as ephemeral; memory export is missing; cloud requests lack centralized token estimation, accumulation, retries, and budget enforcement; edge-cloud routing has no measurable 70% reduction target; and object-recognition prompts do not mandate the "看不清楚" uncertainty phrase.

These requirements span the client media pipeline, local memory stores, cloud request gateway, operations admin backend, and prompt assembly. The design must preserve the existing local-first privacy model while making cost, reliability, and compliance behavior testable.

## Goals / Non-Goals

**Goals:**
- Keep video and audio ephemeral: process in memory only, discard after use, and require explicit user authorization before capture or cloud transmission.
- Keep personalized memory local by default with view, export, and delete controls; block cloud access without consent.
- Introduce a gateway that estimates tokens before each cloud request, accumulates per-request totals, retries up to 2 times, and returns "网络不佳，请重试" after exhaustion.
- Expose per-conversation token and cost telemetry in an operations admin backend with configurable daily budget caps.
- Measure and enforce at least 70% reduction in cloud LLM calls versus a defined cloud-only baseline through edge routing.
- Inject an object-recognition uncertainty constraint so cloud models say "看不清楚" when unsure.

**Non-Goals:**
- Long-term archival of raw video or audio for replay, training, or audit.
- Cross-device sync of personalized memory exports.
- Provider-native token billing reconciliation; estimates are for governance and budgeting, not invoice matching.
- Replacing existing local custom object or long-term memory stores.

## Decisions

1. Treat media buffers as ephemeral in-process artifacts with no IndexedDB, filesystem, or cloud persistence.
   - Rationale: FR-52 requires immediate discard after processing and explicit authorization.
   - Alternative considered: encrypted temporary storage for retry. Rejected because it increases retention surface and conflicts with "不永久存储".

2. Gate camera, microphone, and cloud media transmission behind explicit consent records stored in local settings.
   - Rationale: FR-52 and FR-53 both require explicit user authorization before sensitive data leaves local control.
   - Alternative considered: implicit consent on first app open. Rejected because it weakens the authorization requirement.

3. Add export as a local file download for long-term memory and custom object records.
   - Rationale: FR-53 requires view, export, and delete; view/delete already exist.
   - Alternative considered: clipboard-only export. Rejected because it is harder to audit and less portable for user data portability.

4. Centralize all cloud LLM and vision requests behind a gateway middleware layer.
   - Rationale: FR-55, FR-57, and FR-54 all require gateway-level estimation, accumulation, retry, and budget enforcement in one place.
   - Alternative considered: client-side-only retries without server accumulation. Rejected because admin cost views and daily budgets need authoritative server totals.

5. Use a deterministic pre-request token estimator with image pricing at 85 tokens per 1024px edge.
   - Rationale: FR-55 specifies the image rule explicitly; text can use character or tokenizer-based heuristics consistent with provider limits.
   - Alternative considered: wait for provider usage headers only. Rejected because budget checks must happen before the request is sent.

6. Apply retry policy with exponential backoff and a maximum of 2 retries for retryable transport and 5xx failures.
   - Rationale: FR-57 limits retries to 2 and requires the existing weak-network message on final failure.
   - Alternative considered: unlimited retries. Rejected because it increases cost and latency under persistent outages.

7. Record per-conversation token estimates, actual usage when available, and cost estimates in an operations datastore exposed through an admin API.
   - Rationale: FR-54 requires per-conversation visibility and daily budget configuration.
   - Alternative considered: log-only metrics without admin UI. Rejected because operators need a supported management surface.

8. Define the 70% cloud-call reduction baseline as "cloud-only routing for the same dialogue fixture set without local short-circuit paths".
   - Rationale: FR-56 needs a measurable comparison rather than an anecdotal reduction.
   - Alternative considered: compare against historical production traffic before edge routing existed. Rejected because no stable baseline exists yet in this codebase.

9. Append a fixed object-recognition system constraint to cloud-bound visual QA prompts: "If you are not sure, say '看不清楚'."
   - Rationale: FR-58 is prompt-level and applies only to object identification flows.
   - Alternative considered: post-process model output for low confidence. Rejected because it does not stop hallucinated object names upstream.

## Risks / Trade-offs

- Token estimates diverge from provider billing → Mitigation: store both estimated and actual usage when headers are returned; tune estimator constants from sampled conversations.
- Budget caps block legitimate complex requests → Mitigation: allow admin override thresholds and surface a clear budget-exceeded message distinct from network failure.
- Ephemeral media discard breaks debugging → Mitigation: gate optional dev-only capture behind a non-production flag outside FR-52 production behavior.
- 70% reduction depends on fixture representativeness → Mitigation: maintain a versioned evaluation harness and report reduction ratio in CI or release checks.
- Export files may contain sensitive personal data → Mitigation: warn before export, keep files local, and never upload exports automatically.

## Migration Plan

1. Add consent settings and ephemeral media lifecycle guards in the client capture pipeline without changing default authorized behavior for existing users who already granted permissions.
2. Deploy gateway middleware with estimation and retry in shadow mode first, recording totals without blocking requests.
3. Enable budget enforcement and admin dashboard after telemetry validation.
4. Add memory export UI actions alongside existing management screens.
5. Roll out object-recognition prompt constraint and measure cloud-call reduction against the baseline harness.

Rollback: disable budget enforcement and admin blocking while keeping telemetry; revert prompt constraint independently if recognition quality regresses.

## Open Questions

- Should daily budget caps apply per user, per tenant, or globally for the operations deployment?
- Which export format should be canonical for memory portability: JSON only, or JSON plus optional CSV summaries?
- Should budget-exceeded responses reuse "网络不佳，请重试" or use a distinct cost-limit message?
