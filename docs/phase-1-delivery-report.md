# BrewCode OS 第一阶段交付报告

> **版本：** v1.0
> **日期：** 2026-06-15
> **状态：** ✅ 已完成并上线
> **用途：** 交接文档 + 下一阶段 TRAE 对话上下文锚点

---

## 一、项目概览

| 项目                         | 地址                                       | 状态                         |
| ---------------------------- | ------------------------------------------ | ---------------------------- |
| **BrewRepo**（方案仓库）     | https://repo.礼字号.中国                   | ✅ 正常                      |
| **BrewPlayer**（冲煮播放器） | https://player.礼字号.中国                 | ✅ 正常                      |
| **种子库**                   | 50 个 `.brew` 冲煮方案                     | ✅ 全部通过 JSON Schema 校验 |
| **GitHub**                   | https://github.com/aidulibrary/brewcode-os | ✅ main 分支                 |

---

## 二、架构总览

```
GitHub 仓库: aidulibrary/brewcode-os
│
├── packages/
│   ├── standards/          ← .brew JSON Schema v0.1
│   │   └── brew.schema.json
│   │
│   ├── repo/               ← BrewRepo（方案仓库）
│   │   ├── index.html          → Cloudflare Pages 项目: brewcode-repo
│   │   ├── repo.js             → 自定义域名: repo.礼字号.中国
│   │   └── repo.css
│   │
│   ├── player/             ← BrewPlayer（冲煮播放器）
│   │   ├── index.html          → Cloudflare Pages 项目: brewcode-player
│   │   ├── player.js           → 自定义域名: player.礼字号.中国
│   │   ├── player.css
│   │   ├── sw.js               (Service Worker 离线缓存)
│   │   ├── manifest.json       (PWA 配置)
│   │   └── seeds/              (50 个 .brew 种子文件)
│   │       ├── 01-v60-01-light-yirgacheffe-natural.brew.json
│   │       ├── 02-v60-02-medium-huila-washed.brew.json
│   │       ├── ...
│   │       └── 50-v60-01-medium-dark-sidamo-washed.brew.json
│   │
│   └── portal/             ← 门户首页（待开发）
│
├── docs/                   ← 所有文档
│   ├── phase-1-delivery-report.md          ← 本文件
│   ├── TRAE 系统初始化指令.md               ← 新对话上下文锚点
│   ├── BrewCode OS 产品架构文档 v0.1-01版.md
│   ├── BrewCode OS 平台服务分层设计 v0.1（重构版）.md
│   ├── 第一阶段产出：创世素材与开发宣言.md
│   └── ...
│
└── workers/                ← Cloudflare Workers（AI 服务层，待开发）
```

### 关键架构决策

1. **Repo 和 Player 是独立 Cloudflare Pages 项目**，通过绝对域名跨项目跳转
2. **`?brew=seeds/文件名`** 用相对路径，Player 从自己域名下 fetch，避免中文域名 punycode/Unicode 编码不同源问题
3. **本地开发兼容**：`file://` 协议下自动切换为 `../player/` 相对路径
4. **数据内嵌**：`SEEDS_MANIFEST` 直接写在 `repo.js` 中，不依赖 fetch 外部 JSON 文件
5. **零框架**：全部原生 JavaScript（ES2020+），无 npm 依赖，无构建工具链

---

## 三、BrewRepo 功能清单

```
┌─────────────────────────────────────────────────┐
│  顶部栏: 统计数据（50 个方案 / 器具数 / 产区数）  │
│  筛选栏: 器具类型 / 烘焙度 / 产地                 │
│  搜索框: 按名称、风味、产国、器具搜索              │
│  卡片列表: 50 张方案卡片，支持筛选和搜索           │
│  详情面板（点击卡片展开）:                         │
│    ├─ 方案名称 / 作者 / 风味轮 / 咖啡豆信息        │
│    ├─ 器具参数 / 冲煮参数（粉量/水量/水温/时间）    │
│    ├─ 在 Player 中打开 → 跳转并自动加载方案        │
│    └─ 复制 .brew 内容到剪贴板                     │
│  页脚: 共创邀请文案 + GitHub 链接                  │
└─────────────────────────────────────────────────┘
```

### 核心代码路径

| 功能          | 文件:行号                                                | 关键函数                                                        |
| ------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| 域名/环境检测 | [repo.js:L6-L12](packages/repo/repo.js#L6-L12)           | `isLocal`, `PLAYER_BASE`, `SEEDS_BASE`                          |
| 数据加载      | [repo.js:L1750-L1760](packages/repo/repo.js#L1750-L1760) | `loadManifest()` → `SEEDS_MANIFEST` → `allRecipes`              |
| 卡片渲染      | [repo.js:L1600-L1650](packages/repo/repo.js#L1600-L1650) | `renderCards()` → `getFiltered()` → `forEach` 生成 DOM          |
| 筛选逻辑      | [repo.js:L130-L200](packages/repo/repo.js#L130-L200)     | `matchesFilters()`, `matchesSearch()`, `getFiltered()`          |
| Player 跳转   | [repo.js:L1693-L1696](packages/repo/repo.js#L1693-L1696) | `window.open(PLAYER_BASE + '?brew=' + SEEDS_DIR + recipe.file)` |
| 复制 .brew    | [repo.js:L1698-L1706](packages/repo/repo.js#L1698-L1706) | `fetch(SEEDS_BASE + recipe.file)` → `clipboard.writeText()`     |
| 初始化入口    | [repo.js:L1778-L1793](packages/repo/repo.js#L1778-L1793) | `DOMContentLoaded` → `loadManifest()` → `init()`                |

---

## 四、BrewPlayer 功能清单

```
┌─────────────────────────────────────────────────┐
│  载入方案（三种方式）:                             │
│    ├─ 粘贴 JSON 文本                              │
│    ├─ 打开本地 .brew 文件                         │
│    └─ URL 参数 ?brew=seeds/文件名                  │
│  方案概览（载入后显示）:                           │
│    ├─ 方案名称 / 作者 / 描述                      │
│    ├─ 咖啡豆信息（名称/烘焙商/烘焙度/处理法）       │
│    ├─ 器具信息（冲煮器/磨豆机/滤纸）               │
│    └─ 冲煮参数（粉量/水量/粉水比/研磨度/水温/时间） │
│  开始冲煮 → 分步引导:                              │
│    ├─ 进度条（步骤 N / 总步骤数）                  │
│    ├─ 步骤标签（闷蒸/注水/搅拌/等待...）           │
│    ├─ 注水量显示（单次 + 累计）                    │
│    ├─ 注水手法（水流方式/水流强度）                 │
│    ├─ 计时器（开始/暂停，倒计时）                  │
│    └─ 下一步按钮                                   │
│  完成页面:                                         │
│    ├─ 步骤统计                                     │
│    └─ 结果记录（实际用时/出杯量/TDS/萃取率/评分）   │
│  Service Worker: 离线可用                          │
└─────────────────────────────────────────────────┘
```

### 核心代码路径

| 功能         | 文件:行号                                                  | 关键函数                                              |
| ------------ | ---------------------------------------------------------- | ----------------------------------------------------- |
| URL 参数加载 | [player.js:L420-L447](packages/player/player.js#L420-L447) | `URLSearchParams` → `fetch(brewUrl)` → `loadRecipe()` |
| 方案解析     | [player.js:L50-L70](packages/player/player.js#L50-L70)     | `loadRecipe()` 解析 JSON，校验 meta/recipe/steps      |
| 状态机       | [player.js:L15-L25](packages/player/player.js#L15-L25)     | `STATE`: IDLE → LOADED → PLAYING → PAUSED → DONE      |
| 概览渲染     | [player.js:L75-L140](packages/player/player.js#L75-L140)   | `renderOverview()` 渲染方案信息                       |
| 步骤渲染     | [player.js:L155-L240](packages/player/player.js#L155-L240) | `renderStep()` 渲染当前步骤详情                       |
| 计时器       | [player.js:L260-L285](packages/player/player.js#L260-L285) | `startTimer()` / `stopTimer()` / `pauseTimer()`       |
| 离线缓存     | [sw.js:L1-L52](packages/player/sw.js#L1-L52)               | Service Worker cache-first 策略                       |

---

## 五、本阶段修复的 Bug（共 5 个）

| #   | 问题                                    | 根因                                                                    | 修复方案                                                 | 涉及文件     |
| --- | --------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------- | ------------ |
| 1   | 卡片列表显示"没有匹配的方案"            | `SEEDS_MANIFEST` 缺失 01-20 号条目，只从 21 号开始                      | 从 50 个 `.brew` 文件自动提取元数据，重建完整清单        | `repo.js`    |
| 2   | Player 跳转后不加载方案                 | `../player/` 相对路径跨不过 Cloudflare Pages 独立项目边界               | 改用绝对域名 `https://player.礼字号.中国` + 环境检测     | `repo.js`    |
| 3   | Player 跳转后仍显示粘贴按钮，不自动加载 | `?brew=` 传完整 URL 含中文域名，浏览器 punycode 编码后与 Unicode 不同源 | 改回相对路径 `seeds/文件名`，Player 从自己域名下 resolve | `repo.js`    |
| 4   | 部署后旧缓存不更新                      | 静态资源无版本号，CDN 和浏览器缓存旧文件                                | HTML 引用加版本号 `repo.js?v=20260615`                   | `index.html` |
| 5   | 复制 .brew 内容到剪贴板失败             | 复制按钮用相对路径，跨项目取不到种子文件                                | 改用 `SEEDS_BASE` 完整 URL                               | `repo.js`    |

### 修复涉及的关键代码变更

**环境检测与域名配置（repo.js 第 6-12 行）：**

```javascript
const isLocal = window.location.protocol === 'file:';
const PLAYER_BASE = isLocal ? '../player/index.html' : 'https://player.礼字号.中国';
const SEEDS_DIR = 'seeds/';
const SEEDS_BASE = isLocal ? '../player/seeds/' : 'https://player.礼字号.中国/seeds/';
```

**Player 跳转 URL 构造（repo.js 第 1693-1696 行）：**

```javascript
$('#btn-open-player').onclick = function () {
  const playerUrl = PLAYER_BASE + '?brew=' + encodeURIComponent(SEEDS_DIR + recipe.file);
  window.open(playerUrl, '_blank');
};
```

**复制 .brew 内容（repo.js 第 1698-1706 行）：**

```javascript
$('#btn-copy-json').onclick = async function () {
  try {
    const resp = await fetch(SEEDS_BASE + recipe.file);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const text = await resp.text();
    await navigator.clipboard.writeText(text);
    showToast('已复制 .brew 内容到剪贴板');
  } catch (e) {
    showToast('复制失败：' + e.message);
  }
};
```

---

## 六、种子方案覆盖

| 器具                | 数量 | 方案编号                                              |
| ------------------- | ---- | ----------------------------------------------------- |
| V60                 | 14   | 01, 02, 08, 11, 16, 27, 31, 37, 41, 46, 50 + 深烘系列 |
| Kalita Wave         | 12   | 03, 09, 12, 18, 22, 28, 32, 38, 42, 48 + 深烘系列     |
| Origami             | 9    | 04, 10, 17, 24, 30, 35, 43, 49 + 深烘系列             |
| Chemex              | 8    | 05, 13, 19, 23, 29, 33, 39, 47                        |
| Aeropress（爱乐压） | 4    | 06, 14, 20, 25, 34, 40, 44                            |
| 法压壶              | 3    | 07, 15, 26, 36, 45                                    |

**烘焙度分布：** 浅烘 / 中烘 / 中深烘 / 深烘 全覆盖
**产国分布：** 埃塞俄比亚、肯尼亚、巴拿马、哥伦比亚、巴西、印尼、危地马拉、哥斯达黎加、云南、巴厘、巴布亚新几内亚
**方案来源：** brewcode-os/genesis（AI 生成）+ 冠军方案（粕谷哲 4:6 法等）

### 种子文件命名规范

```
{序号}-{器具}-{规格}-{烘焙度}-{产区}-{处理法}.brew.json

示例: 01-v60-01-light-yirgacheffe-natural.brew.json
      ↑   ↑   ↑   ↑       ↑           ↑
     序号 器具 规格 烘焙度  产区        处理法
```

---

## 七、部署信息

### Cloudflare Pages 项目

| 项目名            | 源目录             | 自定义域名           | 生产分支 |
| ----------------- | ------------------ | -------------------- | -------- |
| `brewcode-repo`   | `packages/repo/`   | `repo.礼字号.中国`   | `main`   |
| `brewcode-player` | `packages/player/` | `player.礼字号.中国` | `main`   |

### 部署流程

1. 本地修改代码 → `git add` → `git commit` → `git push` 到 GitHub `main` 分支
2. Cloudflare Pages 自动检测 `main` 分支变更，触发构建和部署
3. 无需构建命令，无需输出目录配置（纯静态文件直接部署）
4. 部署时间约 30-60 秒
5. 自定义域名自动生效（DNS 已配置 CNAME 指向 Cloudflare Pages）

### 缓存注意事项

- Cloudflare CDN 默认缓存静态资源，部署后可能需要清除缓存
- 浏览器需硬刷新（`Ctrl+Shift+R`）或使用无痕窗口测试
- 已通过版本号 `?v=20260615` 防止 CSS/JS 缓存

---

## 八、技术栈

| 层   | 技术选型                      | 备注                                  |
| ---- | ----------------------------- | ------------------------------------- |
| 前端 | 原生 JavaScript (ES2020+)     | 零框架，零 npm 依赖                   |
| 样式 | 原生 CSS                      | 自定义属性（CSS Variables）主题       |
| 部署 | Cloudflare Pages              | 纯静态托管，自动 GitHub 集成          |
| 离线 | Service Worker                | PWA，cache-first 策略                 |
| 协作 | GitHub Issues / Pull Requests | 不自己搭建用户系统                    |
| 标准 | `.brew` JSON Schema v0.1      | `packages/standards/brew.schema.json` |

---

## 九、已知限制与待办

| 项目                               | 说明                                                                | 优先级 |
| ---------------------------------- | ------------------------------------------------------------------- | ------ |
| 种子文件命名与 SEEDS_MANIFEST 同步 | 当前手动维护，若新增种子文件需同步更新 manifest                     | 中     |
| 风味轮渲染                         | 部分风味词没有对应的 emoji 图标，显示为文字                         | 低     |
| Player 离线种子文件                | Service Worker 仅缓存了 `seeds-manifest.json`，未缓存 50 个种子文件 | 中     |
| 门户首页                           | `packages/portal/` 目录有基础文件，但未部署                         | 高     |
| BrewForge（编译器）                | 可视化创建和编辑 `.brew` 文件，尚未开发                             | 高     |
| AI 服务层                          | 风味诊断、方案生成、语义翻译，尚未开发                              | 中     |

---

## 十、Git 提交历史（本阶段）

```
26da663 fix: ?brew=参数改用相对路径，避免中文域名punycode编码导致fetch失败
5cfd630 fix: 恢复 Player 域名为 player.礼字号.中国
5c244d2 fix: Player域名改为 brewcode-player.pages.dev
af50e52 fix: Repo传完整URL到Player + Player增强调试日志
2e0373c fix: 修复 Player 跨项目跳转路径——Repo 与 Player 为独立 Cloudflare Pages 项目
8394cb2 fix: HTML 静态资源加版本号防缓存，repo.js?v=20260615
2126a98 fix: BrewRepo 渲染修复——Manifest 补全01-50 + DOM安全包裹 + 调试日志
75c6567 feat: 全部50个种子.brew文件生成完毕，JSON校验全部通过
21f977f feat: 全部50个种子.brew文件生成完毕，JSON校验全部通过
bbcfa56 fix: BrewRepo 内嵌种子清单数据，修复 file:// 协议下 fetch JSON 被拦截
```

---

## 十一、TRAE 新对话快速启动

在新 TRAE 对话窗口中，粘贴以下内容即可让 TRAE 快速理解项目全貌：

```
请阅读 docs/phase-1-delivery-report.md 了解 BrewCode OS 第一阶段完整状态。
当前项目仓库位于 d:\brewcode-os，所有代码已推送至 GitHub main 分支。
两个 Cloudflare Pages 项目已上线：
  - BrewRepo: https://repo.礼字号.中国
  - BrewPlayer: https://player.礼字号.中国
核心文件：
  - packages/repo/repo.js（方案仓库逻辑）
  - packages/player/player.js（冲煮播放器逻辑）
  - packages/player/seeds/（50 个种子 .brew 文件）
  - packages/standards/brew.schema.json（.brew 标准）
```

---

## 十二、下一阶段方向建议

1. **门户首页**：部署 `packages/portal/`，作为 BrewCode OS 总入口
2. **BrewForge**：可视化 `.brew` 方案编辑器，创建和编辑冲煮方案
3. **种子文件增量更新**：新增种子文件时自动同步 SEEDS_MANIFEST
4. **Player 离线增强**：Service Worker 预缓存全部 50 个种子文件
5. **AI 服务层**：风味诊断、方案生成、语义翻译

---

_文档生成时间：2026-06-15 | 作者：BrewCode OS 创始架构师 — 李泊言（Bowen Lee）_
