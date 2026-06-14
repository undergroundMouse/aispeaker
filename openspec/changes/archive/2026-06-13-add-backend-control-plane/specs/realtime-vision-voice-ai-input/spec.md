## MODIFIED Requirements

### Requirement: Cloud visual-language model processing
The system SHALL route complex visual question answering tasks to a configured cloud visual-language model such as Qwen3-VL, GPT-4V, LLaVA, or an equivalent backend only when local processing, including local custom object matching where relevant, cannot answer confidently and network conditions allow. In production, cloud visual-language execution SHALL be performed by the backend control plane; the client SHALL submit cloud-required turns to the backend API rather than calling upstream model providers directly. For cloud-bound image answers, the system SHALL request normalized region coordinates when the provider supports them and SHALL preserve both region coordinates and short explanation text in the normalized answer payload.

#### Scenario: Complex visual question uses cloud model
- **WHEN** the user asks a complex visual question that cannot be answered confidently by local processing and the network is available
- **THEN** the client sends the relevant voice transcript, video frame context, and local vision signals to the backend control plane for cloud visual-language processing

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
- **THEN** the UI displays whether the active cloud visual-language path is `backend+Qwen3-VL-8B-Thinking` or `mock`

#### Scenario: Budget exhaustion uses distinct messaging
- **WHEN** the backend blocks a cloud-required visual question because the daily budget cap would be exceeded
- **THEN** the client shows a budget-specific message distinct from the weak-network retry message

## MODIFIED Requirements

### Requirement: Cloud provider environment configuration
The system SHALL document and load cloud execution configuration from environment variables without committing secrets to source control. Production client configuration SHALL reference the backend control plane base URL and device credentials; upstream model API keys SHALL be configured only on the server.

#### Scenario: Example env documents backend variables
- **WHEN** a developer sets up the project for backend-controlled cloud execution
- **THEN** environment examples list the client backend base URL and server-side `QWEN_API_KEY` separately with safe placeholder values

#### Scenario: Local secrets stay out of git
- **WHEN** a developer stores API keys or admin tokens in local env files
- **THEN** git ignore rules prevent committing those files or other `.env` secret files

#### Scenario: Browser no longer requires VITE model API key in production
- **WHEN** production cloud execution is enabled through the backend control plane
- **THEN** the client does not require `VITE_QWEN_API_KEY` to perform cloud visual-language requests

## ADDED Requirements

### Requirement: Operations admin HTTP integration
The client operations admin surface SHALL read conversation telemetry and budget configuration from the backend admin API in production mode.

#### Scenario: Operations panel lists server-backed conversations
- **WHEN** an authorized operator opens the operations admin panel with backend integration enabled
- **THEN** the panel displays conversation telemetry retrieved from the backend admin API

#### Scenario: Budget changes are persisted server-side
- **WHEN** an authorized operator updates the daily budget cap through the operations admin panel
- **THEN** the backend admin API persists the new budget configuration used for subsequent cloud request enforcement
