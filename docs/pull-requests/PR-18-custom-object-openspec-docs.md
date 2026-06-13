# PR-18: 补充本地自定义物体学习 OpenSpec 规格

## 功能描述

本 PR 为 FR-20 至 FR-26 补充 OpenSpec 规格，定义用户通过语音和框选现场教 AI 认识新物体、后续本地识别自定义名称、忘记/撤销教学、以及本地向量存储隐私边界的验收要求。

## 实现思路

- 新增 `local-custom-object-learning` capability spec，描述本地教学、向量持久化、本地优先识别、忘记/撤销和已学列表管理。
- 将云端调用边界写入规格，明确教学流程不调用云端视觉语言、云端 embedding 或云存储服务。
- 规格与前序 PR14-PR17 的代码拆分保持一致，便于评审按功能逐步验证。

## 测试方式

- 文档类 PR 无运行时代码变更。
- 检查 `openspec/specs/local-custom-object-learning/spec.md` 中每个 requirement 均有可测试 scenario。
- 与 PR14-PR17 代码功能对照，确认规格覆盖本地教学、识别、忘记、撤销和管理 UI。
