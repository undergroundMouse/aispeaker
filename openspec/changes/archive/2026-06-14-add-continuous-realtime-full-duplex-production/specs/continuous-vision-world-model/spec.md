## ADDED Requirements

### Requirement: Multi-frame vision buffer
The system SHALL maintain a rolling buffer of recent video frames and vision features for temporal context.

#### Scenario: Buffer retains recent frames
- **WHEN** camera capture is active in session mode
- **THEN** the vision world model retains the configured number of recent frames (30-60)

### Requirement: Object tracking across frames
The system SHALL track detected objects across frames with persistent track identifiers.

#### Scenario: Track persists across frames
- **WHEN** an object is detected in consecutive frames
- **THEN** the system assigns a stable trackId and maintains bounding box with IoU above 0.7 on evaluation fixtures

### Requirement: OCR region detection
The system SHALL detect text regions in the video stream and expose OCR results in vision deltas.

#### Scenario: OCR text extracted
- **WHEN** readable text appears in the camera view
- **THEN** the system includes OCR regions in vision.delta with key field recall above 85% on evaluation fixtures

### Requirement: Gesture and action detection
The system SHALL detect configured gestures and body actions continuously.

#### Scenario: Gesture detected in stream
- **WHEN** the user performs a configured gesture such as raising a hand
- **THEN** the vision delta includes the gesture with confidence and spoken response context

### Requirement: Scene change delta
The system SHALL detect significant scene changes and emit scene delta events.

#### Scenario: Scene change emitted
- **WHEN** the visual scene changes beyond the configured threshold
- **THEN** the system emits a sceneChange event in vision.delta

### Requirement: Temporal visual questions
The system SHALL answer temporal visual questions using multi-frame context.

#### Scenario: Prior object referenced
- **WHEN** the user asks about an object seen earlier such as "where did that thing go"
- **THEN** the system uses track history to answer with accuracy above 80% on evaluation fixtures

### Requirement: Adaptive frame sampling
The system SHALL adjust video sampling rate based on session activity, network, and budget tier.

#### Scenario: Active dialogue increases sampling
- **WHEN** a dialogue turn is active in session mode
- **THEN** sampling increases toward the normal tier (approximately 5 fps)

#### Scenario: Budget pressure reduces sampling
- **WHEN** daily budget tier is constrained
- **THEN** sampling reduces to minimal tier while preserving track updates
