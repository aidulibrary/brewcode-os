# 贡献指南

欢迎你成为 BrewCode OS 的种子贡献者。提交一个冲煮方案只需三步。

---

## 三步提交方案

**第一步：创建方案**

打开 [BrewForge](https://forge.礼字号.中国)，在表单中填写你的冲煮参数，导出 `.brew` 文件。

**第二步：放入仓库**

Fork 本仓库，将 `.brew` 文件放入 `seeds/community/` 目录。

**第三步：提交 PR**

发起 Pull Request 到 `main` 分支。维护者 Review 通过后合并，你的方案将出现在 [BrewRepo](https://repo.礼字号.中国) 中。

---

## .brew 文件规范

`.brew` 文件需通过 [brew.schema.json](./packages/standards/brew.schema.json) 校验。

### 命名规则

```
{序号}-{器具}-{烘焙度}-{产区}-{处理法}.brew.json
```

示例：`01-V60-中浅烘-埃塞俄比亚-日晒.brew.json`

### 必填字段

| 字段     | 说明                                  |
| :------- | :------------------------------------ |
| `meta`   | 方案名称、版本、作者、许可证          |
| `coffee` | 产地、豆种、处理法、烘焙度、风味描述  |
| `recipe` | 粉量、水量、粉水比、研磨度、水温      |
| `steps`  | 步骤列表，每步含 action、耗时、注水量 |

### 约束

- `meta.license` 建议 `CC0-1.0`
- `coffee.roastLevel` 枚举：`浅烘` / `中浅烘` / `中烘` / `中深烘` / `深烘`
- 提交前在 [BrewForge](https://forge.礼字号.中国) 中通过 Schema 校验

---

## PR 规范

- 分支命名：`feat/方案名称`（如 `feat/埃塞俄比亚日晒`)
- 提交信息：`feat: 添加 {方案名称} 方案`
- 标题简明扼要，描述中说明器具、豆子信息和冲煮思路
- 若方案基于已有配方改良，请在描述中注明来源

---

## 行为准则

本项目遵循 [Contributor Covenant](https://www.contributor-covenant.org/zh-cn/version/2/1/code_of_conduct/) 行为准则。尊重他人，包容协作，建设性反馈。
