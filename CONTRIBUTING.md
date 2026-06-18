# 贡献指南

感谢你对 BrewCode OS 的关注！我们欢迎任何形式的贡献——代码、方案、文档、设计、反馈。

---

## 1. 方案提交指南

如果你有功能提案、Bug 修复或任何改进想法，请通过以下方式提交：

- **Bug 报告**：在 [GitHub Issues](https://github.com/aidulibrary/brewcode-os/issues) 新建 Issue，选择「Bug 报告」模板，描述复现步骤、预期行为和实际行为。
- **功能提案**：新建 Issue，选择「功能提案」模板，说明使用场景、期望效果和实现建议。
- **讨论交流**：对于不确定的idea，可先在 Issue 中发起讨论，标题加 `[RFC]` 前缀。

**Issue 必要信息**：标题简洁明确；正文包含背景、目标、方案描述；如涉及前端，附上截图或录屏。

---

## 2. .brew 文件规范

`.brew` 是 BrewCode OS 的核心数据格式，遵循 [brew.schema.json](./packages/standards/brew.schema.json) 定义。

### 命名规则

```
{序号}-{器具}-{烘焙度}-{产区}-{处理法}.brew.json
```

示例：`01-V60-中浅烘-埃塞俄比亚-日晒.brew.json`

### 文件结构

每个 `.brew` 文件包含六个顶层字段：

| 字段 | 必填 | 说明 |
|------|------|------|
| `meta` | 是 | 方案名称、版本、作者、许可证、标签、创建时间 |
| `coffee` | 是 | 豆子信息：产地、豆种、处理法、烘焙度、风味描述 |
| `equipment` | 否 | 器具：滤杯、滤纸、磨豆机、手冲壶、电子秤 |
| `recipe` | 是 | 冲煮参数：粉量、水量、粉水比、研磨度、水温 |
| `steps` | 是 | 步骤列表，每步含 action（13 种操作类型）、耗时、注水量等 |
| `result` | 否 | 品鉴结果：评分、TDS、萃取率、风味笔记 |

### 元数据要求

- `meta.license` 建议使用 `CC0-1.0` 或 `MIT`
- `meta.brewCodeVersion` 必须与当前 Schema 版本一致（当前 `0.1`）
- `coffee.roastLevel` 使用枚举值：`浅烘` / `中浅烘` / `中烘` / `中深烘` / `深烘`
- 提交前请在 [BrewForge](https://forge.礼字号.中国) 中通过 Schema 校验

---

## 3. Pull Request 流程

1. **Fork** 本仓库到你的 GitHub 账户
2. **创建分支**：`git checkout -b feat/xxx`（功能）或 `fix/xxx`（修复）
3. **提交代码**：遵循项目风格（零框架、零构建、纯原生 HTML/CSS/JS）；提交信息用中文，格式：`类型: 描述`，如 `feat: 添加 xxx 功能`
4. **发起 PR**：推送到你的 Fork 后，在 GitHub 发起 Pull Request 到 `main` 分支
5. **代码审查**：维护者会在 1-3 天内进行 Review，请保持关注并回应反馈
6. **合并**：Review 通过后由维护者合并

**PR 规范**：标题简明扼要；描述中说明做了什么、为什么这样做、如何验证；关联相关 Issue（如 `Closes #12`）。

---

## 4. 行为准则

本项目遵循 [Contributor Covenant](https://www.contributor-covenant.org/zh-cn/version/2/1/code_of_conduct/) 行为准则。

### 核心要求

- **尊重他人**：对不同观点、经验和背景保持开放和尊重。我们希望所有参与者在任何互动中都保持友好和专业
- **包容协作**：欢迎任何水平的参与者，耐心帮助新人
- **建设性反馈**：聚焦于代码和方案本身，不针对个人
- **禁止不当行为**：不得发布骚扰、歧视、侮辱性言论或内容

### 违规处理

违反行为准则的贡献者，项目维护者将视情况给予警告、暂时或永久移除其参与资格。

---

> **快速开始**：打开 [BrewForge](https://forge.礼字号.中国) 创建你的第一个 `.brew` 方案，导出后提交 PR 到 `seeds/` 目录即可！