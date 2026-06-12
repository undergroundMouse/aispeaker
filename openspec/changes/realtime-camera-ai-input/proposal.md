## Why

多模态 AI 助手需要持续感知用户所处环境，但当前系统尚无摄像头采集与视频帧输入能力，无法支撑视觉理解、主动提示与可解释性问答等核心功能。实现设备端实时视频采集并将连续画面送入 AI 处理链路，是构建端云协同视觉交互的基础前提。

## What Changes

- 新增浏览器端摄像头访问模块：请求用户授权、打开/关闭摄像头、管理 MediaStream 生命周期
- 新增实时视频帧采集与采样策略：按对话状态智能抽帧（对话中 2 fps，空闲节能 0.5 fps）
- 新增视频帧预处理：缩放至 224×224 缩略图供云端推理，保留原始帧供本地推理引擎使用
- 新增视频帧分发：将连续画面输入本地推理引擎（LocalInferenceEngine）与云端视觉理解服务（`/vision/chat`）
- 新增摄像头状态 UI：预览画面、权限拒绝/设备不可用时的错误提示与重试
- 明确隐私约束：视频帧仅用于实时处理，不持久化存储，用户可随时关闭摄像头

## Capabilities

### New Capabilities

- `camera-capture`: 设备摄像头权限申请、MediaStream 获取与生命周期管理、预览渲染与错误恢复
- `video-ai-pipeline`: 连续视频帧采样、预处理、节能策略，以及向本地/云端 AI 推理链路的帧分发

### Modified Capabilities

（无——项目尚无既有 spec）

## Impact

- **端侧模块**：新增 `MediaStreamManager`（或 `MediaPipeline`）核心模块，对接 `LocalInferenceEngine`、`ConversationManager`、`CloudGateway`
- **浏览器 API**：`navigator.mediaDevices.getUserMedia`、`HTMLVideoElement`、`Canvas` 抽帧
- **云端接口**：`/vision/chat` 将接收来自视频管线的关键帧缩略图
- **依赖**：WebRTC 媒体 API；后续可接入 `@ricky0123/vad-web` 等（本变更聚焦视频，音频不在范围内）
- **非目标（本变更）**：麦克风采集、端侧模型推理实现、云端视觉模型对接细节
