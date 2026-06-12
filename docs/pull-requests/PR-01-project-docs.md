# PR-01: 添加项目需求与架构设计文档

## 标题

docs: 添加项目需求与架构设计文档

## 功能描述

本 PR 不包含可运行代码，为仓库建立需求、架构、模块、接口与数据表等设计基线，以及 OpenSpec 变更管理配置。后续功能 PR 均以此为参考。

## 实现思路

- 将已有中文设计文档纳入版本管理
- 添加 `openspec/config.yaml` 与 `realtime-camera-ai-input` 变更提案（proposal / design / specs / tasks）
- 添加根目录 `README.md` 说明仓库结构与开发规范

## 测试方式

1. 检查 `README.md` 与各 `.txt` 文档可正常阅读
2. 确认 `openspec/changes/realtime-camera-ai-input/` 下 artifact 完整
3. 本 PR 无构建步骤，合并不影响后续代码 PR
