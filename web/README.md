# AISpeaker Web

浏览器端多模态 AI 助手前端，本模块实现摄像头实时采集与视频帧 AI 输入管线。

## 开发

```bash
npm install
npm run dev
```

开发服务器使用 HTTPS（`@vitejs/plugin-basic-ssl`），访问 `https://localhost:5173/` 以使用摄像头 API。

## 架构

- `src/core/media/MediaStreamManager` — 摄像头 MediaStream 生命周期
- `src/core/media/FrameSampler` — 智能抽帧（对话 2fps / 空闲 0.5fps）
- `src/core/inference/LocalInferenceEngine` — 原始帧消费桩
- `src/core/cloud/CloudGateway` — 224×224 缩略图消费桩
- `src/components/CameraPreview` — 实时预览与错误处理 UI

## 隐私

视频帧仅通过内存事件总线传递，不写入 localStorage、IndexedDB 或远程存储。
