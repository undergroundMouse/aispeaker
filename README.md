# AISpeaker

端云协同多模态 AI 助手原型：浏览器端负责音视频采集、端侧推理与主动提示；服务端控制平面负责云端视觉语言模型调用、预算治理与运营遥测。

## 仓库结构

| 路径 | 说明 |
|------|------|
| `app/` | 前端应用（Vite + React + TypeScript） |
| `server/` | 后端控制平面（Hono + JSON 持久化） |
| `shared/` | 前后端共享 API 契约（`@ai/shared`） |
| `openspec/` | OpenSpec 规格与变更记录 |

## 快速开始（评委复现）

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp server/.env.example server/.env
cp app/.env.example app/.env.local
```

在 `server/.env` 中填入 `QWEN_API_KEY`。**国内推荐**使用 [阿里云百炼 DashScope](https://help.aliyun.com/zh/model-studio/get-api-key)（OpenAI 兼容接口）；也可使用 WaveSpeed 等海外网关。未配置时云端走 mock，本地功能仍可演示。

#### 国内模型（阿里云百炼）

```env
QWEN_API_KEY=sk-你的百炼密钥
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-vl-plus
```

可选视觉模型：`qwen-vl-plus`、`qwen-vl-max`、`qwen3-vl-plus` 等，见[模型列表](https://help.aliyun.com/zh/model-studio/models)。

#### 海外模型（WaveSpeed）

```env
QWEN_API_KEY=你的 WaveSpeed 密钥
QWEN_BASE_URL=https://llm.wavespeed.ai/v1
QWEN_MODEL=qwen/qwen3-vl-8b-thinking
```

### 3. 启动后端与前端

```bash
# 终端 1
npm run dev:server

# 终端 2
npm run dev:app
```

浏览器访问 Vite 输出的地址（通常 `http://localhost:5173`）。

### 4. 演示要点

- **Assist 主界面**：摄像头预览、对话条、按住说话
- **设置**：隐私授权、记忆管理
- **运营台**：访问 `/admin` 查看 token 消耗与预算（需配置 backend URL）
- **调试面板**：开发模式下点击「展开调试面板」，使用语音转写模拟器

### 5. 测试

```bash
npm run test
```

## 开发规范

- 每个 PR 保持可构建、可运行
- 功能实现参考 `openspec/specs/` 与 `openspec/changes/`
