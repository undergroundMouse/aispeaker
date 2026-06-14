## Context

The app already has a React/Vite real-time vision and voice prototype with camera sampling, local command matching, watch-only sampling, local vision analysis, multimodal dialogue orchestration, conversation memory, and TTS response playback. Proactive prompts need to reuse this live media loop without depending on user-initiated dialogue turns, while staying local-first for cost, latency, and privacy.

FR-34 through FR-44 add a background observation path: detect noteworthy visual events, apply local rules and rate limits, and speak short uncertain prompts only when helpful. The path must respect user speech state, proactive-speech preferences, daily caps, sensitive OCR filtering, and false-positive feedback.

## Goals / Non-Goals

**Goals:**

- Add a proactive prompt service that evaluates live visual signals outside user-initiated dialogue turns.
- Keep at least 90% of proactive triggers local through TensorFlow.js-compatible object detection plus rules.
- Support prompt categories for left-behind items, unattended hazards, dangerous actions, useful events, optimizable operations, and reminders.
- Add prompt gating for confidence, de-duplication, session rate, daily cap, user enablement, and sensitive text filtering.
- Integrate proactive prompts with existing local voice commands and TTS so non-urgent prompts queue while the user speaks and urgent safety prompts can interrupt.
- Persist proactive reminder state in `localStorage` and expose a configurable daily cap.
- Accept user correction feedback and lower future false-positive likelihood for similar rules.

**Non-Goals:**

- Training production computer-vision models or guaranteeing detection for every possible object/action.
- Reading sensitive OCR strings aloud, storing raw OCR text, or sending proactive prompt frames to cloud services by default.
- Replacing user-initiated multimodal dialogue, long-term memory, or existing watch-only behavior.
- Building a full notification settings UI beyond the controls needed for proactive prompt enablement and daily cap.

## Decisions

1. Add a dedicated proactive prompt service beside multimodal dialogue.

   Introduce a service such as `ProactivePromptService` that accepts `{ frame, localVision, observationHistory, userSpeechState, promptSettings, now, language }` and returns either no prompt or a normalized prompt candidate. This keeps background observation independent from `MultimodalDialogueService`, while allowing both services to share local vision signals and TTS output.

   Alternative considered: fold proactive prompt routing into `MultimodalDialogueService`. That service is turn-oriented and transcript-driven, so mixing passive observation into it would make background prompts harder to test and rate-limit.

2. Extend local vision through a detector adapter rather than binding directly to TensorFlow.js throughout the app.

   Define a local detector interface for object, action/posture, and optional OCR signals, with an implementation backed by TensorFlow.js-compatible models. The existing `LocalVisionAnalyzer` can remain the dialogue-oriented analyzer, while proactive prompting uses a continuous detector result that includes labels, confidence, regions, track IDs or stable object keys, and OCR metadata.

   Alternative considered: import TensorFlow.js directly inside React hooks. That would speed up prototyping but couples model loading, inference, and UI lifecycle, and makes tests depend on browser/model runtime behavior.

3. Use a local rules engine with explicit trigger contracts.

   Represent each proactive rule with inputs, minimum confidence, cooldown key, severity, prompt template, and optional state transition logic. Examples include "phone left frame after being present", "stove flame visible while no person is nearby", "hand/finger near scissors", and "delivery person at door". The rules engine should emit uncertain, short prompts such as "似乎手机不在画面里了，可能需要留意一下。"

   Alternative considered: generate proactive prompts with a cloud model. That would be flexible, but conflicts with the cost and local-trigger requirements.

4. Gate every prompt through centralized policy before TTS.

   Add a `ProactivePromptPolicy` that enforces confidence greater than 90%, same-prompt cooldown of 30 seconds, average session rate no more than one prompt per minute, daily cap, proactive speech enablement, and user speech state. The policy should distinguish non-urgent prompts from urgent safety prompts so only urgent prompts may interrupt active speech or TTS.

   Alternative considered: put rate limits in each rule. Central gating avoids inconsistent behavior and makes prompt frequency testable.

5. Persist settings and counters locally.

   Store proactive speech enablement, reminder intensity, daily cap, daily count, and lightweight rule adjustment data in `localStorage`. Keep values small and non-sensitive. Voice commands "闭嘴，别主动说话" and "多提醒我" update the same settings path used by any UI controls.

   Alternative considered: persist in IndexedDB with long-term memory. Proactive prompt settings are simple local preferences and do not need the heavier encrypted memory store.

6. Add TTS queueing on top of the existing speech controller.

   Wrap or extend `SpeechResponseController` with prompt priority handling: user dialogue responses keep priority, non-urgent proactive prompts wait while the user is speaking, and urgent safety prompts can cancel or interrupt with a dedicated cancellation reason if supported by the type model. Prompt text is still synthesized by the same TTS provider selection and fallback path.

   Alternative considered: create a separate TTS path for proactive prompts. Sharing speech infrastructure keeps language, provider fallback, metrics, and cancellation behavior consistent.

7. Treat OCR-sensitive detections as suppression signals.

   If local OCR detects continuous digits or sensitive-looking strings in the candidate region, the prompt may mention the general situation but MUST NOT speak the detected string. Rules that depend on the actual string should be suppressed locally instead of sent to cloud.

   Alternative considered: mask digits in the spoken text. Suppression is safer for early implementation because it avoids accidental leakage from prompt templates.

8. Use correction feedback as threshold/rule penalty, not model retraining.

   When the user says "错了" after a proactive prompt, store feedback against the prompt/rule key and recent visual labels. Future evaluations can raise the effective threshold or suppress similar low-margin prompts. This provides immediate local adaptation without retraining TensorFlow.js models.

   Alternative considered: persist full false-positive frames for later training. That creates privacy and storage risk and is out of scope.

## Risks / Trade-offs

- Local detectors may miss or misclassify safety-relevant events -> start with conservative rule coverage, confidence gates, uncertainty wording, and visible tests for representative scenarios.
- Continuous TensorFlow.js inference can increase CPU and battery use -> run at a reduced cadence in watch-only mode, reuse sampled frames, and allow model initialization failure to disable proactive prompts without breaking dialogue.
- Prompt noise can annoy users -> central cooldowns, per-session rate limiting, daily caps, and voice commands provide hard controls.
- Urgent interruption can conflict with active dialogue -> restrict interruption to explicitly marked safety rules and record cancellation state.
- OCR filtering can suppress useful prompts near numbers -> prefer privacy for early implementation and only speak generic prompts when sensitive strings are present.
- `localStorage` can be cleared or unavailable -> fall back to conservative defaults with proactive prompts enabled only for the current session if persistence fails.

## Migration Plan

1. Add proactive prompt types, settings persistence, rate-limit policy, and unit tests without wiring camera/TTS yet.
2. Add detector adapter interfaces and a mock detector/rules engine so behavior can be tested without TensorFlow.js.
3. Add TensorFlow.js-compatible detector loading behind the adapter, with graceful failure if the model cannot load.
4. Wire the camera sampling/watch-only loop to run proactive evaluation at the configured cadence.
5. Extend local commands and UI state to update proactive prompt settings.
6. Route accepted prompts through the existing speech response path with queueing and urgent interruption behavior.
7. Add feedback handling for "错了" and privacy tests for OCR digit suppression.
8. Roll back by disabling proactive evaluation and leaving existing user-initiated dialogue, media capture, local commands, and TTS paths unchanged.

## Open Questions

- Which initial TensorFlow.js model package should be used for object detection in the prototype, and should it be bundled or lazy-loaded from local assets?
- What exact daily prompt cap default should ship for normal and "多提醒我" modes?
- Which prompt categories are considered urgent enough to interrupt, beyond unattended flame and immediate dangerous actions?
- Should delivery-person detection require a doorbell/entryway scene hint, or is visual detection alone acceptable for the first version?
