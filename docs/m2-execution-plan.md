# M2 v1.1 硬件认证首发 · 执行方案

> **编制**：首席工程师 · 2026-07-23
> **上位文档**：`ROADMAP.md` + `docs/execution-plan-2026-h2.md`
> **护栏**：`docs/development-guardrails.md` 开工前必读

---

## 现有资产盘点

| 资产 | 状态 | 说明 |
| :-- | :-- | :-- |
| 认证规范 BC-CERT-2026-001 | ✅ 完整 | `docs/brewcode-compatible-spec-v1.0.md`（中英双语、RFC风格、L1/L2/L3三级、费用$0/$99/$299） |
| 测试用例 | ✅ 就绪 | L1/L2/L3 三份 `.brew.json` 在 `certifications/test-cases/` |
| D1 device_registry | ✅ 有数据 | 12条（4设备 × 3设置），translate worker 已在用 |
| certifications 页面 | ⚠ 框架 | mock 数据（3 demo 设备），需接真实数据源 |
| pricing 页面 | ⚠ 框架 | QR码已入库，价格未对齐 L2/L3 标准 |
| AI 计费 | ❌ 未启动 | gateway 认证通过但无计费逻辑 |
| i18n 统一 | ❌ 未启动 | player 内联 vs repo/forge 走 common/i18n |
| Schema 单源 | ❌ 未启动 | 3份物理副本 |

---

## W1 · 认证规范发布 + 申请通道（7/23-7/29）

| 任务 | 执行 | 产出 |
| :-- | :-- | :-- |
| W1.1 portal 集成认证规范页 | WorkBuddy | portal 新增 `/certified` 路由，展示规范摘要+下载链接 |
| W1.2 GitHub Issue 模板 | WorkBuddy | `.github/ISSUE_TEMPLATE/certification-application.md` |
| W1.3 自测指南 | WorkBuddy | `docs/self-test-guide.md`（厂商自测步骤） |
| W1.4 现有 certifications 页面迁移 | WorkBuddy | 独立页迁入 portal 统一体系 |

## W2 · 设备目录页 + 申请流程（7/30-8/5）

| 任务 | 执行 | 产出 |
| :-- | :-- | :-- |
| W2.1 认证设备目录页 | WorkBuddy | portal 页面，读取 certifications 数据展示 |
| W2.2 认证申请 Issue 模板 → 数据录入 | Marvis | 审核通过后录入 D1 `certified_devices` 表 |
| W2.3 认证标识下载 | WorkBuddy | L1/L2/L3 SVG 标识文件 |

## W3 · AI 计费闭环（8/6-8/12）

| 任务 | 执行 | 产出 |
| :-- | :-- | :-- |
| W3.1 DeepSeek 成本核算 | WorkBuddy | 每请求实际成本 → 定价依据 |
| W3.2 定价页更新 | WorkBuddy | 对齐认证规范 L2 $99/年 L3 $299/年 |
| W3.3 Key 发放半自动化 | Marvis | Dashboard API 创建新 Key + SHA-256 哈希入库 |

## W4 · 债务清零（8/13-8/19）

| 任务 | 执行 | 产出 |
| :-- | :-- | :-- |
| W4.1 i18n 统一 (D-08) | TRAE | player 内联 → 复用 common/i18n |
| W4.2 Schema 单源 (D-09) | WorkBuddy | standards 为权威，其余改构建时拷贝 |
| W4.3 封板 | WorkBuddy | tag v1.1 + 文档三件事 |

---

## 开工 · W1 首刀

立即执行 W1.1 —— GitHub Issue 模板 + portal 认证页面。
