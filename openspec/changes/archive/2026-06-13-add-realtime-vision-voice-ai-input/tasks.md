## 1. Domain Models and Contracts

- [x] 1.1 Add typed models for local vision signals, multimodal dialogue requests, visual answers, region coordinates, and conversation memory entries.
- [x] 1.2 Define a local vision analyzer interface for scene classification, object candidates, gesture detection, confidence thresholds, and cloud-routing hints.
- [x] 1.3 Define a cloud visual-language provider interface that normalizes answer text, confidence, referenced entities, and optional region coordinates.

## 2. Local Vision Processing

- [x] 2.1 Implement a lightweight local vision analyzer module with mockable scene, object, and gesture outputs.
- [x] 2.2 Add threshold logic for when local scene or object results are confident enough to answer without cloud processing.
- [x] 2.3 Add gesture recognition handling for configured actions such as raised hand and nod, including spoken-response text.
- [x] 2.4 Add tests for confident local scene answers, low-confidence cloud escalation, and gesture response mapping.

## 3. Multimodal Dialogue Orchestration

- [x] 3.1 Implement a multimodal turn service that combines transcript, latest sampled frame, local vision signals, network state, language, and conversation memory.
- [x] 3.2 Route object-name questions such as "这是什么" through current video context and return object-name answers.
- [x] 3.3 Route scene-category questions such as "我现在在哪类场景" through local scene classification or cloud processing as needed.
- [x] 3.4 Preserve weak-network behavior by rejecting cloud-required visual questions with "网络不佳，请重试".
- [x] 3.5 Add tests for visual-context disambiguation, object identification, scene classification, and weak-network cloud rejection.

## 4. Conversation Memory

- [x] 4.1 Implement bounded structured memory for recent objects, scenes, gestures, topics, and last AI answers.
- [x] 4.2 Update memory after each multimodal response.
- [x] 4.3 Resolve follow-up references such as "it" or "这个" against recent memory when unambiguous.
- [x] 4.4 Add tests for context updates, follow-up resolution, and ambiguous reference handling.

## 5. Cloud Visual-Language Integration

- [x] 5.1 Implement a mock/default cloud VLM provider adapter behind the provider interface.
- [x] 5.2 Build cloud request payloads from transcript, selected video frame, local vision candidates, language, and memory context.
- [x] 5.3 Preserve cloud response region coordinates for UI explainability when present.
- [x] 5.4 Add tests for cloud request construction, normalized cloud answers, and coordinate preservation.

## 6. Hook and UI Wiring

- [x] 6.1 Wire non-local transcript handling in `useRealtimeVisionVoice` to the multimodal turn service.
- [x] 6.2 Expose UI state for latest visual answer, local vision signals, remembered context, cloud/local answer source, and optional explainability regions.
- [x] 6.3 Update `App.tsx` to display multimodal answers, gesture acknowledgements, scene/object results, and coordinate metadata when available.
- [x] 6.4 Add component tests for transcript-driven multimodal answers and displayed context state.

## 7. Accuracy and Regression Coverage

- [x] 7.1 Add a common-object evaluation fixture or test harness for the configured object set.
- [x] 7.2 Add an automated check that object identification reaches at least 85% accuracy on the configured fixture.
- [x] 7.3 Run lint, unit tests, and build to verify the implementation.
