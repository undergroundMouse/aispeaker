## ADDED Requirements

### Requirement: Personalized memory export
The system SHALL allow the user to export locally stored long-term memories in a portable local file without uploading the export to cloud services.

#### Scenario: User exports long-term memories
- **WHEN** the user requests export from the long-term memory management interface
- **THEN** the system generates a local export file containing the active user's memory summaries and metadata and does not upload the export to cloud services

#### Scenario: Export excludes other users' memories
- **WHEN** multiple user profiles exist and the active user exports long-term memories
- **THEN** the export includes only the active user's long-term memories

## MODIFIED Requirements

### Requirement: Cloud access requires explicit authorization
The system SHALL prevent cloud services from accessing long-term memory unless the user explicitly authorizes memory use for cloud reasoning and the current request requires complex reasoning. The system MUST NOT allow cloud services to read, list, export, or infer personalized long-term memory without that explicit authorization.

#### Scenario: Cloud request is not authorized
- **WHEN** a dialogue turn would otherwise call a cloud model and the user has not authorized cloud access to long-term memory
- **THEN** the system MUST NOT include raw long-term memory or long-term memory summaries in the cloud request

#### Scenario: Authorized complex reasoning uses scoped memory
- **WHEN** the user has explicitly authorized cloud access to long-term memory and the current request requires complex cloud reasoning
- **THEN** the system includes only the relevant scoped memory context needed for that request

#### Scenario: Authorization is revoked
- **WHEN** the user disables cloud access to long-term memory
- **THEN** subsequent cloud requests MUST NOT include long-term memory context

#### Scenario: Cloud backend cannot access local memory store
- **WHEN** a cloud service or operations backend receives a request without explicit user-authorized memory context
- **THEN** the cloud side MUST NOT access the device's local long-term memory store or request bulk memory export
