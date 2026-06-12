# AISpeaker

端云协同多模态 AI 助手。浏览器端负责音视频采集、端侧推理与主动提示；云端负责 ASR、视觉大模型与 TTS。

## 仓库结构

| 路径 | 说明 |
|------|------|
| `web/` | 前端应用（Vite + React + TypeScript） |
| `openspec/` | OpenSpec 变更规划 |
| `*.txt` | 需求、架构、接口设计文档 |

## 快速开始

```bash
cd web
npm install
npm run dev
```

访问 `https://localhost:5173/`（HTTPS，摄像头 API 需要安全上下文）。

## 开发规范

- 每个 PR 只做一件事，保持粒度尽可能小
- PR 合并后 `main` 分支应始终可构建、可运行
- 功能实现参考 `openspec/changes/` 中的变更提案
