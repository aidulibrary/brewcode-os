# Marvis 任务：BrewCode OS 整站全量验收与大神级修复

> 任务编号：marvis-site-acceptance-v1.0  
> 创建时间：2026-07-24  
> 执行者：Marvis  
> 验收标准：[site-acceptance-and-repair-standard-v1.0.md](./site-acceptance-and-repair-standard-v1.0.md)  
> 当前现场证据：用户截图显示线上 `brewcode.礼字号.中国` 首页仍为旧文案「诞生记」+ 旧个人叙事；白皮书按钮指向 GitHub 404 URL（`docs/BrewCode%20OS%20白皮书 · 序章.md`）。而 git HEAD 已修正为「诞生纪」与正确白皮书路径。根因：**Cloudflare Pages 未重新部署最新 main**。

---

## 一、任务目标

以全球一线全栈工程交付标准，对 BrewCode OS 全站（前端 4 子站 + 后端 Workers + GitHub 仓库 + Cloudflare 部署）进行深度验收、定级，并修复所有 P0/P1 缺陷，最终达到 **S 级交付**。

---

## 二、范围边界

### 2.1 必须验收的子系统
1. **Portal 首页** `packages/portal/index.html` / `portal.js` / `portal.css`
2. **Player** `packages/player/index.html` / `player.js` / `player.css`
3. **Repo 社区方案库** `packages/repo/index.html` / `repo.js` / `repo.css`
4. **Forge** `packages/forge/index.html` / `forge.js` / `forge.css`
5. **认证设备页** `packages/certifications/index.html` / `pricing.html`
6. **后端 Gateway** `workers/gateway/index.js` / `wrangler.toml`
7. **D1 数据库** `migrations/` 已执行状态
8. **GitHub 仓库** `.github/ISSUE_TEMPLATE/`、`README.md`、仓库根目录文档
9. **Cloudflare 部署** Pages + Workers + D1 + KV 绑定

### 2.2 不纳入本次（后续任务）
- 支付沙盒端到端真实扣款验证（仅做按钮加载 + plan ID 校验）
- 多语言新增（仅做 ZH/EN 一致性）
- 大版本功能新增（如用户系统、后台管理）

---

## 三、执行约束（硬性）

1. **先验收再修复**：每个问题必须有截图/cURL/控制台日志作为「现场证据」才能进入修复。
2. **只改必要文件**：禁止附带大段重构、格式化、无关注释。
3. **双语同步**：任何文案改动必须同时更新 `zh.json` / `en.json` / HTML 字面量 / i18n 字典。
4. **配置即代码**：D1/KV/Workers 绑定调整必须同步到 `wrangler.toml`；禁止只改 Dashboard 不写配置。
5. **部署即验证**：修复后必须触发线上部署并确认构建 hash 与 git HEAD 一致。
6. **不回退基调**：所有文案必须保持「去个人叙事、去宏大叙事、知识治理」基调。
7. **安全红线**：不提交 secrets、不暴露 D1/KV 真实内容、不收集未授权 PII。

---

## 四、任务清单（按优先级）

### P0 — 阻断性（必须全部闭环，否则评级 ≤ C）

#### P0.1 强制重新部署 Cloudflare Pages 并验证首页同步
- **现象**：线上仍显示「诞生记」、旧个人叙事、白皮书 404 链接。
- **根因假设**：Pages 未自动部署或部署失败。
- **操作**：
  1. 登录 Cloudflare Dashboard → Pages → brewcode-os → Deployments。
  2. 找到最新 commit `02df5d0` 或点击 **Retry deployment** / **Create deployment** 手动触发。
  3. 若 Dashboard 无重试入口，本地执行 `npx wrangler pages deploy packages/portal --project-name brewcode-os`（需确认 project name）。
  4. 部署完成后，访问 `https://brewcode.礼字号.中国`，截图确认：
     - Hero 区标题为「诞生纪」
     - 无「一粒种子落下来了/2026年/自由人/三台电脑」文案
     - 白皮书按钮链接路径含 `BrewCode%20OS%20%E2%80%94%20%E8%AF%9E%E7%94%9F%E7%BA%AA`（诞生纪子目录）且**无 `.md` 后缀**
- **验收**：线上 HTML 源码与 `git show HEAD:packages/portal/index.html` 在诞生纪/白皮书链接两处一致。
- **交付物**：部署截图、线上源码片段、对比结论。

#### P0.2 全站导航链接 404 扫描
- **范围**：portal 顶部导航、footer、Player/Repo/Forge 子站互跳、认证设备页返回首页。
- **工具**：Playwright 或自定义爬虫。
- **验收**：所有内链 HTTP 200；外链（GitHub/PayPal）HTTP 200/302（非 404）。
- **交付物**：链接清单 + 状态码表。

#### P0.3 GitHub Issue 模板可用性验证
- **URL**：`https://github.com/aidulibrary/brewcode-os/issues/new/choose`
- **验收**：三个模板选项可见，点击「BrewCode Compatible 认证申请」进入表单且字段完整。
- **交付物**：截图。

#### P0.4 后端 API 健康检查
- **端点**：
  - `GET https://api.礼字号.中国/api/health` 或 smoke 端点
  - `GET https://api.礼字号.中国/api/brew/stats`
  - `OPTIONS + POST https://api.礼字号.中国/api/brew/submit`
- **验收**：返回 200 + JSON；CORS 头正确；D1 查询无 500。
- **交付物**：cURL 输出。

### P1 — 明显缺陷（24h 内闭环，否则评级 ≤ B）

#### P1.1 社区方案分享图端到端验证
- **文件**：`packages/repo/repo.js`（已改内存转换）
- **操作**：
  1. 打开 Repo → 切到「社区方案」→ 点击任一方案 → 点击「分享卡片」。
  2. 确认弹窗出现、图片生成成功、可下载/右键保存。
  3. 同时验证「复制 JSON」「打开 Player」按钮。
- **验收**：分享图生成无 404/无「生成失败」弹窗；二维码可扫；Player 以该方案打开。
- **交付物**：生成成功的分享图截图、Player 打开截图。

#### P1.2 Player 匿名数据提交验证
- **文件**：`packages/player/player.js`、`workers/gateway/index.js`
- **操作**：
  1. 打开 Player → 加载任一方案 → 勾选「贡献匿名数据」→ 完成冲煮 → 点击提交。
  2. 确认提示「提交成功」。
  3. 到 D1 控制台执行 `SELECT * FROM brew_submissions ORDER BY id DESC LIMIT 5;` 确认入库。
- **验收**：开关默认关闭；勾选后提交成功；不勾选不提交。
- **交付物**：Player 提交成功截图、D1 查询结果。

#### P1.3 认证设备页 404 与支付按钮验证
- **文件**：`packages/certifications/index.html` / `pricing.html`
- **操作**：
  1. 访问「认证设备」→ 底部「提交认证申请」按钮 → 应到 GitHub Issue 选择页。
  2. 访问「Pricing」→ 确认 L2($15)/L3($40) PayPal 按钮 iframe 正常加载（沙盒环境可能显示 PayPal 测试界面）。
- **验收**：无 404；PayPal plan ID 与源码一致（L2: P-2GR681421K7125543NJQY2TA；L3: P-90E47668P0711963UNJQZ2TI）。
- **交付物**：按钮加载截图、链接地址。

#### P1.4 i18n 全站一致性扫描
- **文件**：`packages/common/i18n/zh.json`、`packages/common/i18n/en.json` 及各子站 i18n 字典。
- **操作**：
  1. 每页切换 ZH/EN，检查无 fallback 中文、无旧文案残留。
  2. 重点扫描：Hero 副标题、诞生纪标题、白皮书、Player/Repo/Forge 核心按钮。
- **验收**：EN 模式下所有 `data-i18n` 元素渲染英文。
- **交付物**：每页 ZH/EN 对比截图或断言脚本输出。

### P2 — 优化项（纳入报告，本次尽量完成）

#### P2.1 Lighthouse 性能 + 可访问性扫描
- **工具**：Lighthouse CLI 或 Chrome DevTools。
- **验收**：Performance ≥ 70、Accessibility ≥ 90、Best Practices ≥ 90。
- **交付物**：Lighthouse 报告（JSON/HTML）。

#### P2.2 死链扫描（README + 全站）
- **工具**：`lychee` 或 Python 爬虫。
- **验收**：README 与全站内链无 404；外链无 5xx。
- **交付物**：死链清单及修复结果。

#### P2.3 控制台 Warning/Error 清理
- **范围**：portal/player/repo/forge/certifications 首页及核心流程。
- **验收**：控制台无红色 error；yellow warning 需列出并评估是否修复。
- **交付物**：控制台日志截图 + 清理清单。

#### P2.4 SEO / Open Graph 补全
- **文件**：各子站 `index.html` `<head>`。
- **验收**：每页有唯一 `<title>`、`<meta name="description">`、OG 四标签（title/type/url/image）。
- **交付物**：`<head>` 审计表。

---

## 五、输出报告要求

完成全部任务后，在 `docs/marvis-site-acceptance-report.md` 中写入：

1. **执行摘要**：总耗时、修复提交数、最终评级。
2. **按维度评分表**：8D × 权重 × 得分 → 加权总分 → 评级。
3. **P0/P1/P2 逐项清单**：现象/根因/修复提交/验证证据/遗留风险。
4. **未解决问题**：如无法闭环，说明原因与下一步 owner。
5. **后续建议**：监控、自动化回归、CI 加固建议。

---

## 六、可参考文件

- 验收标准：`docs/site-acceptance-and-repair-standard-v1.0.md`
- 现场截图：用户提供的 `Clipboard_Screenshot.png`（白皮书 404）、`Clipboard_Screenshot-1.png`（首页旧文案）
- 关键源码：
  - `packages/portal/index.html`
  - `packages/portal/portal.js`
  - `packages/common/i18n/zh.json`、`packages/common/i18n/en.json`
  - `packages/repo/repo.js`
  - `packages/player/player.js`
  - `workers/gateway/index.js`
  - `wrangler.toml`、各 workers 子目录 `wrangler.toml`
- 历史记忆：`D:\brewcode-os\.workbuddy\memory\2026-07-24.md`

---

## 七、完成定义（Definition of Done）

- [ ] P0 四项全部通过，有截图/cURL 证据。
- [ ] P1 四项全部通过或明确记录无法闭环的原因。
- [ ] P2 四项报告输出，至少完成 Lighthouse 与死链扫描。
- [ ] `docs/marvis-site-acceptance-report.md` 已创建并提交到 `main`。
- [ ] 线上 `brewcode.礼字号.中国` 首页显示「诞生纪」且无旧个人叙事。
- [ ] 线上白皮书按钮点击后 200（非 404）。
- [ ] 最终评级达到 S 或 A；若为 B 及以下，必须列出降级原因。

---

*任务创建：WorkBuddy | 执行者：Marvis | 截止时间：建议 24h 内给出初版验收报告，48h 内闭环 P0+P1。*
