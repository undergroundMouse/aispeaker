# PR-23: 实时多模态 OpenSpec 规格同步

## 标题

docs(openspec): 同步实时多模态、流式 TTS、主动提示与视觉证据规格

## 功能描述

将本地 OpenSpec 主规格与已归档变更同步到仓库，覆盖实时摄像头/麦克风输入、流式 TTS 语音回应、主动语音提示、视觉证据高亮等能力的需求定义与场景说明。合并后评委可对照 `openspec/specs/realtime-vision-voice-ai-input/spec.md` 与 `openspec/changes/archive/` 查阅完整需求，无需运行前端即可理解功能边界。

## 实现思路

- 新增主规格 `openspec/specs/realtime-vision-voice-ai-input/spec.md`，汇总 FR 级需求与场景
- 归档变更：`add-realtime-vision-voice-ai-input`、`add-streaming-tts-voice-response`、`add-proactive-voice-prompts`、`add-visual-evidence-highlighting`
- 不修改 `web/` 运行时代码，保证合并后 `cd web && npm run dev` 行为与 PR-22 一致

## 测试方式

```bash
# 确认规格文件存在
ls openspec/specs/realtime-vision-voice-ai-input/spec.md
ls openspec/changes/archive/

# 前端仍可运行（与 PR-22 相同）
cd web
npm install
npm run dev
```

1. 打开 `openspec/specs/realtime-vision-voice-ai-input/spec.md`，确认含主动提示与视觉证据相关 Requirement
2. 检查四个 archive 目录均含 `proposal.md`、`design.md`、`tasks.md`
3. `cd web && npm run build` 构建成功
