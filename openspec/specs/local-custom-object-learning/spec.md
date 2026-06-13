## Purpose

Define the local custom object learning requirements for teaching, storing, recognizing, forgetting, undoing, and managing user-defined objects without uploading custom object memory to cloud services.

## Requirements

### Requirement: Voice and region based custom object teaching
The system SHALL allow the user to teach a new custom object by providing a spoken name and selecting the object region from the current camera frame.

#### Scenario: User teaches object with voice name and selection
- **WHEN** the camera is active and the user selects an object region while saying a custom name such as "记住这个叫小红杯"
- **THEN** the system extracts local visual features from the selected region and creates a local custom object record associated with the spoken name

#### Scenario: Teaching requires usable object region
- **WHEN** the user provides a custom object name but no usable selected region or current frame is available
- **THEN** the system does not create a custom object record and prompts the user to select the object region again

### Requirement: Local custom object vector persistence
The system SHALL store custom object feature vectors and associated metadata only in a local vector database. Cloud services MUST NOT access custom object feature vectors, selected object crops, or teaching metadata unless the user has explicitly authorized cloud use of personalized object memory for the current complex reasoning request.

#### Scenario: Custom object record is persisted locally
- **WHEN** local feature extraction succeeds for a taught object
- **THEN** the system stores the feature vector, user-defined name, selected region metadata, creation time, and local identifier in the local vector database

#### Scenario: Custom object data is not uploaded
- **WHEN** a custom object is taught, recognized, forgotten, listed, exported, or undone
- **THEN** the system MUST NOT upload custom object feature vectors, selected object crops, or teaching metadata to any cloud service

#### Scenario: Local vector database is unavailable
- **WHEN** the local vector database cannot be opened or written
- **THEN** the system does not complete the teaching action and tells the user that local object memory is unavailable

#### Scenario: Cloud backend cannot access local object store
- **WHEN** a cloud service receives a request without explicit user-authorized personalized object memory context
- **THEN** the cloud side MUST NOT access the device's local custom object vector store or request bulk object memory export

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

#### Scenario: Local search has no confident match
- **WHEN** local vector search returns no custom object above the configured similarity threshold
- **THEN** the system continues through the normal local common-object or cloud fallback recognition path

### Requirement: Forget and undo custom objects
The system SHALL allow the user to forget learned custom objects and undo the most recent teaching action through local controls.

#### Scenario: Voice command forgets referenced object
- **WHEN** the user says "忘记那个物体" or "forget that object" and the referenced custom object can be resolved from recent recognition context
- **THEN** the system deletes that custom object record and its feature vectors from the local vector database

#### Scenario: Voice command undoes last teaching
- **WHEN** the user says "撤销最后一次教学" or "undo last teaching" after a successful teaching action
- **THEN** the system removes the most recently created custom object record and its feature vectors from the local vector database

### Requirement: Learned custom object management list
The system SHALL display the list of learned custom objects and allow the user to manage them locally.

#### Scenario: Learned objects are listed
- **WHEN** the user opens the learned custom object management interface
- **THEN** the system displays locally stored custom object names and available metadata without contacting cloud services

### Requirement: Personalized custom object memory export
The system SHALL allow the user to export locally stored custom object records and associated metadata in a portable local file without uploading custom object feature vectors or crops to cloud services.

#### Scenario: User exports learned custom objects
- **WHEN** the user requests export from the learned custom object management interface
- **THEN** the system generates a local export file containing the user's custom object names and available metadata without uploading feature vectors or object crops to cloud services

#### Scenario: Export excludes other users' objects
- **WHEN** multiple user profiles exist and the active user exports learned custom objects
- **THEN** the export includes only the active user's custom object records
