# qwen-omni-realtime-session

Server-proxied Qwen-Omni Realtime session for native streaming audio dialogue with optional vision frame input.

## ADDED Requirements

### Requirement: Server-proxied Omni Realtime gateway
The backend control plane SHALL expose an authenticated WebSocket gateway that proxies Qwen-Omni Realtime sessions using server-side credentials only.

#### Scenario: Client connects with valid device token
- **WHEN** the client upgrades to `/api/v1/realtime/omni` with a valid device API token
- **THEN** the server establishes an upstream Omni Realtime connection and relays session events bidirectionally

#### Scenario: Invalid device token is rejected
- **WHEN** the client connects without a valid device API token
- **THEN** the server closes the connection with an unauthorized error and does not open an upstream Omni session

#### Scenario: Client never receives upstream API key
- **WHEN** the Omni Realtime session is active
- **THEN** upstream DashScope credentials remain on the server and are not exposed to the client

### Requirement: Omni Realtime session configuration
The server SHALL configure each Omni Realtime session with model id, language, voice, modalities, and turn detection appropriate for Assist dialogue.

#### Scenario: Session starts with default hybrid model
- **WHEN** the client initiates an Omni Realtime session and no override is configured
- **THEN** the server uses `QWEN_OMNI_REALTIME_MODEL` defaulting to `qwen3.5-omni-plus-realtime`

#### Scenario: Server VAD is enabled for hands-free dialogue
- **WHEN** hybrid Omni dialogue mode is active
- **THEN** the server configures Omni turn detection to server-side VAD or semantic VAD for automatic endpointing and barge-in

### Requirement: Streaming audio input and output
The Omni Realtime session SHALL accept continuous PCM audio from the client and SHALL stream assistant audio output back to the client in real time.

#### Scenario: Microphone audio is streamed upstream
- **WHEN** microphone capture is authorized and the Omni session is connected
- **THEN** the client streams PCM audio chunks to the server proxy and the server forwards them to Omni Realtime

#### Scenario: Assistant audio is streamed downstream
- **WHEN** Omni Realtime emits assistant audio output for an active response
- **THEN** the server relays audio chunks to the client for immediate playback

#### Scenario: First assistant audio within fluency budget
- **WHEN** the user completes an utterance in hybrid Omni mode under normal network conditions
- **THEN** first assistant audio arrives within 800ms p95 of utterance endpoint detection

### Requirement: Optional vision frame input to Omni session
The Omni Realtime session SHALL accept optional key-frame image input when cloud media transmission is authorized.

#### Scenario: Key frame appended when authorized
- **WHEN** cloud media transmission is authorized and the client sends a sampled camera key frame
- **THEN** the server appends the frame to the Omni session image buffer at the configured adaptive rate

#### Scenario: Vision frames suppressed when unauthorized
- **WHEN** cloud media transmission is not authorized
- **THEN** the server does not append camera frames to the Omni session and relies on local text hints only

### Requirement: Omni session lifecycle and fallback
The system SHALL support session reconnect and SHALL fall back to the legacy realtime session or push-to-talk pipeline when the Omni session cannot be established or the circuit breaker is open.

#### Scenario: Reconnect after transient disconnect
- **WHEN** the Omni WebSocket disconnects unexpectedly and hybrid mode remains enabled
- **THEN** the client attempts reconnect with exponential backoff within the existing session reconnect budget

#### Scenario: Fallback when Omni circuit is open
- **WHEN** the Omni Realtime circuit breaker is open or upstream authentication fails
- **THEN** the client surfaces a recoverable dialogue state and falls back to the legacy session or push-to-talk path without blocking the Assist surface
