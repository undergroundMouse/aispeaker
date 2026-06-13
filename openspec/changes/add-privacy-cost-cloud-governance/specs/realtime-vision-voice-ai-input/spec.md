## MODIFIED Requirements

### Requirement: Object identification visual question answering
The system SHALL answer object-name questions such as "这是什么" from live video, SHALL check locally learned custom objects before generic recognition or cloud fallback, SHALL achieve at least 85% accuracy on the configured common-object evaluation set, SHALL provide visual evidence highlights plus a short spoken explanation when region evidence is available for the identified object, and SHALL include a cloud-bound object-recognition constraint that instructs the model to respond with "看不清楚" when it is not sure.

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

#### Scenario: Cloud object recognition uses uncertainty constraint
- **WHEN** the system sends an object-name question to a cloud visual-language model
- **THEN** the request includes a constraint instructing the model that if it is not sure, it must say "看不清楚"

#### Scenario: Uncertain cloud object answer is spoken
- **WHEN** a cloud-bound object-name answer returns "看不清楚" because the model is uncertain
- **THEN** the system speaks "看不清楚" to the user and does not invent a specific object name

### Requirement: Edge-side lightweight vision pre-processing
The system SHALL run lightweight edge-side vision models, such as MobileNet-compatible classifiers or detectors, for scene classification and object-detection filtering to reduce unnecessary cloud calls. The overall edge-cloud collaboration strategy SHALL reduce cloud LLM invocations by at least 70% compared with a cloud-only baseline for the configured evaluation fixture set.

#### Scenario: Local vision confidently answers a simple scene request
- **WHEN** the user asks a scene-category question and the edge-side model classifies the scene above the configured confidence threshold
- **THEN** the system may answer locally without sending the frame to cloud visual-language processing

#### Scenario: Local vision filters cloud request context
- **WHEN** the user asks a complex visual question that requires cloud processing
- **THEN** the system includes relevant local object or scene candidates in the cloud request context

#### Scenario: Cloud call reduction is measured
- **WHEN** the edge-cloud routing strategy is evaluated against the configured cloud-only baseline fixture set
- **THEN** the measured cloud LLM invocation count is at least 70% lower than the cloud-only baseline

### Requirement: Cloud visual-language model processing
The system SHALL route complex visual question answering tasks to a cloud visual-language model such as GPT-4V, LLaVA, or an equivalent backend only when local processing, including local custom object matching where relevant, cannot answer confidently and network conditions allow. For cloud-bound image answers, the system SHALL request normalized region coordinates when the provider supports them and SHALL preserve both region coordinates and short explanation text in the normalized answer payload. All cloud visual-language requests SHALL pass through the cloud gateway retry policy with up to 2 retries and SHALL show "网络不佳，请重试" when retries are exhausted.

#### Scenario: Complex visual question uses cloud model
- **WHEN** the user asks a complex visual question that cannot be answered confidently by local processing and the network is available
- **THEN** the system sends the relevant voice transcript, video frame context, and local vision signals to the configured cloud visual-language model through the cloud gateway

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

#### Scenario: Cloud visual request is retried through gateway
- **WHEN** a cloud visual-language request fails with a retryable error and fewer than 2 gateway retries remain
- **THEN** the gateway retries the request before returning failure to the client

#### Scenario: Cloud visual request retries are exhausted
- **WHEN** a cloud visual-language request still fails after 2 gateway retries
- **THEN** the system shows "网络不佳，请重试" and does not present a fabricated visual answer

## ADDED Requirements

### Requirement: Gateway-integrated cloud dialogue retries
The system SHALL route all cloud LLM and cloud visual-language dialogue requests through the cloud gateway so retry and failure messaging behavior is consistent across dialogue features.

#### Scenario: Text dialogue cloud request uses gateway retries
- **WHEN** a cloud LLM text dialogue request fails with a retryable error
- **THEN** the gateway retries the request up to 2 times before returning failure

#### Scenario: Exhausted dialogue retries show network message
- **WHEN** a cloud dialogue request fails after 2 gateway retries
- **THEN** the system shows "网络不佳，请重试" to the user
