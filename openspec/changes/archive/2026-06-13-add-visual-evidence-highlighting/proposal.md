## Why

The real-time vision and voice system can answer image-related questions and already preserves optional region coordinates from cloud models, but it does not yet require or deliver visual evidence on the live video preview with a spoken explanation of why the AI reached its conclusion. Users asking follow-up questions such as "为什么你觉得这是苹果？" need to see highlighted evidence regions and hear concise reasoning, or receive an explicit uncertainty response when evidence is unavailable.

## What Changes

- Add a visual evidence requirement for image-related answers: when the AI answers a visual question, the system SHALL highlight the referenced region on the live video preview and speak a short explanation of the judgment basis.
- Support "why" follow-up questions (e.g., "为什么你觉得这是苹果？") by reusing or deriving evidence regions and speaking feature-based reasoning such as shape and color cues.
- Require cloud visual-language providers to return normalized region coordinates when available, plus explanation text generated in the same model response without an extra API call.
- Render evidence highlights on the client using a Canvas overlay aligned to the current video frame, synchronized with TTS via Web Speech API or an equivalent speech synthesis path.
- For key recognition results, provide both visual evidence (highlight boxes) and a short text or spoken explanation.
- When the cloud model cannot provide reliable coordinate evidence, respond with an uncertainty phrase such as "我不确定原因" instead of inventing a visual highlight.
- Keep highlight payload lightweight (under 200 bytes per frame) by sending normalized bounding boxes and reusing model-generated explanation text.

## Capabilities

### New Capabilities

### Modified Capabilities

- `realtime-vision-voice-ai-input`: Extend cloud visual-language, multimodal visual QA, and TTS requirements with visual evidence highlighting, spoken reasoning, uncertainty handling when coordinates are missing, and lightweight evidence metadata transport.

## Impact

- Affects the cloud visual-language provider contract, multimodal dialogue answer model, video preview UI, Canvas overlay rendering, TTS playback sequencing, and conversation memory for evidence reuse on follow-up "why" turns.
- Builds on existing `VisionRegion` and `VisualAnswer.regions` types, local vision candidate regions, and the current text-only explainability panel.
- Requires provider adapters to request and normalize region coordinates plus explanation text from GPT-4V-style backends when configured.
- Should not add significant bandwidth or extra model-call cost because coordinates are small and explanations are returned with the primary answer.
