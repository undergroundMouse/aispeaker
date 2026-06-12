# PR-05: 实现视频帧智能采样管线

## 标题

feat(web): 实现视频帧智能采样与预处理管线

## 功能描述

摄像头开启后，系统按对话状态从视频流中持续抽帧：对话进行中 2 fps，空闲 10 秒后降至 0.5 fps。每帧同时产出原始 `ImageData` 与 224×224 JPEG 缩略图，通过事件总线广播，供后续 AI 模块消费。

## 实现思路

- `FrameSampler`：隐藏 `<video>` + `<canvas>` 抽帧，`setInterval` 驱动采样
- `ConversationManager` 桩：发布 `conversation:stateChanged` 事件驱动采样率切换
- 背压策略：仅保留最新帧（`latestRaw` / `latestThumbnail`），不堆积队列
- 工具栏增加对话状态切换按钮与帧计数，便于调试

## 测试方式

```bash
cd web
npm install
npm run dev
```

1. 打开摄像头，观察「已采集帧」计数持续增长
2. 切换对话状态为 `listening` / `thinking` / `speaking`，帧增长约 2 帧/秒
3. 切回 `idle` 并等待 10 秒，帧增长降至约 0.5 帧/秒
4. 关闭摄像头后帧计数停止增长
