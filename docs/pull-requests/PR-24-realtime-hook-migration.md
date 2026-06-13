# PR-24: 实时多模态 Hook 架构迁移与流式 TTS

## 标题

feat(web): 迁移至实时多模态 Hook 架构并接入流式 TTS 语音回应

## 功能描述

将前端从 EventBus + `ConversationManager` 架构迁移为 `useRealtimeVisionVoice` 统一 Hook，整合摄像头/麦克风采集、端侧视觉、多模态对话、自定义物体学习、长期记忆与**流式 TTS 语音回应**。用户完成一轮语音对话后，系统按网络状态选择云端流式 TTS 或浏览器 `speechSynthesis` 播报回答，并展示延迟指标。

## 实现思路

- 用 `app/` 原型实现替换 `web/`，保留 `cd web && npm run dev` 入口与 HTTPS 开发服务器（`@vitejs/plugin-basic-ssl`）
- `SpeechResponseController` + `ttsProviders` 管理多段播报、取消与延迟度量
- `MultimodalDialogueService` 编排端侧视觉、自定义物体、长期记忆与云端视觉语言模型
- `VideoFrameSampler` 与 `mediaCapture` 提供连续帧输入
- 新增 Vitest 测试套件（`npm test`）

## 测试方式

```bash
cd web
npm install
npm test
npm run build
npm run dev
```

1. 访问 `https://localhost:5173/`，授权摄像头与麦克风
2. 输入或模拟语音指令（如「你好」），确认对话反馈与 TTS 状态变化
3. 弱网时确认本地指令仍可用
4. `npm test` 全部通过，`npm run build` 成功
