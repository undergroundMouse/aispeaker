## 1. Ephemeral Media Privacy (FR-52)

- [x] 1.1 Add explicit consent settings for camera capture, microphone capture, and cloud media transmission with revocable local persistence.
- [x] 1.2 Enforce consent checks before starting media capture and before attaching raw video or audio to cloud-bound requests.
- [x] 1.3 Refactor media pipeline buffers to release raw video and audio immediately after each processing step with no IndexedDB or filesystem persistence.
- [x] 1.4 Add a media privacy settings surface that shows current authorization state and lets the user disable cloud media transmission.
- [x] 1.5 Add tests for unauthorized capture blocking, post-processing buffer discard, and revoked authorization behavior.

## 2. Personalized Memory Privacy and Export (FR-53)

- [x] 2.1 Add local export for long-term memories from the memory management UI as a downloadable file scoped to the active user.
- [x] 2.2 Add local export for learned custom objects from the custom object management UI without uploading feature vectors or crops.
- [x] 2.3 Audit cloud request builders to ensure personalized memory is excluded unless explicit user authorization is present for the current complex reasoning request.
- [x] 2.4 Add tests for memory export scoping, no-cloud-upload guarantees, and unauthorized cloud memory exclusion.

## 3. Cloud Gateway Token Estimation and Accumulation (FR-55)

- [x] 3.1 Create a cloud gateway module that all LLM and visual-language requests must pass through.
- [x] 3.2 Implement pre-request text token estimation and image token estimation using 85 tokens per 1024px edge.
- [x] 3.3 Accumulate estimated tokens per conversation turn and persist conversation telemetry records.
- [x] 3.4 Update actual token usage from provider responses when available and store it alongside estimates.
- [x] 3.5 Add unit tests for text estimation, image edge-token math, and per-conversation accumulation.

## 4. Cloud Retry and Failure Messaging (FR-57)

- [x] 4.1 Implement gateway retry policy with exponential backoff and a maximum of 2 retries for retryable failures.
- [x] 4.2 Route dialogue, visual-language, and other cloud LLM client calls through the gateway retry path.
- [x] 4.3 Return "网络不佳，请重试" to the client when retries are exhausted and preserve existing weak-network offline behavior.
- [x] 4.4 Add tests for retryable vs non-retryable failures, retry count limits, and final failure messaging.

## 5. Operations Admin Cost Visibility and Budget Caps (FR-54)

- [x] 5.1 Define conversation telemetry and daily budget data models for estimated tokens, actual tokens, and cost estimates.
- [x] 5.2 Add operations admin APIs to list and inspect per-conversation token and cost records with authorization checks.
- [x] 5.3 Build an operations admin UI to view conversation token consumption and cost estimates.
- [x] 5.4 Implement configurable daily budget caps in the admin backend and enforce them in the gateway before request send.
- [x] 5.5 Add tests for admin authorization, conversation cost retrieval, budget enforcement, and daily reset behavior.

## 6. Edge-Cloud Call Reduction (FR-56)

- [x] 6.1 Define a versioned cloud-only baseline fixture set for measuring dialogue cloud LLM invocation counts.
- [x] 6.2 Instrument edge routing to count cloud LLM invocations per evaluation session and attribute local short-circuit paths.
- [x] 6.3 Verify and tune local custom object matching, edge vision pre-processing, and local command routing to meet the 70% reduction target.
- [x] 6.4 Add evaluation or CI reporting that fails when cloud-call reduction falls below 70% against the baseline fixture set.

## 7. Object Recognition Uncertainty Prompt (FR-58)

- [x] 7.1 Append the object-recognition constraint "If you are not sure, say '看不清楚'" to cloud-bound object-name prompts.
- [x] 7.2 Preserve and speak "看不清楚" answers without inventing object names or evidence highlights when uncertainty is returned.
- [x] 7.3 Add prompt assembly and response handling tests for uncertain cloud object recognition outcomes.

## 8. Integration and Validation

- [x] 8.1 Integrate gateway estimation, retry, and budget checks with existing multimodal dialogue and visual QA flows.
- [x] 8.2 Run an end-to-end validation pass covering media consent, memory export, gateway telemetry, retries, budget blocking, cloud-call reduction metrics, and uncertainty responses.
- [x] 8.3 Document operator setup for daily budget configuration and conversation cost review in the operations admin backend.
