# PR-25: 主动语音提示

## 标题

feat(web): 实现端侧主动语音提示与语音控制

## 功能描述

在实时画面分析基础上，系统根据本地规则引擎与 Mock 检测器主动播报提醒（如久坐、使用手机等场景）。用户可通过语音指令关闭主动提示、提高提醒强度或纠正误报。非紧急提示在用户说话时排队，紧急提示可打断当前 TTS。

## 实现思路

- `proactivePrompts.ts`：规则引擎、观测历史、频控策略与 localStorage 持久化
- `MockProactiveLocalDetector` 提供可复现的开发期检测信号
- `SpeechResponseController.speakProactivePrompt` 实现排队与紧急打断
- `localCommands` 增加「闭嘴别主动说话」「多提醒我」「错了」等指令
- `useRealtimeVisionVoice` 在抽帧后异步评估规则并触发播报

## 测试方式

```bash
cd web
npm test -- proactivePrompts proactivePromptFlows localCommands speechResponseController App
npm run dev
```

1. 确认 Runtime State 中 Proactive prompts 为 on
2. 说出「闭嘴，别主动说话」，状态变为 off
3. 说出「多提醒我」，强度提升
4. 相关单元测试与流程测试通过

> **合并说明**：本 PR 基于 PR-24，仅新增主动语音提示相关模块与接线。
