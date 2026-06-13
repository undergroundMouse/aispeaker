## ADDED Requirements

### Requirement: Multimodal video and voice intent understanding
The system SHALL analyze live video content and user voice instructions together to infer user intent, including visible objects, scenes, actions, and facial expressions when available.

#### Scenario: Voice question is answered using current video
- **WHEN** the user asks a visual question by voice while camera capture is active
- **THEN** the system uses the user's speech and the latest relevant sampled video frame context to produce the answer

#### Scenario: Visual context refines ambiguous speech
- **WHEN** the user says an ambiguous instruction such as "what is this" while showing an object
- **THEN** the system resolves the intent using visible video context instead of relying on speech text alone

### Requirement: Gesture and body-action voice response
The system SHALL recognize configured user body actions such as raising a hand and nodding, and SHALL provide a corresponding spoken response.

#### Scenario: Raised hand is recognized
- **WHEN** the user raises a hand in the camera view
- **THEN** the system recognizes the raised-hand gesture and responds by voice with a message such as "你举手了"

#### Scenario: Nod is recognized
- **WHEN** the user nods in the camera view and the gesture confidence meets the configured threshold
- **THEN** the system recognizes the nod and provides a matching spoken acknowledgement

### Requirement: Object identification visual question answering
The system SHALL answer object-name questions such as "这是什么" from live video and SHALL achieve at least 85% accuracy on the configured common-object evaluation set.

#### Scenario: User asks what a shown object is
- **WHEN** the user shows a common object to the camera and asks "这是什么"
- **THEN** the system answers with the detected object name

#### Scenario: Common object accuracy is evaluated
- **WHEN** the object identification flow is tested against the configured common-object evaluation set
- **THEN** at least 85% of object-name answers are correct

### Requirement: Scene classification visual question answering
The system SHALL answer scene-category questions such as "我现在在哪类场景" by classifying the current video scene.

#### Scenario: User asks current scene type
- **WHEN** the user asks "我现在在哪类场景" while camera capture is active
- **THEN** the system classifies the visible scene and answers with a scene category such as kitchen or office

#### Scenario: Scene evidence is unavailable
- **WHEN** the user asks for the current scene type but no usable video frame is available
- **THEN** the system tells the user that the scene cannot be determined from the current video

### Requirement: Continuous multi-turn visual dialogue context
The system SHALL support continuous multi-turn dialogue and remember recently mentioned objects, scenes, gestures, and topics for follow-up turns.

#### Scenario: Follow-up references previous object
- **WHEN** the system identifies an object in one dialogue turn and the user asks a follow-up question that refers to "it" or "这个"
- **THEN** the system resolves the follow-up against the recently mentioned object context

#### Scenario: Context is updated after each multimodal answer
- **WHEN** the system produces a multimodal answer about an object, scene, gesture, or topic
- **THEN** the system stores the relevant structured context for later dialogue turns

### Requirement: Edge-side lightweight vision pre-processing
The system SHALL run lightweight edge-side vision models, such as MobileNet-compatible classifiers or detectors, for scene classification and object-detection filtering to reduce unnecessary cloud calls.

#### Scenario: Local vision confidently answers a simple scene request
- **WHEN** the user asks a scene-category question and the edge-side model classifies the scene above the configured confidence threshold
- **THEN** the system may answer locally without sending the frame to cloud visual-language processing

#### Scenario: Local vision filters cloud request context
- **WHEN** the user asks a complex visual question that requires cloud processing
- **THEN** the system includes relevant local object or scene candidates in the cloud request context

### Requirement: Cloud visual-language model processing
The system SHALL route complex visual question answering tasks to a cloud visual-language model such as GPT-4V, LLaVA, or an equivalent backend when network conditions allow.

#### Scenario: Complex visual question uses cloud model
- **WHEN** the user asks a complex visual question that cannot be answered confidently by local processing and the network is available
- **THEN** the system sends the relevant voice transcript, video frame context, and local vision signals to the configured cloud visual-language model

#### Scenario: Cloud answer includes explainability regions
- **WHEN** the cloud visual-language model returns region coordinates for referenced visual evidence
- **THEN** the system preserves those coordinates with the answer so the UI can explain which area of the image was used

#### Scenario: Cloud-required visual question during weak network
- **WHEN** the user asks a complex visual question that requires cloud processing while the system is offline or in a weak-network state
- **THEN** the system does not start the cloud request and prompts "网络不佳，请重试"
