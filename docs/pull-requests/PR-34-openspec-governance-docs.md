# PR-34: 隐私成本云端治理 OpenSpec 规格同步

## 标题

docs(openspec): 同步隐私、成本与云端治理规格（FR-52 至 FR-58）

## 功能描述

将 `add-privacy-cost-cloud-governance` 变更合并入主规格并归档，覆盖 FR-52 至 FR-58：临时媒体隐私、个性化记忆导出与云端访问限制、云端网关 token 估算与重试、运营后台成本可见性与日预算、端云 70% 调用减少目标，以及物体识别不确定性约束（"看不清楚"）。本 PR 仅更新 OpenSpec 文档，不修改 `web/` 运行时代码。

## 实现思路

- 新增主规格 `openspec/specs/ephemeral-media-privacy/spec.md`（FR-52 显式授权、内存临时处理、隐私设置）
- 新增主规格 `openspec/specs/cloud-gateway-cost-governance/spec.md`（FR-54/55/57 token 估算、重试、运营后台、日预算）
- 更新 `local-long-term-memory`：增加记忆导出需求，收紧云端访问授权
- 更新 `local-custom-object-learning`：增加物体导出需求，对齐云端访问限制
- 更新 `realtime-vision-voice-ai-input`：物体识别不确定性、70% 端云减少、网关重试集成
- 归档变更至 `openspec/changes/archive/2026-06-13-add-privacy-cost-cloud-governance/`

## 测试方式

```bash
# 确认新增与更新规格存在
ls openspec/specs/ephemeral-media-privacy/spec.md
ls openspec/specs/cloud-gateway-cost-governance/spec.md
ls openspec/changes/archive/2026-06-13-add-privacy-cost-cloud-governance/

# 前端行为与 PR-33 一致
cd web
npm run build
```

1. 打开各主规格文件，确认每个 Requirement 均有可测试 Scenario
2. 对照 PR-27 至 PR-33 代码实现，确认 FR-52 至 FR-58 需求覆盖完整
3. 检查 archive 目录含 `proposal.md`、`design.md`、`tasks.md` 及 delta specs

> **合并说明**：本 PR 基于 PR-33（`pr/33-object-uncertainty-prompt`），为文档同步 PR。
