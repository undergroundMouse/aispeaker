# Pull Request 提交指南

本仓库按「一事一 PR」拆分为多个增量 PR，**请按编号顺序合并**，确保每次合并后 `main` 可构建、可运行。

## 合并顺序

| 顺序 | 分支 | 合并后 main 状态 |
|------|------|------------------|
| 1 | `pr/01-project-docs` | 有设计文档，无代码 |
| 2 | `pr/02-web-scaffold` | `cd web && npm run dev` 可启动 HTTPS 默认页 |
| 3 | `pr/03-event-bus` | 同上（新增核心模块，UI 不变） |
| 4 | `pr/04-camera-capture` | 可打开摄像头并预览 |
| 5 | `pr/05-frame-sampling` | 可抽帧，工具栏显示帧计数 |
| 6 | `pr/06-ai-integration` | 摄像头 → 抽帧 → AI 桩模块接线 |
| 7 | `pr/07-voice-conversation-input` | 可打开麦克风、按住说话、语音识别 |
| 8 | `pr/08-local-voice-commands` | 端侧识别简单指令并本地触发动作 |
| 9 | `pr/09-network-fallback` | 弱网/离线时本地指令可用，复杂请求提示重试 |
| 10 | `pr/10-bilingual-i18n` | 中英文界面与语音切换语言 |
| 11–22 | `pr/11` … `pr/22-long-term-memory-ui` | 多模态契约、端侧视觉、自定义物体、长期记忆（EventBus 架构） |
| 23 | `pr/23-realtime-vision-voice-openspec` | OpenSpec 主规格与变更归档（主动提示、视觉证据、流式 TTS） |
| 24 | `pr/24-realtime-hook-migration` | Hook 架构迁移 + 流式 TTS + 主动提示 + 视觉证据高亮 |

## 推送到 GitHub

```bash
git remote add origin https://github.com/undergroundMouse/aispeaker.git
git push -u origin main
git push -u origin pr/01-project-docs pr/02-web-scaffold pr/03-event-bus pr/04-camera-capture pr/05-frame-sampling pr/06-ai-integration pr/07-voice-conversation-input pr/08-local-voice-commands pr/09-network-fallback pr/10-bilingual-i18n
```

## 在 GitHub 创建 PR

每个 PR 的 base 均为 `main`，详细描述见同目录 `PR-0X-*.md`。

PR-01 合并后，再创建 PR-02，以此类推（避免 diff 包含已合并提交）。

## 创建 PR 示例（需安装 [GitHub CLI](https://cli.github.com/)）

```bash
# PR-01
gh pr create --base main --head pr/01-project-docs \
  --title "docs: 添加项目需求与架构设计文档" \
  --body-file docs/pull-requests/PR-01-project-docs.md

# 合并 PR-01 后，更新本地 main 再创建 PR-02
git checkout main && git pull
gh pr create --base main --head pr/02-web-scaffold \
  --title "feat(web): 初始化 Vite + React + TypeScript 前端工程（HTTPS 开发服务器）" \
  --body-file docs/pull-requests/PR-02-web-scaffold.md
```
