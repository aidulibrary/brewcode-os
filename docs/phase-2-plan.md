# BrewCode OS 第二阶段开发规划

**版本：** v0.1
**创建时间：** 2026-06-14
**状态：** 待执行
**前置条件：**
- 标准层：`.brew` JSON Schema v0.1 已完成（`packages/standards/brew.schema.json`）
- 工具层：BrewPlayer MVP 已完成（`packages/player/`，状态机五态，PWA 就绪）
- 种子数据：1 个 sample 文件（`packages/player/sample.brew`）
- 项目仓库：`github.com/aidulibrary/brewcode-os`

**本阶段目标：**
1. 补齐 50 个种子 `.brew` 文件
2. BrewPlayer 部署到 Cloudflare Pages
3. BrewRepo 索引站骨架

---

## 优先级判断

种子文件必须先补齐。原因：没有足够的方案数据，BrewPlayer 就只能展示一个 sample，无法验证“覆盖主流器具×烘焙度×产区”的检索结构是否合理，后续 BrewRepo 的索引设计也缺乏测试数据。部署可以在种子文件生成的同时进行。

---

## 任务一：生成首批 50 个种子 `.brew` 文件

**目标：** 让任何人打开 BrewRepo 或使用 BrewPlayer 时，都能找到至少一个与自己设备匹配的方案。

**覆盖矩阵：**

| 维度 | 覆盖项 |
|:---|:---|
| 器具 | V60（01/02）、Kalita Wave（155/185）、Origami、Chemex、爱乐压、法压壶 |
| 烘焙度 | 浅烘（20 个）、中烘（18 个）、深烘（12 个） |
| 产区/处理法 | 埃塞俄比亚（水洗/日晒）、肯尼亚（水洗）、哥伦比亚（水洗/日晒）、危地马拉（水洗）、巴西（日晒）、印尼（湿刨） |
| 方案来源 | 国际公认的经典方案 + 社区冠军方案 + 适度原创 |

**生成方式：** 用 TRAE 逐批生成。每批 10 个，5 批完成。

**指令模板：**

> 根据 `packages/standards/brew.schema.json`，生成一个 `.brew` 种子文件。器具为 [V60 01]，烘焙度为 [浅烘]，豆子为 [埃塞俄比亚 耶加雪菲 水洗]。参考世界赛冠军方案设定参数。文件名 `seeds/genesis-brews/v60-01-light-yirgacheffe-washed.brew.json`。输出完整 JSON。

**文件存放路径：** `seeds/genesis-brews/`
**命名规范：** `{器具}-{烘焙度}-{产区}-{处理法}.brew.json`

**验证标准：**
- 每个文件在 VS Code 中无 Schema 校验错误
- 在 BrewPlayer 中加载后步骤完整可执行

---

## 任务二：部署 BrewPlayer 到 Cloudflare Pages

**目标：** 让 `player.brewcode.os` 指向可用的 BrewPlayer。

**步骤：**

1. **确认 Wrangler 登录状态：** 终端执行 `wrangler login`，在浏览器完成 Cloudflare 授权。
2. **创建 Pages 项目：**
   ```bash
   wrangler pages project create brewcode-player --production-branch main

3.配置部署： 在 Cloudflare Dashboard → Pages → brewcode-player → Settings → Build configuration，设置构建输出目录为 packages/player，构建命令留空（纯静态）。

绑定自定义域： 在 Pages 项目的 Custom Domains 中添加 player.brewcode.os。

推送部署： git push origin main 触发自动部署，或手动在 Dashboard 点击 Deploy。

验证： 浏览器访问 https://player.brewcode.os，加载一个种子文件，确认分步引导正常。

替代方案： 如果 Wrangler CLI 部署 Pages 遇到权限问题，直接在 Cloudflare Dashboard 中创建 Pages 项目，连接 GitHub 仓库，设置构建输出目录为 packages/player，效果相同。

任务三（种子完成后）：搭建 BrewRepo 索引站骨架
50 个种子文件就位后，BrewRepo 的索引站就有了内容基础。届时开发一个静态索引页，从 seeds/genesis-brews/ 目录中读取所有 .brew 文件的 meta 和 coffee 字段，按器具/烘焙度/产区三维筛选展示。

建议执行顺序
今天： 部署 BrewPlayer 到 Cloudflare Pages（先让东西能访问，哪怕只有一个 sample）

今晚-明天： 用 TRAE 逐批生成 50 个种子文件（每批 10 个，5 轮对话）

种子完成当天： git add seeds/ + commit + push，里程碑二达成