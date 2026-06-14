# qwen-cloud-visual-language

Qwen3-VL cloud visual-language provider integration for complex image-related dialogue turns.

## Requirements

### Requirement: Qwen cloud provider configuration
The system SHALL configure Qwen3-VL credentials on the backend control plane for production use. The client SHALL select a backend HTTP visual-language provider when backend execution is enabled and MAY fall back to the mock provider for local development without server credentials.

#### Scenario: Backend credentials enable production Qwen execution
- **WHEN** the backend control plane is configured with valid Qwen provider credentials
- **THEN** production cloud visual-language requests are executed by the server-side Qwen adapter

#### Scenario: Client without backend URL falls back to mock
- **WHEN** the client is not configured with a backend base URL for cloud execution
- **THEN** the client uses `MockCloudVisualLanguageProvider` for cloud visual-language processing

#### Scenario: Default WaveSpeed endpoint and model on server
- **WHEN** optional server-side Qwen endpoint and model variables are not provided
- **THEN** the backend uses base URL `https://llm.wavespeed.ai/v1` and model id `qwen/qwen3-vl-8b-thinking`

### Requirement: HTTP client adapter for backend visual answers
The client SHALL implement a `CloudVisualLanguageProvider` adapter that calls the backend `POST /api/v1/cloud/visual-answer` endpoint instead of calling the upstream Qwen API directly in production mode.

#### Scenario: Production adapter calls backend API
- **WHEN** backend execution is enabled for cloud visual-language processing
- **THEN** the client adapter sends the normalized cloud visual request to the backend and maps the response into `VisualAnswer`

#### Scenario: Client does not send provider API keys
- **WHEN** the HTTP client adapter calls the backend visual answer API
- **THEN** it does not include upstream model provider API keys in the request

### Requirement: OpenAI-compatible Qwen visual request
The server-side Qwen provider SHALL send authorized visual questions to an OpenAI-compatible `chat/completions` endpoint with the user transcript, optional camera frame image, local vision hints, and authorized long-term memory context received from the client request.

#### Scenario: Frame is attached when cloud media is authorized
- **WHEN** a cloud visual question includes an authorized camera frame
- **THEN** the server-side provider sends the frame as a base64 image payload alongside the structured prompt text

#### Scenario: Text-only request without authorized frame
- **WHEN** cloud media transmission is not authorized or no frame is available
- **THEN** the server-side provider sends a text-only request without attaching image bytes

#### Scenario: Object uncertainty constraint is preserved
- **WHEN** the user asks an object-identification question routed to Qwen
- **THEN** the server-side provider includes the object-recognition uncertainty constraint requiring "看不清楚" when uncertain

### Requirement: Structured Qwen answer normalization
The server-side Qwen provider SHALL parse model output into the normalized `VisualAnswer` shape with answer text, optional explanation, confidence, referenced entities, and normalized region coordinates between 0 and 1 before returning the response to the client.

#### Scenario: JSON answer with regions is normalized
- **WHEN** the model returns a JSON answer containing `answer`, `explanation`, and normalized `regions`
- **THEN** the server maps the payload into a cloud-sourced `VisualAnswer` suitable for visual evidence overlay and TTS

#### Scenario: Thinking reasoning is preserved
- **WHEN** the model returns separate `reasoning_content` and the structured answer lacks an explanation
- **THEN** the server uses the reasoning text as the explanation field without issuing a second cloud request

#### Scenario: Uncertain object answer is constrained
- **WHEN** the parsed object answer matches the uncertain-object phrases such as "看不清楚"
- **THEN** the server clears regions and marks evidence as unavailable

#### Scenario: Unparseable model output falls back safely
- **WHEN** the model response cannot be parsed as structured JSON
- **THEN** the server returns a general cloud answer using the raw text and does not invent region coordinates

### Requirement: Backend gateway telemetry response
The backend visual answer API SHALL return per-request telemetry metadata, including estimated tokens, actual tokens when available, and estimated cost, for client display and operations correlation.

#### Scenario: Successful answer includes telemetry metadata
- **WHEN** the backend completes a cloud visual answer request successfully
- **THEN** the response includes telemetry fields alongside the normalized `VisualAnswer`

#### Scenario: Budget-blocked request includes telemetry metadata
- **WHEN** the backend blocks a request due to budget enforcement before upstream provider invocation
- **THEN** the response includes the estimated token and cost metadata used for the budget decision

### Requirement: Visual verification role in hybrid Omni mode
When hybrid Omni dialogue mode is enabled, the server-side Qwen visual-language provider SHALL serve as the structured visual verification and enrichment backend invoked by the hybrid visual orchestrator rather than as the primary generator of spoken assistant responses.

#### Scenario: Hybrid mode invokes VLM through orchestrator tool
- **WHEN** hybrid Omni dialogue mode is active and the orchestrator schedules cloud visual verification
- **THEN** the backend executes the existing visual answer pipeline and returns a normalized `VisualAnswer` to the orchestrator without blocking Omni session audio streaming

#### Scenario: Spoken response is not sourced from HTTP VLM alone
- **WHEN** hybrid Omni dialogue mode is active and a visual question is answered with speech
- **THEN** the spoken response is produced by the Omni Realtime session using orchestrator hints and the HTTP VLM result supplies structured evidence and verification only

#### Scenario: Legacy turn-based VLM path remains for fallback
- **WHEN** hybrid Omni dialogue mode is disabled
- **THEN** the existing client `CloudVisualLanguageProvider` turn-based visual answer path remains available unchanged
