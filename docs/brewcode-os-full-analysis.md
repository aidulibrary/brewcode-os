# BrewCode OS 项目全面分析报告

> **版本：** v1.1（修正版）
> **日期：** 2026-06-18
> **修正说明：** 本版修正了 v1.0 中三处错误：1) Portal 站点部署状态；2) docs/portal/ 与 packages/portal/ 的目录关系；3) AI 服务层 API Key 当前状态
> **用途：** 项目全景快照，供后续决策和知识同步参考

---

## 一、项目定位与概述

**BrewCode OS（中文品牌名：礼字号）** 是一个开源项目，旨在为全球咖啡冲煮建立一套**通用数字语言**。它的核心资产是一个名为 `.brew` 的 JSON 标准文件格式，用于描述冲一杯咖啡所需的全部参数（粉量、水温、研磨度、每一步的注水手法）。项目以"咖啡冲煮的数字操作系统"为定位，类比 HTTP 定义了网页传输协议，`.brew` 则定义了咖啡冲煮的数据协议。

**创始人：** 李泊言 (Bowen Lee)，项目启动于 2026 年。GitHub 仓库：`aidulibrary/brewcode-os`。

这不是一个公司，不是一个 App，而是一个**开源标准运动**。核心哲学是"风味-参数同构"（任何可描述的风味差异，必然对应可测量的参数差异）。

---

## 二、技术栈

### 前端（零框架、零构建）
- **纯原生 HTML/CSS/JavaScript (ES2020+)**，不引入 React/Vue/Svelte 等任何前端框架
- 三个核心工具（Player、Repo、Forge）均为单文件 SPA，每个工具的文件结构为 `index.html + 模块.css + 模块.js`
- BrewPlayer 实现了 **PWA（渐进式网页应用）**，支持离线使用，包含 Service Worker 缓存策略和 Web App Manifest
- 国际化方案：自研轻量级 i18n 加载器（`BrewCodeI18n`），词条内嵌，支持中英文切换，体积 < 2KB
- 代码编辑器：BrewForge 使用 CodeMirror 6（约 200KB）作为 JSON 代码编辑视图

### 后端（Cloudflare 生态）
- **Cloudflare Workers**：AI 服务层，运行在 Cloudflare 边缘网络
- **Cloudflare D1**：SQLite 兼容的边缘数据库，存储 API 密钥、设备注册表
- **Cloudflare KV**：键值存储，用于 API 速率限制
- **Cloudflare Pages**：4 个静态站点 + 1 个 API 网关，全部托管在 Pages 上
- **DeepSeek API**：作为 AI 引擎，提供风味诊断和方案生成能力

### 标准与模式
- `.brew` 文件格式：遵循 **JSON Schema (Draft 2020-12)** 规范
- 许可证：`.brew` 标准用 **CC0 1.0**（公共领域），所有代码用 **MIT**
- 格式：`wrangler.toml` 配置，`git` 版本控制

---

## 三、六层架构体系

BrewCode OS 采用六层独立但互通的架构设计，每一层可单独使用：

| 层级 | 名称 | 说明 |
|------|------|------|
| 1 | **标准层 (Standard)** | `.brew` JSON Schema (CC0)，位于 `packages/standards/brew.schema.json` |
| 2 | **工具层 (Tools)** | BrewPlayer（播放器）/ BrewRepo（仓库）/ BrewForge（编辑器） |
| 3 | **AI 服务层 (AI Services)** | 风味诊断 / 方案生成 / 语义翻译（Cloudflare Workers） |
| 4 | **数据层 (Data)** | 50 个种子方案，覆盖 20 个产区、6 种器具、4 位世界冠军署名 |
| 5 | **基础设施层 (Infrastructure)** | Cloudflare Pages + Workers + D1 + R2 + GitHub |
| 6 | **认证层 (Certification)** | BrewCode Compatible 硬件认证生态（推进中） |

---

## 四、核心模块与功能详解

### 1. 标准层 -- `.brew` JSON Schema
**路径：** `d:\brewcode-os\packages\standards\brew.schema.json`

定义了 `.brew` 文件的完整数据结构，包含 6 个顶层字段：
- `meta`：方案元信息（名称、版本、作者、许可证、标签、创建时间等）
- `coffee`：咖啡豆信息（产地、豆种、处理法、烘焙度、风味描述等）
- `equipment`：冲煮器具信息（滤杯、滤纸、磨豆机、手冲壶、电子秤等）
- `recipe`：冲煮配方核心参数（粉量、水量、粉水比、研磨度、水温、闷蒸参数等）
- `steps`：冲煮步骤列表（按顺序执行，包含 13 种操作类型：prepare/rinse/grind/bloom/pour/stir/swirl/drawdown 等）
- `result`：冲煮结果记录（可选，含品鉴评分、TDS、萃取率、风味笔记等）

### 2. 工具层 -- 三个核心工具

#### BrewPlayer（冲煮播放器）
**路径：** `d:\brewcode-os\packages\player\`
**域名：** `player.礼字号.中国`

- 功能：载入 `.brew` 文件，渲染成分步倒计时的冲煮向导
- 包含状态机设计（IDLE / LOADED / PLAYING / PAUSED / DONE）
- PWA 支持：包含 `manifest.json`、`sw.js`（Service Worker 缓存）、图标（192x192 + 512x512）
- 内嵌 50 个种子方案清单（`seeds-manifest.json`），可按器具/烘焙度/产区筛选
- 设计原则：极简 UI，冲煮时"扫一眼就够"，注意力留在咖啡上

#### BrewForge（方案编译器）
**路径：** `d:\brewcode-os\packages\forge\`
**域名：** `forge.礼字号.中国`

- 功能：可视化 `.brew` 文件创建和编辑工具
- 双模式编辑：表单模式（适合新手）+ 代码模式（CodeMirror，适合极客）
- 内置 Schema 实时校验
- 支持导入/导出 `.brew` 文件
- 集成 AI 功能：风味诊断（调用 `/diagnose`）和方案生成（调用 `/generate`）
- 遵循 `brew.schema.json` 六段数据结构

#### BrewRepo（方案仓库）
**路径：** `d:\brewcode-os\packages\repo\`
**域名：** `repo.礼字号.中国`

- 功能：`.brew` 文件的公共浏览和搜索平台
- 内嵌种子方案清单，支持按器具、烘焙度、产区、关键词筛选
- 烘焙度/器具名称均做了规范化处理函数
- 每个方案可一键跳转到 BrewPlayer 打开

### 3. AI 服务层 -- 三个 Cloudflare Workers

#### 风味诊断 Worker (`brewcode-diagnose`)
**路径：** `d:\brewcode-os\workers\diagnose\index.js`

- 输入：`.brew` 方案 + 用户问题描述（如"这杯偏苦"）
- 输出：具体到操作层面的参数调整建议（研磨度、水温、粉水比、注水手法等）
- 使用 DeepSeek API (`deepseek-chat`)，超时 15s，最多重试 2 次
- System Prompt 包含常见问题对应策略（偏苦/偏酸/太淡/太浓/涩）

#### 方案生成 Worker (`brewcode-generate`)
**路径：** `d:\brewcode-os\workers\generate\index.js`

- 输入：豆子信息 + 设备列表 + 口味偏好
- 输出：完整 `.brew` JSON 方案
- 使用 DeepSeek API，超时 25s，最多重试 3 次
- 包含详细的 Schema 提示和参数推荐规则

#### 语义翻译 Worker (`brewcode-translate`)
**路径：** `d:\brewcode-os\workers\translate\index.js`

- 功能：磨豆机刻度 → 微米值翻译
- 查询 D1 数据库的 `device_registry` 表
- 示例：`Comandante C40 22 clicks` → `600μm`

#### API 网关 (`brewcode-gateway`)
**路径：** `d:\brewcode-os\workers\gateway\index.js`

- 统一入口：`api.礼字号.中国`
- 路由分发：`/diagnose`、`/generate`、`/translate`
- 鉴权系统：Bearer Token (`bk_xxx` 前缀)，D1 存储 key_hash
- 速率限制：基于 KV 的每分钟调用次数限制
- CORS 支持：全开放跨域头

#### ⚠️ AI 服务层当前状态

> **API Key 已删除**：`wrangler.toml` 中配置的 DeepSeek API Key 已在 DeepSeek 平台侧删除/失效。
>
> **诊断和生成功能不可用**：`/diagnose` 和 `/generate` 端点当前返回 502（Upstream service unavailable），根因是 DeepSeek API 调用失败——Worker 代码向 DeepSeek 发起请求时，因 Key 无效而返回错误，经重试后最终向上游网关返回失败状态。
>
> **翻译 Worker 正常**：`/translate` 端点不依赖 DeepSeek API，仅查询 D1 数据库，功能正常。

---

### 4. 官网 Portal
**路径：** 活跃部署目录 `d:\brewcode-os\packages\portal\`，历史部署目录 `d:\brewcode-os\docs\portal\`
**域名：** `brewcode.礼字号.中国`（唯一活跃入口）

- 七屏结构的品牌官网，展示项目宣言、六层架构、工具矩阵、数据叙事、加入社区等
- 中英文双语支持（内嵌 i18n 词条）
- 深色/浅色主题切换

> **目录关系说明**：`packages/portal/` 和 `docs/portal/` 是同一官网的两个不同部署路径。`packages/portal/` 是当前活跃开发和部署目录，`docs/portal/` 是历史遗留目录（早期 Pages 项目 `brewcode-portal` 的源目录配置为 `docs/portal/`）。后续维护者应以 `packages/portal/` 为准。两个目录当前内容一致（通过文件同步保持），但 `docs/portal/_redirects` 是仅存在于历史路径中的重定向配置文件。

> **域名状态说明**：`portal.礼字号.中国` 已被废弃，不再作为独立站点使用。官网唯一活跃入口为 `brewcode.礼字号.中国`。`礼字号.中国` 顶级域已通过 `_redirects` 文件配置 301 重定向至 `brewcode.礼字号.中国`。

---

## 五、部署架构

### Cloudflare 生态全栈部署

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
    │ 礼字号.中国  │          │ (4 个站点)   │           │ api.礼字号.中国   │
    │ (301→主站)  │          │              │           │ (Worker)         │
    └────────────┘          └──────┬───────┘           └─────────────────┘
                                   │
          ┌────────────┬───────────┼───────────┬────────────┐
          │            │           │           │            │
    ┌─────┴─────┐ ┌────┴────┐ ┌───┴────┐ ┌────┴────┐
    │ brewcode  │ │ player  │ │ repo   │ │ forge   │
    │ 官网首页   │ │ 冲煮器   │ │ 方案库  │ │ AI编辑器 │
    │ Pages     │ │ Pages   │ │ Pages  │ │ Pages   │
    └───────────┘ └─────────┘ └────────┘ └─────────┘
```

### 站点注册表

| 站点 | 域名 | Pages 项目名 | 活跃源目录 | 状态 |
|------|------|-------------|-----------|------|
| 官网首页 | `brewcode.礼字号.中国` | `brewcode-portal` | `packages/portal/` | active |
| 冲煮播放器 | `player.礼字号.中国` | `brewcode-player` | `packages/player/` | active |
| 方案仓库 | `repo.礼字号.中国` | `brewcode-repo` | `packages/repo/` | active |
| AI 编辑器 | `forge.礼字号.中国` | `brewcode-forge` | `packages/forge/` | active |
| API 网关 | `api.礼字号.中国` | —（Worker） | `workers/gateway/` | active |
| ~~旧 Portal~~ | ~~`portal.礼字号.中国`~~ | — | — | 已废弃 |
| 顶级域 | `礼字号.中国` | — | — | 301 → brewcode |

### 基础设施组件
- **D1 数据库** (`brewcode-db`，ID: `81422e38-499c-4f13-810a-98fa1f6a18f4`)：存储 `api_keys` 和 `device_registry` 两张表
- **KV 命名空间** (ID: `2b7ce0793e8b4b4f9cfd6ce0114fc52a`)：API 速率限制
- **DeepSeek API**：AI 引擎，Key 通过 Worker 环境变量注入
- **GitHub**：代码托管、版本控制、协作平台

---

## 六、目录结构总览

```
d:\brewcode-os\
├── README.md                          # 项目说明
├── .gitignore                         # 仅忽略 .wrangler/
├── .prettierrc                        # 代码格式化配置
├── migrations/                        # 数据库迁移脚本
│   ├── 001_api_keys.sql               # API 密钥表
│   └── 002_device_registry.sql        # 设备注册表（含预置数据）
├── packages/                          # 核心代码包
│   ├── common/                        # 共享资源
│   │   ├── i18n/                      # 国际化（中/英词条 + 加载器）
│   │   └── logo.svg                   # 品牌 Logo
│   ├── standards/                     # 标准层
│   │   └── brew.schema.json           # .brew JSON Schema 规范
│   ├── player/                        # BrewPlayer 冲煮播放器
│   │   ├── index.html                 # 主页面
│   │   ├── player.js                  # 核心逻辑（状态机 + 渲染）
│   │   ├── player.css                 # 样式
│   │   ├── manifest.json              # PWA 清单
│   │   ├── sw.js                      # Service Worker
│   │   ├── seeds-manifest.json        # 种子方案清单
│   │   ├── sample.brew                # 示例 .brew 文件
│   │   ├── icon-192.png / icon-512.png
│   │   └── seeds/                     # 50 个种子 .brew 方案
│   ├── forge/                         # BrewForge 方案编辑器
│   │   ├── index.html
│   │   ├── forge.js                   # 编辑器核心（表单+代码双模式）
│   │   └── forge.css
│   ├── repo/                          # BrewRepo 方案仓库
│   │   ├── index.html
│   │   ├── repo.js                    # 筛选/搜索/播放跳转
│   │   └── repo.css
│   └── portal/                        # 【活跃】官网 Portal（当前部署目录）
│       ├── index.html
│       ├── portal.js                  # i18n + 主题切换
│       └── portal.css
├── seeds/                             # 额外种子方案（genesis-brews/）
│   └── genesis-brews/                 # 50 个创世方案（覆盖 20 产区、6 器具）
├── workers/                           # Cloudflare Workers
│   ├── wrangler.toml                  # 网关总配置
│   ├── gateway/index.js               # API 网关（路由 + 鉴权 + 限流）
│   ├── diagnose/                      # 风味诊断 Worker
│   │   ├── index.js
│   │   └── wrangler.toml
│   ├── generate/                      # 方案生成 Worker
│   │   ├── index.js
│   │   └── wrangler.toml
│   └── translate/                     # 语义翻译 Worker
│       ├── index.js
│       └── wrangler.toml
├── docs/                              # 文档中心
│   ├── portal/                        # 【历史】官网旧部署目录（含 _redirects）
│   │   ├── index.html
│   │   ├── portal.css
│   │   ├── portal.js
│   │   └── _redirects                 # 301 重定向：礼字号.中国 → brewcode.礼字号.中国
│   ├── BrewCode OS 产品架构文档 v0.1-01版.md
│   ├── 《BrewCode OS 技术选型文档 v0.1》.md
│   ├── domain-infra-ops.md            # 域名基础设施运维手册
│   ├── BrewCode OS 平台服务分层设计 v0.1（重构版）.md
│   ├── deploy-guide-player.md
│   ├── phase-1-delivery-report.md
│   ├── phase-2-plan.md
│   ├── forge-validation-report.md
│   ├── 域名体系调整记录.md
│   ├── 第一阶段产出：创世素材与开发宣言.md
│   └── BrewCode OS — 诞生记/         # 诞生记系列文档
├── tasks/                             # 运维脚本
│   └── portal-redirect.ps1            # PowerShell 域名重定向脚本
└── .trae/skills/                      # TRAE IDE 技能包
    └── brewcode-infra-operator/
        └── SKILL.md                   # 基础设施运维智能体定义
```

---

## 七、设计哲学与技术约束

1. **零框架**：纯 HTML/CSS/JS，不引入 React/Vue/Svelte
2. **零构建**：不经过 npm/webpack，直接写原生代码
3. **静态优先**：前端全部静态托管，后端用 Cloudflare Workers
4. **依赖原则**：每个外部依赖必须能回答"如果它明天停止维护，我一个人能在两周内替换它吗？"
5. **数据主权**：不拥有用户数据，不售卖数据，不做广告
6. **工具隐去**：所有界面"扫一眼就够"
7. **知识开源主义**：核心标准永远以 CC0/MIT 发布，永不封闭
8. **不融资**：运营成本极低，自给自足

---

## 八、总结

BrewCode OS 是一个定位清晰的开源项目，试图为咖啡冲煮领域建立一套类似 HTTP 之于互联网的通用数字标准。项目采用极简技术栈（纯原生前端 + Cloudflare 边缘计算），六层架构各层解耦，四个站点已上线运行，50 个种子方案覆盖主流冲煮场景。项目由个人独立开发者创建，运营成本极低，所有核心资产以 CC0/MIT 开放。

---

> **文档版本**：v1.1（修正版） | **生成日期**：2026-06-18 | **作者**：BrewCode OS 项目分析