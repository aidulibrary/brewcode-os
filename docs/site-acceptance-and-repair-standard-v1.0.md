# BrewCode OS 整站全量验收及修复标准 v1.0

> 适用范围：前端门户（portal/player/repo/forge/certifications）、后端 Workers（gateway/translate/generate/diagnose）、D1/KV/R2、GitHub 仓库与 Actions、Cloudflare 部署与体验。
> 目标评级：S（生产就绪 / 大神级交付）。

---

## 一、验收维度模型（8D）

| 维度 | 英文 | 权重 | 核心问题 |
|------|------|------|----------|
| D1 部署同步 | Deployment Sync | 20% | Git main 与线上构建是否逐字节一致？ |
| D2 功能正确性 | Functional Correctness | 20% | 每个按钮、链接、表单、API 是否按预期工作？ |
| D3 数据一致性 | Data Consistency | 15% | Schema 单源、i18n 单源、社区数据、认证数据是否一致？ |
| D4 体验与可访问性 | UX / A11y | 15% | 多端、多语言、键盘、屏幕阅读器、加载态、错误态是否优雅？ |
| D5 性能 | Performance | 10% | LCP ≤ 2.5s、TTFB ≤ 600ms、无阻塞渲染、资源压缩。 |
| D6 安全与隐私 | Security & Privacy | 10% | CORS、CSP、PII 收集、支付回调、API 鉴权、输入校验。 |
| D7 SEO 与可发现性 | SEO / Discoverability | 5% | 标题、meta、Open Graph、结构化数据、robots、sitemap。 |
| D8 代码与仓库健康 | Code & Repo Health | 5% | 无死代码、无冗余文件、gitignore 有效、CI 通过、文档与代码一致。 |

---

## 二、交付完成度评级（S/A/B/C/D/F）

| 评级 | 含义 | 判定标准 |
|------|------|----------|
| **S** | 大神级 / 生产标杆 | 8D 全部通过；零 P0/P1 遗留；有自动化回归覆盖；文档、监控、回滚方案齐全。 |
| **A** | 生产可用 | 全部 P0 通过，P1 ≤ 2 项可解释遗留；核心链路有手动验收清单。 |
| **B** | 基本可用但有明显瑕疵 | 存在 P1 功能/体验问题，不影响主流程但需修复。 |
| **C** | 勉强可用 | 存在 P0 问题已 workaround，或关键体验/性能未达标。 |
| **D** | 不可用 | 存在阻断性 P0 问题（如 404、支付失败、数据丢失风险）。 |
| **F** | 严重事故 | 安全漏洞、隐私泄露、资金损失、服务整体不可用。 |

### 评级加权算法

```
Score = Σ(维度通过分 × 权重)
维度通过分：1.0=全部通过，0.8=仅 minor，0.5=有 P1，0.0=有 P0
S ≥ 0.95；A ≥ 0.85；B ≥ 0.70；C ≥ 0.55；D ≥ 0.40；F < 0.40
```

---

## 三、P0/P1/P2 缺陷分级标准

| 级别 | 定义 | 修复时限 | 示例 |
|------|------|----------|------|
| **P0 阻断** | 核心功能不可用、数据错误、安全/隐私风险 | 立即 | 首页 404、支付按钮失效、白皮书链接 404、i18n 渲染错误导致文案回退到旧版 |
| **P1 明显缺陷** | 功能可用但体验受损、非主流程崩溃 | 24h | 分享图生成慢/失败、表单校验缺失、暗色模式闪烁、移动端排版错位 |
| **P2 优化项** | 不影响使用但降低专业度 | 下次迭代 | 缺少 aria-label、meta 描述不全、控制台 warning、未使用的 CSS |

---

## 四、大神级检修执行标准

### 4.1 修前必做
1. **可复现**：用截图/录屏/cURL/Playwright 脚本固定问题现场。
2. **根因定位**：区分「代码 bug」「部署未同步」「数据缺失」「配置丢失」「缓存/CDN 污染」。
3. **影响面评估**：一个改动会波及其他页面/子站/后端/第三方吗？
4. **回滚方案**：如果修复引发回归，如何 5 分钟内回滚？

### 4.2 修中约束
- **最小改动**：只改必要的文件，不附带格式化/重构。
- **对称修复**：改中文文案必须同步英文（i18n 字典 + HTML 字面量）。
- **配置即代码**：D1/KV/Pages 设置必须在 `wrangler.toml`/代码中有对应，禁止只改 Dashboard 不写配置。
- **验证优先于提交**：本地 `node --check`/浏览器验证/cURL 通过后再 commit。

### 4.3 修后必做
1. **回归验证**：修复点 + 相邻 2 个功能点必须重测。
2. **部署验证**：必须确认线上构建已刷新（时间戳、ETag、内容 hash）。
3. **证据归档**：截图/cURL 输出/控制台日志写入任务报告。
4. **文档同步**：README、白皮书、任务报告如有必要同步更新。

---

## 五、各子系统验收检查表

### 5.1 Portal 首页（packages/portal）
- [ ] 标题、Hero 副标题、诞生纪文案与 git HEAD 逐字一致
- [ ] 白皮书链接 200 且内容正确
- [ ] Player / Repo / Forge / 认证设备导航跳转正确
- [ ] 中/EN 切换后所有 `data-i18n` 元素渲染正确
- [ ] 无控制台报错、无 404 资源
- [ ] 移动端首屏无横向滚动、按钮可点击

### 5.2 Player（packages/player）
- [ ] `.brew` 文件上传/粘贴/URL 参数三种入口正常
- [ ] 冲煮步骤播放、暂停、重置正常
- [ ] 匿名数据提交开关默认关闭，勾选后提交成功
- [ ] 失败时显示友好错误（非裸 HTTP 状态码）

### 5.3 Repo 社区方案库（packages/repo）
- [ ] 种子方案与社区方案列表正常渲染
- [ ] 详情页打开、分享图生成、复制 JSON、打开 Player 全部可用
- [ ] 分享图清晰、信息完整、二维码可扫

### 5.4 Forge（packages/forge）
- [ ] 创建方案表单校验完整
- [ ] 生成/导出 `.brew` JSON 正确
- [ ] 分享卡片功能正常

### 5.5 认证设备（packages/certifications）
- [ ] 10 台设备卡片渲染正确
- [ ] 提交认证申请按钮指向 GitHub Issue 模板且模板三选项可见
- [ ] PayPal 订阅按钮 L2/L3 正常加载

### 5.6 后端 API（workers/gateway）
- [ ] `/api/health`、`/api/brew/submit`、`/api/brew/stats` 响应正常
- [ ] CORS 配置允许前端域名
- [ ] D1 绑定存在且查询正常
- [ ] KV 绑定存在（即使空值不抛错）

### 5.7 GitHub 仓库
- [ ] Issue 模板在 `/issues/new/choose` 可见
- [ ] README 无断链
- [ ] `.gitignore` 有效（无 `.wrangler` 缓存误提交）
- [ ] 无冗余/过期/概念冲突文档

### 5.8 部署与监控
- [ ] Cloudflare Pages 最新 commit hash 与 git HEAD 一致
- [ ] Workers 已部署且版本与代码一致
- [ ] 自定义域名 `brewcode.礼字号.中国` 解析正常

---

## 六、验收工具链

| 场景 | 工具/命令 |
|------|-----------|
| 部署同步 | `git ls-remote --heads origin` vs `git rev-parse HEAD`；线上查看构建 commit hash |
| 页面功能 | Playwright / Puppeteer 自动化点击 + 截图 |
| API | `curl -i -X POST/GET` + JSON 校验 |
| 性能 | Lighthouse CI、WebPageTest |
| 可访问性 | axe-core、Lighthouse a11y |
| 安全 | `wrangler tail`、HTTP Security Headers 检查 |
| 链接 | `lychee` 或自定义爬虫 |
| SEO | `curl` 检查 `<title>`/`<meta>`/OG tags |

---

## 七、验收报告模板

每个 Marvis 任务完成后必须输出：

```markdown
## 验收项：XXX
- 目标：...
- 现场证据：截图/cURL/URL
- 根因：...
- 修复提交：`<hash>`
- 修复后验证：截图/cURL/URL
- 遗留风险：...
- 评级：S/A/B/C/D/F
```

---

*版本：v1.0 | 创建：2026-07-24 | 适用分支：main*
