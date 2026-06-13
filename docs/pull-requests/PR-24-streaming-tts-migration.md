# PR-24: 实时多模态 Hook 架构与流式 TTS

## 标题

feat(web): 迁移至实时多模态 Hook 架构并接入流式 TTS 语音回应

## 功能描述

将 `web/` 从 EventBus 架构迁移为 `useRealtimeVisionVoice` 统一 Hook，整合摄像头/麦克风采集、端侧视觉、多模态对话、自定义物体学习与长期记忆，并新增**流式 TTS 语音回应**。用户完成语音对话后，系统按网络状态选择云端流式 TTS 或浏览器语音合成播报回答。

## 实现思路

- 以 Vite + React Hook 原型替换原 `web/src/core/*` 模块
- `SpeechResponseController` + `ttsProviders` 实现分段播报、取消与延迟指标
- `MultimodalDialogueService` 编排端侧/云端视觉与记忆上下文
- 保留 `visualEvidence.ts` 数据规范化（对话管线），预览高亮叠加层留待 PR-26
- 主动语音提示留待 PR-25

## 测试方式

```bash
cd web
npm install
npm test
npm run build
npm run dev
```

1. 访问 `https://localhost:5173/` 并授权摄像头/麦克风
2. 输入「你好」或英文问题，确认对话反馈与 TTS 状态
3. `npm test` 71 项通过，`npm run build` 成功
