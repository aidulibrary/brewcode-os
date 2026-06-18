# BrewCode OS 域名基础设施运维 · 神级操作手册

> **版本**：v1.0
> **生成日期**：2026-06-17
> **适用范围**：BrewCode OS Cloudflare 生态全栈运维
> **前置阅读**：[BrewCode OS 平台服务分层设计 v0.1（重构版）](./BrewCode%20OS%20平台服务分层设计%20v0.1（重构版）.md)
> **关联文档**：[域名体系调整记录](./域名体系调整记录.md) · [brewforge-ai-delivery](./brewforge-ai-delivery.md) · [phase-1-delivery-report](./phase-1-delivery-report.md)

---

## 目录

1. [域名体系架构](#1-域名体系架构)
2. [基础设施凭据矩阵](#2-基础设施凭据矩阵)
3. [任务模型（Task Model）](#3-任务模型)
4. [问题百科（Troubleshooting Encyclopedia）](#4-问题百科)
5. [技术难点深度解构](#5-技术难点深度解构)
6. [标准工作流](#6-标准工作流)
7. [技能包（Skill Package）](#7-技能包)
8. [自进化智能体：BrewCode Infra Operator](#8-自进化智能体)

---

## 1. 域名体系架构

### 1.1 完整域名地图

```
                    ┌──────────────────────────────────┐
                    │     Cloudflare DNS Zone           │
                    │     礼字号.中国 (xn--fiqs8s)       │
                    └──────────────┬───────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────────┐
          │                        │                            │
    ┌─────┴──────┐          ┌──────┴──────┐           ┌────────┴────────┐
    │ 顶级域      │          │ 子域名站点   │           │ API 网关         │
    │ 礼字号.中国  │          │ (5 个站点)   │           │ api.礼字号.中国   │
    │ (预留)      │          │              │           │ (Worker)         │
    └────────────┘          └──────┬───────┘           └─────────────────┘
                                   │
          ┌────────────┬───────────┼───────────┬────────────┐
          │            │           │           │            │
    ┌─────┴─────┐ ┌────┴────┐ ┌───┴────┐ ┌────┴────┐ ┌─────┴─────┐
    │ brewcode  │ │ player  │ │ repo   │ │ forge   │ │ portal    │
    │ 官网首页   │ │ 冲煮器   │ │ 方案库  │ │ AI编辑器 │ │ 学习中心   │
    │ Pages     │ │ Pages   │ │ Pages  │ │ Pages   │ │ Pages     │
    └───────────┘ └─────────┘ └────────┘ └─────────┘ └───────────┘
```

### 1.2 站点注册表

| 站点       | 域名                   | Pages 项目名      | 源目录             | 状态      |
| ---------- | ---------------------- | ----------------- | ------------------ | --------- |
| 官网首页   | `brewcode.礼字号.中国` | `brewcode-portal` | `docs/portal/`     | ✅ active |
| 冲煮播放器 | `player.礼字号.中国`   | `brewcode-player` | `packages/player/` | ✅ active |
| 方案仓库   | `repo.礼字号.中国`     | `brewcode-repo`   | `packages/repo/`   | ✅ active |
| AI 编辑器  | `forge.礼字号.中国`    | `brewcode-forge`  | `packages/forge/`  | ✅ active |
| 学习中心   | `portal.礼字号.中国`   | `brewcode-portal` | —                  | ⚠️ 待部署 |
| API 网关   | `api.礼字号.中国`      | —（Worker）       | `workers/gateway/` | ✅ active |
| 社区门户   | `礼字号.中国`          | —                 | —                  | 🔮 预留   |

### 1.3 Punycode 编码对照表

> **⚠️ 致命陷阱**：中文字符的 Punycode 编码**不是唯一的**。同一中文在不同 Unicode 版本/不同注册商处可能产生不同编码。Cloudflare 内部使用自己的编码映射，**必须用 API 查询实际 Zone 使用的 Punycode**，不可自行计算。

| 中文   | Cloudflare Zone 实际 Punycode | 常见错误编码    | 偏差来源           |
| ------ | ----------------------------- | --------------- | ------------------ |
| 礼字号 | `xn--rpr94o750a`              | `xn--ebru9sx1b` | 不同 Punycode 实现 |
| 中国   | `xn--fiqs8s`                  | `xn--fiq66k`    | 繁简体差异         |

**铁律**：在 Cloudflare API 中操作中文域名时，**永远不要自己计算 Punycode**。用以下命令获取 Zone 的真实编码：

```powershell
$zone = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=礼字号.中国" `
  -Headers @{"Authorization"="Bearer $TOKEN";"Content-Type"="application/json"}
$zone.result[0].name  # 输出 Zone 实际使用的 Punycode
```

### 1.4 命名规范

| 规则                                           | 示例                                           |
| ---------------------------------------------- | ---------------------------------------------- |
| 子域名使用英文小写，连字符分隔                 | `brewcode`、`brewcode-portal`                  |
| Pages 项目名使用 `brewcode-<功能>` 格式        | `brewcode-forge`、`brewcode-player`            |
| 源目录：工具类放 `packages/`，官网类放 `docs/` | `packages/forge/`、`docs/portal/`              |
| 禁止在子域名中使用中文                         | ❌ `工坊.礼字号.中国` → ✅ `forge.礼字号.中国` |

---

## 2. 基础设施凭据矩阵

### 2.1 凭据清单

| 凭据             | 值（占位符）                           | 获取方式                            | 权限范围              |
| ---------------- | -------------------------------------- | ----------------------------------- | --------------------- |
| Account ID       | `<ACCOUNT_ID>`                         | `dash.cloudflare.com` → 右侧 API 栏 | 全局账户              |
| Zone ID          | `<ZONE_ID>`                            | API 查询或 Dashboard 右下角         | 仅 `礼字号.中国`      |
| API Token        | `<API_TOKEN>`                          | Profile → API Tokens → 创建         | Pages:Edit + DNS:Edit |
| D1 Database ID   | `81422e38-499c-4f13-810a-98fa1f6a18f4` | `wrangler.toml`                     | D1 读写               |
| KV Namespace ID  | `2b7ce0793e8b4b4f9cfd6ce0114fc52a`     | `wrangler.toml`                     | KV 读写               |
| DeepSeek API Key | `sk-7dd92cdba882468f88cf95d226d4a42c`  | platform.deepseek.com               | AI 调用               |
| 测试 API Key     | `bk_test1234567890abcdef`              | 硬编码（开发阶段）                  | D1 鉴权               |

### 2.2 API Token 最小权限原则

**正确配置**（每次操作都成功）：

| 权限             | 资源    | 级别 | 用途                |
| ---------------- | ------- | ---- | ------------------- |
| Cloudflare Pages | Account | Edit | 绑定/解绑自定义域名 |
| DNS              | Zone    | Edit | 创建/删除 DNS 记录  |

**错误配置**（真实踩坑记录）：

| 错误配置       | 失败症状             | 根因                      |
| -------------- | -------------------- | ------------------------- |
| DNS: Read      | 创建 CNAME 返回 403  | 缺少写入权限              |
| 仅 Pages: Edit | 域名验证卡在 Pending | 无法自动创建 DNS 验证记录 |

### 2.3 密钥安全边界

| 密钥         | 安全等级 | 泄露影响               | 轮换周期   |
| ------------ | -------- | ---------------------- | ---------- |
| API Token    | 🔴 高    | 可操作全部 DNS + Pages | 90 天      |
| DeepSeek Key | 🟡 中    | 消耗 API 余额          | 按需       |
| 测试 API Key | 🟢 低    | 仅限 D1 鉴权测试       | 上线前废弃 |

> **铁律**：API Token 和 DeepSeek Key **绝不写入 Git 仓库**。使用 Cloudflare Dashboard 环境变量或 `.env`（已 .gitignore）。

---

## 3. 任务模型

### 3.1 任务：新建 Pages 项目并绑定自定义域名

```
┌─────────────────────────────────────────────────────┐
│  TASK-001: 新站点上线                                 │
│  输入: 站点名称、源目录、目标域名                       │
│  输出: 可访问的 HTTPS 站点                             │
│  回滚: 删除 Pages 项目 + 删除 DNS 记录                  │
│  预计耗时: 5 分钟                                      │
└─────────────────────────────────────────────────────┘
```

**步骤**：

```powershell
# ===== 变量区 =====
$TOKEN    = "<API_TOKEN>"
$ACCOUNT  = "<ACCOUNT_ID>"
$ZONE     = "<ZONE_ID>"
$PROJECT  = "brewcode-<name>"        # Pages 项目名
$DOMAIN   = "<subdomain>.礼字号.中国" # 目标域名
$SOURCE   = "packages/<name>/"       # 源目录
$HEADERS  = @{ "Authorization" = "Bearer $TOKEN"; "Content-Type" = "application/json" }

# 步骤 1: 创建 DNS CNAME 记录（代理 = true）
$dnsBody = @{ type="CNAME"; name=$DOMAIN; content="$PROJECT.pages.dev"; proxied=$true; ttl=1 } | ConvertTo-Json
$dns = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" -Method Post -Headers $HEADERS -Body $dnsBody
if (-not $dns.success) { throw "DNS 创建失败: $($dns.errors[0].message)" }

# 步骤 2: 绑定自定义域名到 Pages 项目
$addBody = @{ name = $DOMAIN } | ConvertTo-Json
$add = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/$PROJECT/domains" -Method Post -Headers $HEADERS -Body $addBody
if (-not $add.success) { throw "域名绑定失败: $($add.errors[0].message)" }

# 步骤 3: 轮询等待 SSL 签发
do {
  Start-Sleep -Seconds 10
  $status = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/$PROJECT/domains" -Method Get -Headers $HEADERS
  Write-Host "状态: $($status.result[0].status)"
} while ($status.result[0].status -ne "active" -and $status.result[0].status -ne "error")

# 步骤 4: 验证可访问性
$http = Invoke-WebRequest -Uri "https://$DOMAIN" -TimeoutSec 30
Write-Host "HTTP $($http.StatusCode) — $DOMAIN ✅"
```

**验证清单**：

- [ ] DNS CNAME 记录存在且 `proxied: true`
- [ ] Pages 自定义域名状态为 `active`
- [ ] `curl -I https://<域名>` 返回 200
- [ ] SSL 证书已签发（浏览器无证书警告）

---

### 3.2 任务：D1 鉴权密钥管理

```
┌─────────────────────────────────────────────────────┐
│  TASK-002: 添加 API 鉴权密钥                          │
│  输入: 原始密钥字符串                                 │
│  输出: key_hash 已插入 api_keys 表                    │
│  回滚: DELETE FROM api_keys WHERE key_hash = '...'    │
│  预计耗时: 1 分钟                                      │
└─────────────────────────────────────────────────────┘
```

**步骤**：

```powershell
# 1. 计算 key_hash（去掉 "bk_" 前缀后取哈希）
# 在浏览器 Console 中运行：
function hashKey(k) {
  let h = 0;
  for (let i = 0; i < k.length; i++) {
    h = (h << 5) - h + k.charCodeAt(i);
    h |= 0;
  }
  return h.toString(16);
}
console.log(hashKey('test1234567890abcdef'));  // → -3e3230b0

# 2. 插入到远程 D1
npx wrangler d1 execute brewcode-db --remote `
  --command="INSERT INTO api_keys (key_hash, plan, rate_limit) VALUES ('-3e3230b0', 'pro', 120);"

# 3. 验证
npx wrangler d1 execute brewcode-db --remote `
  --command="SELECT * FROM api_keys WHERE key_hash = '-3e3230b0';"

# 4. 测试鉴权
curl -X POST "https://api.礼字号.中国/diagnose" `
  -H "Authorization: Bearer bk_test1234567890abcdef" `
  -H "Content-Type: application/json" `
  -d '{"brew":{},"issue":"test"}'
```

**表结构**：

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  key_hash   TEXT PRIMARY KEY,
  plan       TEXT NOT NULL DEFAULT 'free',
  rate_limit INTEGER NOT NULL DEFAULT 10,
  created_at TEXT DEFAULT (datetime('now')),
  last_used_at TEXT
);
```

---

### 3.3 任务：DNS 记录批量审计

```
┌─────────────────────────────────────────────────────┐
│  TASK-003: DNS 审计                                  │
│  输入: Zone ID                                       │
│  输出: 所有 CNAME 记录清单 + 代理状态                  │
│  预计耗时: 30 秒                                      │
└─────────────────────────────────────────────────────┘
```

```powershell
$records = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records?type=CNAME" -Method Get -Headers $HEADERS
$records.result | Select-Object name, content, proxied, ttl | Format-Table -AutoSize
```

---

## 4. 问题百科

> 每个问题按「症状 → 根因 → 解决方案 → 预防措施」四段式记录。所有问题均为 BrewCode OS 项目实战中真实踩过并修复的坑。

---

### 问题 1：Invalid API key

| 属性     | 值                              |
| -------- | ------------------------------- |
| 严重级别 | 🔴 阻断                         |
| 首次出现 | 2026-06-17                      |
| 触发条件 | BrewForge 调用 AI 诊断/生成接口 |

**症状**：

```
HTTP 401: Invalid API key
```

BrewForge AI 诊断/生成按钮点击后立即返回鉴权失败，调用链路在网关层被拦截。

**根因**：
网关已启用 D1 鉴权模式，`api_keys` 表为空。测试密钥 `bk_test1234567890abcdef` 从未被插入到 D1 数据库中。网关收到请求后查询 `api_keys` 表，`key_hash` 不匹配，返回 401。

**调用链路**：

```
BrewForge → fetch('https://api.礼字号.中国/diagnose', { Authorization: 'Bearer bk_xxx' })
  → 网关 Worker (gateway/index.js)
    → D1: SELECT * FROM api_keys WHERE key_hash = ?
    → 0 rows → 401 'Invalid API key'
```

**解决方案**：

1. 计算 `key_hash`：`test1234567890abcdef` → `-3e3230b0`
2. 插入 D1：`INSERT INTO api_keys (key_hash, plan, rate_limit) VALUES ('-3e3230b0', 'test', 10);`
3. 验证：`curl -X POST https://api.礼字号.中国/diagnose -H "Authorization: Bearer bk_test1234567890abcdef"`

**预防措施**：

- 每次部署网关后，执行 smoke test：`curl` 诊断端点确认鉴权通过
- 在 `wrangler.toml` 中添加部署后钩子脚本（`wrangler deploy && wrangler d1 execute ...`）
- 将测试密钥插入作为 D1 schema migration 的一部分

---

### 问题 2：ERR_CONNECTION_REFUSED

| 属性     | 值                             |
| -------- | ------------------------------ |
| 严重级别 | 🟡 操作错误                    |
| 首次出现 | 2026-06-17                     |
| 触发条件 | 本地开发预览时未启动静态服务器 |

**症状**：

```
ERR_CONNECTION_REFUSED (-102)
URL: http://localhost:3000/
```

**根因**：
BrewForge 是纯静态 HTML/CSS/JS，没有内置服务器。需要通过 `npx serve .` 或 `python -m http.server` 启动本地服务。

**解决方案**：

```powershell
cd d:\brewcode-os\packages\forge
npx serve .
```

**为什么不能直接双击打开 HTML**：

- `file://` 协议下，`fetch()` 跨域请求被浏览器拦截
- AI 诊断/生成需要调用 `https://api.礼字号.中国`，`file://` 不支持 CORS

---

### 问题 3：Punycode 编码不一致导致域名验证失败

| 属性     | 值                            |
| -------- | ----------------------------- |
| 严重级别 | 🔴 阻断                       |
| 首次出现 | 2026-06-17                    |
| 触发条件 | 通过 API 绑定中文域名到 Pages |

**症状**：
Cloudflare API 返回成功，但 Pages 自定义域名状态卡在 `pending_verification`，DNS 验证永远不通过，SSL 证书不签发。

**根因**：
`礼字号` 的 Punycode 编码存在**双重表示**：

- 常见编码：`xn--ebru9sx1b`（在线 Punycode 转换器输出）
- Cloudflare 实际使用：`xn--rpr94o750a`（Zone 内部编码）

当 API 请求使用 `xn--ebru9sx1b` 时，Cloudflare 在 DNS 中创建了验证记录，但验证逻辑期望的是 `xn--rpr94o750a`，导致验证记录永远匹配不上。

**技术细节**：
Punycode（RFC 3492）在编码中文字符时，不同实现库对同一字符可能产生不同编码。这是因为 Unicode 规范化形式（NFC/NFD）和 IDNA 2003 vs 2008 的差异。

**解决方案**：

```powershell
# 永远不要自己计算 Punycode，用 API 查询 Zone 实际编码
$zone = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=礼字号.中国" `
  -Headers @{"Authorization"="Bearer $TOKEN"}
$zonePunycode = $zone.result[0].name  # 获取实际 Punycode

# 使用实际编码构建域名
$actualDomain = "subdomain.$zonePunycode"
```

**预防措施**：

- 封装 `get-zone-punycode.ps1` 脚本，所有操作前先查询
- 在文档中记录已知的编码对照表
- 使用 Cloudflare Dashboard 而非 API 绑定域名时，直接输入中文（Dashboard 自动处理编码）

---

### 问题 4：API Token 权限不足（403 Forbidden）

| 属性     | 值                                       |
| -------- | ---------------------------------------- |
| 严重级别 | 🔴 阻断                                  |
| 首次出现 | 2026-06-17                               |
| 触发条件 | 使用只有 DNS:Read 的 Token 创建 DNS 记录 |

**症状**：

```json
{
  "success": false,
  "errors": [
    {
      "code": 10000,
      "message": "Authentication error"
    }
  ]
}
```

HTTP 403，创建 DNS 记录失败。

**根因**：
API Token 创建时只授予了 `DNS:Read` 权限，创建 CNAME 记录需要 `DNS:Edit`。

**Cloudflare API Token 权限矩阵**：

| 操作                    | 所需权限   |
| ----------------------- | ---------- |
| 查询 DNS 记录           | DNS:Read   |
| 创建/修改/删除 DNS 记录 | DNS:Edit   |
| 查询 Pages 域名         | Pages:Read |
| 绑定/解绑 Pages 域名    | Pages:Edit |

**解决方案**：
Cloudflare Dashboard → Profile → API Tokens → 编辑 Token → 添加 `Zone → DNS → Edit` 权限。

**预防措施**：

- 创建 Token 时，遵循「最小权限 + 一次给够」原则
- 用一个 Token 完成所有 DNS + Pages 操作，避免权限碎片化
- 生产环境 Token 与开发 Token 分离

---

### 问题 5：部署后页面未更新（浏览器缓存）

| 属性     | 值                                |
| -------- | --------------------------------- |
| 严重级别 | 🟡 误判                           |
| 首次出现 | 2026-06-17                        |
| 触发条件 | `git push` 后刷新页面仍显示旧内容 |

**症状**：
Cloudflare Pages 部署状态显示 `Success`，但浏览器中页面显示旧版内容（渲染失衡、配色不对）。

**根因**：
浏览器缓存了旧版 CSS/JS 文件。Cloudflare Pages 部署成功后，静态资源 URL 不变，浏览器（尤其是 Chrome）倾向于使用 `304 Not Modified` 的缓存版本。

**解决方案**：

```
Ctrl+Shift+R（Windows）/ Cmd+Shift+R（Mac）— 硬刷新
```

或在开发者工具 → Network 标签 → 勾选「Disable cache」→ 刷新。

**预防措施**：

- 部署后等待 1-2 分钟（Cloudflare CDN 全球传播延迟）
- 生产环境考虑为静态资源添加版本查询参数（如 `portal.css?v=20260617`）
- Cloudflare Dashboard → Caching → Configuration → Purge Everything 可手动清除 CDN 缓存

---

### 问题 6：Cloudflare Pages 部署目录不匹配

| 属性     | 值                       |
| -------- | ------------------------ |
| 严重级别 | 🔴 阻断                  |
| 首次出现 | 2026-06-17               |
| 触发条件 | Pages 项目源目录配置错误 |

**症状**：
`brewcode.礼字号.中国` 显示旧版官网（无 Logo、无七屏结构），而非 `packages/portal/` 中的新版本。

**根因**：
`brewcode-portal` Pages 项目的部署目录配置为 `docs/portal/`（旧文件），而新官网文件位于 `packages/portal/`。Git 推送了新文件到 `packages/portal/`，但 Pages 构建时拉取的是 `docs/portal/`。

**解决方案**：

```powershell
# 方案 A：同步文件到 Pages 实际使用的目录
Copy-Item "d:\brewcode-os\packages\portal\index.html" "d:\brewcode-os\docs\portal\index.html" -Force
Copy-Item "d:\brewcode-os\packages\portal\portal.css" "d:\brewcode-os\docs\portal\portal.css" -Force
Copy-Item "d:\brewcode-os\packages\portal\portal.js" "d:\brewcode-os\docs\portal\portal.js" -Force
git add docs/portal/ && git commit -m "docs: sync new portal" && git push

# 方案 B：更改 Pages 构建输出目录
# Dashboard → brewcode-portal → Settings → Build & deployments → Build output directory → packages/portal
```

**预防措施**：

- 在项目 README 中明确记录每个 Pages 项目的源目录
- 新站点上线时，在 Dashboard 中验证 `Build output directory` 配置
- 使用 `wrangler pages project list` 定期审计配置

---

### 问题 7：DeepSeek API 402 Insufficient Balance

| 属性     | 值                                     |
| -------- | -------------------------------------- |
| 严重级别 | 🟡 外部依赖                            |
| 首次出现 | 2026-06-17                             |
| 触发条件 | AI 诊断/生成请求到达 Worker 后转发失败 |

**症状**：

```
DeepSeek API call failed after retries
详情: {"status":402,"body":"{\"error\":{\"message\":\"Insufficient Balance\",\"type\":\"unknown_error\",\"param\":null,\"code\":\"invalid_request_error\"}}"}
```

**根因**：
DeepSeek 账户余额不足。虽然每次调用成本极低（诊断约 ¥0.002，生成约 ¥0.005），但 Key 可能被多个项目共享消耗。

**调用成本分析**：

| 调用类型 | 输入 Token | 输出 Token | 单次成本 | 5 元可调用次数 |
| -------- | ---------- | ---------- | -------- | -------------- |
| 诊断     | ~1,000     | ~500       | ¥0.002   | ~2,500 次      |
| 生成     | ~1,750     | ~1,500     | ¥0.005   | ~1,000 次      |

**解决方案**：

1. 登录 [platform.deepseek.com](https://platform.deepseek.com) → 充值（最低 10 元）
2. 建议为 BrewCode OS 创建独立 API Key，避免与其他项目共享余额
3. 在用量统计中查看消耗明细，确认是否有异常消耗

**预防措施**：

- 设置 DeepSeek 余额告警（如剩余 < 5 元时邮件通知）
- 在 Worker 中添加余额检查逻辑（调用 `/user/balance` 端点）
- 考虑为生产环境使用独立的 DeepSeek Key

---

### 问题 8：Cloudflare Analytics 信标被阻断

| 属性     | 值                      |
| -------- | ----------------------- |
| 严重级别 | 🟢 无影响               |
| 首次出现 | 2026-06-17              |
| 触发条件 | 国内网络访问 Pages 站点 |

**症状**：
浏览器 Console 中报错：

```
GET https://static.cloudflareinsights.com/beacon.min.js/v833ccba
net::ERR_CONNECTION_RESET
```

**根因**：
Cloudflare Pages 默认注入 Web Analytics 信标脚本。`static.cloudflareinsights.com` 域名在国内网络环境下被 GFW 阻断。

**影响评估**：

- ✅ 页面渲染：无影响
- ✅ 主题切换：无影响
- ✅ 中英双语：无影响
- ⚠️ 访问统计：Cloudflare 后台看不到国内用户数据

**解决方案**：

- 保留：不影响功能，仅开发者工具中可见报错
- 关闭：Dashboard → Web Analytics → 禁用

---

### 问题 9：顶级域 Apex 301 重定向错误

| 属性     | 值                                                         |
| -------- | ---------------------------------------------------------- |
| 严重级别 | 🔴 阻断                                                    |
| 首次出现 | 2026-06-17                                                 |
| 触发条件 | 将顶级域 `example.com` 重定向到子域 `brewcode.example.com` |

**症状**：

- 绑定顶级域到 Pages 后，访问返回 `Host Error`
- 找不到正确的 API 权限，API 返回 `Authentication error`

**根因**：

1. 顶级域 Apex（无点域名）需要 DNS 记录支持，不能只用 CNAME
2. 使用 Rulesets API 需要额外权限 `Zone → Rulesets → Edit`，普通人找不到
3. API 认证复杂，权限模型对小白不友好

**最佳实践解决方案**（零额外权限）：

1. **创建 DNS CNAME 记录**（即使是顶级域，Cloudflare 支持 Apex CNAME）

   ```powershell
   $body = @{
     type="CNAME"; name="礼字号.中国"; content="brewcode-portal.pages.dev"; proxied=$true; ttl=1
   } | ConvertTo-Json
   Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" -Method Post -Headers $HEADERS -Body $body
   ```

2. **绑定顶级域到 Pages 项目**（使用 Zone 实际 Punycode）

   ```powershell
   # 查询 Zone 实际 Punycode
   $zoneInfo = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=礼字号.中国" -Headers $HEADERS
   $actualPuny = $zoneInfo.result[0].name  # xn--rpr94o750a.xn--fiqs8s

   # 绑定
   $addBody = @{ name = $actualPuny } | ConvertTo-Json
   Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/brewcode-portal/domains" -Method Post -Headers $HEADERS -Body $addBody
   ```

3. **添加 `_redirects` 文件** 到 Pages 源目录根目录

   ```
   https://礼字号.中国/* https://brewcode.礼字号.中国/:splat 301!
   ```

   文件路径：`docs/portal/_redirects`（对应 `brewcode-portal` 项目）

4. **Git 推送触发部署**
   ```powershell
   git add docs/portal/_redirects
   git commit -m "feat: add 301 redirect"
   git push
   ```

**预防措施**：

- 优先使用 `_redirects` 文件方式，不需要 API 权限，小白友好
- 不要在 Rulesets API 上折腾，权限太复杂
- 顶级域必须绑定到 Pages 项目，不能只做 CNAME

---

## 5. 技术难点深度解构

### 5.1 Punycode 双重编码问题

**问题本质**：
Punycode（RFC 3492）是 Unicode 到 ASCII 的编码算法，用于在 DNS 系统中表示非 ASCII 字符。但同一中文字符在不同 IDNA 版本（2003 vs 2008）和不同实现库中可能产生不同编码。

**涉及的 Unicode 规范化**：

- NFC（Normalization Form C）：组合字符
- NFD（Normalization Form D）：分解字符
- 中文域名注册时，注册商可能对输入做了 NFC 规范化，但 Cloudflare 内部可能使用 NFD 或其他变体

**影响范围**：

- 通过 API 绑定的自定义域名
- DNS 验证记录的自动创建
- SSL 证书的域名验证

**最佳实践**：

```powershell
# 所有中文域名操作前，必须执行此查询
function Get-ActualPunycode {
  param($chineseDomain, $token)
  $zone = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=$chineseDomain" `
    -Headers @{"Authorization"="Bearer $token"}
  return $zone.result[0].name
}
```

---

### 5.2 Cloudflare API Token 最小权限实践

**设计原则**：

- 一个 Token 只做一类事
- 权限粒度匹配操作频率
- 生产 Token 与开发 Token 分离

**BrewCode OS 推荐的 Token 策略**：

| Token 名称          | 权限                  | 用途                 | 环境 |
| ------------------- | --------------------- | -------------------- | ---- |
| `brewcode-deploy`   | Pages:Edit + DNS:Edit | 新站点上线、域名变更 | 开发 |
| `brewcode-readonly` | Pages:Read + DNS:Read | 日常审计、监控       | 生产 |
| `brewcode-purge`    | Cache:Purge           | CDN 缓存清理         | 运维 |

**安全边界**：

- Token 仅通过环境变量或安全存储传递，不写入代码
- 每次操作后验证 Token 是否泄漏（检查 API 审计日志）
- 离职/项目交接时立即吊销所有 Token

---

### 5.3 D1 鉴权密钥哈希算法

**网关鉴权流程**：

```
1. 提取 Authorization: Bearer bk_<key>
2. 去除 "bk_" 前缀 → rawKey
3. hashKey(rawKey) → keyHash
4. SELECT * FROM api_keys WHERE key_hash = keyHash
5. 匹配 → 检查 plan + rate_limit → 放行/拒绝
```

**哈希算法**（JavaScript）：

```javascript
function hashKey(k) {
  let h = 0;
  for (let i = 0; i < k.length; i++) {
    h = (h << 5) - h + k.charCodeAt(i);
    h |= 0; // 32-bit integer overflow
  }
  return h.toString(16);
}
```

**安全特性**：

- 数据库存储的是哈希值，不是原始密钥
- 哈希碰撞概率极低（32-bit 空间，在 BrewCode OS 规模下可忽略）
- 密钥前缀 `bk_` 作为命名空间隔离

**局限性**（正式上线前需升级）：

- 当前哈希算法简单，不抗碰撞攻击
- 生产环境应使用 SHA-256 + salt
- 应支持密钥过期和吊销

---

### 5.4 Cloudflare Pages 部署目录的三种模式

| 模式                | 配置方式                           | 适用场景                   | BrewCode OS 使用     |
| ------------------- | ---------------------------------- | -------------------------- | -------------------- |
| Git 集成 + 指定路径 | Dashboard → Build output directory | monorepo 中多个 Pages 项目 | ✅ `packages/forge/` |
| Git 集成 + 根目录   | 默认                               | 单项目仓库                 | ✅ `docs/portal/`    |
| Direct Upload       | `wrangler pages deploy`            | 无 Git 仓库的静态文件      | ❌ 未使用            |

**为什么 brewcode-portal 用 `docs/portal/` 而非 `packages/portal/`**：

- 历史原因：项目早期官网文件放在 `docs/` 下
- 保持一致性：所有 `docs/` 子目录对应 Pages 项目的约定
- 如果改用 `packages/portal/`，需要同时更新 `.gitignore` 和 CI 配置

**迁移检查清单**（如需更改部署目录）：

- [ ] 确认新目录中所有文件齐全
- [ ] 更新 Dashboard 中的 Build output directory
- [ ] 触发一次部署（Retry deployment 或 git push）
- [ ] 验证自定义域名仍然生效
- [ ] 更新文档中的目录映射

---

## 6. 标准工作流

### 6.1 新站点上线全流程

```
┌──────────────────────────────────────────────────────────────────┐
│  WORKFLOW-001: 从代码到可访问                                      │
│                                                                   │
│  1. 代码就绪  →  2. Git 推送  →  3. Pages 部署  →  4. 域名绑定    │
│     (本地)        (GitHub)        (自动)           (API)           │
│                                                                   │
│  5. SSL 签发   →  6. 验证可访问  →  7. 文档更新                    │
│     (自动,~2min)   (curl)          (docs/)                         │
└──────────────────────────────────────────────────────────────────┘
```

**详细步骤**：

```powershell
# === 阶段 1: 代码就绪 ===
# 确认源目录文件齐全
Get-ChildItem "d:\brewcode-os\packages\<name>\" | Select-Object Name, Length

# === 阶段 2: Git 推送 ===
cd d:\brewcode-os
git add packages/<name>/
git commit -m "feat: <name> 站点上线"
git push

# === 阶段 3: 等待 Pages 自动部署（约 30-60 秒） ===
# 可在 Dashboard → Deployments 查看进度

# === 阶段 4: 域名绑定 ===
# 执行 TASK-001 脚本（见第 3 章）

# === 阶段 5: 等待 SSL 签发（约 1-2 分钟） ===
# 轮询直到 status = "active"

# === 阶段 6: 验证 ===
curl -I "https://<domain>.礼字号.中国"

# === 阶段 7: 更新文档 ===
# 更新 域名体系调整记录.md
# 更新 第 1.2 节站点注册表
```

---

### 6.2 域名变更/迁移流程

```
┌──────────────────────────────────────────────────────────────────┐
│  WORKFLOW-002: 域名迁移                                           │
│                                                                   │
│  旧域名 ──→ 301 重定向 ──→ 新域名                                  │
│  (保留 30 天)              (目标)                                   │
│                                                                   │
│  关键原则：                                                       │
│  - 先建新，后拆旧                                                  │
│  - 保留旧域名至少 30 天作为过渡                                     │
│  - 所有内部链接同步更新                                            │
└──────────────────────────────────────────────────────────────────┘
```

**BrewCode OS 实际案例**：

```
礼字号.中国（旧官网）→ brewcode.礼字号.中国（新官网）
- 旧域名保留，通过 Cloudflare Redirect Rules 做 301
- 工具站点中硬编码的链接需批量更新
```

---

### 6.3 API 鉴权密钥轮换流程

```
┌──────────────────────────────────────────────────────────────────┐
│  WORKFLOW-003: 密钥轮换                                           │
│                                                                   │
│  1. 生成新密钥                                                     │
│  2. 插入 D1（新旧密钥共存）                                         │
│  3. 更新客户端配置                                                 │
│  4. 验证新密钥可用                                                 │
│  5. 删除旧密钥（7 天后）                                            │
└──────────────────────────────────────────────────────────────────┘
```

```powershell
# 1. 生成新密钥（示例）
$newKey = "bk_" + (-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 24 | % {[char]$_}))

# 2. 计算哈希并插入
# 3. 更新 BrewForge forge.js 中的 AI_API_KEY 变量
# 4. 验证：curl 诊断端点
# 5. 7 天后：DELETE FROM api_keys WHERE key_hash = '<old_hash>'
```

---

## 7. 技能包

### 7.1 PowerShell 脚本模板库

**模板 1：通用 Cloudflare API 调用封装**

```powershell
# save as: cf-api.ps1
param(
  [string]$Method = "GET",
  [string]$Path,
  [string]$Body = $null
)

$TOKEN   = $env:CF_API_TOKEN  # 从环境变量读取，不硬编码
$BASE    = "https://api.cloudflare.com/client/v4"
$HEADERS = @{
  "Authorization" = "Bearer $TOKEN"
  "Content-Type"  = "application/json"
}

$params = @{ Uri = "$BASE$Path"; Method = $Method; Headers = $HEADERS }
if ($Body) { $params.Body = $Body }

try {
  $result = Invoke-RestMethod @params
  if (-not $result.success) {
    Write-Host "❌ $($result.errors[0].message)" -ForegroundColor Red
  }
  return $result
} catch {
  Write-Host "❌ Network error: $_" -ForegroundColor Red
  return $null
}
```

**模板 2：Pages 域名批量查询**

```powershell
# save as: list-pages-domains.ps1
$TOKEN   = $env:CF_API_TOKEN
$ACCOUNT = $env:CF_ACCOUNT_ID
$HEADERS = @{ "Authorization" = "Bearer $TOKEN"; "Content-Type" = "application/json" }

$projects = @("brewcode-portal","brewcode-player","brewcode-repo","brewcode-forge")

foreach ($p in $projects) {
  $r = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/$p/domains" -Method Get -Headers $HEADERS
  Write-Host "`n=== $p ===" -ForegroundColor Cyan
  foreach ($d in $r.result) {
    $icon = if ($d.status -eq "active") { "✅" } else { "⚠️" }
    Write-Host "  $icon $($d.name) — $($d.status)"
  }
}
```

**模板 3：D1 数据库快速操作**

```powershell
# save as: d1-exec.ps1
param([string]$Sql)

cd d:\brewcode-os\workers
npx wrangler d1 execute brewcode-db --remote --command="$Sql"
```

---

### 7.2 curl 命令速查表

```powershell
# 变量
$T="<TOKEN>"; $A="<ACCOUNT_ID>"; $Z="<ZONE_ID>"

# 查询 Zone
curl -s "https://api.cloudflare.com/client/v4/zones?name=礼字号.中国" -H "Authorization: Bearer $T"

# 列出所有 CNAME 记录
curl -s "https://api.cloudflare.com/client/v4/zones/$Z/dns_records?type=CNAME" -H "Authorization: Bearer $T"

# 列出 Pages 项目
curl -s "https://api.cloudflare.com/client/v4/accounts/$A/pages/projects" -H "Authorization: Bearer $T"

# 列出 Pages 项目自定义域名
curl -s "https://api.cloudflare.com/client/v4/accounts/$A/pages/projects/<PROJECT>/domains" -H "Authorization: Bearer $T"

# 测试 AI 诊断 API
curl -X POST "https://api.礼字号.中国/diagnose" -H "Authorization: Bearer bk_test1234567890abcdef" -H "Content-Type: application/json" -d '{"brew":{},"issue":"test"}'

# 测试 AI 生成 API
curl -X POST "https://api.礼字号.中国/generate" -H "Authorization: Bearer bk_test1234567890abcdef" -H "Content-Type: application/json" -d '{"coffee":{"origin":"埃塞俄比亚","roastLevel":"浅烘","process":"水洗"},"equipment":["V60"],"preference":"明亮酸质"}'
```

---

### 7.3 wrangler CLI 常用命令

```powershell
# 部署网关
cd d:\brewcode-os\workers
npx wrangler deploy

# 查看部署状态
npx wrangler deployments list

# D1 查询
npx wrangler d1 execute brewcode-db --remote --command="SELECT * FROM api_keys;"

# D1 插入
npx wrangler d1 execute brewcode-db --remote --command="INSERT INTO api_keys (key_hash, plan, rate_limit) VALUES ('-3e3230b0', 'test', 10);"

# 查看 Worker 日志（实时）
npx wrangler tail

# 查看 KV 数据
npx wrangler kv:key list --namespace-id=2b7ce0793e8b4b4f9cfd6ce0114fc52a
```

---

### 7.4 Cloudflare Dashboard 操作速查

| 操作               | 路径                                                           |
| ------------------ | -------------------------------------------------------------- |
| 创建 API Token     | Profile → API Tokens → Create Token                            |
| 查看 Pages 项目    | Workers & Pages → Pages → 项目名                               |
| 更改部署目录       | 项目 → Settings → Build & deployments → Build output directory |
| 重试部署           | 项目 → Deployments → ⋯ → Retry deployment                      |
| 清除 CDN 缓存      | 域名 → Caching → Configuration → Purge Everything              |
| 添加 Redirect Rule | 域名 → Rules → Redirect Rules → Create Rule                    |
| 查看 DNS 记录      | 域名 → DNS → Records                                           |
| 查看 Web Analytics | 域名 → Analytics → Web Analytics                               |

---

## 8. 自进化智能体

### 8.1 智能体定义

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│   BrewCode Infra Operator (BIO)                                   │
│   ─────────────────────────────                                  │
│   域名基础设施运维专用智能体                                        │
│                                                                   │
│   触发词：域名、部署、Pages、DNS、Cloudflare、D1、鉴权、SSL、Worker │
│   知识库：本文档（domain-infra-ops.md）                            │
│   能力：查询、诊断、执行、文档更新                                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 8.2 核心指令（System Prompt）

```markdown
# BrewCode Infra Operator — 系统指令

你是 BrewCode OS 项目的域名基础设施运维智能体。你的知识库是 `domain-infra-ops.md`，
包含所有域名架构、任务模型、问题百科和标准工作流。

## 核心规则

1. **安全第一**：绝不输出或记录 API Token、密钥等敏感信息。使用占位符替代。
2. **先查后做**：任何操作前，先查询当前状态（DNS 记录、Pages 域名、Worker 部署状态）。
3. **Punycode 铁律**：操作中文域名时，永远通过 API 查询 Zone 实际 Punycode，不自行计算。
4. **幂等性**：所有操作支持重复执行而不产生副作用（创建前检查是否存在）。
5. **文档同步**：每次操作后，更新本文档中的相关章节。

## 路由规则

| 用户意图   | 执行动作     | 参考章节  |
| ---------- | ------------ | --------- |
| 新站点上线 | WORKFLOW-001 | 第 6.1 节 |
| 域名故障   | 问题百科诊断 | 第 4 章   |
| 鉴权问题   | TASK-002     | 第 3.2 节 |
| DNS 审计   | TASK-003     | 第 3.3 节 |
| 密钥轮换   | WORKFLOW-003 | 第 6.3 节 |

## 输出格式

- 所有命令使用 PowerShell 语法
- 执行前展示影响范围（dry-run）
- 执行后展示验证结果
- 错误时自动搜索问题百科匹配
```

### 8.3 自进化机制

```
┌──────────────────────────────────────────────────────────────────┐
│  自进化循环                                                       │
│                                                                   │
│  新问题出现                                                       │
│     │                                                             │
│     ├──→ 1. 诊断（匹配问题百科）                                   │
│     │      ├── 命中 → 直接应用解决方案                             │
│     │      └── 未命中 → 进入分析流程                               │
│     │                                                             │
│     ├──→ 2. 解决（实战修复）                                       │
│     │                                                             │
│     └──→ 3. 进化（追加到文档）                                     │
│            ├── 问题百科：新增条目（症状 + 根因 + 方案 + 预防）       │
│            ├── 技术难点：如涉及深层原理，追加深度解构               │
│            ├── 技能包：如有新脚本，追加模板                         │
│            └── 工作流：如有新模式，追加标准流程                     │
│                                                                   │
│  触发条件：每次解决一个未在本文档中记录的问题后自动执行。            │
└──────────────────────────────────────────────────────────────────┘
```

### 8.4 进化记录

| 日期       | 类型     | 内容         | 触发场景                                                     |
| ---------- | -------- | ------------ | ------------------------------------------------------------ |
| 2026-06-17 | 初始创建 | 全文档       | 积累 2 个会话的域名运维经验                                  |
| 2026-06-17 | 新增问题 | 问题 1-8     | forge.礼字号.中国 + brewcode.礼字号.中国 绑定                |
| 2026-06-17 | 新增难点 | 难点 5.1-5.4 | Punycode / Token 权限 / D1 鉴权 / Pages 部署模式             |
| 2026-06-17 | 新增问题 | 问题 9       | 顶级域 Apex 301 重定向（礼字号.中国 → brewcode.礼字号.中国） |

---

## 附录 A：环境变量模板

```powershell
# 保存为 $PROFILE 或手动 source
$env:CF_API_TOKEN   = "cfut_xxxxxxxxxxxxxxxxxxxx"
$env:CF_ACCOUNT_ID  = "069b4b27c46072cd26d43332ea283c70"
$env:CF_ZONE_ID     = "0d3e654c3781bc66d48468568b6ca35d"
```

## 附录 B：快速诊断命令

```powershell
# 一键诊断：检查所有站点健康状态
$T=$env:CF_API_TOKEN; $A=$env:CF_ACCOUNT_ID; $H=@{"Authorization"="Bearer $T"}
$sites = @{
  "brewcode" = "brewcode-portal"
  "player"   = "brewcode-player"
  "repo"     = "brewcode-repo"
  "forge"    = "brewcode-forge"
}
foreach ($s in $sites.GetEnumerator()) {
  $url = "https://$($s.Key).礼字号.中国"
  try {
    $r = Invoke-WebRequest -Uri $url -TimeoutSec 10 -Method Head
    Write-Host "✅ $($s.Key) — HTTP $($r.StatusCode)" -F Green
  } catch {
    Write-Host "❌ $($s.Key) — $_" -F Red
  }
}
# API 网关
try {
  $r = Invoke-WebRequest -Uri "https://api.礼字号.中国/translate" -TimeoutSec 10
  Write-Host "✅ api — HTTP $($r.StatusCode)" -F Green
} catch {
  Write-Host "❌ api — $_" -F Red
}
```

---

> **文档自进化标记**：本文档记录 BrewCode OS 域名基础设施运维的全部实战经验。每次解决新问题后，请更新第 4 章（问题百科）和第 8.4 节（进化记录）。这是活的文档，不是死的档案。
