# 构造语言工坊功能清单

本包拥有专业能力；宿主拥有正文、来源与作者决定。

| 动作 | 用途 | 必填参数 | 效果 |
| --- | --- | --- | --- |
| list_projects | 查找专业工程 |  | read |
| get_project | 读取固定专业工程 | object_id | read |
| save_project | 保存完整专业工程 | expected_revision, expected_sha256, operation_key, content | managed_write |
| get_source | 分块读取固定来源 | object_id, source_index | read |
| get_basis | 读取固定专业依据 | object_id, basis_index | read |
| compare_versions | 比较固定专业修订 | object_id, from_revision, to_revision | read |
| export_project | 分块导出完整专业数据 | object_id, format | read |
| build_context | 准备有界创作上下文 | object_id, goal, max_chars | read |
| create_handoff | 准备本工程AI接续 | object_id, goal | read |
| get_operation | 回读原操作 | operation_key | read |
| put_evidence | 维护固定引文 | object_id, expected_revision, expected_sha256, operation_key, evidence | managed_write |
| put_phoneme | 维护音位 | object_id, expected_revision, expected_sha256, operation_key, phoneme | managed_write |
| remove_phoneme | 移除音位 | object_id, expected_revision, expected_sha256, operation_key, phoneme_id | managed_write |
| put_lexeme | 维护词根词条 | object_id, expected_revision, expected_sha256, operation_key, lexeme | managed_write |
| remove_lexeme | 移除词根词条 | object_id, expected_revision, expected_sha256, operation_key, lexeme_id | managed_write |
| put_rule | 维护形态规则 | object_id, expected_revision, expected_sha256, operation_key, rule | managed_write |
| remove_rule | 移除形态规则 | object_id, expected_revision, expected_sha256, operation_key, rule_id | managed_write |
| put_derivation | 维护命名派生 | object_id, expected_revision, expected_sha256, operation_key, derivation | managed_write |
| remove_derivation | 移除命名派生 | object_id, expected_revision, expected_sha256, operation_key, derivation_id | managed_write |
| put_example | 维护逐词例句 | object_id, expected_revision, expected_sha256, operation_key, example | managed_write |
| remove_example | 移除逐词例句 | object_id, expected_revision, expected_sha256, operation_key, example_id | managed_write |
| put_note | 维护固定意见 | object_id, expected_revision, expected_sha256, operation_key, note | managed_write |
| remove_note | 移除固定意见 | object_id, expected_revision, expected_sha256, operation_key, note_id | managed_write |
| target_digest | 读取目标固定摘要 | object_id, target_kind, target_id | read |
| check_language | 检查专业关系与依据 | object_id | read |
| derive | 预览有限词形规则 | object_id, lexeme_id, rule_ids | read |
| example_basis | 核对逐词例句依据 | object_id, tokens | read |
| derivation_view | 回读固定命名派生 | object_id, derivation_id | read |
| record_derivation | 固定可复算命名派生 | object_id, expected_revision, expected_sha256, operation_key, lexeme_id, rule_ids, record_id, title, meaning | managed_write |
| export_reading | 导出专业阅读本 | object_id | read |
| export_review | 导出完整审核本 | object_id | read |

默认流程、边界及验收见 [docs](docs/README.md)。
