# PR-29: 云端 Token 估算

## 标题

feat(web): 添加云端请求 token 估算与对话遥测存储（FR-55 部分）

## 功能描述

为后续云端网关提供 token 成本估算与 per-conversation 遥测记录能力。本 PR 仅引入独立模块与类型，尚未接入 realtime hook。

## 实现思路

- `web/src/gateway/tokenEstimator.ts`：文本与图像 token 启发式估算
- `web/src/gateway/conversationTelemetry.ts`：内存遥测存储与成本换算
- `web/src/types.ts`：补充 `ConversationTelemetryRecord`、`CloudGatewayRequestContext`、`CloudGatewayResult`、`OperationsBudgetConfig` 等类型

## 测试方式

```bash
cd web
npm test -- tokenEstimator
npm run build
```

> **合并说明**：本 PR 基于 PR-28（`pr/28-memory-export`）。
