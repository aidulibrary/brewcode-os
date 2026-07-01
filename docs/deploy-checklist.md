---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 0c5caf7145ca8876d640e5da87215fbf_5651afd36de811f1a99c5254007bceed
    ReservedCode1: Zi4bD84kx8n46Y2nZZosBNaqvY8dwdQx1E4L0Y4GSZqzQ6GXuHMBRKtW6T2bpaxFt0XW4UBILQjJuKTNpN5HoRlMn0Etsj+JAmWkYDBnOEcPdhPMqLSbxaiTLBElEPEm8B8vhTqcQKIoHHP7/RTdfxnD1+QOU0XI1M8OHBMBnG7/kYZshr7eZuN586w=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 0c5caf7145ca8876d640e5da87215fbf_5651afd36de811f1a99c5254007bceed
    ReservedCode2: Zi4bD84kx8n46Y2nZZosBNaqvY8dwdQx1E4L0Y4GSZqzQ6GXuHMBRKtW6T2bpaxFt0XW4UBILQjJuKTNpN5HoRlMn0Etsj+JAmWkYDBnOEcPdhPMqLSbxaiTLBElEPEm8B8vhTqcQKIoHHP7/RTdfxnD1+QOU0XI1M8OHBMBnG7/kYZshr7eZuN586w=
---

# BrewCode OS 部署检查清单

> 版本：v1.1  
> 最后更新：2026-07-02  
> 适用版本：BrewCode OS v1.2.1  
> 用途：环境切换、设备更换、Git 克隆后快速恢复可运行状态，避免重复踩坑。

---

## 目录

1. [环境准备清单](#1-环境准备清单)
2. [关键配置清单](#2-关键配置清单)
3. [部署前检查清单](#3-部署前检查清单)
4. [常见问题排查](#4-常见问题排查)
5. [新设备快速上手](#5-新设备快速上手)
6. [GitHub 连通性](#6-github-连通性)

---

## 1. 环境准备清单

### 1.1 基础依赖

| 依赖 | 最低版本 | 检查命令 | 安装命令 |
|------|----------|----------|----------|
| Node.js | ≥ v18 | `node -v` | [nodejs.org](https://nodejs.org) |
| npm | ≥ v9 | `npm -v` | 随 Node.js 附带 |
| Git | ≥ v2.40 | `git --version` | `winget install Git.Git` |
| Wrangler | ≥ v4.0 | `npx wrangler --version` | `npm install -g wrangler` |

### 1.2 Python（可选，用于本地开发脚本）

```powershell
python --version  # ≥ 3.10 推荐
```

### 1.3 必需的文件复制操作

**项目内的 Schema 文件复制**：`forge.js` 通过相对路径 `./brew.schema.json` 加载 Schema，而 Schema 权威源在 `packages/standards/` 下。每次 git clone 后必须执行：

```powershell
Copy-Item packages/standards/brew.schema.json packages/forge/brew.schema.json -Force
```

或 Linux/macOS：

```bash
cp packages/standards/brew.schema.json packages/forge/brew.schema.json
```

> ⚠️ **为什么不能直接引用 `../standards/brew.schema.json`？**  
> Wrangler Pages 在 Windows 上使用 workerd 运行时，`fetch()` 无法解析跨目录的相对路径（`../` 会触发 404）。因此必须将 Schema 文件复制到 Forge 同目录，使 fetch 路径保持 `./brew.schema.json`。

---

## 2. 关键配置清单

### 2.1 `packages/forge/index.html` — importmap 版本号 & CDN

| # | 配置项 | 文件位置 | 正确值 | 错误值（曾踩坑） | 说明 |
|---|--------|----------|--------|------------------|------|
| 1 | CodeMirror 版本号 | `index.html` importmap 第 15 行 | `codemirror@6.0.2` | `codemirror@6` | `codemirror@6` 被 esm.sh 错误解析为 CM5 UMD 包（v6.65.7），导致 `basicSetup`、`EditorView` 未定义。必须固定次版本号 `6.0.2`。 |
| 2 | AJV 版本号 | `index.html` importmap 第 14 行 | `ajv@8/dist/2020` | — | 必须包含 `/dist/2020` 路径后缀，否则无法获取 draft/2020-12 的校验能力。 |
| 3 | CodeMirror 语言包 | `index.html` importmap 第 16-17 行 | `@codemirror/lang-json@6` / `@codemirror/lint@6` | 省略版本号 | 同样受 esm.sh 版本解析影响，建议保留 `@6` 主版本约束。 |
| 4 | 内联 Meta Schema 拦截器 | `index.html` 第 22-62 行 | 存在 | 缺失 | AJV 初始化时会 fetch `json-schema.org/draft/2020-12/schema`，该域名被墙返回 403。内联拦截器在 importmap 之后、`forge.js` 之前加载，拦截该请求并返回本地 meta schema。 |

### 2.2 `packages/forge/forge.js` — Schema 路径、跳转地址、API

| # | 配置项 | 文件位置 | 正确值 | 错误值（曾踩坑） | 说明 |
|---|--------|----------|--------|------------------|------|
| 5 | Schema 加载路径 | `forge.js:445` | `'./brew.schema.json'` | `'../standards/brew.schema.json'` | 见 §1.3 说明。跨目录相对路径在 Wrangler workerd 下不可用。 |
| 6 | Forge → Player 跳转地址 | `forge.js:1388` | `'https://player.礼字号.中国?brew='` | `'http://localhost:8789?brew='` | 本地开发用 localhost，线上部署必须替换为生产域名。 |
| 7 | Player 回传接收（URL hash） | `forge.js:1400-1410` | `#brew=` hash 解析 | 无 | Forge 通过 URL hash 接收 Player 回传的方案数据。如果 `#brew=` 段缺失，则无法接收回传。 |
| 8 | JS 防御性按钮创建 | `forge.js:1380-1386` | 存在 | 缺失 | 当 `index.html` 因 Cloudflare Pages 缓存未部署 `btn-open-in-player` 按钮时，JS 自动动态创建。如果禁用此段代码，会导致"在 Player 中打开"按钮消失。 |
| 9 | 编辑状态采集 | `forge.js:1387` | `collectFormToState()` + `buildBrewJSON()` | 直接传 `editorState` | 传给 Player 的数据必须是 `buildBrewJSON()` 输出的标准 brew 格式（含 meta/coffee/equipment/recipe/steps/result 六个字段），而非编辑器内部状态对象。 |

### 2.3 `packages/player/player.js` — 跳转地址、回传逻辑

| # | 配置项 | 文件位置 | 正确值 | 错误值（曾踩坑） | 说明 |
|---|--------|----------|--------|------------------|------|
| 10 | URL 参数解析 | `player.js:423-435` | `decodeURIComponent` + `JSON.parse` | `fetch(brewUrl)` | 早期版本将 `?brew=` 的值当作远程 URL 去 fetch，实际传入的是 JSON 字符串。现已改为直接同步解析。 |
| 11 | Player → Forge 回传地址 | `player.js:442` | `'https://forge.礼字号.中国/#brew='` | `'http://localhost:8788/#brew='` | 本地开发用 localhost，线上部署必须替换。 |
| 12 | 回传数据格式 | `player.js:442` | `encodeURIComponent(JSON.stringify(recipe))` | 直接传 recipe 对象 | 必须通过 URL hash 传递，使用 `encodeURIComponent` + `JSON.stringify` 序列化。 |
| 13 | recipe 变量作用域 | `player.js:19` | 模块级变量 | 局部变量 | `recipe` 必须在模块级可访问，否则回传按钮的事件处理中无法获取。 |

### 2.4 `packages/forge/brew.schema.json` — 文件存在性

| # | 配置项 | 文件位置 | 正确状态 | 错误状态 | 说明 |
|---|--------|----------|----------|----------|------|
| 14 | Schema 文件存在 | `packages/forge/brew.schema.json` | 必须存在 | 不存在（忘记复制） | 见 §1.3。每次 git clone 后必须从 `packages/standards/` 复制。如果缺失，Forge 代码模式仅做语法检查，不做 Schema 校验。 |

### 2.5 `packages/standards/brew.schema.json` — JSON Schema 合规

| # | 配置项 | 文件位置 | 正确值 | 错误值（曾踩坑） | 说明 |
|---|--------|----------|--------|------------------|------|
| 15 | `exclusiveMinimum` 值类型 | `brew.schema.json` 多处 | `0`（数字） | `true`（布尔值）或 `"0"`（字符串） | JSON Schema Draft 2020-12 规定 `exclusiveMinimum` 必须是数字（表示排他下界值），不能是 `true`/`false`。当前第 196/214/259 行已修正为 `0`，第 439 行仍为 `true` 需要修正。错误值会使 AJV 在校验时抛出 `exclusiveMinimum must be number`。 |

### 2.6 `workers/wrangler.toml` — Cloudflare Workers 配置

| # | 配置项 | 文件位置 | 正确值 | 错误值（曾踩坑） | 说明 |
|---|--------|----------|--------|------------------|------|
| 16 | API Key 硬编码 | `workers/diagnose/wrangler.toml:7` | 使用 `npx wrangler secret put` 注入 | 明文写在 wrangler.toml 中 | **安全风险**。硬编码的密钥会被提交到 Git 仓库。应使用 `npx wrangler secret put DEEPSEEK_API_KEY` 通过 Cloudflare 环境变量注入。 |
| 17 | API Key 硬编码 | `workers/generate/wrangler.toml:7` | 同上 | 明文写在 wrangler.toml 中 | 同上。`generate` worker 也存在相同问题。 |
| 18 | D1 绑定 | `workers/wrangler.toml:6-8` | `database_id = "81422e38-..."` | ID 不匹配 | D1 database_id 是 Cloudflare 账号级别的唯一标识，换账号必须更新。 |
| 19 | KV 绑定 | `workers/wrangler.toml:10-12` | `id = "2b7ce0793e8b..."` | ID 不匹配 | KV namespace id 同样是账号级别，换账号必须更新。 |
| 20 | 环境变量 | `workers/wrangler.toml:15` | `DEEPSEEK_API_BASE = "https://api.deepseek.com/v1"` | 错误的 API 端点 | DeepSeek API 基地址如有变更需同步更新。 |

### 2.7 步骤编辑器 DOM 依赖

| # | 配置项 | 文件位置 | 正确状态 | 错误状态 | 说明 |
|---|--------|----------|----------|----------|------|
| 21 | `#step-list` | `forge/index.html` + `forge.js` | 必须存在 | 缺失 | 步骤列表的渲染容器。缺失导致 `appendChild` 报错。 |
| 22 | `#btn-add-step` | `forge/index.html` + `forge.js` | 必须存在 | 缺失 | 添加步骤按钮。缺失导致点击无响应。 |
| 23 | `#step-modal` | `forge/index.html` + `forge.js` | 必须存在 | 缺失 | 步骤编辑模态框。缺失导致步骤编辑器无法弹出。 |
| 24 | `#btn-save-step` / `#btn-cancel-step` | `forge/index.html` + `forge.js:986-987` | 必须存在 | 缺失 | 模态框保存/取消按钮。缺失导致步骤无法保存或关闭。 |

---

## 3. 部署前检查清单

### 3.1 本地 ↔ 线上地址替换

部署到生产环境前，如下地址必须从本地值切换为线上值：

| # | 位置 | 本地值 | 线上值 | 说明 |
|---|------|--------|--------|------|
| A | `forge.js:1388` | `http://localhost:8789?brew=` | `https://player.礼字号.中国?brew=` | Forge → Player 跳转 |
| B | `player.js:442` | `http://localhost:8788/#brew=` | `https://forge.礼字号.中国/#brew=` | Player → Forge 回传 |

> **建议**：在代码中定义地址常量，避免散落在业务逻辑中。未来可提取为配置文件或环境变量。

### 3.2 本地开发启动命令

```powershell
# 终端 1：启动 Forge（端口 8788）
npx wrangler pages dev packages/forge --port 8788 --compatibility-date=2026-06-18

# 终端 2：启动 Player（端口 8789）
npx wrangler pages dev packages/player --port 8789 --compatibility-date=2026-06-18
```

> ⚠️ 如果 Wrangler workerd 在 Windows 上响应异常（常见现象），可使用 Python 作为替代：
> ```powershell
> Start-Process python -ArgumentList "-m","http.server","8788","--directory","packages/forge" -NoNewWindow
> Start-Process python -ArgumentList "-m","http.server","8789","--directory","packages/player" -NoNewWindow
> ```

### 3.3 部署验证步骤

1. 访问 `https://forge.礼字号.中国`，确认页面正常加载
2. 填写方案名称、咖啡豆名称、冲煮器具
3. 至少添加 1 个冲煮步骤
4. 点击 `▶ 在 Player 中打开`，确认跳转至 Player 且数据正确加载
5. 在 Player 完成冲煮后点击 `✏️ 回 Forge 调整`，确认回传至 Forge 且数据完整
6. 点击 `{} 代码`，确认 CodeMirror 编辑器正常显示 JSON
7. 点击 `⬇ 导出 .brew`，确认文件下载正常

---

## 4. 常见问题排查

### 4.1 `exclusiveMinimum must be number`

**症状**：AJV 校验报错，代码模式下保存时提示 Schema 校验失败。

**原因**：`brew.schema.json` 中 `exclusiveMinimum` 字段值为布尔值 `true`（JSON Schema Draft 4 的遗留语法），而 Draft 2020-12 要求该字段为数字。

**修复**：将所有 `"exclusiveMinimum": true` 替换为 `"exclusiveMinimum": 0`。

**涉及文件**：`packages/standards/brew.schema.json` + `packages/forge/brew.schema.json`

**未修复位置**（截至 2026-06-22）：两个文件第 439 行（`step.temperature.value` 字段）仍为 `true`。

### 4.2 `Cannot read properties of undefined (reading 'theme')`

**症状**：点击 `{} 代码` 按钮后页面空白，浏览器控制台报此错误。

**原因**：CodeMirror 版本号错误。`codemirror@6` 被 esm.sh 解析为 CM5 UMD 包，导致 `EditorView` 和 `basicSetup` 未定义。

**修复**：将 `forge/index.html` importmap 中 `codemirror@6` 改为 `codemirror@6.0.2`。

### 4.3 Schema 加载失败（控制台警告："Schema 加载失败"）

**症状**：Forge 启动后控制台显示 `BrewForge: Schema 加载失败，代码模式仅做 JSON 语法检查`。

**原因**：
- `packages/forge/brew.schema.json` 文件不存在（忘记复制）
- `forge.js` 中 fetch 路径错误（使用了 `../standards/brew.schema.json`）

**修复**：
1. 确认 `packages/forge/brew.schema.json` 文件存在
2. 确认 `forge.js:445` 中 fetch 路径为 `'./brew.schema.json'`

### 4.4 按钮无响应 / 点击无效

**症状**：页面上的 `+ 添加步骤`、`{} 代码`、`▶ 在 Player 中打开` 等按钮点击无反应。

**原因**：`index.html` 中对应 DOM 元素缺失（部署缓存问题或 HTML 结构错误）。

**排查顺序**：
1. 检查 `#step-list`、`#btn-add-step`、`#step-modal` 是否存在于 HTML
2. 检查 `#btn-open-in-player` 是否存在（Forge）
3. 检查 `#btn-back-to-forge` 是否存在（Player）
4. 对于 `btn-open-in-player` 缺失，`forge.js:1380-1386` 的防御代码会自动创建

### 4.5 Player 加载方案失败："无法解析方案数据"

**症状**：从 Forge 跳转到 Player 后显示解析错误。

**原因**：
- 传入的 `?brew=` 参数不是合法的 JSON 字符串
- Forge 端传的是 `editorState` 而非 `buildBrewJSON()` 的输出

**修复**：
1. 确认 `forge.js:1387` 调用的是 `buildBrewJSON()` 而非直接访问 `editorState`
2. 确认 `player.js:427` 使用的是 `decodeURIComponent` + `JSON.parse`
3. 确认 Forge 中至少填写了方案名称和 1 个步骤

### 4.6 GitHub 推送失败（SNI 阻断）

**症状**：`git push` 报 `Connection reset` 或 `Failed to connect to github.com port 443`。

**原因**：网络环境对 GitHub 域名存在 SNI 级别的阻断。

**修复方案 A — hosts 硬编码**：
```powershell
# 以管理员身份运行 PowerShell，测试可用 IP 后写入 hosts
Add-Content "$env:SystemRoot\System32\drivers\etc\hosts" "140.82.113.4    github.com"
ipconfig /flushdns
```

**修复方案 B — SSH 替代 HTTPS**：
```powershell
git remote set-url origin git@github.com:aidulibrary/brewcode-os.git
# 同时确保 ssh.github.com 在 hosts 中指向可用 IP
```

**注意**：IP 可用性随时间变化，需定期测试。常见候选 IP：`140.82.113.3`、`140.82.113.4`、`140.82.112.3`、`140.82.114.3`。

### 4.7 Cloudflare Pages 部署后 HTML 缓存不刷新

**症状**：`forge.js` 已更新，但 `index.html` 仍是旧版本（按钮缺失）。

**原因**：Cloudflare Pages CDN 缓存策略导致 HTML 部署延迟。

**临时绕过**：`forge.js:1380-1386` 的 JS 防御代码会在 DOM 中动态创建缺失的按钮。

**永久修复**：
1. 进入 Cloudflare Dashboard → Pages → 项目 → 部署 → 清除缓存并重新部署
2. 或通过 API 触发：`npx wrangler pages deployment list --project-name brewcode-os`

### 4.8 微信端分享图片生成失败（createPattern canvas 0 size）

**症状**：微信内置浏览器（X5 内核）中调用 `html2canvas` 生成分享图片时，报错 `createPattern: Passed-in canvas has width 0 / height 0`，导致图片生成失败。

**原因**：微信 X5 内核的 Canvas 实现不支持以下 CSS 属性在 `html2canvas` 中的渲染，使用后会导致 Canvas 绘制异常：

- `text-shadow` — X5 Canvas 调用 `createPattern` 时设置无效参数，导致 Canvas 尺寸计算为 0
- `linear-gradient` — 同上，X5 对渐变背景的 Canvas 渲染存在缺陷
- `transform: scaleX(-1)` — 翻转变换在 X5 中触发 Canvas 上下文异常

**根因定位历史**（commit 链追踪）：
- `9f7d6af`：分享功能正常可用（Blob URL + 多CDN回退，CSS 极简）
- `eb528c4`：引入 `text-shadow` — **根因之一**
- `c6a9f1a`：引入 `linear-gradient` + `transform:scaleX(-1)` — **根因之二、三**

**修复**：将 `injectShareCardCSS()` 中的 CSS 字符串回退到 `9f7d6af` 极简基线，移除 `text-shadow` / `linear-gradient` / `transform` / `overflow:hidden`。涉及文件：
- `packages/repo/repo.js:674-680`（CSS 字符串）
- `packages/forge/share-card.js:529-535`（CSS 字符串，同步修复）

**教训**：
1. 任何 CSS 视觉增强（shadow/gradient/transform）必须先**在微信端验证**后再合并到 main
2. Cloudflare Pages **别名缓存**与直链行为不一致，验证时优先使用直链 `*.brewcode-repo.pages.dev`
3. 别名缓存需通过 `wrangler pages deploy --branch=<name>` 重新部署触发更新，无法通过 API 清除

**参考 commit**：`0a11e89`（repo）、`e907179`（forge）

---

## 5. 新设备快速上手

### 5.1 从零开始（完整命令序列）

```powershell
# 1. 克隆仓库
git clone https://github.com/aidulibrary/brewcode-os.git
cd brewcode-os

# 2. 安装 Wrangler CLI
npm install -g wrangler

# 3. 复制 Schema 文件到 Forge 目录（关键步骤！）
Copy-Item packages/standards/brew.schema.json packages/forge/brew.schema.json -Force

# 4. 启动 Forge（终端 1）
npx wrangler pages dev packages/forge --port 8788 --compatibility-date=2026-06-18

# 5. 启动 Player（终端 2）
npx wrangler pages dev packages/player --port 8789 --compatibility-date=2026-06-18
```

### 5.2 Linux / macOS

```bash
git clone https://github.com/aidulibrary/brewcode-os.git
cd brewcode-os
npm install -g wrangler
cp packages/standards/brew.schema.json packages/forge/brew.schema.json

# 终端 1
npx wrangler pages dev packages/forge --port 8788 --compatibility-date=2026-06-18

# 终端 2
npx wrangler pages dev packages/player --port 8789 --compatibility-date=2026-06-18
```

### 5.3 若 Wrangler workerd 在 Windows 上异常

使用 Python HTTP Server 替代：

```powershell
# 终端 1：Forge
python -m http.server 8788 --directory packages/forge

# 终端 2：Player
python -m http.server 8789 --directory packages/player
```

> 注意：Python HTTP Server 不提供 Cloudflare Workers 的 D1/KV 模拟环境，仅适用于前端页面和服务端 Worker 分离开发的场景。

---

## 6. GitHub 连通性

### 6.1 DNS 前置配置

如所处网络环境存在 GitHub SNI 阻断，在 hosts 文件中添加：

```
# GitHub 相关域名（IP 需定期测试更新）
140.82.113.4    github.com
140.82.113.3    ssh.github.com
140.82.112.14   raw.githubusercontent.com
20.205.243.162  github.githubassets.com
20.205.243.165  objects.githubusercontent.com
```

hosts 文件位置：`C:\Windows\System32\drivers\etc\hosts`（Windows）或 `/etc/hosts`（Linux/macOS）

修改后执行 `ipconfig /flushdns`（Windows）或 `sudo dscacheutil -flushcache`（macOS）。

### 6.2 IP 可用性测试命令

```powershell
# 测试 443 端口的 IP
$ips = @("140.82.113.3","140.82.113.4","140.82.112.3","140.82.114.3","20.205.243.166")
foreach ($ip in $ips) {
    $r = Test-NetConnection -ComputerName $ip -Port 443 -WarningAction SilentlyContinue
    Write-Host "$ip : $($r.TcpTestSucceeded)"
}
```

### 6.3 SSH Key 备用

```powershell
ssh-keygen -t rsa -b 4096 -C "your-email@example.com" -f "$env:USERPROFILE\.ssh\brewcode_rsa"
```

将公钥添加至 `https://github.com/aidulibrary/brewcode-os/settings/keys/new`。

---

## 附录 A：配置文件索引

| 文件 | 用途 | 关键配置 |
|------|------|----------|
| `packages/forge/index.html` | Forge 页面入口 | importmap（CDN 版本号）、DOM 结构 |
| `packages/forge/forge.js` | Forge 核心逻辑 | Schema 路径、跳转地址、回传接收 |
| `packages/forge/forge.css` | Forge 样式 | — |
| `packages/forge/brew.schema.json` | Forge 运行时 Schema | 从 standards 复制而来 |
| `packages/player/index.html` | Player 页面入口 | 按钮 DOM |
| `packages/player/player.js` | Player 核心逻辑 | 跳转地址、URL 解析、回传逻辑 |
| `packages/standards/brew.schema.json` | Schema 权威源 | exclusiveMinimum、字段定义 |
| `workers/wrangler.toml` | Gateway Worker | D1/KV 绑定、环境变量 |
| `workers/diagnose/wrangler.toml` | Diagnose Worker | ⚠️ API Key 硬编码 |
| `workers/generate/wrangler.toml` | Generate Worker | ⚠️ API Key 硬编码 |
| `workers/translate/wrangler.toml` | Translate Worker | D1 绑定 |

## 附录 B：已知待修复项

| # | 问题 | 严重程度 | 位置 |
|---|------|----------|------|
| P1 | `exclusiveMinimum: true` 仍存在 | 中 | `brew.schema.json` 两副本第 439 行 |
| P2 | `workers/diagnose/wrangler.toml` 硬编码 API Key | 高 | 第 7 行 |
| P3 | `workers/generate/wrangler.toml` 硬编码 API Key | 高 | 第 7 行 |
| P4 | 跳转地址散落在业务逻辑中，无集中配置 | 低 | `forge.js:1388` / `player.js:442` |
*（内容由AI生成，仅供参考）*
