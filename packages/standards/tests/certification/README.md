# BrewCode Compatible 认证测试用例

本目录包含 BrewCode Compatible 认证体系的标准测试用例，供厂商在提交认证申请前进行自测使用。

## 测试用例概览

| 文件名                        | 对应认证等级   | 测试目的                                                               | 步骤数 |
| :---------------------------- | :------------- | :--------------------------------------------------------------------- | :----: |
| `tc-l1-basic.brew.json`       | L1 Ready       | 验证设备能接收并正确解析核心冲煮参数（粉量、水量、水温、研磨度）       |   5    |
| `tc-l2-three-steps.brew.json` | L2 Interactive | 验证设备能解析并按顺序执行包含 3 个步骤的冲煮序列                      |   6    |
| `tc-l2-five-steps.brew.json`  | L2 Interactive | 验证设备能解析并按顺序执行包含 5 个及以上步骤的复杂冲煮序列            |   8    |
| `tc-l3-data-record.brew.json` | L3 Native      | 验证设备能准确记录冲煮过程数据并按规范格式回写至 result 字段           |   6    |
| `tc-l3-full.brew.json`        | L3 Native      | 综合测试：验证设备对完整冲煮方案的执行能力及符合规范的 result 结构生成 |   9    |

## 参数对照表

### 核心参数

| 参数                        | `tc-l1-basic` | `tc-l2-three-steps` | `tc-l2-five-steps` | `tc-l3-data-record` | `tc-l3-full` |
| :-------------------------- | :------------ | :------------------ | :----------------- | :------------------ | :----------- |
| **粉量 (dose)**             | 15.0g         | 15.0g               | 15.0g              | 15.0g               | 18.0g        |
| **总水量 (waterAmount)**    | 250ml         | 250ml               | 250ml              | 250ml               | 270ml        |
| **粉水比 (ratio)**          | 1:16.7        | 1:16.7              | 1:16.7             | 1:16.7              | 1:15         |
| **水温 (waterTemperature)** | 93.0°C        | 93.0°C              | 93.0°C             | 93.0°C              | 92.0°C       |
| **研磨度 (grindSize)**      | 600μm         | 600μm               | 600μm              | 600μm               | 700μm        |
| **闷蒸比例 (bloomRatio)**   | 1:2           | 1:2                 | 1:2                | 1:2                 | 1:2.5        |
| **闷蒸时间 (bloomTime)**    | 30s           | 30s                 | 30s                | 30s                 | 35s          |
| **目标冲煮时间 (brewTime)** | 120s          | 150s                | 180s               | 210s                | 180s         |

### 步骤结构

| 测试用例            | 步骤数 | 动作类型                                                    | 动作序列                                                                             |
| :------------------ | :----: | :---------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| `tc-l1-basic`       |   5    | prepare, dose, bloom, pour, drawdown                        | 准备 → 投粉 → 闷蒸(30ml) → 注水(220ml) → 滴滤                                        |
| `tc-l2-three-steps` |   6    | prepare, dose, bloom, pour, pour, drawdown                  | 准备 → 投粉 → 闷蒸(30ml) → 注水(110ml) → 注水(110ml) → 滴滤                          |
| `tc-l2-five-steps`  |   8    | rinse, dose, bloom, pour, wait, pour, pour, drawdown        | 润湿 → 投粉 → 闷蒸(30ml) → 注水(60ml) → 等待 → 注水(80ml) → 注水(80ml) → 滴滤        |
| `tc-l3-data-record` |   6    | prepare, dose, bloom, pour, pour, drawdown                  | 准备 → 投粉 → 闷蒸(30ml) → 注水(110ml) → 注水(110ml) → 滴滤                          |
| `tc-l3-full`        |   9    | rinse, dose, bloom, pour, wait, pour, pour, drawdown, taste | 润湿 → 投粉 → 闷蒸(45ml) → 注水(75ml) → 等待 → 注水(80ml) → 注水(70ml) → 滴滤 → 品鉴 |

### 各步骤水量分配

| 步骤     | `tc-l1-basic` | `tc-l2-three-steps` | `tc-l2-five-steps` | `tc-l3-data-record` | `tc-l3-full` |
| :------- | :------------ | :------------------ | :----------------- | :------------------ | :----------- |
| 闷蒸     | 30ml          | 30ml                | 30ml               | 30ml                | 45ml         |
| 注水 1   | 220ml         | 110ml               | 60ml               | 110ml               | 75ml         |
| 注水 2   | —             | 110ml               | 80ml               | 110ml               | 80ml         |
| 注水 3   | —             | —                   | 80ml               | —                   | 70ml         |
| **累计** | **250ml**     | **250ml**           | **250ml**          | **250ml**           | **270ml**    |

### 咖啡豆信息

| 测试用例            | 咖啡名称                  | 产区     | 豆种     | 处理法 | 烘焙度 |
| :------------------ | :------------------------ | :------- | :------- | :----- | :----- |
| `tc-l1-basic`       | 埃塞俄比亚 耶加雪菲 水洗  | 耶加雪菲 | Heirloom | 水洗   | 浅烘   |
| `tc-l2-three-steps` | 埃塞俄比亚 古吉 日晒      | 古吉     | Heirloom | 日晒   | 浅烘   |
| `tc-l2-five-steps`  | 哥伦比亚 蕙兰 水洗        | 蕙兰     | Caturra  | 水洗   | 中烘   |
| `tc-l3-data-record` | 肯尼亚 涅里 水洗          | 涅里     | SL28     | 水洗   | 浅烘   |
| `tc-l3-full`        | 巴拿马 翡翠庄园 瑰夏 水洗 | 波奎特   | Geisha   | 水洗   | 浅烘   |

### 设备信息

| 测试用例            | 冲煮器具        | 磨豆机   | 手冲壶           | 电子秤                |
| :------------------ | :-------------- | :------- | :--------------- | :-------------------- |
| `tc-l1-basic`       | V60 01          | C40      | Brewista 温控壶  | Acaia Pearl           |
| `tc-l2-three-steps` | Kalita Wave 155 | Kinu M47 | Fellow Stagg EKG | Timemore Black Mirror |
| `tc-l2-five-steps`  | Origami S       | EK43     | Bonavita 温控壶  | Acaia Pearl           |
| `tc-l3-data-record` | Chemex 3 Cup    | C40      | Brewista 温控壶  | Acaia Pearl           |
| `tc-l3-full`        | V60 02          | EK43     | Fellow Stagg EKG | Acaia Pearl           |

### L3 结果数据 (result)

| 参数                          | `tc-l3-data-record` | `tc-l3-full` |
| :---------------------------- | :------------------ | :----------- |
| 实际冲煮时间 (actualBrewTime) | 215s                | 185s         |
| 最终咖啡液重 (finalYield)     | 218g                | 235g         |
| 实测 TDS (measuredTDS)        | 1.35%               | 1.38%        |
| 萃取率 (extractionYield)      | 19.6%               | 20.7%        |
| 综合评分 (rating)             | 8.5                 | 9.0          |

## 误差容限参考

根据 BrewCode Compatible 认证规范 v1.0 第 3.3 节，设备在实现参数映射时必须满足以下误差容限：

| 参数   | 允许误差                  | 测试方法                                |
| :----- | :------------------------ | :-------------------------------------- |
| 粉量   | ±0.5g 或 ±3%（取较大值）  | 校准砝码在 10g/20g/30g 各测试 5 次      |
| 水量   | ±5ml 或 ±5%（取较大值）   | 量筒在 100ml/250ml/500ml 各测试 5 次    |
| 水温   | ±1.5°C                    | 校准温度计在 85°C/93°C/98°C 各测试 5 次 |
| 研磨度 | ±50μm 或 ±15%（取较大值） | 粒度分析仪或标准筛网                    |
| 时间   | ±1s 或 ±5%（取较大值）    | 校准秒表在 10s/30s/60s 各测试 5 次      |

## 自测流程

1. 根据申请的认证等级，选择对应的测试用例文件
2. 将测试用例 `.brew.json` 文件导入设备
3. 按照设备操作手册执行冲煮
4. 对照参数对照表，检查设备显示的参数值是否正确
5. 对于 L2 等级：检查步骤顺序、提示信息、跳过/暂停功能
6. 对于 L3 等级：检查数据记录完整性、result 字段回写格式
7. 填写自测清单（参考认证规范附录 D）

## 相关文档

- [BrewCode Compatible 认证规范 v1.0](../../../docs/brewcode-compatible-spec-v1.0.md)
- [BrewCode OS .brew JSON Schema](../brew.schema.json)
- [认证申请 Issue 模板](../../../.github/ISSUE_TEMPLATE/certification.md)
