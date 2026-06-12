# PR-07: 语音对话输入

## 标题

feat(web): 实现语音对话输入（麦克风采集、按住说话、语音识别）

## 功能描述

在摄像头与抽帧能力之上，新增麦克风语音输入链路。用户可打开麦克风、按住说话完成一轮语音采集，并可选开启本地唤醒词监听。识别结果通过事件总线发布，驱动对话状态从 `listening` → `thinking`。

## 实现思路

- `VoiceInputManager` 通过 WebRTC `getUserMedia` 采集麦克风音频
- `BrowserSpeechRecognition` 适配器封装浏览器语音识别 API
- `BrowserWakeDetector` 适配器在支持时启用唤醒词监听
- 按住说话：`startPressToTalk` / `stopPressToTalk` 控制录音与识别
- 识别完成后发布 `voice:turn:submitted` 事件，并更新 `ConversationManager` 状态
- `Toolbar` 增加麦克风、唤醒、按住说话控件与最近识别文本展示

## 测试方式

```bash
cd web
npm install
npm run dev
```

1. 点击「打开麦克风」，授权后状态显示「就绪」
2. 按住「按住说话」说话，松开后工具栏显示最近识别文本
3. 对话状态应进入 `thinking`
4. 可选：点击「开启唤醒」，说出默认唤醒词后自动开始一轮对话
5. `npm run build` 构建成功
