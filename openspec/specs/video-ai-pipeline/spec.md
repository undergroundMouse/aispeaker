# video-ai-pipeline

## Purpose

Sample, preprocess, and route video frames from the active camera stream to local and cloud AI inference consumers with adaptive sampling and backpressure handling.

## Requirements

### Requirement: Continuous video frames are sampled from the camera stream

The system SHALL extract video frames from the active MediaStream at a configurable sampling rate and emit them as a continuous frame sequence for AI processing.

#### Scenario: Frames emitted while capture is active

- **WHEN** camera capture is active and the MediaStream is playing
- **THEN** the system emits video frames at the configured sampling rate

#### Scenario: Frame emission stops when capture ends

- **WHEN** camera capture is stopped
- **THEN** the system ceases emitting new video frames to downstream consumers

### Requirement: Frame sampling rate adapts to conversation state

The system SHALL adjust the video frame sampling rate based on conversation activity to balance responsiveness and resource usage.

#### Scenario: Active conversation sampling rate

- **WHEN** a conversation is in progress (listening, thinking, or speaking state)
- **THEN** the system samples video frames at approximately 2 frames per second

#### Scenario: Idle power-saving sampling rate

- **WHEN** no conversation has occurred for at least 10 seconds
- **THEN** the system reduces sampling to approximately 0.5 frames per second

#### Scenario: Sampling rate restores on new conversation

- **WHEN** a new conversation begins after an idle period
- **THEN** the system restores sampling to approximately 2 frames per second

### Requirement: Video frames are preprocessed for AI consumption

The system SHALL produce two outputs per sampled frame: the original frame for local inference and a 224×224 thumbnail for cloud inference.

#### Scenario: Thumbnail generation for cloud AI

- **WHEN** a video frame is sampled
- **THEN** the system generates a 224×224 pixel thumbnail suitable for cloud vision API submission

#### Scenario: Original frame preserved for local AI

- **WHEN** a video frame is sampled
- **THEN** the system retains the original-resolution frame data for local inference engine consumption

### Requirement: Video frames are routed to AI inference consumers

The system SHALL distribute sampled and preprocessed frames to registered downstream consumers for local and cloud AI processing.

#### Scenario: Frames delivered to local inference engine

- **WHEN** a video frame is sampled and preprocessed
- **THEN** the system delivers the original frame to the LocalInferenceEngine module

#### Scenario: Thumbnails available for cloud vision requests

- **WHEN** the ConversationManager or CloudGateway requests the latest visual context
- **THEN** the system provides the most recent 224×224 thumbnail frame for `/vision/chat` submission

#### Scenario: Frame metadata accompanies each sample

- **WHEN** a frame is emitted to downstream consumers
- **THEN** the frame payload includes a monotonically increasing frame index and a capture timestamp

### Requirement: Video pipeline handles backpressure gracefully

The system SHALL drop or coalesce frames when downstream AI consumers cannot keep pace, prioritizing the most recent frame over backlog accumulation.

#### Scenario: Stale frames dropped under load

- **WHEN** downstream processing lags behind the sampling rate
- **THEN** the system discards older pending frames and retains only the latest frame for each consumer
