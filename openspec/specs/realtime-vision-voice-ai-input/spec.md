## Purpose

Define the real-time camera, microphone, local command, fallback, energy-saving, and bilingual interaction requirements for feeding live user context into AI.

## Requirements

### Requirement: Real-time camera capture for AI input
The system SHALL call the device camera to capture real-time video and continuously provide sampled live environmental frames to the AI input pipeline while camera capture is active.

#### Scenario: Continuous camera input reaches AI
- **WHEN** the user grants camera permission and camera capture starts
- **THEN** the system displays the live camera stream and continuously supplies sampled frames from that stream to the AI input pipeline

#### Scenario: Camera permission is denied
- **WHEN** the user denies camera permission during initialization
- **THEN** the system shows a camera permission error and does not attempt to send camera frames to AI

### Requirement: Microphone capture and conversation triggering
The system SHALL capture user speech through the microphone and support both voice wake-up and push-to-talk triggering for natural dialogue.

#### Scenario: Push-to-talk starts dialogue
- **WHEN** the user presses the configured push-to-talk control and speaks
- **THEN** the system captures microphone audio and starts a dialogue turn from the captured speech

#### Scenario: Voice wake-up starts dialogue
- **WHEN** voice wake-up is enabled and the local wake trigger is detected
- **THEN** the system starts listening for the user's dialogue utterance through the microphone

### Requirement: Startup media initialization and live preview
The system SHALL automatically initialize camera and microphone capture when the app opens and SHALL show the real-time video preview in the interface after camera initialization succeeds.

#### Scenario: Startup media initialization succeeds
- **WHEN** the app opens and the user grants camera and microphone permissions
- **THEN** the system initializes both media devices and renders the live camera preview in the UI

#### Scenario: Startup microphone initialization fails
- **WHEN** microphone initialization fails during app startup
- **THEN** the system keeps the video preview available if camera initialization succeeded and shows that voice input is unavailable

### Requirement: WebRTC-compatible media capture
The system SHALL use WebRTC-compatible media stream capture and SHALL support Chrome, Edge, and Electron runtime environments.

#### Scenario: Browser supports WebRTC media devices
- **WHEN** the app runs in Chrome, Edge, or Electron with `navigator.mediaDevices.getUserMedia` available
- **THEN** the system requests camera and microphone media streams through WebRTC APIs

#### Scenario: WebRTC media devices are unavailable
- **WHEN** the runtime does not provide WebRTC media capture APIs
- **THEN** the system shows an unsupported-environment message and does not start media capture

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

### Requirement: Watch-only energy-saving mode
The system SHALL support a watch-only energy-saving mode that lowers the AI video sampling frame rate after 10 seconds without dialogue.

#### Scenario: Inactivity reduces AI sampling
- **WHEN** watch-only mode is enabled and no dialogue activity occurs for 10 seconds
- **THEN** the system lowers the video frame sampling rate used for AI input while keeping the live preview visible

#### Scenario: Dialogue resumes normal sampling
- **WHEN** the user starts a new dialogue turn while watch-only mode has reduced sampling
- **THEN** the system restores the normal AI video sampling frame rate for the active dialogue

### Requirement: Bilingual language support and voice switching
The system SHALL support Chinese and English interaction modes and SHALL allow the user to switch the active language through voice commands.

#### Scenario: Switch to English by voice
- **WHEN** the user says a configured language-switch command such as "switch to English"
- **THEN** the system sets English as the active interaction language and uses English command aliases and prompts

#### Scenario: Switch to Chinese by voice
- **WHEN** the user says a configured language-switch command such as "切换到中文"
- **THEN** the system sets Chinese as the active interaction language and uses Chinese command aliases and prompts

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

### Requirement: Scene classification visual question answering
The system SHALL answer scene-category questions such as "我现在在哪类场景" by classifying the current video scene.

#### Scenario: User asks current scene type
- **WHEN** the user asks "我现在在哪类场景" while camera capture is active
- **THEN** the system classifies the visible scene and answers with a scene category such as kitchen or office

#### Scenario: Scene evidence is unavailable
- **WHEN** the user asks for the current scene type but no usable video frame is available
- **THEN** the system tells the user that the scene cannot be determined from the current video

### Requirement: Continuous multi-turn visual dialogue context
The system SHALL support continuous multi-turn dialogue and remember recently mentioned objects, scenes, gestures, and topics for follow-up turns. Before each dialogue turn, the system SHALL also retrieve relevant local long-term memories for the active user and include only the scoped memory context needed for the turn while preserving cloud access restrictions.

#### Scenario: Follow-up references previous object
- **WHEN** the system identifies an object in one dialogue turn and the user asks a follow-up question that refers to "it" or "这个"
- **THEN** the system resolves the follow-up against the recently mentioned object context

#### Scenario: Context is updated after each multimodal answer
- **WHEN** the system produces a multimodal answer about an object, scene, gesture, or topic
- **THEN** the system stores the relevant structured context for later dialogue turns

#### Scenario: Dialogue turn includes relevant local long-term memories
- **WHEN** the user starts a dialogue turn and relevant local long-term memories exist for the active user
- **THEN** the system appends concise relevant memory context to prompt construction before generating the answer

#### Scenario: Cloud-bound turn excludes unauthorized long-term memory
- **WHEN** a dialogue turn requires cloud processing and the user has not explicitly authorized cloud access to long-term memory
- **THEN** the system excludes long-term memory context from the cloud-bound request

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

### Requirement: Gateway-integrated cloud dialogue retries
The system SHALL route all cloud LLM and cloud visual-language dialogue requests through the cloud gateway so retry and failure messaging behavior is consistent across dialogue features.

#### Scenario: Text dialogue cloud request uses gateway retries
- **WHEN** a cloud LLM text dialogue request fails with a retryable error
- **THEN** the gateway retries the request up to 2 times before returning failure

#### Scenario: Exhausted dialogue retries show network message
- **WHEN** a cloud dialogue request fails after 2 gateway retries
- **THEN** the system shows "网络不佳，请重试" to the user

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

### Requirement: Natural AI response text-to-speech
The system SHALL synthesize AI dialogue responses through TTS and provide natural, fluent spoken feedback to the user.

#### Scenario: AI answer is spoken to the user
- **WHEN** the system produces an AI dialogue answer for a voice-initiated turn
- **THEN** the system speaks the answer through TTS in the active interaction language

#### Scenario: Gesture acknowledgement is spoken
- **WHEN** the system recognizes a configured gesture or body action that requires an acknowledgement
- **THEN** the system provides the acknowledgement through synthesized speech

#### Scenario: TTS is unavailable
- **WHEN** no supported TTS provider is available in the current runtime
- **THEN** the system keeps the textual AI answer visible and shows that spoken output is unavailable

### Requirement: End-to-end voice response latency
The system SHALL keep the end-to-end latency from user speech to received AI response under 3 seconds, with an implementation target below 2.5 seconds.

#### Scenario: Voice response meets latency budget
- **WHEN** the user finishes speaking a supported dialogue utterance under normal network and device conditions
- **THEN** the system starts delivering the AI response to the user within 3 seconds

#### Scenario: Latency metrics are recorded
- **WHEN** a voice dialogue turn is processed
- **THEN** the system records timing metrics for speech capture, ASR transcript commit, AI response generation, TTS start, first playback, and response completion

#### Scenario: Latency target is reported
- **WHEN** latency metrics are available for a dialogue turn
- **THEN** the system reports whether the turn met the 3 second requirement and the below-2.5-second implementation target

### Requirement: Streaming speech synthesis
The system SHALL use streaming speech synthesis through Web Speech API or a cloud TTS stream to improve response speed.

#### Scenario: TTS begins from first speakable segment
- **WHEN** the AI response is produced as streamed text segments
- **THEN** the system begins TTS playback after the first speakable segment is available without waiting for the full final answer

#### Scenario: Full-answer TTS fallback
- **WHEN** the AI provider only returns a complete final answer instead of streamed segments
- **THEN** the system synthesizes the complete answer through the same TTS lifecycle

#### Scenario: Weak-network TTS fallback
- **WHEN** cloud streaming TTS is configured but the system is offline or in a weak-network state
- **THEN** the system uses an available local TTS provider such as Web Speech API or reports that spoken output is unavailable

#### Scenario: User interrupts speech output
- **WHEN** the user issues a supported stop command or starts a new dialogue turn while TTS playback is active
- **THEN** the system cancels the current TTS playback and updates the speaking state

### Requirement: ASR and TTS quality targets
The system SHALL achieve more than 95% ASR word accuracy in quiet environments and a TTS naturalness MOS greater than 4.0 for the selected spoken-output provider.

#### Scenario: Quiet-environment ASR accuracy is evaluated
- **WHEN** the ASR pipeline is tested against the configured quiet-environment utterance fixture
- **THEN** the measured word accuracy is greater than 95%

#### Scenario: TTS naturalness is accepted
- **WHEN** the selected TTS voice or provider is evaluated for naturalness
- **THEN** the accepted MOS score is greater than 4.0

#### Scenario: Quality result is below target
- **WHEN** ASR accuracy or TTS MOS evaluation falls below the configured target
- **THEN** the system marks the quality gate as failed and reports which metric did not meet the requirement

### Requirement: Proactive visual voice prompts
The system SHALL proactively provide short spoken prompts when live video shows noteworthy targets or state changes that are useful, safety-relevant, optimizable, or reminder-worthy.

#### Scenario: Left-behind phone is detected
- **WHEN** the local vision pipeline detects that a phone previously visible in the scene has left the camera view and the proactive prompt gates pass
- **THEN** the system speaks a brief prompt such as "似乎手机不在画面里了，可能需要留意一下"

#### Scenario: Unattended stove flame is detected
- **WHEN** the local vision pipeline detects an active stove flame and no attending person is detected by the configured local rule
- **THEN** the system treats the prompt as an urgent safety prompt and speaks a brief warning

#### Scenario: Risky scissor use is detected
- **WHEN** the local vision pipeline detects scissors near a user's fingers with confidence above the configured threshold
- **THEN** the system speaks a brief caution prompt such as "使用剪刀时可能需要小心手指"

#### Scenario: Useful event appears in energy-saving mode
- **WHEN** watch-only energy-saving mode is active, no dialogue is in progress, and a useful configured event such as a delivery person at the door is detected
- **THEN** the system may proactively speak a short useful prompt such as "快递员似乎在门口"

### Requirement: Proactive prompt local-first triggering
The system SHALL trigger at least 90% of proactive prompts from a local rules engine and edge-side object detection without producing cloud costs.

#### Scenario: Local rule triggers proactive prompt
- **WHEN** a configured proactive prompt rule matches local detector signals with sufficient confidence
- **THEN** the system decides whether to prompt locally without sending the frame or rule evaluation to cloud processing

#### Scenario: Local trigger ratio is measured
- **WHEN** proactive prompt telemetry is summarized for an evaluation session
- **THEN** at least 90% of emitted proactive prompts are attributed to the local rules engine plus edge-side detection path

### Requirement: Continuous local TensorFlow.js detection for proactive prompts
The system SHALL continuously run a local TensorFlow.js-compatible object detection pipeline while camera capture is active and proactive prompts are enabled.

#### Scenario: Object detection feeds rules engine
- **WHEN** camera capture is active and proactive prompts are enabled
- **THEN** the system provides local object detection signals with labels, confidence scores, regions, and timestamps to the proactive rules engine

#### Scenario: State-change rule evaluates object history
- **WHEN** the rules engine evaluates a state-change rule such as "object leaves view"
- **THEN** the system uses recent local detection history to determine whether the rule matched

#### Scenario: Dangerous action rule evaluates posture
- **WHEN** the rules engine evaluates a dangerous action rule such as risky scissor use
- **THEN** the system uses local object and posture/action signals to determine whether the rule matched

### Requirement: Proactive prompt gating and rate limits
The system SHALL apply multiple gates before speaking a proactive prompt, including target confidence greater than 90%, no repeat of the same prompt within 30 seconds, session average no more than one proactive prompt per minute, and a configurable daily prompt cap.

#### Scenario: Low confidence prompt is suppressed
- **WHEN** a proactive rule matches but the target confidence is 90% or lower
- **THEN** the system does not speak the proactive prompt

#### Scenario: Duplicate prompt is suppressed within cooldown
- **WHEN** the same proactive prompt was spoken less than 30 seconds ago
- **THEN** the system does not repeat that prompt

#### Scenario: Session rate limit is enforced
- **WHEN** speaking a non-urgent proactive prompt would make the session average exceed one proactive prompt per minute
- **THEN** the system suppresses or delays the prompt

#### Scenario: Daily prompt cap is reached
- **WHEN** the configured daily proactive prompt cap has already been reached
- **THEN** the system does not speak additional non-urgent proactive prompts that day

### Requirement: Voice control and persistence for proactive prompts
The system SHALL allow users to control proactive prompts through local voice commands and SHALL persist the proactive prompt switch state in `localStorage`.

#### Scenario: User disables proactive prompts by voice
- **WHEN** the user says "闭嘴，别主动说话"
- **THEN** the system recognizes the command locally, disables proactive prompts, and persists the disabled state in `localStorage`

#### Scenario: User increases reminders by voice
- **WHEN** the user says "多提醒我"
- **THEN** the system recognizes the command locally, enables proactive prompts or increases reminder intensity, and persists the updated state in `localStorage`

#### Scenario: Proactive state is restored
- **WHEN** the app starts after a proactive prompt switch state was saved
- **THEN** the system restores that state from `localStorage`

### Requirement: Proactive prompt speech queueing and interruption
The system SHALL queue proactive prompts while the user is speaking and SHALL allow urgent safety prompts to interrupt when configured as urgent.

#### Scenario: Non-urgent prompt waits for user speech
- **WHEN** a non-urgent proactive prompt is accepted while the user is speaking
- **THEN** the system queues the prompt instead of immediately speaking over the user

#### Scenario: Urgent safety prompt interrupts
- **WHEN** an urgent safety proactive prompt such as an unattended flame warning is accepted while the user is speaking or TTS is active
- **THEN** the system may interrupt the active speech path and speak the urgent prompt

### Requirement: Uncertainty wording and correction feedback
The system SHALL include uncertainty wording in proactive prompts and SHALL use user correction feedback to reduce future false triggers for similar prompts.

#### Scenario: Proactive prompt uses uncertain wording
- **WHEN** the system speaks a proactive prompt
- **THEN** the prompt includes uncertainty wording such as "似乎" or "可能需要"

#### Scenario: User marks prompt as wrong
- **WHEN** the user says "错了" after a proactive prompt
- **THEN** the system records local feedback for the recent prompt rule and lowers the likelihood of repeating similar false triggers

### Requirement: Local sensitive information filtering for proactive prompts
The system SHALL locally filter sensitive OCR content before proactive speech and MUST NOT speak continuous digit strings detected by OCR.

#### Scenario: Continuous digits are detected
- **WHEN** local OCR detects continuous digits in the region relevant to a proactive prompt
- **THEN** the system suppresses the sensitive string and does not read the digits aloud

#### Scenario: Sensitive prompt depends on OCR string
- **WHEN** a proactive prompt would require speaking a sensitive OCR string to be useful
- **THEN** the system suppresses that proactive prompt locally
