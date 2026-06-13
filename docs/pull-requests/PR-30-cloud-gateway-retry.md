# PR-30: 云端网关重试

## 标题

feat(web): 添加带重试与预算检查的 CloudGateway（FR-57）

## 功能描述

封装云端视觉语言调用：估算 token 成本、记录遥测、在网络/5xx 错误时最多重试 2 次，并在超出日预算时阻断请求。通过 `GatewayCloudVisualLanguageProvider` 接入 realtime hook。

## 实现思路

- `web/src/gateway/cloudGateway.ts`：`CloudGateway` 与 `GatewayCloudVisualLanguageProvider`
- `web/src/hooks/useRealtimeVisionVoice.ts`：用 gateway 包装 `MockCloudVisualLanguageProvider`

## 测试方式

```bash
cd web
npm test -- cloudGateway
npm run build
```

> **合并说明**：本 PR 基于 PR-29（`pr/29-cloud-token-estimation`）。
