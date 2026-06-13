## MODIFIED Requirements

### Requirement: Local simple voice commands
The system SHALL recognize a configured set of simple Chinese and English command phrases locally, including custom object memory management commands, and SHALL trigger their mapped actions without cloud processing.

#### Scenario: Local greeting command is recognized
- **WHEN** the user says a configured greeting phrase such as "你好" or "hello"
- **THEN** the system recognizes the phrase locally and triggers the mapped greeting action without sending the command to cloud processing

#### Scenario: Local stop command is recognized
- **WHEN** the user says a configured stop phrase such as "停止" or "stop"
- **THEN** the system recognizes the phrase locally and stops the active dialogue action without cloud processing

#### Scenario: Local custom object forget command is recognized
- **WHEN** the user says a configured custom object management phrase such as "忘记那个物体" or "forget that object"
- **THEN** the system recognizes the phrase locally and routes it to the custom object forget action without sending the command to cloud processing

#### Scenario: Local custom object undo command is recognized
- **WHEN** the user says a configured custom object management phrase such as "撤销最后一次教学" or "undo last teaching"
- **THEN** the system recognizes the phrase locally and routes it to the undo-last-teaching action without sending the command to cloud processing

#### Scenario: Unconfigured phrase is spoken
- **WHEN** the user says a phrase that does not match the configured local command set
- **THEN** the system routes the utterance through the normal dialogue path when network conditions permit

### Requirement: Weak-network and offline fallback
The system SHALL execute supported simple local commands, including custom object memory management commands, during weak-network or offline states and SHALL prompt "网络不佳，请重试" for complex requests that require cloud processing.

#### Scenario: Offline local command executes
- **WHEN** the system is offline and the user says a supported local command such as "停止对话" or "拍照"
- **THEN** the system executes the mapped local action without cloud processing

#### Scenario: Offline custom object management command executes
- **WHEN** the system is offline and the user says a supported custom object management command such as "忘记那个物体" or "撤销最后一次教学"
- **THEN** the system executes the mapped local custom object action without cloud processing if the local custom object store is available

#### Scenario: Offline complex request is rejected
- **WHEN** the system is offline or in a weak-network state and the user makes a complex request that requires cloud AI processing
- **THEN** the system shows "网络不佳，请重试" and does not start the cloud request

### Requirement: Object identification visual question answering
The system SHALL answer object-name questions such as "这是什么" from live video, SHALL check locally learned custom objects before generic recognition or cloud fallback, and SHALL achieve at least 85% accuracy on the configured common-object evaluation set.

#### Scenario: User asks what a learned custom object is
- **WHEN** the user shows a previously taught custom object to the camera and asks "这是什么"
- **THEN** the system searches local custom object memory first and answers with the user-defined custom object name when the match meets the configured threshold

#### Scenario: User asks what a shown common object is
- **WHEN** the user shows a common object to the camera, no local custom object match is found, and asks "这是什么"
- **THEN** the system answers with the detected common object name

#### Scenario: Common object accuracy is evaluated
- **WHEN** the object identification flow is tested against the configured common-object evaluation set
- **THEN** at least 85% of object-name answers are correct

### Requirement: Cloud visual-language model processing
The system SHALL route complex visual question answering tasks to a cloud visual-language model such as GPT-4V, LLaVA, or an equivalent backend only when local processing, including local custom object matching where relevant, cannot answer confidently and network conditions allow.

#### Scenario: Complex visual question uses cloud model
- **WHEN** the user asks a complex visual question that cannot be answered confidently by local processing and the network is available
- **THEN** the system sends the relevant voice transcript, video frame context, and local vision signals to the configured cloud visual-language model

#### Scenario: Custom object match prevents cloud request
- **WHEN** the user asks an object-name question and local custom object memory returns a confident match
- **THEN** the system answers with the custom object name without sending the frame or custom object feature vector to cloud visual-language processing

#### Scenario: Cloud answer includes explainability regions
- **WHEN** the cloud visual-language model returns region coordinates for referenced visual evidence
- **THEN** the system preserves those coordinates with the answer so the UI can explain which area of the image was used

#### Scenario: Cloud-required visual question during weak network
- **WHEN** the user asks a complex visual question that requires cloud processing while the system is offline or in a weak-network state
- **THEN** the system does not start the cloud request and prompts "网络不佳，请重试"
