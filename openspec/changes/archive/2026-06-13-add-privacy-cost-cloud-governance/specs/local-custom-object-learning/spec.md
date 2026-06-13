## ADDED Requirements

### Requirement: Personalized custom object memory export
The system SHALL allow the user to export locally stored custom object records and associated metadata in a portable local file without uploading custom object feature vectors or crops to cloud services.

#### Scenario: User exports learned custom objects
- **WHEN** the user requests export from the learned custom object management interface
- **THEN** the system generates a local export file containing the user's custom object names and available metadata without uploading feature vectors or object crops to cloud services

#### Scenario: Export excludes other users' objects
- **WHEN** multiple user profiles exist and the active user exports learned custom objects
- **THEN** the export includes only the active user's custom object records

## MODIFIED Requirements

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
