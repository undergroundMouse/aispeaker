# PR-32: 端云路由指标

## 标题

feat(web): 添加端云路由指标与会话统计（FR-56）

## 功能描述

跟踪每次对话 turn 的本地短路 vs 云端调用结果，并在 Operations Admin 面板展示相对 cloud-only 基线的云调用减少比例。

## 实现思路

- `web/src/ai/edgeCloudMetrics.ts`：基线 fixture 集与会话指标
- `web/src/ai/multimodalDialogue.ts`：`onCloudRoutingOutcome` 回调
- `web/src/hooks/useRealtimeVisionVoice.ts`：`edgeCloudMetrics` 状态

## 测试方式

```bash
cd web
npm test -- edgeCloudMetrics
npm run build
```

> **合并说明**：本 PR 基于 PR-31（`pr/31-operations-admin-budget`）。
