# PR-33: 物体识别不确定性提示

## 标题

feat(web): 添加物体识别不确定性约束与云端媒体隐私（FR-58）

## 功能描述

云端物体识别 prompt 附加“看不清楚”约束；不确定回答不展示视觉证据。对话服务在 ephemeral frame 生命周期内处理 turn，并按 media privacy 同意决定是否向云端发送帧。

## 实现思路

- `web/src/ai/objectRecognitionPrompt.ts`：不确定性约束与 prompt 构建
- `web/src/ai/cloudVisualLanguage.ts`：不确定回答规范化
- `web/src/ai/multimodalDialogue.ts`：`withEphemeralFrameAsync`、`stripMediaForCloud`、`mediaPrivacy`
- `web/src/types.ts`：`MultimodalDialogueRequest` 增加 `mediaPrivacy` / `conversationId`

## 测试方式

```bash
cd web
npm test -- objectRecognitionPrompt
npm run build
```

> **合并说明**：本 PR 基于 PR-32（`pr/32-edge-cloud-metrics`）。
