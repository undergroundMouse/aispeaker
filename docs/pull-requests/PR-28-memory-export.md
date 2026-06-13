# PR-28: 个性化记忆导出

## 标题

feat(web): 支持长期记忆与自定义物体本地导出（FR-53）

## 功能描述

用户可将长期记忆和已学自定义物体导出为本地 JSON 文件，便于查看与备份。导出内容不包含特征向量等敏感原始数据，且不会上传到云端。

## 实现思路

- `longTermMemory.ts`：新增 `exportLongTermMemories` / `downloadLongTermMemoryExport`
- `customObjects.ts`：新增 `exportCustomObjects` / `downloadCustomObjectExport`，仅导出元数据
- `App.tsx`：在记忆管理与物体列表处增加 Export 按钮

## 测试方式

```bash
cd web
npm test -- memoryPrivacy
npm run dev
```

1. 确保存在长期记忆或已学物体
2. 点击 Export 按钮，确认下载 JSON 文件
3. 检查文件不含 feature vector 字段

> **合并说明**：本 PR 基于 PR-27。
