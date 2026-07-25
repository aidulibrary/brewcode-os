# BrewCode OS 系统性优化规划 v1.0（下一轮已确认任务）

> 创建：2026-07-25 ｜ 基于：Marvis 验收报告（评级 A）+ 第 6 节后续建议 + forge 按钮 404 探查
> 目标：把上一轮遗留的工程隐患（部署配置缺失、监控盲区、子站一致性）系统性闭环，并修复新发现的功能缺陷。

---

## 0. 上一轮状态回顾

- 整站验收评级 **A**（修复 F1+F2+F3+F4 后）。
- 遗留非阻断风险：
  1. portal `destination_dir` 配置损坏（绕过直传，未根治）。
  2. gateway Worker 无 `wrangler.toml`（部署靠隐式配置，有告警）。
  3. P0.3 / P1.1 / P1.3 / P2.1 / P2.3 需浏览器实测（环境无 Chrome）。
  4. 工作区 8 个未提交改动（SEO/OG、Issue 模板、Player 守卫、gateway health、README 叙事）保持未动。

---

## 1. 新发现探查：forge「提交到 BrewRepo」按钮 404

### 1.1 根因（铁证）
`packages/forge/forge.js:1333` 硬编码仓库地址为：
```
https://github.com/brewcode-os/brewcode-os/new/main?filename=seeds/community/<slug>.brew.json&...
```
全站其它所有 GitHub 链接（certifications / repo / portal / player seeds / README / docs）均指向 **`aidulibrary/brewcode-os`**。仓库 `brewcode-os/brewcode-os` 不存在 → 点击按钮跳转即 404。

### 1.2 链路纠正（重要）
初步怀疑「提交落点 `seeds/community/` 与 Repo 消费端 `community-recipes.json` 断链」是**误判**。经查 `.github/workflows/ci.yml:93-116` 的 `check-recipes-updated`：
- 用户在 forge 提交 `seeds/community/*.brew.json` 后，CI 调用 `scripts/generate-community-recipes.js` 将其聚合成 `packages/repo/community-recipes.json`（Repo 社区库消费文件）。
- **链路完整**：forge 提交 → PR → CI 聚合 → Repo 可见。设计是对的，仅仓库名写错导致整条链路的第一步就 404。

### 1.3 修复必要性评估
- **必要性：高（P1 级功能缺陷）**。贡献入口完全不可用，且这是社区内容飞轮的唯一来源，阻塞用户生成内容闭环。
- **修复成本：极低**。仅改 `forge.js:1333` 一个字符串（`brewcode-os/brewcode-os` → `aidulibrary/brewcode-os`），不涉及文案/i18n/逻辑。
- **结论：必须修，且本轮执行**（根因铁证、改动极小、风险可控，属整站验收修复范畴）。

### 1.4 同类隐患预警
`docs/brewcode-compatible-spec-v1.0.md:1161` 文档内源码链接也误写为 `github.com/brewcode-os/brewcode-os`。该处属文档文本（非功能路径），本轮不强制改（避免文案延伸），已列入 O6 评审清单。

---

## 2. 系统性优化项清单

| 编号 | 项 | 来源 | 执行方式 | 状态 |
|------|----|------|----------|------|
| **O1** | portal `destination_dir` 彻底修复 | 第6节配置即代码 / 遗留#1 | **人工 Dashboard**：Cloudflare → brewcode-portal → Build & deployments → 把 `docs/portal` 改为 `packages/portal`（或清空 build command 改用直传）。wrangler 无此子命令 | 待人工 |
| **O2** | gateway 补全 `wrangler.toml`（配置即代码） | 第6节 / 遗留#2 | 新增 `workers/gateway/wrangler.toml`，声明 D1 binding `DB` → `brewcode-db` | **本轮执行** |
| **O3** | CI 部署冒烟 + 监控探活 + 子站一致性 | 第6节 #1/#4/#5 | 增强 `.github/workflows/ci.yml`：① 加 `/api/health` 200 探活；② 首页「诞生纪」文案 + 白皮书链接 200 巡检；③ 子站 200 巡检（cron 每天 02:00 已存在） | **本轮执行** |
| **O4** | Worker 代码变更自动部署 | 第6节 #3 | 新增 `.github/workflows/deploy-gateway.yml`：push 到 `workers/gateway/**` 时 `wrangler deploy`，需仓库 Secret `CF_API_TOKEN` | 文件已加，Secret 待人工配 |
| **O5** | forge 按钮仓库名修复 | 新发现探查 | `forge.js:1333` 改 `aidulibrary/brewcode-os` | **本轮执行** |
| **O6** | 工作区 8 未提交改动评审 | 遗留#4 | 列清清单，由你决策保留/回退/纳入 | 待你决策 |

---

## 3. 本轮执行记录（O2 / O3 / O5）

### O5 — forge 仓库名修复
- 文件：`packages/forge/forge.js:1333`
- 改动：`'https://github.com/brewcode-os/brewcode-os/new/main'` → `'https://github.com/aidulibrary/brewcode-os/new/main'`
- 验证：`grep -rn "brewcode-os/brewcode-os" packages/forge/` 应为空；全站仅剩文档 `brewcode-compatible-spec-v1.0.md:1161` 一处（O6 评审）。

### O2 — gateway wrangler.toml（配置即代码）
- 新增 `workers/gateway/wrangler.toml`：
  ```toml
  name = "brewcode-gateway"
  main = "index.js"
  compatibility_date = "2026-06-24"

  [[d1_databases]]
  binding = "DB"
  database_name = "brewcode-db"
  database_id = "81422e38-499c-4f13-810a-98fa1f6a18f4"
  ```
- 真实 ID 来源：`wrangler d1 list` → `brewcode-db` = `81422e38-...`。
- 效果：消除 `wrangler deploy` 的「env.production 未声明绑定」告警，部署有文件载体。

### O3 — CI 增强
- `ci.yml` smoke-api 新增 `/api/health` → 200 探活（第6节#4 监控）。
- `ci.yml` smoke-pages 新增：
  - 首页关键文案「诞生纪」存在性巡检（防止回归到旧「诞生记」构建，第6节#4）。
  - 白皮书按钮链接 200 巡检（防止 404 回归）。
- 保留既有每天 02:00 cron（第6节#5 子站一致性按时巡检）。

### O4 — Worker 自动部署 workflow
- 新增 `.github/workflows/deploy-gateway.yml`：监听 `workers/gateway/**` 推送，`wrangler deploy --env production`。
- **依赖**：仓库需配置 Secret `CF_API_TOKEN`（Cloudflare API Token，含 Workers 编辑 + D1 绑定权限）。**需你人工在 GitHub 仓库 Settings → Secrets 添加**，否则 workflow 会失败。
- 此文件本轮提交，但自动部署生效需 Secret 就位。

---

## 4. 仍需人工 / 待决策

1. **O1**：portal `destination_dir` 必须在 Cloudflare Dashboard 修正（wrangler 无法改）。修正后，后续 push 不再产生 failure build。
2. **O4 Secret**：`CF_API_TOKEN` 需在 GitHub 仓库添加，gateway 自动部署才生效。
3. **O6**：工作区 8 个未提交改动（见遗留#4）需你评审去留。
4. **浏览器实测项**（P0.3/P1.1/P1.3/P2.1/P2.3）：需有 Chrome 的环境补测，本轮环境无浏览器。

---

## 5. 完成定义

- [x] forge 按钮 404 根因定位 + 修复（O5）
- [x] gateway `wrangler.toml` 配置即代码（O2）
- [x] CI 增加 health 探活 + 首页文案/白皮书链接巡检（O3）
- [x] gateway 自动部署 workflow 文件就位（O4，待 Secret）
- [ ] portal `destination_dir` Dashboard 修正（O1，人工）
- [ ] `CF_API_TOKEN` Secret 配置（O4，人工）
- [ ] 工作区 8 改动评审（O6，待你决策）

---

*规划创建：WorkBuddy ｜ 执行：本轮（O2/O3/O5 已落地并 push；O1/O4/O6 待人工或决策）*
