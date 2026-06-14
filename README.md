# AISpeaker

端云协同的多模态 AI 视觉语音助手。浏览器负责摄像头/麦克风采集、端侧视觉推理、全双工语音交互与隐私治理；服务端控制平面负责 Qwen 云端模型调用、Qwen-Omni Realtime 会话代理、预算管控与运营遥测。

## 功能概览

| 能力 | 说明 |
|------|------|
| **实时视觉语音** | WebRTC 采集 + 帧采样，支持文字输入与按住说话 |
| **Hybrid Omni 对话** | 经后端代理接入 Qwen-Omni Realtime，原生语音进/出，支持 barge-in 打断 |
| **混合视觉编排** | 本地视觉世界模型 + Qwen-VL 云端校正，证据高亮与降级链 |
| **端云自适应路由** | 按网络、成本、置信度在 local / cloud / omni 路径间切换 |
| **本地记忆与学习** | 长期记忆、自定义物体识别与语音管理 |
| **隐私与成本治理** | 临时媒体生命周期、consent 校验、每日 token 预算 |
| **运营面板** | `/admin` 查看会话健康、Omni 指标、消耗与预算 |

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│  app/  (Vite + React)                                       │
│  Assist UI · 视觉分析 · 全双工语音 · Feature Flags          │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST / WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│  server/  (Hono)                                            │
│  视觉问答 · Omni Realtime 代理 · 会话状态 · 熔断与指标       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  阿里云百炼 DashScope                                        │
│  Qwen-VL · Qwen-Omni Realtime                               │
└─────────────────────────────────────────────────────────────┘

shared/  — 前后端共享类型与 API 路由 (@ai/shared)
openspec/ — 需求规格与变更记录 (OpenSpec)
```

**降级路径**：Hybrid Omni → Legacy Realtime Session → 按住说话（Push-to-Talk），任意层级失败均可回退。

## 环境要求

- Node.js 20+
- npm 10+（monorepo workspaces）
- 现代浏览器（Chrome / Edge 推荐，需摄像头与麦克风权限）
- （可选）阿里云百炼 API Key，用于云端视觉与 Omni Realtime

## 快速开始

### 1. 克隆与安装

```bash
git clone git@github.com:undergroundMouse/aispeaker.git
cd aispeaker
npm install
```

### 2. 配置环境变量

```bash
cp server/.env.example server/.env
cp app/.env.example app/.env.local
```

**`server/.env`（必填项用于完整云端演示）**

```env
QWEN_API_KEY=sk-你的百炼密钥
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-vl-plus

# Hybrid Omni Realtime（需账号开通 Omni WebSocket 权限）
QWEN_OMNI_REALTIME_MODEL=qwen3.5-omni-plus-realtime
QWEN_OMNI_REALTIME_BASE_URL=wss://dashscope.aliyuncs.com/api-ws/v1/realtime
```

API Key 获取：[阿里云百炼控制台](https://help.aliyun.com/zh/model-studio/get-api-key)

**`app/.env.local`（默认即可本地联调）**

```env
VITE_BACKEND_BASE_URL=http://localhost:3000
VITE_DEVICE_API_TOKEN=dev-device-token
VITE_ADMIN_API_TOKEN=dev-admin-token
VITE_CLOUD_AUTHORITY_MODE=server
```

> 密钥只放在 `server/.env`，不要写入 `app/.env.local`。

未配置 `QWEN_API_KEY` 时，云端走 mock，本地指令、按住说话、记忆等功能仍可演示。

### 3. 启动

```bash
# 终端 1 — 后端
npm run dev:server

# 终端 2 — 前端
npm run dev:app
```

浏览器打开 Vite 输出地址（通常 http://localhost:5173）。

### 4. 验证

```bash
npm run test
```

当前应 **258** 个测试全部通过（app + server）。

## 演示指南（评委复现）

### 基础演示（无需云端 Key）

1. 打开 Assist 主界面，允许摄像头/麦克风权限
2. 在对话栏输入 `switch to English` 验证本地指令
3. 点击 **按住说话** → 松开，查看 ASR 转写与回复
4. 点击 **我的记忆** 进入记忆管理页

### 完整演示（需配置 QWEN_API_KEY）

1. 启动 app + server，确认设置中 **Omni 会话** 状态为 `connected`
2. 按住说话进行 3–5 轮对话，尝试在 AI 说话时再次开口（barge-in）
3. 对着摄像头提问：「这是什么？」，观察视觉证据高亮
4. 访问 `/admin`，查看 token 消耗、Omni 时长与会话健康

### Hybrid Omni 开关

| 变量 | 作用 |
|------|------|
| `VITE_HYBRID_OMNI_DIALOGUE=true` | 启用 Qwen-Omni Realtime 混合对话（默认开启） |
| `VITE_HYBRID_OMNI_DIALOGUE=false` | 关闭 Omni，回退 legacy / PTT |
| `VITE_REALTIME_SESSION_MODE=true` | 启用 legacy WebSocket 会话管线 |
| `VITE_FULL_DUPLEX_ENABLED=true` | 启用全双工 ASR+TTS |
| `VITE_OMNI_VL_CORRECTION_MODE=ui-only` | 视觉校正仅更新 UI（默认） |

详细上线检查清单见 [`docs/HYBRID_OMNI_ROLLOUT.md`](docs/HYBRID_OMNI_ROLLOUT.md)，运维 Runbook 见 [`docs/RUNBOOK_REALTIME_SESSION.md`](docs/RUNBOOK_REALTIME_SESSION.md)。

## 仓库结构

| 路径 | 说明 |
|------|------|
| [`app/`](app/) | 前端：Assist UI、视觉/语音/编排、Feature Flags |
| [`server/`](server/) | 后端：Hono API、Omni 代理、预算与熔断 |
| [`shared/`](shared/) | 共享契约：`API_ROUTES`、会话协议类型 |
| [`openspec/`](openspec/) | OpenSpec 规格与归档变更 |
| [`docs/`](docs/) | 上线清单、Realtime 运维文档 |

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev:app` | 启动前端开发服务器 |
| `npm run dev:server` | 启动后端（读取 `server/.env`） |
| `npm run test` | 运行 app + server 全部单元测试 |
| `npm run build --workspace app` | 构建前端生产包 |
| `npm run build --workspace server` | 编译后端 TypeScript |

## API 概览

| 端点 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `POST /api/v1/cloud/visual-answer` | 云端视觉问答 |
| `GET /api/v1/realtime/session` | Legacy Realtime 会话 |
| `WS /api/v1/realtime/omni` | Qwen-Omni Realtime 代理 |
| `GET /api/v1/admin/session-health` | 会话健康与熔断状态 |
| `GET /api/v1/admin/daily-spend` | 当日 token 消耗 |

完整契约见 [`shared/API.md`](shared/API.md) 与 [`shared/src/index.ts`](shared/src/index.ts)。

## 开发与 PR 规范

- **一事一 PR**：每个 PR 只实现或修改单一功能，粒度尽量细
- **可运行**：每个 PR 合并后主分支保持可构建、可演示
- **规格驱动**：功能实现参考 `openspec/specs/`，变更提案见 `openspec/changes/`
- **PR 描述**应包含：标题、功能描述、实现思路、测试方式

## 海外模型（可选）

若使用 WaveSpeed 等海外网关，在 `server/.env` 中替换：

```env
QWEN_BASE_URL=https://llm.wavespeed.ai/v1
QWEN_MODEL=qwen/qwen3-vl-8b-thinking
```

Omni Realtime 国际节点：

```env
QWEN_OMNI_REALTIME_BASE_URL=wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime
```

## 许可证

Private — 仅供 aispeaker 项目评审与开发使用。
