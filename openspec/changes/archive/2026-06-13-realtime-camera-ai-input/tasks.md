## 1. Project Scaffolding

- [x] 1.1 Initialize Vite + TypeScript + React frontend project with HTTPS dev server support
- [x] 1.2 Create `src/core/event-bus/` module with typed publish/subscribe API
- [x] 1.3 Define shared media types (`MediaFrame`, `ThumbnailFrame`, `StreamState`) in `src/core/media/types.ts`

## 2. Camera Capture (camera-capture spec)

- [x] 2.1 Implement `MediaStreamManager` class with `start()`, `stop()`, and stream lifecycle management
- [x] 2.2 Add `getUserMedia` integration with video-only constraints and error mapping (NotAllowedError, NotFoundError, NotReadableError)
- [x] 2.3 Emit `media:stream:state` events for inactive, starting, active, and error states
- [x] 2.4 Ensure all MediaStream tracks are stopped on `stop()` and page `beforeunload`
- [x] 2.5 Build `CameraPreview` React component showing live video preview bound to the active MediaStream
- [x] 2.6 Add permission-denied and device-unavailable error UI with retry button

## 3. Video AI Pipeline (video-ai-pipeline spec)

- [x] 3.1 Implement `FrameSampler` using hidden `<video>` + `<canvas>` to extract frames from MediaStream
- [x] 3.2 Add adaptive sampling rate: 2 fps during conversation, 0.5 fps after 10s idle
- [x] 3.3 Subscribe to `ConversationManager` state changes (stub if not yet implemented) to drive sampling rate
- [x] 3.4 Generate 224×224 JPEG thumbnail alongside original-resolution frame per sample
- [x] 3.5 Emit `media:frame:raw` and `media:frame:thumbnail` events with frameId and timestamp metadata
- [x] 3.6 Implement latest-frame-only backpressure: drop stale frames when consumers lag

## 4. Downstream Integration Stubs

- [x] 4.1 Create `LocalInferenceEngine` stub that subscribes to `media:frame:raw` and logs received frames
- [x] 4.2 Create `CloudGateway` stub with `getLatestThumbnail()` reading the most recent `media:frame:thumbnail`
- [x] 4.3 Wire `MediaStreamManager` and `FrameSampler` into application bootstrap singleton

## 5. UI & Privacy

- [x] 5.1 Add camera on/off toggle in main toolbar wired to `MediaStreamManager.start()` / `stop()`
- [x] 5.2 Verify no video data is written to localStorage, IndexedDB, or remote endpoints
- [x] 5.3 Confirm frame emission stops immediately when camera is disabled

## 6. Manual Verification

- [x] 6.1 Test permission grant flow: preview appears, frames are emitted
- [x] 6.2 Test permission deny flow: error message and retry work
- [x] 6.3 Test sampling rate switch: verify 2 fps during active state and 0.5 fps after 10s idle
- [x] 6.4 Test camera stop: preview hidden, tracks released, no further frame events
