## MODIFIED Requirements

### Requirement: Cloud visual-language model processing
The system SHALL route complex visual question answering tasks to a configured cloud visual-language model such as Qwen3-VL, GPT-4V, LLaVA, or an equivalent backend only when local processing, including local custom object matching where relevant, cannot answer confidently and network conditions allow. When `VITE_QWEN_API_KEY` is configured, the system SHALL use the Qwen3-VL provider; otherwise it SHALL use the mock cloud provider for development. For cloud-bound image answers, the system SHALL request normalized region coordinates when the provider supports them and SHALL preserve both region coordinates and short explanation text in the normalized answer payload.

#### Scenario: Complex visual question uses cloud model
- **WHEN** the user asks a complex visual question that cannot be answered confidently by local processing and the network is available
- **THEN** the system sends the relevant voice transcript, video frame context, and local vision signals to the configured cloud visual-language model

#### Scenario: Custom object match prevents cloud request
- **WHEN** the user asks an object-name question and local custom object memory returns a confident match
- **THEN** the system answers with the custom object name without sending the frame or custom object feature vector to cloud visual-language processing

#### Scenario: Cloud answer includes explainability regions
- **WHEN** the cloud visual-language model returns region coordinates for referenced visual evidence
- **THEN** the system preserves those coordinates with the answer so the UI can highlight the referenced area and speak the bundled explanation text

#### Scenario: Cloud answer includes reasoning without extra call
- **WHEN** the cloud visual-language model returns explanation text for an image-related answer
- **THEN** the system preserves that explanation in the same normalized response used for TTS and does not issue a separate cloud request only for reasoning

#### Scenario: Cloud-required visual question during weak network
- **WHEN** the user asks a complex visual question that requires cloud processing while the system is offline or in a weak-network state
- **THEN** the system does not start the cloud request and prompts "网络不佳，请重试"

#### Scenario: Operator sees active cloud provider
- **WHEN** an operator opens the realtime vision dashboard
- **THEN** the UI displays whether the active cloud visual-language provider is `Qwen3-VL-8B-Thinking` or `mock`

## ADDED Requirements

### Requirement: Cloud provider environment configuration
The system SHALL document and load cloud visual-language credentials from local environment configuration without committing secrets to source control.

#### Scenario: Example env documents Qwen variables
- **WHEN** a developer sets up the project
- **THEN** `.env.example` lists `VITE_QWEN_API_KEY`, `VITE_QWEN_BASE_URL`, and `VITE_QWEN_MODEL` with safe placeholder values

#### Scenario: Local secrets stay out of git
- **WHEN** a developer stores an API key in `.env.local`
- **THEN** git ignore rules prevent committing that file or other `.env` secret files
