# PR-31: 运维预算管理

## 标题

feat(web): 添加运维管理面板与日预算上限（FR-54）

## 功能描述

提供受 token 保护的运维 API，用于查看 per-conversation 遥测、查询当日花费，并在 UI 中设置日预算上限（同步到 CloudGateway）。

## 实现思路

- `web/src/admin/operationsAdmin.ts`：内存运维 API
- `web/docs/OPERATIONS_ADMIN.md`：运维说明
- `web/src/hooks/useRealtimeVisionVoice.ts`：遥测刷新与 `setDailyBudgetCap`
- `web/src/App.tsx`：Operations Admin 面板

## 测试方式

```bash
cd web
npm test -- operationsAdmin
npm run build
```

> **合并说明**：本 PR 基于 PR-30（`pr/30-cloud-gateway-retry`）。
