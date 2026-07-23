# 贡献指南 / Contributing Guide

欢迎你成为 BrewCode OS 的种子贡献者。提交一个冲煮方案只需四步，全程自动化校验。

---

## 四步提交方案

### 第一步：创建 .brew 方案

打开 [BrewForge](https://forge.礼字号.中国)，在表单中填写你的冲煮参数：

1. 选择语言（中文 / English）
2. 填写咖啡豆信息（产区、豆种、处理法、烘焙度、风味描述）
3. 填写设备信息（手冲壶/滤杯/磨豆机/滤纸）
4. 添加冲煮步骤（注水、等待、搅拌、滴滤）
5. 点击「导出 .brew」下载文件

### 第二步：本地校验（可选）

```bash
# 安装 ajv-cli
npm install -g ajv-cli

# 校验你的方案文件
ajv validate -s packages/standards/brew.schema.json -d 你的方案.brew.json
```

### 第三步：更新社区清单

```bash
# 将 .brew.json 放入 community/ 目录
cp 你的方案.brew.json packages/player/seeds/community/

# 生成社区方案清单
node scripts/generate-community-recipes.js
```

### 第四步：提交 PR

1. Fork 本仓库
2. 创建分支：`feat/方案名称`（如 `feat/埃塞俄比亚-水洗-浅烘`）
3. Commit：`feat: 添加 {方案名称} 方案`
4. 推送后发起 Pull Request 到 `main` 分支
5. CI 自动校验 Schema + 清单同步 → 通过后维护者合并
6. 合并后你的方案自动出现在 [BrewRepo](https://repo.礼字号.中国)「社区方案」分区

---

## .brew 文件规范

所有 `.brew` 文件需通过 [brew.schema.json](./packages/standards/brew.schema.json) 校验。

### 命名规则

```
{序号}-{器具}-{烘焙度}-{产区}-{处理法}.brew.json
```

示例：`01-V60-中浅烘-埃塞俄比亚-日晒.brew.json`

### 必填字段

| 字段 | 说明 |
| :-- | :-- |
| `meta` | 方案名称、版本、作者、许可证、提交日期 |
| `coffee` | 产地、豆种、处理法、烘焙度、风味描述 |
| `equipment` | 器具名称、磨豆机、滤纸类型 |
| `recipe` | 粉量(g)、水量(ml)、粉水比、研磨度、水温(°C) |
| `steps` | 步骤数组，每步含 action、duration(秒)、amount(ml) |

### 推荐模板

```json
{
  "meta": {
    "name": "我的方案",
    "version": "1.0",
    "author": "你的名字",
    "license": "CC0-1.0",
    "submittedAt": "2026-07-23"
  },
  "coffee": {
    "origin": "产区名",
    "variety": "豆种",
    "process": "处理法",
    "roastLevel": "烘焙度",
    "flavorNotes": "风味描述"
  },
  "equipment": {
    "brewer": "V60",
    "grinder": "C40",
    "filter": "漂白滤纸"
  },
  "recipe": {
    "dose": 15,
    "waterAmount": 225,
    "ratio": "1:15",
    "grindSize": "中细",
    "waterTemperature": 93
  },
  "steps": [
    { "action": "注水", "duration": 30, "amount": 45 },
    { "action": "等待", "duration": 30, "amount": 0 }
  ]
}
```

### 约束

- `meta.license` 建议 `CC0-1.0`
- `coffee.roastLevel` 枚举：`浅烘` / `中浅烘` / `中烘` / `中深烘` / `深烘`
- `recipe.waterTemperature` 单位 °C，范围 80-100
- `recipe.dose` 单位 g，范围 6-30
- `steps[].amount` 单位 ml

---

## PR 规范

- **分支命名**：`feat/方案简称`（如 `feat/哥斯达黎加-蜜处理`）
- **提交信息**：`feat: 添加 {方案名称} 方案`
- **标题**：简明扼要，说明器具+豆子+处理法
- **描述**：冲煮思路（为什么选这个水温/研磨度/注水节奏），若基于已有方案改良请注明来源
- **一个 PR 一个方案**：方便 Review 和合并

---

## CI 自动检查

PR 提交后，GitHub Actions 自动执行：

| 检查项 | 说明 |
| :-- | :-- |
| **validate-schema** | 校验所有 `.brew.json` 文件是否符合 Schema |
| **check-recipes-updated** | 检查 `community-recipes.json` 是否随方案同步更新 |
| **gitleaks** | 密钥泄漏扫描 |

三项全部通过后，PR 才可合并。失败会在 PR 页面显示具体错误信息。

---

## 方案署名

你的方案出现在 BrewRepo 后，卡片上会显示：
- 方案名称 +「社区方案」标签
- 你的名字（来自 `meta.author`）
- 头像（设置 `meta.authorAvatarUrl` 可显示头像）
- 咖啡豆信息（产区、烘焙度、风味描述）

---

## 行为准则

本项目遵循 [Contributor Covenant](https://www.contributor-covenant.org/zh-cn/version/2/1/code_of_conduct/) 行为准则。

- 开放、包容、尊重
- 建设性反馈，不人身攻击
- 方案署名权归原作者所有
- 提交即同意 CC0 1.0 协议（公共领域）
