## Context

The app already has a React/Vite real-time vision and voice prototype with camera preview, multimodal dialogue orchestration, local and cloud visual answers, `VisionRegion` types, `VisualAnswer.regions`, conversation memory, and TTS playback through `SpeechResponseController`. The main spec already preserves optional cloud explainability regions, and the UI currently lists region coordinates in a debug panel while only drawing a manual selection box for custom object teaching.

FR-45 through FR-51 extend this into a user-facing explainability flow: when the AI answers an image-related question, the referenced region must be highlighted on the live preview and the user must hear a short reason. If the model cannot provide coordinates, the system must say it is uncertain rather than fabricating evidence. Evidence metadata must stay small and must not require a second model call.

## Goals / Non-Goals

**Goals:**

- Render evidence highlight boxes on the live video preview for image-related answers when regions are available.
- Speak concise judgment reasoning through the existing TTS path when explanation text is available.
- Support "why" follow-up turns by reusing recent evidence regions and speaking feature-based reasoning.
- Extend cloud provider normalization to request and preserve region coordinates plus explanation text in one response.
- Fall back to an explicit uncertainty phrase and no highlights when coordinate evidence is unavailable.
- Keep evidence payloads under 200 bytes per frame and avoid extra cloud calls for reasoning.

**Non-Goals:**

- Guarantee pixel-perfect bounding boxes or production-grade grounding from every provider.
- Replacing local vision, proactive prompts, custom object teaching, or long-term memory flows.
- Adding a separate reasoning-only cloud endpoint or second-pass VLM call by default.
- Persisting highlight overlays across sessions or exporting annotated video recordings.

## Decisions

1. Extend `VisualAnswer` with optional explanation metadata instead of overloading `answer` text.

   Add fields such as `explanation?: string` and `evidenceAvailable: boolean` while keeping `regions: VisionRegion[]`. The spoken output can combine the primary answer and explanation when appropriate, but "why" follow-ups can prefer `explanation` directly. This keeps provider adapters explicit about whether visual evidence exists.

   Alternative considered: embed reasoning only inside `answer`. That makes it harder to distinguish uncertainty responses, reuse evidence on follow-ups, and test highlight behavior separately from spoken content.

2. Add a dedicated evidence overlay component on top of the video preview.

   Introduce a component such as `VisualEvidenceOverlay` that owns a Canvas element sized to the preview container and draws normalized bounding boxes from `VisualAnswer.regions`. Reuse the same normalized coordinate model already used for custom object region selection. Clear overlays when evidence expires, the user starts a new unrelated turn, or no regions are available.

   Alternative considered: continue using absolutely positioned DOM divs like the teaching selection box. Canvas is better for multiple transient regions, stroke styles, labels, and future fade animations without polluting the video DOM tree.

3. Centralize evidence lifecycle in the realtime vision hook.

   Extend `useRealtimeVisionVoice` to track `activeVisualEvidence` derived from `lastVisualAnswer`, including regions, explanation, frame reference or timestamp, and expiry rules. The hook exposes this to both the overlay and TTS sequencing so highlights appear when the explanation is spoken and disappear on timeout or interruption.

   Alternative considered: render highlights directly inside `App.tsx` from `lastVisualAnswer`. That works for a prototype but couples overlay timing, TTS cancellation, and follow-up reuse to view code.

4. Reuse conversation memory for "why" follow-ups before issuing new cloud calls.

   When the transcript matches a configured why-follow-up pattern, resolve the referenced recent object, scene, or answer from `ConversationMemoryState` and reuse stored `region` plus `explanation` if still valid. Only call cloud processing again when memory lacks evidence or the user asks about a different entity.

   Alternative considered: always re-query the cloud model on "why" questions. That adds latency, cost, and risks inconsistent coordinates for the same frame.

5. Extend cloud provider adapters to request structured evidence in one response.

   Update the `CloudVisualLanguageProvider` contract so adapters for GPT-4V-style backends ask for normalized region coordinates and a short explanation in the same completion. Normalize provider-specific region formats into `VisionRegion[]`. If the adapter cannot extract coordinates, set `evidenceAvailable: false`, clear `regions`, and populate an uncertainty answer such as "我不确定原因".

   Alternative considered: add a second "explain regions" tool call after the answer. That violates FR-51's no-extra-call requirement and increases latency.

6. Use local vision regions as evidence for local and custom-object answers.

   When local object detection, scene classification, or custom object memory already returns a `region`, treat it as first-class evidence and generate a short local explanation template from label and confidence cues. This gives explainability for the local-first path without cloud cost.

   Alternative considered: only highlight cloud answers. That would leave most offline or local answers without visual evidence despite available detector regions.

7. Speak explanation through the existing `SpeechResponseController`.

   Queue TTS using the same provider selection, streaming, interruption, and language handling already used for dialogue answers. For answers with evidence, prefer speaking the explanation immediately after or as part of the primary answer segment so the user hears the reason while seeing the highlight.

   Alternative considered: use Web Audio directly for explanation playback. Web Speech API / existing TTS infrastructure already satisfies FR-48 and keeps behavior consistent with the rest of the app.

8. Enforce lightweight evidence serialization at the type boundary.

   Keep `VisionRegion` normalized to 0-1 floats with optional `label`, cap the number of regions per answer, and avoid embedding frame bitmaps in evidence payloads. This keeps per-frame evidence under 200 bytes and suitable for memory storage and provider normalization.

   Alternative considered: send polygon masks or saliency maps. That would exceed the bandwidth budget and is unnecessary for the prototype explainability UX.

## Risks / Trade-offs

- Cloud providers may return inconsistent or missing region formats -> normalize aggressively, mark `evidenceAvailable: false` when parsing fails, and test adapter fixtures per provider.
- Canvas overlay alignment can drift if preview aspect ratio changes -> size the canvas from the rendered video container on resize and use normalized coordinates only.
- Speaking both answer and explanation may increase TTS duration -> keep explanations short, allow streaming TTS, and preserve interruption on new dialogue turns.
- Reused memory evidence may reference a stale frame -> bind evidence to frame timestamp and expire highlights after a short TTL or when the scene changes significantly.
- Local template explanations may sound generic -> acceptable for local-first path; cloud path should still return model-generated reasoning when available.

## Migration Plan

1. Extend shared types and provider contracts with explanation and evidence availability fields.
2. Update local and cloud answer builders to populate regions, explanation, and uncertainty fallbacks.
3. Add Canvas overlay rendering and hook state for active visual evidence.
4. Wire TTS to spoken explanations and add why-follow-up handling in dialogue orchestration.
5. Replace the text-only explainability debug panel with overlay-driven evidence display while keeping debug coordinates optional for development.
6. Add unit tests for provider normalization, uncertainty fallback, why-follow-up reuse, payload size limits, and overlay state transitions.

Rollback: hide the overlay component and continue returning text-only answers using existing `VisualAnswer.answer` if evidence rendering or provider changes cause regressions.

## Open Questions

- Should the primary object-name answer and the explanation be spoken as one utterance or two sequential utterances?
- What evidence TTL is acceptable before highlights are cleared while the user keeps looking at the same scene?
- Which cloud provider adapter should be implemented first for real region output beyond the current mock provider?
