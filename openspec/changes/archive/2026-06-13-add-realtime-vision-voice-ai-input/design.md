## Context

The current app is a React/Vite prototype for FR-01 through FR-08. It initializes camera and microphone capture, displays a live preview, samples video frames for AI input, supports local voice commands, tracks network state, and falls back during weak-network/offline conditions.

FR-09 through FR-15 extend this foundation from media input into multimodal understanding. The implementation needs to combine a voice transcript, recent video frames, local vision signals, network state, and conversation memory into one dialogue turn that can answer object, scene, gesture, and follow-up questions.

## Goals / Non-Goals

**Goals:**

- Add a multimodal dialogue orchestration path that consumes user speech and the latest sampled video context together.
- Support local lightweight vision inference for common scene classification, object candidate filtering, and simple gesture/body-action detection.
- Route complex visual question answering to a cloud VLM provider when network conditions allow it.
- Preserve multi-turn context for recently referenced objects, scenes, gestures, and topics.
- Surface explainability metadata when the cloud model returns region coordinates.

**Non-Goals:**

- Training custom production-grade computer vision models.
- Guaranteeing recognition of rare objects, complex gestures, or privacy-sensitive identity attributes.
- Replacing existing local command, weak-network fallback, media-capture, or watch-only behavior.
- Committing to one cloud vendor permanently; the integration should allow GPT-4V, LLaVA, or an equivalent backend.

## Decisions

1. Introduce a multimodal turn service behind the existing transcript handling path.

   `useRealtimeVisionVoice` should continue to own user interaction state, but non-trivial AI processing should move into a service that accepts `{ transcript, frame, localVision, conversationContext, networkState, language }` and returns a normalized response. This keeps the React hook focused on UI orchestration and makes the AI path testable without rendering components.

   Alternative considered: place all intent routing directly inside the hook. That is faster for a prototype, but it would mix UI state, provider calls, context updates, and local inference in one file.

2. Run edge-side lightweight vision before cloud routing.

   The local layer should produce low-cost signals such as top scene labels, object candidates, gesture events, confidence scores, and whether a cloud call is needed. Simple answers with sufficient confidence can be generated locally, while ambiguous or complex questions are routed to the cloud VLM.

   Alternative considered: always send frames to the cloud model. That simplifies logic but increases latency, network dependency, privacy exposure, and cost.

3. Use a provider interface for cloud visual-language calls.

   Cloud VLM integration should be represented by an interface such as `answerVisualQuestion(request): Promise<VisualAnswer>`, with provider-specific adapters for GPT-4V, LLaVA, or later backends. Responses should normalize answer text, confidence, referenced objects, and optional region coordinates.

   Alternative considered: hard-code one provider API in the dialogue path. That would make the prototype quicker but brittle and harder to test.

4. Store short-lived conversation context as structured memory.

   The system should remember recent objects, scenes, gestures, topics, and the last AI answer for follow-up resolution. Context should be bounded by turn count or age so it supports continuity without accumulating stale observations.

   Alternative considered: append raw transcript and answer strings only. That is simple, but it makes references such as "that object" or "where is it?" harder to resolve reliably.

5. Treat visual explainability as metadata, not required UI behavior for every answer.

   Region coordinates from cloud VLM responses should be preserved in response data and displayed when available, but user-facing answers should still work when the model cannot provide reliable coordinates.

   Alternative considered: require coordinates for every visual answer. That would overconstrain providers and fail useful answers that lack bounding boxes.

## Risks / Trade-offs

- Local model confidence may be wrong -> require thresholds and route low-confidence or ambiguous cases to cloud VLM.
- Cloud VLM latency can make responses feel slow -> keep the local prefilter path, expose pending state, and reuse the latest suitable frame instead of waiting for a new capture on every turn.
- Conversation memory may resolve follow-ups incorrectly -> store structured entities with timestamps and prefer asking for clarification when references are ambiguous.
- Gesture recognition can be noisy -> limit initial support to a small configured gesture set such as raised hand and nod, with clear confidence gates.
- Region coordinates may be approximate -> display them as explanatory hints rather than strict truth.
- Adding model packages can increase bundle size -> isolate local model loading and defer model initialization until camera capture is ready.

## Migration Plan

1. Add typed AI and vision domain models without changing current behavior.
2. Implement local vision analysis and multimodal turn orchestration behind tests and mock providers.
3. Wire the existing transcript simulator and push-to-talk flow into the multimodal route for non-local commands.
4. Add UI state for visual answers, remembered context, local vision signals, and optional coordinates.
5. Keep weak-network fallback behavior so cloud-required requests still return "网络不佳，请重试" when unavailable.
6. Roll back by routing non-local transcripts to the existing queued cloud-dialogue placeholder while preserving media capture and local commands.

## Open Questions

- Which concrete local model runtime will be used in the browser/Electron target, such as TensorFlow.js, ONNX Runtime Web, or a custom native bridge?
- Which cloud VLM provider and API contract should be used first?
- What object set defines "common objects" for measuring the 85% accuracy requirement?
- Should gesture detection rely only on visual frames, or can future versions use pose/landmark models?
