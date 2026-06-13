## Why

Users need a way to teach the AI personally meaningful objects in the moment, using the live camera and voice interaction they already rely on. This change makes custom object recognition private, local-first, and cost-conscious by keeping teaching, feature extraction, vector storage, and repeat recognition on the device whenever possible.

## What Changes

- Add an in-session teaching flow where the user can describe a new object by voice and select the object region in the camera frame.
- Store learned custom object names, metadata, regions, and feature vectors locally only, using a local vector database such as LanceDB or sqlite-vss.
- Recognize previously taught custom objects before falling back to cloud visual-language processing.
- Ask the user whether to remember an unknown or low-confidence object only when local matching fails and cloud recognition is needed.
- Add voice and UI management for learned custom objects, including "forget that object", list management, and undoing the last teaching action.
- Ensure the custom object teaching path performs feature extraction and vector storage locally and does not create cloud inference cost.

## Capabilities

### New Capabilities
- `local-custom-object-learning`: Covers local teaching, storage, recognition, and management of user-defined custom objects.

### Modified Capabilities
- `realtime-vision-voice-ai-input`: Extends local voice commands and object-identification routing so custom learned objects are checked locally before cloud fallback.

## Impact

- Affects the realtime camera, voice command, object identification, and multimodal dialogue routing flows.
- Adds a local feature extraction and embedding pipeline for selected object regions.
- Adds a local vector database dependency or adapter for persisted custom object embeddings and metadata.
- Adds UI surfaces for drawing/selecting object regions and managing the learned object list.
- Adds local privacy constraints ensuring custom object vectors and teaching data are not uploaded to cloud services.
