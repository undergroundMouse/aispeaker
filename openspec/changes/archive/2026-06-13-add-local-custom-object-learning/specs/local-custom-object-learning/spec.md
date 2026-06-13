## ADDED Requirements

### Requirement: Voice and region based custom object teaching
The system SHALL allow the user to teach a new custom object by providing a spoken name and selecting the object region from the current camera frame.

#### Scenario: User teaches object with voice name and selection
- **WHEN** the camera is active and the user selects an object region while saying a custom name such as "记住这个叫小红杯"
- **THEN** the system extracts local visual features from the selected region and creates a local custom object record associated with the spoken name

#### Scenario: Teaching requires usable object region
- **WHEN** the user provides a custom object name but no usable selected region or current frame is available
- **THEN** the system does not create a custom object record and prompts the user to select the object region again

#### Scenario: Teaching requires usable spoken name
- **WHEN** the user selects an object region but the spoken custom name cannot be determined
- **THEN** the system does not create a custom object record and prompts the user to provide the object name again

### Requirement: Local custom object vector persistence
The system SHALL store custom object feature vectors and associated metadata only in a local vector database.

#### Scenario: Custom object record is persisted locally
- **WHEN** local feature extraction succeeds for a taught object
- **THEN** the system stores the feature vector, user-defined name, selected region metadata, creation time, and local identifier in the local vector database

#### Scenario: Custom object data is not uploaded
- **WHEN** a custom object is taught, recognized, forgotten, listed, or undone
- **THEN** the system MUST NOT upload custom object feature vectors, selected object crops, or teaching metadata to any cloud service

#### Scenario: Local vector database is unavailable
- **WHEN** the local vector database cannot be opened or written
- **THEN** the system does not complete the teaching action and tells the user that local object memory is unavailable

### Requirement: Local-only teaching cost boundary
The system SHALL complete the custom object teaching process locally without invoking cloud visual-language, cloud embedding, or cloud storage services.

#### Scenario: Teaching completes without cloud request
- **WHEN** the user teaches a custom object through voice and region selection
- **THEN** the system performs feature extraction and vector storage locally without creating a cloud request

#### Scenario: Offline teaching is supported
- **WHEN** the system is offline and the user teaches a custom object with a valid region and name
- **THEN** the system completes the teaching action locally if the local feature extractor and vector database are available

### Requirement: Custom object recognition from local vector search
The system SHALL recognize previously taught custom objects by searching the local vector database before relying on cloud recognition.

#### Scenario: Learned object is recognized later
- **WHEN** the user shows an object that matches a stored custom object above the configured similarity threshold
- **THEN** the system returns the user-defined custom object name as the recognition result

#### Scenario: Custom match includes source metadata
- **WHEN** the system recognizes a learned custom object
- **THEN** the recognition result includes that the source was local custom object memory and includes the matched local object identifier

#### Scenario: Local search has no confident match
- **WHEN** local vector search returns no custom object above the configured similarity threshold
- **THEN** the system continues through the normal local common-object or cloud fallback recognition path

### Requirement: Remember prompt after low-confidence cloud recognition
The system SHALL ask whether to remember an object only when local custom matching fails and cloud recognition was needed for a low-confidence unknown object.

#### Scenario: Prompt to remember cloud-recognized object
- **WHEN** local custom matching fails, local common-object confidence is low, cloud recognition identifies the object, and the user interaction context supports teaching
- **THEN** the system asks the user whether to remember the object locally under a user-provided name

#### Scenario: No remember prompt after local custom match
- **WHEN** local custom matching successfully recognizes the object
- **THEN** the system returns the custom object name without asking the user to remember it again

#### Scenario: User declines remember prompt
- **WHEN** the system asks whether to remember a cloud-recognized object and the user declines
- **THEN** the system does not store a custom object record for that object

### Requirement: Forget custom objects by voice and UI
The system SHALL allow the user to forget learned custom objects through voice commands and through the learned object management interface.

#### Scenario: Voice command forgets referenced object
- **WHEN** the user says "忘记那个物体" or "forget that object" and the referenced custom object can be resolved from recent recognition or selection context
- **THEN** the system deletes that custom object record and its feature vectors from the local vector database

#### Scenario: UI deletes selected object
- **WHEN** the user deletes a learned object from the custom object management list
- **THEN** the system removes the selected custom object record and its feature vectors from the local vector database

#### Scenario: Forget command cannot resolve target
- **WHEN** the user gives a forget command but no custom object can be resolved from context
- **THEN** the system asks the user to choose an object from the learned object list or specify the object name

### Requirement: Undo last custom object teaching
The system SHALL provide a way to undo the most recent successful teaching action through voice and UI controls.

#### Scenario: Voice command undoes last teaching
- **WHEN** the user says "撤销最后一次教学" or "undo last teaching" after a successful teaching action
- **THEN** the system removes the most recently created custom object record and its feature vectors from the local vector database

#### Scenario: UI undo removes last teaching
- **WHEN** the user activates the undo-last-teaching control in the interface
- **THEN** the system removes the most recently created custom object record and updates the learned object list

#### Scenario: Nothing to undo
- **WHEN** the user requests undo and there is no previous teaching action available
- **THEN** the system tells the user there is no custom object teaching action to undo

### Requirement: Learned custom object management list
The system SHALL display the list of learned custom objects and allow the user to manage them locally.

#### Scenario: Learned objects are listed
- **WHEN** the user opens the learned custom object management interface
- **THEN** the system displays locally stored custom object names and available metadata without contacting cloud services

#### Scenario: List updates after teaching or deletion
- **WHEN** a custom object is taught, forgotten, deleted, or undone
- **THEN** the learned object management list reflects the updated local vector database state
