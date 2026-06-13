## MODIFIED Requirements

### Requirement: Cloud visual-language model processing
The system SHALL route complex visual question answering tasks to a configured cloud visual-language model such as Qwen3-VL, GPT-4V, LLaVA, or an equivalent backend only when local processing, including local custom object matching where relevant, cannot answer confidently and network conditions allow. In production, cloud visual-language execution SHALL be performed by the backend control plane; the client SHALL submit cloud-required turns to the backend API rather than calling upstream model providers directly. For cloud-bound image answers, the system SHALL request normalized region coordinates when the provider supports them and SHALL preserve both region coordinates and short explanation text in the normalized answer payload. The Assist surface SHALL present cloud answers and failure messages through the floating caption layer and system toasts rather than requiring users to read engineering debug cards.

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
- **WHEN** an operator opens the Operator surface
- **THEN** the UI displays whether the active cloud visual-language path is `backend+Qwen3-VL-8B-Thinking`, direct Qwen, or `mock`

#### Scenario: Budget exhaustion uses distinct messaging
- **WHEN** the backend blocks a cloud-required visual question because the daily budget cap would be exceeded
- **THEN** the UI shows a budget-specific message distinct from the weak-network retry message

#### Scenario: Cloud answer is visible on Assist without debug scrolling
- **WHEN** a cloud visual-language answer completes on the default Assist surface
- **THEN** the user can read the answer in the caption layer without scrolling to an engineering event card

### Requirement: Assist talk controls placement
The Assist surface SHALL place push-to-talk and object-selection controls as overlays on the camera stage, with push-to-talk centered in a floating action control and object-selection available adjacent to the talk control.

#### Scenario: Push-to-talk is reachable without opening Settings
- **WHEN** the Assist surface is active and microphone capture is authorized
- **THEN** the user can start and stop push-to-talk from the floating talk control without opening Settings or debug panels

#### Scenario: Object selection hint is available during teaching
- **WHEN** no object region is selected on the Assist surface
- **THEN** the UI provides a visible hint that the user may tap the preview or use a select-object control before teaching a custom object

### Requirement: Visual evidence canvas overlay for image answers
The system SHALL draw highlight boxes on the live video preview for image-related answers when visual evidence regions are available, using a Canvas overlay aligned to the current preview frame. When evidence becomes visible, highlight boxes SHALL fade in rather than appearing instantaneously.

#### Scenario: Image answer highlights referenced region
- **WHEN** the system produces an image-related answer with one or more evidence regions
- **THEN** the system renders highlight boxes for those regions on the live video preview using a Canvas overlay

#### Scenario: Multiple evidence regions are shown
- **WHEN** the answer includes multiple evidence regions for the same frame
- **THEN** the system renders all provided regions on the Canvas overlay without requiring additional network requests

#### Scenario: No evidence regions are available
- **WHEN** the system produces an image-related answer without usable evidence regions
- **THEN** the system does not draw misleading highlight boxes on the video preview

#### Scenario: Evidence regions animate into view
- **WHEN** visual evidence regions first become visible for an answer
- **THEN** the Canvas overlay animates the highlight boxes into view with a fade-in effect

## ADDED Requirements

### Requirement: Streaming caption presentation on Assist
The client SHALL surface non-final `DialogueResponseSegment` events to the Assist caption layer so assistant text can update while the active dialogue turn is still in progress.

#### Scenario: Caption updates on partial segment
- **WHEN** the dialogue pipeline emits a non-final response segment for the active turn
- **THEN** the Assist caption layer updates the assistant line for that turn before the final segment arrives

#### Scenario: Caption finalizes on last segment
- **WHEN** the dialogue pipeline emits the final response segment for a turn
- **THEN** the Assist caption layer marks that turn assistant text as final and retains it in session history

### Requirement: Object selection and teaching visual feedback
The client SHALL provide visible selection and teaching feedback on the Assist camera preview when users select object regions or complete teaching actions.

#### Scenario: Selection box animates after tap
- **WHEN** the user selects an object region from a preview tap
- **THEN** the selection box appears with a brief motion feedback animation

#### Scenario: Teaching feedback is shown on failure
- **WHEN** a teaching action fails on the Assist surface
- **THEN** the UI shows user-visible failure feedback on or adjacent to the camera preview without requiring debug panel access
