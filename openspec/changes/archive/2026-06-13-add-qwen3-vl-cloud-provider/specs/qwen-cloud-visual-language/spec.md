## ADDED Requirements

### Requirement: Qwen cloud provider configuration
The system SHALL support configuring a Qwen3-VL cloud visual-language provider through environment variables and SHALL use secure local secret files that are excluded from version control.

#### Scenario: API key enables Qwen provider
- **WHEN** `VITE_QWEN_API_KEY` is set in the runtime environment
- **THEN** the system selects the Qwen cloud visual-language provider instead of the mock provider

#### Scenario: Missing API key falls back to mock
- **WHEN** `VITE_QWEN_API_KEY` is not configured
- **THEN** the system uses `MockCloudVisualLanguageProvider` for cloud visual-language processing

#### Scenario: Default WaveSpeed endpoint and model
- **WHEN** optional Qwen endpoint and model variables are not provided
- **THEN** the system uses base URL `https://llm.wavespeed.ai/v1` and model id `qwen/qwen3-vl-8b-thinking`

### Requirement: OpenAI-compatible Qwen visual request
The Qwen provider SHALL send authorized visual questions to an OpenAI-compatible `chat/completions` endpoint with the user transcript, optional camera frame image, local vision hints, and authorized long-term memory context.

#### Scenario: Frame is attached when cloud media is authorized
- **WHEN** a cloud visual question includes an authorized camera frame
- **THEN** the provider sends the frame as a base64 image payload alongside the structured prompt text

#### Scenario: Text-only request without authorized frame
- **WHEN** cloud media transmission is not authorized or no frame is available
- **THEN** the provider sends a text-only request without attaching image bytes

#### Scenario: Object uncertainty constraint is preserved
- **WHEN** the user asks an object-identification question routed to Qwen
- **THEN** the provider includes the object-recognition uncertainty constraint requiring "看不清楚" when uncertain

### Requirement: Structured Qwen answer normalization
The Qwen provider SHALL parse model output into the normalized `VisualAnswer` shape with answer text, optional explanation, confidence, referenced entities, and normalized region coordinates between 0 and 1.

#### Scenario: JSON answer with regions is normalized
- **WHEN** the model returns a JSON answer containing `answer`, `explanation`, and normalized `regions`
- **THEN** the provider maps the payload into a cloud-sourced `VisualAnswer` suitable for visual evidence overlay and TTS

#### Scenario: Thinking reasoning is preserved
- **WHEN** the model returns separate `reasoning_content` and the structured answer lacks an explanation
- **THEN** the provider uses the reasoning text as the explanation field without issuing a second cloud request

#### Scenario: Uncertain object answer is constrained
- **WHEN** the parsed object answer matches the uncertain-object phrases such as "看不清楚"
- **THEN** the provider clears regions and marks evidence as unavailable

#### Scenario: Unparseable model output falls back safely
- **WHEN** the model response cannot be parsed as structured JSON
- **THEN** the provider returns a general cloud answer using the raw text and does not invent region coordinates

### Requirement: Qwen requests use cloud gateway telemetry
All Qwen visual-language requests SHALL pass through the existing cloud gateway and SHALL record actual token usage from provider responses when available.

#### Scenario: Gateway wraps Qwen provider
- **WHEN** the application handles a cloud-bound visual question with Qwen configured
- **THEN** the request is invoked through `GatewayCloudVisualLanguageProvider` rather than calling the remote API directly from dialogue routing code

#### Scenario: Actual token usage is captured
- **WHEN** the Qwen API returns `usage.total_tokens`
- **THEN** the gateway stores actual token usage alongside pre-request estimates in conversation telemetry
