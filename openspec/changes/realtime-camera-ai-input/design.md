## Context

aispeaker 是一个端云协同的多模态 AI 助手，架构设计（`架构设计.txt`、`模块设计.txt`）已定义 `MediaStreamManager` / `MediaPipeline` 负责音视频采集与智能抽帧，但代码库尚未实现任何摄像头相关逻辑。本变更是视觉交互链路的第一步：在浏览器端打通摄像头 → 帧采样 → AI 输入。

约束：
- 部署于浏览器，使用 Web 标准 API（`getUserMedia`、`<video>`、`<canvas>`）
- 遵循「端侧为主」原则：原始帧留在本地，仅缩略图上云
- 需用户明确授权，视频不持久化存储

## Goals / Non-Goals

**Goals:**

- 实现 `MediaStreamManager` 模块，管理摄像头 MediaStream 全生命周期
- 实现基于 `requestAnimationFrame` + 定时器的智能抽帧管线，支持对话/空闲双模式采样率
- 通过事件总线将帧分发给 `LocalInferenceEngine`（原始帧）和 `CloudGateway`（224×224 缩略图）
- 提供基础 UI：预览、开关、权限/设备错误处理
- 满足隐私要求：无持久化、可随时关闭

**Non-Goals:**

- 麦克风采集与 VAD（后续独立变更）
- 端侧模型加载与推理（LocalInferenceEngine 仅定义接收接口）
- 云端 `/vision/chat` 完整对接（仅保证缩略图可用）
- 可解释性渲染（ExplainabilityRenderer，依赖后续视觉问答结果）

## Decisions

### 1. 模块命名与位置：`MediaStreamManager`

**选择**：在 `src/core/media/MediaStreamManager.ts` 实现，作为微内核独立模块，通过事件总线通信。

**理由**：与架构文档 `MediaStreamManager` 命名一致；Core 层与 UI 解耦，便于 React/Vue 外壳替换。

**备选**：将采集逻辑直接写在 UI 组件内 —— 拒绝，违反微内核分层。

### 2. 摄像头访问：`navigator.mediaDevices.getUserMedia`

**选择**：使用 `{ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }` 仅请求视频。

**理由**：标准 API，HTTPS 下广泛支持；本变更不涉及音频。

**备选**：WebRTC RTCPeerConnection —— 过度复杂，无远端对等端需求。

### 3. 抽帧实现：隐藏 `<video>` + OffscreenCanvas / `<canvas>`

**选择**：
1. 将 MediaStream 绑定到隐藏 `<video autoplay playsinline muted>`
2. 用 `setInterval` 按目标 fps 从 video 元素 `drawImage` 到 canvas
3. `canvas.toBlob()` / `getImageData()` 产出帧数据

**理由**：简单可靠，不依赖额外库；canvas 缩放天然支持 224×224 缩略图生成。

**备选**：`ImageCapture.grabFrame()` —— 兼容性较差；MediaRecorder —— 面向录制而非逐帧。

### 4. 采样率策略：对话状态驱动

**选择**：`MediaStreamManager` 订阅 `ConversationManager` 的 `stateChanged` 事件：
- `idle` 且超过 10s → `0.5 fps`（interval 2000ms）
- `listening | thinking | speaking` → `2 fps`（interval 500ms）

**理由**：与需求文档和模块设计一致，显著降低空闲时 CPU/电量消耗。

### 5. 帧分发：发布-订阅事件总线

**选择**：定义事件：
- `media:frame:raw` — `{ frameId, timestamp, imageData, width, height }`
- `media:frame:thumbnail` — `{ frameId, timestamp, blob, width: 224, height: 224 }`
- `media:stream:state` — `{ status: 'inactive' | 'starting' | 'active' | 'error', error? }`

**理由**：与架构「事件总线通信」一致；消费者（LocalInferenceEngine、CloudGateway）松耦合注册。

### 6. 背压处理：保留最新帧

**选择**：每个消费者维护 `latestFrame` 指针；采样时覆盖而非排队。

**理由**：视觉 AI 场景下陈旧帧无价值；避免内存堆积。

### 7. UI 集成

**选择**：`CameraPreview` React 组件，读取 `media:stream:state` 渲染预览与错误态；工具栏提供开关按钮。

**理由**：最小可用 UI，满足 spec 中预览与错误提示要求。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 浏览器拒绝非 HTTPS 环境的 `getUserMedia` | 开发环境使用 `localhost`；生产强制 HTTPS |
| 高分辨率 canvas 抽帧 CPU 开销 | 缩略图在独立小 canvas 上绘制；空闲时降采样率 |
| 权限拒绝后无法自动重试（Safari） | UI 引导用户到浏览器设置手动开启 |
| 多标签页争抢摄像头 | 单例 Manager；检测到 `NotReadableError` 时提示关闭其他应用 |
| 帧时间戳与音频不同步 | 本变更仅视频；多模态对齐留待音频变更 |

## Migration Plan

1. 搭建前端工程骨架（若尚未存在）：Vite + TypeScript + React
2. 实现 `EventBus`、`MediaStreamManager`、帧采样器
3. 实现 `CameraPreview` UI 与开关
4. 为 `LocalInferenceEngine`、`CloudGateway` 添加帧订阅桩（stub handler，日志验证）
5. 手动测试：权限授予/拒绝、开关、采样率切换、帧事件触发

无生产迁移需求（绿field）。回滚：移除模块注册，UI 隐藏摄像头入口。

## Open Questions

- 是否支持用户切换前/后置摄像头？（移动端相关，首版可仅 `facingMode: 'user'`）
- 缩略图编码格式：JPEG quality 0.8 vs WebP？（建议 JPEG 以兼容 `/vision/chat` base64 上传）
- 前端框架最终选型是否确认为 React？（设计按 React 编写，可适配）
