## MODIFIED Requirements

### Requirement: Cloud visual-language model processing
The system SHALL route complex visual question answering tasks to a configured cloud visual-language model such as Qwen3-VL, GPT-4V, LLaVA, or an equivalent backend only when local processing, including local custom object matching where relevant, cannot answer confidently and network conditions allow. In production, cloud visual-language execution SHALL be performed by the backend control plane; the client SHALL submit cloud-required turns to the backend API rather than calling upstream model providers directly. For cloud-bound image answers, the system SHALL request normalized region coordinates when the provider supports them and SHALL preserve both region coordinates and short explanation text in the normalized answer payload. The Assist surface SHALL present cloud answers and failure messages through the conversation strip rather than requiring users to read engineering debug cards.

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
- **WHEN** an operator opens the Assist surface or Operator surface
- **THEN** the UI displays whether the active cloud visual-language path is `backend+Qwen3-VL-8B-Thinking`, direct Qwen, or `mock`

#### Scenario: Budget exhaustion uses distinct messaging
- **WHEN** the backend blocks a cloud-required visual question because the daily budget cap would be exceeded
- **THEN** the conversation strip shows a budget-specific message distinct from the weak-network retry message

#### Scenario: Cloud answer is visible on Assist without debug scrolling
- **WHEN** a cloud visual-language answer completes on the default Assist surface
- **THEN** the user can read the answer in the conversation strip without scrolling to an engineering event card

### Requirement: Operations admin HTTP integration
The client operations admin surface SHALL read conversation telemetry and budget configuration from the backend admin API in production mode and SHALL render that information on the dedicated Operator surface rather than the default Assist layout.

#### Scenario: Operations panel lists server-backed conversations
- **WHEN** an authorized operator opens the Operator surface with backend integration enabled
- **THEN** the panel displays conversation telemetry retrieved from the backend admin API

#### Scenario: Budget changes are persisted server-side
- **WHEN** an authorized operator updates the daily budget cap through the Operator surface
- **THEN** the backend admin API persists the new budget configuration used for subsequent cloud request enforcement

#### Scenario: Assist does not expose operator telemetry lists
- **WHEN** a user opens the default Assist surface
- **THEN** per-conversation token and cost telemetry lists are not shown in the primary assist layout

## ADDED Requirements

### Requirement: Assist talk controls placement
The Assist surface SHALL place push-to-talk and object-selection controls adjacent to the camera stage and conversation strip.

#### Scenario: Push-to-talk is reachable without opening Settings
- **WHEN** the Assist surface is active and microphone capture is authorized
- **THEN** the user can start and stop push-to-talk from the primary assist controls without opening Settings or debug panels

#### Scenario: Object selection hint is available during teaching
- **WHEN** no object region is selected on the Assist surface
- **THEN** the UI provides a visible hint that the user may tap the preview or use a select-object control before teaching a custom object
