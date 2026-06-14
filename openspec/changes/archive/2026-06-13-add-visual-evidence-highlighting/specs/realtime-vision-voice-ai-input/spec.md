## ADDED Requirements

### Requirement: Visual evidence canvas overlay for image answers
The system SHALL draw highlight boxes on the live video preview for image-related answers when visual evidence regions are available, using a Canvas overlay aligned to the current preview frame.

#### Scenario: Image answer highlights referenced region
- **WHEN** the system produces an image-related answer with one or more evidence regions
- **THEN** the system renders highlight boxes for those regions on the live video preview using a Canvas overlay

#### Scenario: Multiple evidence regions are shown
- **WHEN** the answer includes multiple evidence regions for the same frame
- **THEN** the system renders all provided regions on the Canvas overlay without requiring additional network requests

#### Scenario: No evidence regions are available
- **WHEN** the system produces an image-related answer without usable evidence regions
- **THEN** the system does not draw misleading highlight boxes on the video preview

### Requirement: Spoken visual reasoning for image answers
The system SHALL speak a short explanation of why the AI reached an image-related conclusion when visual evidence is available, using the same TTS path as other AI responses.

#### Scenario: Answer includes reasoning text
- **WHEN** the system produces an image-related answer with evidence regions and an explanation of the judgment basis
- **THEN** the system speaks the explanation through TTS in the active interaction language

#### Scenario: Key recognition result includes evidence and explanation
- **WHEN** the system produces a key recognition result such as an object-name answer with evidence regions
- **THEN** the system provides both the visual highlight boxes and a short spoken explanation of the judgment basis

### Requirement: Why-follow-up visual evidence
The system SHALL answer "why" follow-up questions about a recent image-related conclusion by reusing or deriving evidence regions and speaking a concise feature-based explanation.

#### Scenario: User asks why the object was identified
- **WHEN** the user asks a follow-up such as "为什么你觉得这是苹果？" after a recent object identification answer
- **THEN** the system highlights the apple region on the video preview and speaks a short explanation such as shape and stem cues

#### Scenario: Why follow-up reuses recent evidence
- **WHEN** the user asks why about a recently answered visual topic and stored evidence regions are still available
- **THEN** the system reuses the stored evidence regions for the highlight overlay instead of inventing new coordinates

### Requirement: Visual evidence uncertainty response
The system SHALL avoid inventing visual evidence and SHALL respond with an explicit uncertainty phrase when coordinate evidence is unavailable from the answering model.

#### Scenario: Cloud model lacks coordinate evidence
- **WHEN** a cloud-bound image answer cannot provide reliable region coordinates
- **THEN** the system answers with an uncertainty phrase such as "我不确定原因" and does not draw highlight boxes

#### Scenario: Local answer lacks region evidence
- **WHEN** a local image-related answer has no region coordinates for the referenced entity
- **THEN** the system speaks the answer without visual highlights and does not claim a specific visual basis

### Requirement: Lightweight visual evidence payload
The system SHALL keep visual evidence metadata lightweight and SHALL include explanation text in the primary model response without requiring an extra model call for reasoning.

#### Scenario: Evidence payload stays within bandwidth budget
- **WHEN** the system transmits or stores visual evidence regions for a frame
- **THEN** the serialized region payload for that frame remains under 200 bytes

#### Scenario: Explanation text is bundled with primary answer
- **WHEN** the cloud visual-language model generates an image-related answer with reasoning
- **THEN** the explanation text is returned in the same response as the answer and regions without a separate reasoning request

## MODIFIED Requirements

### Requirement: Cloud visual-language model processing
The system SHALL route complex visual question answering tasks to a cloud visual-language model such as GPT-4V, LLaVA, or an equivalent backend only when local processing, including local custom object matching where relevant, cannot answer confidently and network conditions allow. For cloud-bound image answers, the system SHALL request normalized region coordinates when the provider supports them and SHALL preserve both region coordinates and short explanation text in the normalized answer payload.

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

### Requirement: Object identification visual question answering
The system SHALL answer object-name questions such as "这是什么" from live video, SHALL check locally learned custom objects before generic recognition or cloud fallback, SHALL achieve at least 85% accuracy on the configured common-object evaluation set, and SHALL provide visual evidence highlights plus a short spoken explanation when region evidence is available for the identified object.

#### Scenario: User asks what a learned custom object is
- **WHEN** the user shows a previously taught custom object to the camera and asks "这是什么"
- **THEN** the system searches local custom object memory first and answers with the user-defined custom object name when the match meets the configured threshold

#### Scenario: User asks what a shown common object is
- **WHEN** the user shows a common object to the camera, no local custom object match is found, and asks "这是什么"
- **THEN** the system answers with the detected object name

#### Scenario: Object answer includes visual evidence
- **WHEN** the system answers an object-name question and region evidence is available for the identified object
- **THEN** the system highlights the object region on the video preview and speaks a short explanation of the judgment basis

#### Scenario: Common object accuracy is evaluated
- **WHEN** the object identification flow is tested against the configured common-object evaluation set
- **THEN** at least 85% of object-name answers are correct
