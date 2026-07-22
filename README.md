# BrewCode OS · 礼字号

> 咖啡冲煮的通用语言
> The Universal Language for Coffee Brewing

一粒种子，为咖啡世界建立数字秩序。
A seed that brings digital order to the world of coffee.

---

## 这是什么

BrewCode OS 是一个开源项目，为全球咖啡冲煮爱好者建立通用数字语言。核心资产是一个名为 `.brew` 的 JSON 文件格式——它描述冲一杯咖啡所需的全部参数：粉量、水温、研磨度、每一步的注水手法。任何一个 `.brew` 文件，可以在任何设备上被解析、被执行、被复现。

这不是一个 App。这是一个标准。就像 HTTP 定义了网页的传输协议，`.brew` 定义了咖啡冲煮的数据协议。

---

## 六层架构

BrewCode OS 不是一个大一统平台，而是六层独立但互通的架构。每一层都可以单独使用，也可以组合成完整闭环。

| 层级 | 名称                          | 说明                                                      |
| :--: | ----------------------------- | --------------------------------------------------------- |
|  ①   | **标准层** Standard           | `.brew` JSON Schema (CC0)，描述冲煮方案的完整数据结构     |
|  ②   | **工具层** Tools              | BrewPlayer（播放）/ BrewRepo（仓库）/ BrewForge（编辑器） |
|  ③   | **AI 服务层** AI Services     | 风味诊断 / 方案生成 / 语义翻译（Cloudflare Workers）      |
|  ④   | **数据层** Data               | 100 个种子方案，覆盖 20 个产区、6 种器具、4 位世界冠军署名 |
|  ⑤   | **基础设施层** Infrastructure | Cloudflare Pages + Workers + D1 + R2 + GitHub             |
|  ⑥   | **认证层** Certification      | BrewCode Compatible 硬件认证生态（推进中）                |

---

## 六个站点

| 站点       | 地址                                                                  | 用途                                           |
| ---------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| 官网       | [brewcode.礼字号.中国](https://brewcode.礼字号.中国)                  | 项目入口，诞生记，工具导航                     |
| BrewPlayer | [player.礼字号.中国](https://player.礼字号.中国)                      | 打开 `.brew` 文件，分步冲煮引导，PWA 离线可用  |
| BrewRepo   | [repo.礼字号.中国](https://repo.礼字号.中国)                          | 浏览方案库，按器具/烘焙度/产区筛选搜索         |
| BrewForge  | [forge.礼字号.中国](https://forge.礼字号.中国)                        | 可视化创建和编辑 `.brew` 文件，表单+代码双模式 |
| AI 服务    | [api.礼字号.中国](https://api.礼字号.中国)                            | 风味诊断、方案生成、语义翻译（部署中）         |
| GitHub     | [aidulibrary/brewcode-os](https://github.com/aidulibrary/brewcode-os) | 源码、标准、Issues 协作                        |

---

## 快速上手

**第一步：冲一杯。** 打开 [BrewPlayer](https://player.礼字号.中国)，选一个种子方案，手机放秤旁边，跟着分步引导走。扫一眼就够，注意力留在咖啡上。

**第二步：找方案。** 打开 [BrewRepo](https://repo.礼字号.中国)，按器具、烘焙度、产区筛选。从 V60 到法压壶，从浅烘到深烘，从埃塞到云南——50 个方案覆盖主流冲煮场景。

**第三步：创造自己的。** 打开 [BrewForge](https://forge.礼字号.中国)，表单模式快速填参数，代码模式直接编辑 JSON。内置 Schema 实时校验，写完导出 `.brew` 文件，分享给任何人。

---

## 贡献指南

BrewCode OS 是一个开放项目。标准、工具、方案——全部开源。你不需要申请权限，Fork 即可开始。

### 贡献方式

- **提交方案**：在 `packages/player/seeds/` 目录下新增 `.brew` 文件，附带你的冲煮笔记
- **改进工具**：Player、Repo、Forge 都是纯前端单文件，修改 `packages/` 下对应目录
- **完善 Schema**：对 `.brew` 标准有建议，修改 `packages/standards/brew.schema.json`
- **翻译**：帮助完善 `packages/common/i18n/` 下的多语言词条
- **报告问题**：在 GitHub Issues 中描述你遇到的问题或想法

### 技术约束

- **零框架**：纯 HTML/CSS/JS (ES2020+)，不引入 React/Vue/Svelte
- **零构建**：不经过 npm/webpack，直接写原生代码
- **静态优先**：前端全部静态托管，后端用 Cloudflare Workers
- **依赖原则**：每个外部依赖必须能回答——「如果它明天停止维护，我一个人能在两周内替换它吗？」

### 提交规范

- 分支：`feat/功能描述` 或 `fix/问题描述`
- Commit：`feat: 中文描述` / `fix: 中文描述` / `docs: 中文描述`
- 每完成一个可运行功能就提交，不攒大 PR

---

## 哲学

**风味-参数同构**：任何可描述的风味差异，必然对应可测量的参数差异。咖啡是物理，不是玄学。

**知识开源主义**：冲煮知识是公共财产。核心标准永远以 CC0/MIT 发布，永不封闭。

**数据主权**：你的冲煮数据属于你。BrewCode OS 不拥有用户数据，不售卖数据，不做广告。

**工具隐去**：最好的工具在使用时消失。所有界面「扫一眼就够」。

---

## 许可证

| 资产         | 协议                |
| ------------ | ------------------- |
| `.brew` 标准 | CC0 1.0（公共领域） |
| 所有代码     | MIT                 |
| 种子方案     | CC0 1.0             |

---

_BrewCode OS 诞生于 2026 年。这不是一个产品，不是一个公司。_
_这是一粒种子——一个为咖啡冲煮建立通用语言的开源运动。_

_创始人：李泊言 Bowen Lee_
