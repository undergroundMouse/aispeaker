## 1. Domain Types and Settings

- [x] 1.1 Add proactive prompt domain types for detector signals, rule matches, prompt candidates, severity, priority, telemetry source, prompt settings, prompt counters, and user feedback.
- [x] 1.2 Implement `localStorage` persistence for proactive prompt enablement, reminder intensity, daily prompt cap, daily count, and lightweight rule feedback.
- [x] 1.3 Add tests for default settings, persisted state restoration, daily counter reset, and unavailable `localStorage` fallback.

## 2. Local Detection and Observation History

- [x] 2.1 Add a proactive local detector interface for object, posture/action, and OCR metadata signals.
- [x] 2.2 Implement a mock detector for tests and development scenarios including phone, stove flame, scissors, person, delivery person, and OCR digit detections.
- [x] 2.3 Add a TensorFlow.js-compatible detector adapter with lazy model loading and graceful unavailable-state handling.
- [x] 2.4 Track recent observation history so rules can evaluate state changes such as an object leaving the camera view.
- [x] 2.5 Add tests for detector normalization, model-load failure behavior, and object history retention.

## 3. Rules Engine and Prompt Policy

- [x] 3.1 Implement the proactive rules engine with rule contracts for inputs, minimum confidence, cooldown key, severity, prompt template, and local/cloud attribution.
- [x] 3.2 Add initial rules for left-behind phone, unattended stove flame, risky scissor use, delivery person at door, and generic useful reminder events.
- [x] 3.3 Implement centralized prompt policy gates for confidence greater than 90%, duplicate suppression within 30 seconds, session average no more than one prompt per minute, daily cap, and proactive prompt enablement.
- [x] 3.4 Add uncertainty wording enforcement for emitted prompt text.
- [x] 3.5 Add local OCR sensitive-information filtering that suppresses continuous digit strings and suppresses prompts that depend on speaking sensitive OCR text.
- [x] 3.6 Add tests for all prompt gates, urgent versus non-urgent behavior, uncertainty wording, local attribution ratio accounting, and OCR suppression.

## 4. Voice Commands and Feedback

- [x] 4.1 Extend local command definitions with "闭嘴，别主动说话" for disabling proactive speech and "多提醒我" for enabling or increasing reminder intensity.
- [x] 4.2 Add local handling for "错了" after a proactive prompt to store feedback against the recent rule and visual labels.
- [x] 4.3 Apply feedback adjustments when evaluating similar future rule matches.
- [x] 4.4 Add tests for proactive command recognition, settings persistence after commands, and false-trigger feedback lowering future prompt likelihood.

## 5. Speech Queue and Integration

- [x] 5.1 Extend or wrap `SpeechResponseController` to support proactive prompt queueing with prompt priority.
- [x] 5.2 Queue non-urgent proactive prompts while the user is speaking and flush them when speech is no longer active.
- [x] 5.3 Allow urgent safety prompts to interrupt active user speech or TTS according to the configured priority rules.
- [x] 5.4 Add tests for queued non-urgent prompts, urgent interruption, cancellation state, and TTS fallback reuse.

## 6. App Wiring and UI State

- [x] 6.1 Wire proactive evaluation into the camera sampling/watch-only loop while camera capture is active and proactive prompts are enabled.
- [x] 6.2 Run proactive detection at an energy-conscious cadence in watch-only mode while still allowing useful prompts without dialogue.
- [x] 6.3 Surface proactive prompt enabled state, daily cap, daily count, latest prompt, and detector availability in app state or UI.
- [x] 6.4 Ensure disabling proactive prompts does not affect user-initiated multimodal dialogue, local commands, media capture, or TTS responses.
- [x] 6.5 Add integration tests for startup state restoration, watch-only useful event prompting, and disabled proactive prompt behavior.

## 7. Validation

- [x] 7.1 Add focused tests covering all OpenSpec scenarios in the proactive prompt delta spec.
- [x] 7.2 Add an evaluation helper or fixture that verifies at least 90% of proactive prompts in a session are attributed to local rules plus edge-side detection.
- [x] 7.3 Run unit tests, lint, and build for the app.
- [x] 7.4 Manually verify representative flows for phone leaving view, unattended flame, risky scissors, delivery event in watch-only mode, voice disable, voice increase reminders, queued prompt, urgent interruption, correction feedback, and OCR digit suppression.
