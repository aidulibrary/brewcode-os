# M4 W3 报告页调试 · 完成报告

> **执行者**：Marvis  
> **发起**：WorkBuddy · 2026-07-24 11:42  
> **完成**：2026-07-24 12:15  
> **关联 Commit**：`7a96880`

---

## 1. 问题诊断

### 1.1 症状

| 检查项 | 状态 |
|--------|------|
| `curl https://api.礼字号.中国/api/brew/stats` | ✅ 返回 17 条聚合数据 |
| `https://brewcode.礼字号.中国/data-report.html` | ❌ SPA 首页接管，从未加载报告页 |

### 1.2 排查路径

```
浏览器访问 /data-report.html
  → 返回页面标题 "BrewCode OS · 礼字号"（SPA 首页标题）
  → 非预期 "BrewCode OS · 全球冲煮数据报告"
  → 排除 CORS / 404 / API 故障
```

### 1.3 根因

| 层级 | 发现 |
|------|------|
| **直接原因** | `brewcode.礼字号.中国` 的 Cloudflare Pages 开启了 SPA 模式，所有路径回退到 `index.html`，`data-report.html` 从未被送达 |
| **部署层面** | `wrangler pages deployment list` 显示近 25 次 Git 自动构建全部 **Failure**，站点停留在初始部署版本 |

---

## 2. 修复措施

### 2.1 新增文件

| 文件 | 用途 |
|------|------|
| `packages/portal/_redirects` | Cloudflare Pages 路由豁免：`/data-report.html` 直通静态文件 |
| `_redirects`（根目录） | 覆盖 Pages 可能从根部署的场景 |
| `packages/portal/data-report.js` | SPA 内嵌路由模块：命中 `/data-report.html` 时接管整页渲染（CSS + HTML + Chart.js 动态加载 + API fetch） |

### 2.2 修改文件

| 文件 | 修改 |
|------|------|
| `packages/portal/index.html` | `<body>` 开头新增 `<script src="data-report.js">`，确保在 `portal.js` 之前执行 |

### 2.3 部署

| 操作 | 结果 |
|------|------|
| Git 自动部署 | ❌ Failure（历史遗留问题，非本次引入） |
| `wrangler pages deploy packages\portal --project-name brewcode-portal` | ✅ 手动部署成功 |

---

## 3. 验证结果

### 3.1 任务 A — Console 报错检测

| 检查项 | 结果 |
|--------|------|
| `console.error` 调用 | **0 条** |
| 未捕获异常（`error` 事件） | **0 条** |

### 3.2 任务 C — 报告页完整性验证

| 检查项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| 页面标题 | 数据报告 | `BrewCode OS · 全球冲煮数据报告` | ✅ |
| 统计卡片数 | 4 | **4** | ✅ |
| 卡片 1 — 总提交 | 17 | `17` | ✅ |
| 卡片 2 — 产区 | 2 | `2`（Colombia 11 / Ethiopia 6） | ✅ |
| 卡片 3 — 器具 | 1 | `1`（V60 17） | ✅ |
| 卡片 4 — 平均水温 | ~92.3°C | `92.3°C` | ✅ |
| Chart.js 图表 | 4 | **4**（产区 / 器具 / 烘焙度 / 水温） | ✅ |
| 加载态隐藏 | 是 | `#loading` display:none | ✅ |
| 空态隐藏 | 是 | `#empty` display:none | ✅ |
| 内容区可见 | 是 | `#content` display:block | ✅ |

### 3.3 综合判定

**全部通过。** Console 零报错，4 张统计卡片数值正确，4 个 Chart.js 图表完整渲染。

---

## 4. 产物清单

| 产物 | 路径 |
|------|------|
| 报告页路由模块 | `packages/portal/data-report.js` |
| Pages 路由规则 (portal) | `packages/portal/_redirects` |
| Pages 路由规则 (root) | `_redirects` |

## 5. 遗留事项

- [ ] Cloudflare Pages Git 自动构建 Failure 需排查（Build command / Root directory 配置），本次通过手动 `wrangler pages deploy` 绕过
- [ ] 后续 Pages 配置修复后，`data-report.js` 的双重机制可简化：`_redirects` 生效后 `data-report.js` 变为冗余兜底
