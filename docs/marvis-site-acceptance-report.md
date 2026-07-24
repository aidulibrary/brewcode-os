# BrewCode OS 整站全量验收报告（Marvis 执行 / 验收诊断版）

> 执行者：Marvis ｜ 验收标准：[site-acceptance-and-repair-standard-v1.0.md](./site-acceptance-and-repair-standard-v1.0.md)
> 执行时间：2026-07-24 ｜ 状态：**纯验收诊断完成（只读、零改动、零部署）**
> 范围：功能实现 / 体验 / 技术验收。未做任何代码或配置修改、未执行任何部署、未改动任何文案。
> 证据目录：`.workbuddy/evidence/`

---

## 0. 执行摘要

- **核心结论**：用户截图反映的「线上仍是旧构建」问题，根因经**二次线上核验**确认为 **`brewcode-portal` Cloudflare Pages 构建配置损坏**——其 `build_config.destination_dir` 被设为 `docs/portal`（仓库中不存在该目录），导致**每一次针对 main 的部署（含最新 commit `593a306`，即 HEAD）在 build 阶段 `failure`**。自定义域名 `brewcode.礼字号.中国` 因此一直服务"失败前的最后一次成功部署"，即旧「诞生记」+ 白皮书 404 链接。
- **线上双重确认（本次重新抓取）**：
  - 首页 HTML 中「诞生记」出现 **2 次**、「诞生纪」出现 **0 次** → 确为旧构建。
  - 白皮书按钮链接 `docs/BrewCode OS 白皮书 · 序章.md` → **HTTP 404**。
  - `GET /api/health` → **404**（响应体明示可用路由仅 `/api/diagnose,/api/generate,/api/translate`），而 `workers/gateway/index.js:17` 代码中**已存在** `/health` 路由 → 线上 `gateway` Worker 为**旧版本**。
- **三态不一致（D1 关键背景）**：线上（旧成功部署）≠ `git HEAD`（`593a306`，已含「诞生纪」）≠ 工作树（另有 8 个文件未提交改动，含 portal 13 行 OG 标签增补）。修复部署应以 `git HEAD` 为准，未提交改动不在本次范围。
- **当前评级**：**C**（被 P0.1 + P0.4 两个部署同步类 P0 阻断）。**修复后预测评级：A**（若 F1+F2 部署修复闭环）。
- **待授权操作**：① 修正 portal `destination_dir` 并重部署；② 重部署 gateway worker。两者均为部署/配置变更，按标准 4.2 与任务书约束须用户明确授权后方可执行。

---

## 1. 8D 评分表（当前态 → 修复后预测）

| 维度 | 权重 | 当前通过分 | 当前加权 | 修复后预测 | 说明 |
|------|------|-----------|---------|-----------|------|
| D1 部署同步 | 20% | **0.0** | 0.00 | 1.0 | portal 构建全失败；gateway 缺 `/health` → 线上为旧构建 |
| D2 功能正确性 | 20% | 0.8 | 0.16 | 0.95 | 导航/链接/播放器/分享/支付代码级可用；`/health` 监控端点缺失 |
| D3 数据一致性 | 15% | 0.8 | 0.12 | 0.95 | i18n 已在代码修正；`/api/brew/stats` D1 可读 |
| D4 体验与可访问性 | 15% | 0.8 | 0.12 | 0.90 | portal 旧内容影响观感，非功能崩溃；a11y 待浏览器复核 |
| D5 性能 | 10% | 0.8* | 0.08 | 0.85 | Lighthouse 无 Chrome 环境，待修复后跑（*暂估） |
| D6 安全与隐私 | 10% | 0.8 | 0.08 | 0.90 | CORS `*` 可接受；无 P0 安全项；未做真实扣款 |
| D7 SEO 与可发现性 | 5% | 0.8 | 0.04 | 0.95 | 6 页 OG 四标签齐全（已审计） |
| D8 代码与仓库健康 | 5% | 0.8 | 0.04 | 0.85 | gitignore 有效；存在未提交 SEO 改动（观测项） |
| **加权总分** | 100% | — | **0.64 (C)** | **≈0.93 (A)** | 当前被 D1 拉低 |

评级算法：S≥0.95 / A≥0.85 / B≥0.70 / C≥0.55 / D≥0.40。当前 0.64 → **C**；修复 D1 后约 0.93 → **A**。

---

## 2. P0 阻断项清单

### P0.1 强制重部署 Cloudflare Pages 并验证首页同步 —— **根因已铁证定位，修复待授权**

- **现象（线上，本次重新抓取 `p0.1-deploy/live_portal_refetch.html`）**：
  - 首页「**诞生记**」2 处、「**诞生纪**」0 处（git HEAD `packages/portal/index.html:306` 为「诞生纪」）。
  - 白皮书按钮链接 → **HTTP 404**（`p0.1-deploy/live_portal_refetch.html` 中 `href` + 直连 curl 验证）。
- **根因（铁证 `portal_project_config.json` / `portal_deployments.json`）**：
  - `brewcode-portal` 项目 `build_config.destination_dir = "docs/portal"`，而 portal 站点真实路径为 `packages/portal`，仓库**不存在 `docs/portal`**（`test -d docs/portal` → NOT EXISTS）。
  - 部署历史最新 5 次（含 `593a306`/`a6e8843`/`02df5d0`/`50a8965`/`f05d099） build 阶段**全部 `failure`**，deploy 阶段 idle。
  - 兄弟子站 `player/repo/forge/compatible.礼字号.中国` 本次 curl 均 **200 可达**（间接表明其 `destination_dir` 正确）。
- **影响面**：仅 portal 项目；其余子站不受影响（已最新/可达）。portal 目录自包含（仅引用本地 `portal.css/portal.js/data-report.js` + 外链字体 + 子域导航），直接部署无缺漏。
- **回滚方案**：Dashboard「Rollback」回退到最近一次成功部署（旧内容，安全无数据损失）；或撤销 `destination_dir` 变更。
- **验收（修复后，待授权执行）**：线上 HTML 含「诞生纪」且白皮书链接返回 200。
- **当前状态**：❌ 未修复（等待授权）。

### P0.2 全站导航链接 404 扫描 —— **实质通过（唯一 404 归并 P0.1）**

- **内链（线上 curl）**：`player/repo/forge/compatible.礼字号.中国` 全部 **200**；portal 顶部导航/footer/子站互跳在代码层（`packages/portal/index.html`）指向正确的子域根路径。
- **外链**：GitHub 仓库链接 `https://github.com/aidulibrary/brewcode-os` → **200**（README 扫描确认）。
- **结论**：修复 P0.1 后链接层面无 404。唯一真实 404（白皮书）已归并 P0.1。✅

### P0.3 GitHub Issue 模板可用性 —— **通过（配置级，最终视觉确认待授权浏览器）**

- `https://github.com/aidulibrary/brewcode-os/issues/new/choose` → **HTTP 302**（GitHub 对匿名访问跳转登录，页面/模板本身存在；用已登录会话访问即见三选项）。
- 本地 `.github/ISSUE_TEMPLATE/` 含三个模板：`bug_report.md`、`certification.md`（名称「BrewCode Compatible 认证申请 Certification Application」，字段 `title`/`labels:[certification]`/`about` 完整）、`recipe_contribution.md`；`config.yml` 启用 `blank_issues_enabled` 并配置 Discussions 联系链接。
- **遗留**：GitHub 选择页为 JS 渲染，静态抓取不含模板名；建议授权后用无头浏览器最终确认三选项可见（非阻断）。

### P0.4 后端 API 健康检查 —— **部分通过，1 项待修复（gateway 旧版本）**

- `GET /api/brew/stats` → **200** + JSON（D1 可读，`total:17`，产地/器具/烘焙统计正常；证据 `p0.4-api/stats_refetch.json`）✅
- `OPTIONS /api/brew/submit` 预检 → **204** + 正确 CORS 头（`Access-Control-Allow-Origin: *`、`Allow-Methods: GET,POST,OPTIONS`、`Allow-Headers: Authorization, Content-Type`；证据 `p0.4-api/submit_options_headers.txt`）✅
- `GET /api/health` → **404**，响应体 `"Not found. Available: /api/diagnose, /api/generate, /api/translate"`（证据 `p0.4-api/health_refetch.json`）。
  - **根因**：线上 `brewcode-gateway` Worker 为**旧版本**，未含代码中已存在的 `/health` 路由（`workers/gateway/index.js:17` 路由表、`index.js:20` PUBLIC_ROUTES 均含 `/health`）。
  - **修复（待授权）**：在 `workers/gateway/` 执行 `npx wrangler deploy`（部署当前代码，补齐 `/health`）。
  - **验证（待授权执行时做）**：重部署后 `GET /api/health` 应返回 200 + JSON。

---

## 3. P1 明显缺陷清单（代码级通过；E2E 视觉确认待授权浏览器）

### P1.1 社区方案分享图端到端 —— **代码级通过**
- `packages/repo/repo.js` 内联 html2canvas v1.4.1，`canvas.toDataURL()` **内存渲染**生成分享卡；先前 commit `02df5d0` 的 `.brew.json` fetch 404 已在代码中修复（社区方案直接由内存数据生成）。
- 「复制 JSON」「打开 Player」逻辑同在 repo.js。需授权后浏览器实测生成成功 + 二维码可扫（不真实扣款、不写库）。

### P1.2 Player 匿名数据提交 —— **代码级通过**
- `packages/player/index.html:262` `<input type="checkbox" id="optInCheckbox" />` **无 `checked` 属性 → 默认关闭** ✅
- `packages/player/player.js:500` `if (!optInCheckbox || !optInCheckbox.checked) return;`（未勾选不提交）；勾选后 `player.js:522` `fetch('https://api.礼字号.中国/api/brew/submit', …)`。逻辑正确 ✅
- 实写 D1 入库验证（P0.4 已确认 CORS + 路由可达）留待授权后执行。

### P1.3 认证设备页 404 与支付按钮 —— **通过**
- `packages/certifications/index.html:403` 「提交认证申请」按钮 → `https://github.com/aidulibrary/brewcode-os/issues/new/choose`（与 P0.3 一致）✅
- `packages/certifications/pricing.html:616 / :621` PayPal plan ID：`P-2GR681421K7125543NJQY2TA`(L2)、`P-90E47668P0711963UNJQZ2TI`(L3) 与任务书期望值**逐字一致** ✅
- PayPal iframe 沙盒加载属外部渲染，需授权后浏览器复核（仅加载验证，不真实扣款）。

---

## 4. P2 优化项清单

### P2.1 Lighthouse 性能 + 可访问性 —— **待修复后执行（环境无 Chrome）**
- 本环境 `lighthouse` / `chrome` 不可用，无法跑分。线上 portal 当前为旧构建，跑分无参考意义；建议在 P0.1 修复后运行（目标 Performance≥70 / A11y≥90 / BP≥90）。**状态：待授权后浏览器环境执行。**

### P2.2 死链扫描（README + 全站）—— **基本通过，1 处软 404**
- README 外链（Python 扫描 `p2.2-lychee/README_scan.txt` + curl 复核 `idn_readme_links.txt`）：`brewcode/player/repo/forge.礼字号.中国` → **200**；`api.礼字号.中国` 根路径 → **404**（API 无根路由，预期内软 404，非真死链）；GitHub 仓库 → **200**。
- **建议（F3 可选）**：将 README 中 API 链接改为具体端点（如 `https://api.礼字号.中国/api/brew/stats`）避免误导。属 P2，可后续处理。

### P2.3 控制台 Warning/Error 清理 —— **待修复后浏览器复核**
- 需授权后用 Playwright 跑核心流程抓控制台（环境无浏览器）。**状态：待执行。** 代码层未发现裸 `console.error` 抛异常路径；具体 warning 清单待浏览器采集。

### P2.4 SEO / Open Graph 技术标签补全 —— **通过（技术标签审计）**
- 6 页（`portal`/`player`/`repo`/`forge`/`certifications`/`pricing`）均具备唯一 `<title>`、`<meta name="description">` 及 `og:title`/`og:type`/`og:url`/`og:image` 四标签（head 审计：每页 `og:` 标签数 = 5，含全部必需四项）。仅检查技术标签，未改动任何文案。

---

## 5. 未解决问题 / 观测项

1. **portal `destination_dir` 损坏起源**：未知是哪次操作将其设为 `docs/portal`。修复后建议核查是否有自动化/历史提交误写，避免复发。
2. **工作树未提交改动（8 文件）**：含 `packages/portal/index.html` 13 行 OG 标签增补等。按"只读不动"原则**未触碰**；它们不在 git main 中，git 构建重部署不会包含。建议后续单独评审提交，不在本次 P0.1 范围。
3. **其余 4 子站部署 commit 一致性**：本次环境**无 Cloudflare API token**，无法直查 `brewcode-player/-repo/-forge/-compatible` 的部署 commit 与 `destination_dir`；仅确认 4 子站均 200 可达。建议在授权后凭 Dashboard / CF API 复核其是否确为 `593a306` 成功部署（避免隐藏的同步问题）。
4. **需授权浏览器的验收项**：P0.3 三选项视觉确认、P1.1 分享图实测、P1.3 PayPal 加载、P2.1 Lighthouse、P2.3 控制台——均列为"待授权后复核"，不影响 P0 闭环判定。

---

## 6. 后续建议

1. **CI 加固**：为 5 个 Pages 项目增加部署后冒烟校验（curl 首页关键文案 + 关键链接），部署 Failure 时告警，防止再次出现"全失败但无感知"。
2. **配置即代码**：Pages 构建配置当前无文件载体，建议以文档/脚本固化 `destination_dir` 约定，或在 `wrangler.toml` 增加注释说明，避免误配。
3. **Worker 部署同步**：gateway worker 与代码不同步（缺 `/health`），建议接入 CI 在 gateway 代码变更时自动 `wrangler deploy`。
4. **监控**：对 `/api/health` 做外部探活；对首页「诞生纪」文案做内容一致性巡检。
5. **子站一致性巡检**：在 F3 之外，增加对所有子站部署 commit 与 git HEAD 的定时比对。

---

## 7. 待授权执行项（修复方案）

> 以下均为**部署与配置变更**，依据任务书约束与标准 4.2，须获得你明确授权后方可执行。当前验收阶段已严格"只读不动"。

| 项 | 操作 | 风险 | 回滚 |
|----|------|------|------|
| **F1 (P0.1)** | 修正 `brewcode-portal` `build_config.destination_dir` → `packages/portal`，并触发 Production 重部署（commit `593a306`） | 低（自包含目录） | Dashboard Rollback 到旧成功部署 |
| **F2 (P0.4)** | `cd workers/gateway && npx wrangler deploy`（部署含 `/health` 的当前代码） | 低（仅补齐路由） | 重新部署上一版本 |
| **F3 (P2.2 可选)** | README 中 API 链接改为具体端点 | 极低 | git revert |
| **F4 (验证项)** | 授权后凭 Dashboard/CF API 复核 `player/repo/forge/compatible` 部署 commit 是否 = `593a306` | 极低 | — |

**请你确认是否授权执行 F1 + F2（及可选 F3/F4）。** 一经授权，我将进入修复阶段并执行对应部署验证（届时另产出修复提交与部署后复测证据）。

---

*报告生成：Marvis ｜ 验收性质：只读诊断，零代码改动、零部署 ｜ 证据目录：`.workbuddy/evidence/`*
