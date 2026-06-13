# PR-26: 视觉证据高亮

## 标题

feat(web): 实现视觉证据区域高亮与可解释回答

## 功能描述

当 AI 回答引用画面中的物体或区域时，在摄像头预览上叠加高亮框，并附带简短解释。云端无坐标时标记 `evidenceAvailable: false` 且不显示高亮。用户可说「为什么」追问上一轮视觉结论。

## 实现思路

- `visualEvidence.ts`：区域归一化、证据载荷预算（≤200B）、`finalizeVisualAnswer` 与追问回答
- `VisualEvidenceOverlay` 在预览上方渲染高亮区域
- `useRealtimeVisionVoice` 在对话完成后创建 `ActiveVisualEvidence` 并自动过期清除
- `MultimodalDialogueService` / `cloudVisualLanguage` 统一经过视觉证据规范化管线

## 测试方式

```bash
cd web
npm test -- visualEvidence visualEvidenceFlows cloudVisualLanguage multimodalDialogue
npm run dev
```

1. 发起视觉相关问题，确认预览上出现高亮框（有坐标时）
2. 勾选 Debug evidence 查看证据状态文案
3. 对上一轮回答说「为什么」，确认追问链路
4. 相关测试全部通过

> **合并说明**：本 PR 基于 PR-25，新增预览叠加层高亮与相关流程测试。
