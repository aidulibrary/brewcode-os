# BrewCode Compatible 认证规范 v1.0

## BrewCode Compatible Certification Specification v1.0

---

**文档编号 / Document Number**：BC-CERT-2026-001  
**版本 / Version**：1.0  
**发布日期 / Release Date**：2026-06-25  
**状态 / Status**：正式发布 / Released  
**维护方 / Maintainer**：BrewCode OS 项目组 / BrewCode OS Project  
**发布许可 / License**：CC0 1.0 Universal (Public Domain Dedication)  

---

## 目录 / Table of Contents

1. [引言 / Introduction](#1-引言-introduction)
2. [认证等级 / Certification Levels](#2-认证等级-certification-levels)
3. [参数映射规范 / Parameter Mapping Specification](#3-参数映射规范-parameter-mapping-specification)
4. [认证流程 / Certification Process](#4-认证流程-certification-process)
5. [认证标识使用规范 / Certification Mark Usage Guidelines](#5-认证标识使用规范-certification-mark-usage-guidelines)
6. [认证费用 / Certification Fees](#6-认证费用-certification-fees)
7. [认证续期与撤销 / Certification Renewal and Revocation](#7-认证续期与撤销-certification-renewal-and-revocation)
8. [附录 / Appendices](#8-附录-appendices)

---

## 1. 引言 / Introduction

### 1.1 什么是 BrewCode Compatible / What is BrewCode Compatible

**BrewCode Compatible**（以下简称「本认证」）是 BrewCode OS 项目为第三方咖啡冲煮硬件设备设立的互操作性认证体系。通过本认证的设备，证明其能够正确解析、执行或记录 `.brew` 标准文件格式所定义的冲煮方案。

**BrewCode Compatible** (hereinafter referred to as "this Certification") is an interoperability certification system established by the BrewCode OS project for third-party coffee brewing hardware devices. A device that passes this Certification demonstrates its ability to correctly parse, execute, or record brewing recipes defined in the `.brew` standard file format.

> **关键区分 / Critical Distinction**：本认证是**互操作性认证**（Interoperability Certification），而非品质认证（Quality Certification）。通过认证仅表明设备能够与 `.brew` 生态系统正确交互，不对设备的冲煮品质、耐用性或安全性做出任何保证。

### 1.2 目的 / Purpose

本规范文档的目的：

1. 为硬件厂商（Hardware Manufacturer）提供清晰、可验证的技术合规要求
2. 为用户（End User）提供识别兼容设备的可靠依据
3. 为 `.brew` 生态系统建立统一的互操作性基准
4. 保障跨设备冲煮方案的可移植性（Portability）和可复现性（Reproducibility）

### 1.3 适用范围 / Scope

本规范的适用范围包括但不限于：

- 手冲咖啡器具（Pour-over Devices）：智能手冲壶、电子秤、温控设备
- 意式咖啡机（Espresso Machines）：具备数字控制接口的意式咖啡机
- 浸泡式冲煮设备（Immersion Brewers）：法压壶、爱乐压等设备的智能附件
- 研磨设备（Grinders）：具备数字粒度设置的研磨机
- 冲煮辅助设备（Brewing Accessories）：智能电子秤、温度计、流量计等独立设备

### 1.4 目标受众 / Target Audience

| 受众 / Audience | 角色 / Role | 关注章节 / Relevant Sections |
|---|---|---|
| 硬件厂商 / Hardware Manufacturer | 申请认证 | 第2、3、4、6、7章 |
| 开发者 / Developer | 实现 `.brew` 解析 | 第2、3章 |
| 终端用户 / End User | 选购兼容设备 | 第1、2、5章 |
| 认证审核员 / Certification Auditor | 执行审核 | 第3、4、7章 |

### 1.5 文档结构 / Document Organization

本文档共八章。第1章定义概念和术语；第2章定义认证等级；第3章规定参数映射技术要求；第4章描述认证申请流程；第5章规范标识使用；第6章说明费用；第7章规定续期和撤销机制；第8章提供附录模板。

### 1.6 规范性词汇定义 / Definition of Normative Terms

本文档采用 IETF RFC 2119 定义的规范性关键词。以下为其中文对应表述：

| 英文 / English | 中文 / Chinese | 含义 / Meaning |
|---|---|---|
| **MUST** / **REQUIRED** / **SHALL** | **必须** / **必需** | 绝对要求，不允许任何偏离 |
| **MUST NOT** / **SHALL NOT** | **禁止** / **不得** | 绝对禁止 |
| **SHOULD** / **RECOMMENDED** | **应该** / **建议** | 强烈推荐，在特定情况下可有合理偏离，但需充分理解其影响并谨慎处理 |
| **SHOULD NOT** / **NOT RECOMMENDED** | **不应该** / **不建议** | 强烈不推荐，在特定情况下可能接受，但需充分理解其影响并谨慎处理 |
| **MAY** / **OPTIONAL** | **可以** / **可选** | 完全可选，由实现者自行决定 |

---

## 2. 认证等级 / Certification Levels

BrewCode Compatible 认证分为三个等级，各级别为递进关系：高等级**必须**满足所有低等级的全部要求。

The BrewCode Compatible Certification has three levels. Each level is cumulative: a higher level **MUST** satisfy all requirements of all lower levels.

### 2.1 认证等级概览 / Certification Level Overview

```
 ┌──────────────────────────────────────────────────────────────┐
 │  L3 Native 原生级                                            │
 │  ┌──────────────────────────────────────────────────────────┐│
 │  │ L2 Interactive 交互级                                    ││
 │  │ ┌────────────────────────────────────────────────────────┐││
 │  │ │ L1 Ready 就绪级                                        │││
 │  │ │                                                        │││
 │  │ │ • 接收并处理核心参数                                    │││
 │  │ │ • 支持 API 或手动输入                                  │││
 │  │ │                                                        │││
 │  │ └────────────────────────────────────────────────────────┘││
 │  │ • 解析完整 steps 数组                                     ││
 │  │ • 按步骤顺序执行冲煮                                      ││
 │  └──────────────────────────────────────────────────────────┘│
 │ • 记录冲煮过程数据                                           │
 │ • 回写完整冲煮记录到 .brew 文件 result 字段                   │
 └──────────────────────────────────────────────────────────────┘
```

### 2.2 L1 Ready（就绪级）

#### 定义 / Definition

L1 Ready 认证表明设备具备接收并处理 `.brew` 文件核心参数的基本能力，是实现 `.brew` 生态互操作性的最低门槛。

#### 技术要求 / Technical Requirements

设备**必须**（MUST）满足以下全部要求：

| 编号 / ID | 要求 / Requirement | 验证方式 / Verification |
|---|---|---|
| L1-REQ-01 | **必须**能够接收并处理以下四个核心参数：<br>• 粉量 / Coffee Weight (grams)<br>• 水量 / Water Volume (milliliters)<br>• 水温 / Water Temperature (°C)<br>• 研磨度 / Grind Size (microns or device-specific scale) | 功能测试 / Functional Test |
| L1-REQ-02 | **必须**支持至少一种参数输入方式：<br>• 方式A：通过 API 自动接收 `.brew` 文件数据（推荐）<br>• 方式B：通过设备面板手动输入参数 | 接口测试 / Interface Test |
| L1-REQ-03 | **必须**提供参数确认机制，在开始冲煮前向用户展示当前设置的参数值 | 用户界面测试 / UI Test |
| L1-REQ-04 | **必须**支持参数单位转换，至少支持公制单位（Metric） | 单位测试 / Unit Test |
| L1-REQ-05 | **必须**提交完整的参数映射表（见第3章） | 文档审查 / Document Review |

#### 典型适用设备 / Typical Applicable Devices

- 具备温度控制的智能手冲壶（Smart Pour-over Kettle）
- 具备重量显示的电子秤（Digital Scale）
- 具备数字研磨度设置的研磨机（Digital Grinder）

### 2.3 L2 Interactive（交互级）

#### 定义 / Definition

L2 Interactive 认证表明设备在满足 L1 全部要求的基础上，具备解析并执行 `.brew` 文件中完整冲煮步骤序列的能力，实现冲煮过程的自动化或半自动化交互。

#### 前置要求 / Prerequisites

申请 L2 认证的设备**必须**（MUST）已通过 L1 Ready 认证，或同步申请 L1+L2 联合认证。

#### 技术要求 / Technical Requirements

除满足 L1 全部要求外，设备**必须**（MUST）额外满足：

| 编号 / ID | 要求 / Requirement | 验证方式 / Verification |
|---|---|---|
| L2-REQ-01 | **必须**能够解析 `.brew` 文件中的完整 `steps` 数组（Array），包括每个步骤的 `action`、`amount`、`duration`、`note` 等字段 | 解析测试 / Parsing Test |
| L2-REQ-02 | **必须**按照 `steps` 数组中定义的步骤顺序，依次执行冲煮操作 | 序列测试 / Sequence Test |
| L2-REQ-03 | **必须**在每个步骤执行前向用户提供提示（Prompt），包括当前步骤的动作描述和参数 | 用户界面测试 / UI Test |
| L2-REQ-04 | **必须**支持用户跳过（Skip）或暂停（Pause）当前步骤 | 交互测试 / Interaction Test |
| L2-REQ-05 | **必须**支持至少 3 个步骤类型的识别与执行（如注水 Pour、等待 Wait、搅拌 Stir） | 动作测试 / Action Test |
| L2-REQ-06 | **必须**在冲煮结束后提供完成摘要（Summary），包括总用时、总注水量等关键数据 | 用户界面测试 / UI Test |

#### 典型适用设备 / Typical Applicable Devices

- 具备流量控制的智能手冲设备（Smart Pour-over Device with Flow Control）
- 具备步骤引导的冲煮辅助系统（Brewing Assistant System）
- 具备程序控制的意式咖啡机（Programmable Espresso Machine）

### 2.4 L3 Native（原生级）

#### 定义 / Definition

L3 Native 认证是 BrewCode Compatible 的最高等级。表明设备在满足 L2 全部要求的基础上，具备完整的冲煮过程数据记录能力，并能将冲煮记录以标准格式回写到 `.brew` 文件的 `result` 字段，实现冲煮数据的闭环。

#### 前置要求 / Prerequisites

申请 L3 认证的设备**必须**（MUST）已通过 L2 Interactive 认证，或同步申请 L1+L2+L3 联合认证。

#### 技术要求 / Technical Requirements

除满足 L1、L2 全部要求外，设备**必须**（MUST）额外满足：

| 编号 / ID | 要求 / Requirement | 验证方式 / Verification |
|---|---|---|
| L3-REQ-01 | **必须**在冲煮过程中实时记录以下数据（至少每秒采集一次）：<br>• 实际水温 / Actual Water Temperature (°C)<br>• 实际注水量 / Actual Water Volume per step (ml)<br>• 实际注水时间 / Actual Pour Timestamp (ISO 8601) | 数据采集测试 / Data Capture Test |
| L3-REQ-02 | **必须**在冲煮结束后，将完整冲煮记录写入 `.brew` 文件的 `result` 字段，**必须**符合 `.brew` Schema 中 `result` 对象的定义 | Schema 校验 / Schema Validation |
| L3-REQ-03 | **必须**在 `result` 字段中至少包含以下内容：<br>• `brewedAt`：冲煮开始时间（ISO 8601 格式）<br>• `totalTime`：总冲煮用时（秒）<br>• `actualCoffeeWeight`：实际粉量（克）<br>• `actualWaterVolume`：实际总注水量（毫升）<br>• `steps`：每个步骤的实际执行记录数组 | Schema 校验 / Schema Validation |
| L3-REQ-04 | **必须**提供数据导出功能，支持将包含 `result` 字段的完整 `.brew` 文件导出至本地存储或通过 API 回传 | 导出测试 / Export Test |
| L3-REQ-05 | **必须**在数据记录失败时（如传感器故障）向用户发出明确告警，并在 `result` 中标记数据完整性状态 | 异常测试 / Exception Test |

#### 典型适用设备 / Typical Applicable Devices

- 具备全传感器阵列的高端智能冲煮设备（High-end Smart Brewing Device with Full Sensor Array）
- 具备数据记录和分析功能的专业冲煮工作站（Professional Brewing Workstation）

### 2.5 等级对比矩阵 / Level Comparison Matrix

| 能力 / Capability | L1 Ready | L2 Interactive | L3 Native |
|---|---|---|---|
| 接收核心参数 / Receive Core Parameters | ✓ | ✓ | ✓ |
| API 或手动输入 / API or Manual Input | ✓ | ✓ | ✓ |
| 解析 steps 数组 / Parse steps Array | ✗ | ✓ | ✓ |
| 按步骤顺序执行 / Sequential Step Execution | ✗ | ✓ | ✓ |
| 步骤交互控制 / Step Interaction Control | ✗ | ✓ | ✓ |
| 记录冲煮过程数据 / Record Brewing Data | ✗ | ✗ | ✓ |
| 回写 result 字段 / Write-back result Field | ✗ | ✗ | ✓ |

---

## 3. 参数映射规范 / Parameter Mapping Specification

### 3.1 概述 / Overview

参数映射（Parameter Mapping）是指将 `.brew` 文件中定义的抽象参数，转换为设备可执行的物理参数的过程。每一个申请认证的设备**必须**（MUST）提供完整的参数映射表，说明设备如何将 `.brew` 标准字段映射到设备的实际控制参数。

### 3.2 参数映射表要求 / Parameter Mapping Table Requirements

厂商**必须**（MUST）为以下 `.brew` 核心字段提供映射说明：

| .brew 字段 / Field | 数据类型 / Type | 映射要求 / Mapping Requirement |
|---|---|---|
| `meta.name` | String | 方案名称在设备上的显示方式 |
| `recipe.dose.value` | Number (g) | 粉量参数映射到设备的目标重量设置 |
| `recipe.waterAmount.value` | Number (ml) | 总水量参数映射到设备的目标水量设置 |
| `recipe.waterTemperature.value` | Number (°C) | 水温参数映射到设备的目标温度设置 |
| `recipe.grindSize.value` | Number (μm) | 研磨度参数映射到设备的研磨档位/刻度 |
| `steps[].action` | String | 步骤动作类型映射到设备支持的操作 |
| `steps[].waterAmount.value` | Number (ml) | 单步注水量映射到设备的流量控制 |
| `steps[].duration.value` | Number (s) | 步骤持续时间映射到设备的计时控制 |

### 3.3 误差容限 / Error Tolerance

设备在实现参数映射时，**必须**（MUST）满足以下误差容限：

| 参数 / Parameter | 单位 / Unit | 允许误差 / Tolerance | 测试方法 / Test Method |
|---|---|---|---|
| 粉量 / Coffee Weight | 克 (g) | ±0.5g 或 ±3%（取较大值） | 使用校准砝码（Calibrated Weight）在三个量程点（10g, 20g, 30g）各测试5次 |
| 水量 / Water Volume | 毫升 (ml) | ±5ml 或 ±5%（取较大值） | 使用量筒（Graduated Cylinder）在三个量程点（100ml, 250ml, 500ml）各测试5次 |
| 水温 / Water Temperature | 摄氏度 (°C) | ±1.5°C | 使用校准温度计（Calibrated Thermometer）在三个温度点（85°C, 93°C, 98°C）各测试5次 |
| 研磨度 / Grind Size | 微米 (μm) | ±50μm 或 ±15%（取较大值） | 使用粒度分析仪（Particle Size Analyzer）或标准筛网（Standard Sieve）测试 |
| 时间 / Duration | 秒 (s) | ±1s 或 ±5%（取较大值） | 使用校准秒表（Calibrated Stopwatch）在三个时长点（10s, 30s, 60s）各测试5次 |

### 3.4 单位转换标准 / Unit Conversion Standard

设备**必须**（MUST）支持以下单位转换：

| 源单位 / Source Unit | 目标单位 / Target Unit | 转换公式 / Conversion Formula |
|---|---|---|
| 克 (g) | 盎司 (oz) | 1 oz = 28.3495 g |
| 毫升 (ml) | 液盎司 (fl oz) | 1 fl oz = 29.5735 ml |
| 摄氏度 (°C) | 华氏度 (°F) | °F = °C × 9/5 + 32 |
| 微米 (μm) | — | 无需转换，直接使用数值 |

### 3.5 参数映射表模板 / Parameter Mapping Table Template

厂商**必须**（MUST）按以下模板填写参数映射表（完整模板见附录B）：

```
┌─────────────────────────────────────────────────────────────────┐
│  BrewCode Compatible 参数映射表 / Parameter Mapping Table       │
├─────────────────────────────────────────────────────────────────┤
│  厂商名称 / Manufacturer：___________                           │
│  设备型号 / Device Model：___________                           │
│  固件版本 / Firmware Version：___________                       │
│  认证等级 / Certification Level：□ L1  □ L2  □ L3              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  .brew 字段          │ 设备参数名      │ 映射方式     │ 误差   │
│  .brew Field         │ Device Param    │ Mapping      │ Error  │
│  ────────────────────┼────────────────┼─────────────┼────────│
│  recipe.dose.value   │ ______         │ □ 直接 / □ 转换│ ±____ │
│  recipe.waterAmount.value │ ______         │ □ 直接 / □ 转换│ ±____ │
│  recipe.waterTemperature.value │ ______         │ □ 直接 / □ 转换│ ±____ │
│  recipe.grindSize.value │ ______         │ □ 直接 / □ 转换│ ±____ │
│  ...                 │ ...            │ ...          │ ...    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 认证流程 / Certification Process

### 4.1 流程总览 / Process Overview

```
厂商申请 ──→ 资料审核 ──→ 自测提交 ──→ 认证审核 ──→ 结果通知 ──→ 标识颁发
   │            │            │            │            │            │
   │ 5工作日    │ 10工作日   │ 不限时     │ 15工作日   │ 3工作日    │ 即时
   │ 内受理     │ 内反馈     │ 厂商自定   │ 内完成     │ 内通知     │ 生效
   ▼            ▼            ▼            ▼            ▼            ▼
```

### 4.2 第一步：提交申请 / Step 1: Submit Application

#### 申请方式 / Application Method

厂商**必须**（MUST）通过以下方式提交认证申请：

- **方式 / Method**：向 `certification@brewcode.dev` 发送电子邮件，或通过 GitHub Issues 在 `brewcode-os/brewcode-os` 仓库提交认证申请（使用 `Certification Application` 模板）
- **语言 / Language**：中文或英文
- **内容 / Content**：**必须**包含以下信息：

| 信息项 / Information Item | 说明 / Description |
|---|---|
| 厂商全称 / Manufacturer Full Name | 公司或个人的法定名称 |
| 厂商官网 / Manufacturer Website | 官方网站 URL（如有） |
| 联系人姓名 / Contact Name | 认证事务负责人姓名 |
| 联系人邮箱 / Contact Email | 用于认证沟通的邮箱地址 |
| 设备型号 / Device Model | 申请认证的设备型号名称 |
| 设备类型 / Device Type | 手冲设备 / 意式机 / 研磨机 / 其他 |
| 申请等级 / Applied Level | L1 Ready / L2 Interactive / L3 Native |
| 产品页面 / Product Page URL | 设备的产品介绍页面（如有） |
| 自述材料 / Self-Description | 设备技术概述（500字以内） |

#### 受理时间 / Processing Time

BrewCode OS 认证团队**应该**（SHOULD）在收到申请后 **5 个工作日**（5 Business Days）内确认受理。

### 4.3 第二步：资料审核 / Step 2: Document Review

认证团队**必须**（MUST）在受理后 **10 个工作日**内完成以下审核：

1. 厂商身份真实性核验（Identity Verification）
2. 设备技术可行性初步评估（Technical Feasibility Assessment）
3. 申请等级与设备类型匹配性判断（Level-Device Matching）

审核结果**必须**（MUST）以邮件形式书面通知厂商：

- 审核通过：发送《自测指南 / Self-Test Guide》和《参数映射表模板 / Parameter Mapping Table Template》
- 审核不通过：说明不通过原因，厂商**可以**（MAY）在补充材料后重新提交

### 4.4 第三步：自测提交 / Step 3: Self-Test Submission

厂商收到《自测指南》后，**必须**（MUST）完成以下自测工作：

#### 自测要求 / Self-Test Requirements

| 自测项 / Test Item | L1 Ready | L2 Interactive | L3 Native |
|---|---|---|---|
| 核心参数接收测试 / Core Parameter Test | ✓ 必须 | ✓ 必须 | ✓ 必须 |
| 参数单位转换测试 / Unit Conversion Test | ✓ 必须 | ✓ 必须 | ✓ 必须 |
| Steps 数组解析测试 / Steps Parsing Test | — | ✓ 必须 | ✓ 必须 |
| 步骤顺序执行测试 / Sequential Execution Test | — | ✓ 必须 | ✓ 必须 |
| 步骤交互控制测试 / Interaction Control Test | — | ✓ 必须 | ✓ 必须 |
| 数据记录测试 / Data Recording Test | — | — | ✓ 必须 |
| Result 回写测试 / Result Write-back Test | — | — | ✓ 必须 |
| 异常处理测试 / Exception Handling Test | — | ✓ 必须 | ✓ 必须 |

#### 提交材料 / Submission Materials

厂商**必须**（MUST）提交以下材料：

1. **自测报告 / Self-Test Report**：按《自测报告模板》（见附录D）填写
2. **参数映射表 / Parameter Mapping Table**：按模板（见附录B）填写
3. **测试证据 / Test Evidence**：包括但不限于：
   - 测试过程照片或视频截图（至少 3 张）
   - 设备显示界面截图
   - L3 申请者需提供 `.brew` 文件导出样本

#### 提交方式 / Submission Method

将上述材料打包为 ZIP 文件，发送至 `certification@brewcode.dev`。邮件主题格式：

```
[认证自测提交] {厂商名称} - {设备型号} - {申请等级}
[Certification Self-Test] {Manufacturer} - {Device Model} - {Level}
```

### 4.5 第四步：认证审核 / Step 4: Certification Review

认证团队**必须**（MUST）在收到完整自测材料后 **15 个工作日**内完成审核。

#### 审核标准 / Review Criteria

| 审核维度 / Review Dimension | 权重 / Weight | 通过条件 / Pass Condition |
|---|---|---|
| 参数映射完整性 / Mapping Completeness | 30% | 所有必填字段均已映射 |
| 误差容限符合性 / Tolerance Compliance | 35% | 所有参数在允许误差范围内 |
| 功能完整性 / Functional Completeness | 25% | 所有申请等级要求的功能均通过测试 |
| 文档质量 / Documentation Quality | 10% | 自测报告和参数映射表填写完整、清晰 |

**综合评分达到 80 分及以上**视为审核通过。

#### 审核中可能的结果 / Possible Review Outcomes

| 结果 / Outcome | 说明 / Description |
|---|---|
| **通过 / Pass** | 进入认证结果通知和标识颁发阶段 |
| **有条件通过 / Conditional Pass** | 存在不影响核心功能的轻微不符合项，厂商需在 30 日内提交整改计划 |
| **需补充材料 / Additional Information Required** | 提交材料不完整，厂商需在 15 日内补充 |
| **不通过 / Fail** | 存在重大不符合项，厂商**可以**（MAY）在改进后重新申请 |

### 4.6 第五步：结果通知与标识颁发 / Step 5: Result Notification and Mark Issuance

审核通过后，认证团队**必须**（MUST）在 **3 个工作日**内：

1. 发送正式认证通知邮件（Certification Notification Email）
2. 颁发认证编号（Certification ID），格式：`BC-{LEVEL}-{YYYY}-{NNNN}`
3. 提供认证标识文件（Certification Mark Files）下载链接
4. 将认证设备信息录入 BrewCode OS 官方网站的认证设备名录（Certified Device Registry）

示例认证编号：`BC-L2-2026-0001`

---

## 5. 认证标识使用规范 / Certification Mark Usage Guidelines

### 5.1 标识设计 / Mark Design

BrewCode Compatible 认证标识由品牌标志与等级标识组合而成，彰显设备与 `.brew` 生态系统的兼容性。

#### 标识样式 / Mark Styles

```
┌──────────────────────────────────────────────┐
│                                              │
│    ┌──────────────────────┐                  │
│    │                      │                  │
│    │   BrewCode           │                  │
│    │   COMPATIBLE         │                  │
│    │                      │                  │
│    │      L1 / L2 / L3    │                  │
│    │                      │                  │
│    └──────────────────────┘                  │
│                                              │
│    标识组成 / Mark Composition：             │
│    • 品牌名称 "BrewCode" + "COMPATIBLE"      │
│    • 等级标识 "L1" / "L2" / "L3"             │
│    • 认证编号 (可选 / Optional)              │
│                                              │
└──────────────────────────────────────────────┘
```

#### 颜色标准 / Color Standard

| 元素 / Element | 颜色值 / Color Value | 说明 / Description |
|---|---|---|
| 主色 / Primary Color | `#2C2C2C` (深黑 / Dark Black) | 标识主体颜色 |
| 辅色 / Accent Color | `#C8A27A` (铜金色 / Copper Gold) | 等级标识强调色 |
| 底色 / Background | 透明或白色 / Transparent or White | 确保在任何背景下可读 |
| 专色印刷 / Spot Color | Pantone 7515 C | 仅供印刷参考 |

#### 尺寸比例与最小尺寸 / Size Ratio and Minimum Size

| 等级 / Level | 标识比例 / Mark Ratio | 最小宽度 / Minimum Width |
|---|---|---|
| L1 Ready | 3:1 (宽:高) | 40mm (印刷) / 120px (屏幕) |
| L2 Interactive | 3:1 (宽:高) | 40mm (印刷) / 120px (屏幕) |
| L3 Native | 3:1 (宽:高) | 40mm (印刷) / 120px (屏幕) |

### 5.2 使用许可 / Usage Permissions

获得认证的厂商**可以**（MAY）在以下场景使用认证标识：

| 使用场景 / Usage Scenario | L1 | L2 | L3 |
|---|---|---|---|
| 产品包装 / Product Packaging | ✓ | ✓ | ✓ |
| 产品说明书 / Product Manual | ✓ | ✓ | ✓ |
| 产品机身 / Product Body | ✓ | ✓ | ✓ |
| 官方网站 / Official Website | ✓ | ✓ | ✓ |
| 电商平台产品页 / E-commerce Product Page | ✓ | ✓ | ✓ |
| 营销材料 / Marketing Materials | ✓ | ✓ | ✓ |
| 社交媒体 / Social Media | ✓ | ✓ | ✓ |
| 展会展示 / Exhibition Display | ✓ | ✓ | ✓ |

### 5.3 使用规则 / Usage Rules

厂商**必须**（MUST）遵守以下规则：

1. **完整性 / Integrity**：标识**必须**保持完整，不得裁剪、变形或修改颜色
2. **清晰性 / Clarity**：标识**必须**清晰可辨，不得被其他元素遮挡或干扰
3. **关联性 / Association**：标识**必须**与被认证设备型号明确关联，不得暗示未认证设备已通过认证
4. **等级标识 / Level Marking**：L2/L3 标识**必须**显示正确的等级标识，不得将 L1 认证的产品标记为更高等级
5. **认证编号 / Certification ID**：在技术文档中引用认证信息时，**应该**使用完整的认证编号

### 5.4 禁止使用 / Prohibited Uses

以下行为**禁止**（MUST NOT）：

1. 在未通过认证的设备上使用认证标识
2. 在认证被撤销后继续使用认证标识
3. 修改、篡改或伪造认证标识
4. 以任何方式暗示 BrewCode OS 项目对设备品质、安全性或耐用性做出保证
5. 将认证标识用于与咖啡冲煮设备无关的产品
6. 在认证标识上叠加其他图形或文字

### 5.5 违规处理 / Violation Handling

发现违规使用认证标识的情况，BrewCode OS 项目**必须**（MUST）采取以下措施：

1. **首次违规 / First Violation**：发出书面警告（Written Warning），要求 15 日内整改
2. **二次违规 / Second Violation**：暂停认证资格（Suspension）30 日，要求厂商提交整改报告
3. **三次违规 / Third Violation**：撤销认证（Revocation），从认证设备名录中移除，并公告撤销决定

---

## 6. 认证费用 / Certification Fees

### 6.1 费用标准 / Fee Schedule

| 认证等级 / Level | 费用 / Fee | 计费周期 / Billing Cycle | 说明 / Notes |
|---|---|---|---|
| **L1 Ready** | **免费 / Free** | 永久 / Perpetual | 鼓励生态接入，降低入门门槛 |
| **L2 Interactive** | **$99 USD / 年** | 年度 / Annual | 覆盖认证审核和标识维护成本 |
| **L3 Native** | **$299 USD / 年** | 年度 / Annual | 覆盖深度审核、数据校验和持续维护成本 |

> **费用原则 / Fee Principle**：BrewCode OS 是非营利开源项目，认证费用仅用于覆盖认证体系的运营成本，包括但不限于：审核人力、测试设备、标识维护、官方网站运维。费用不构成利润来源。

### 6.2 支付方式 / Payment Methods

厂商**必须**（MUST）通过以下方式支付认证费用：

- **支付平台 / Payment Platform**：Stripe（国际）或微信支付（中国大陆）
- **支付链接 / Payment Link**：认证审核通过后，认证团队将发送专属支付链接
- **发票 / Invoice**：支付完成后，认证团队**应该**（SHOULD）在 5 个工作日内提供电子发票/收据

### 6.3 费用调整机制 / Fee Adjustment Mechanism

1. BrewCode OS 项目**可以**（MAY）根据运营成本变化调整认证费用
2. 费用调整**必须**（MUST）提前 **90 日**在官方网站 `brewcode.礼字号.中国` 公告
3. 已缴纳年度费用的厂商，在当前计费周期内不受费用调整影响
4. L1 Ready 认证**永久免费**，此承诺不可撤销

### 6.4 退款政策 / Refund Policy

| 情形 / Circumstance | 退款政策 / Refund Policy |
|---|---|
| 认证审核不通过 / Certification Review Failed | 退还 50% 费用 |
| 厂商主动撤销申请（审核开始前）/ Voluntary Withdrawal Before Review | 全额退还 / Full Refund |
| 厂商主动撤销申请（审核开始后）/ Voluntary Withdrawal After Review Begins | 不予退还 / No Refund |
| 认证被撤销（因违规）/ Certification Revoked (Due to Violation) | 不予退还 / No Refund |

---

## 7. 认证续期与撤销 / Certification Renewal and Revocation

### 7.1 认证有效期 / Certification Validity Period

| 认证等级 / Level | 有效期 / Validity Period | 起始日期 / Start Date |
|---|---|---|
| L1 Ready | 永久 / Perpetual | 认证通过日期 |
| L2 Interactive | 1 年 / 1 Year | 认证通过日期 |
| L3 Native | 1 年 / 1 Year | 认证通过日期 |

### 7.2 年度续期流程 / Annual Renewal Process

L2 和 L3 认证厂商**必须**（MUST）按以下流程完成年度续期：

#### 续期时间线 / Renewal Timeline

```
认证到期前 60 日          到期前 30 日          到期日              到期后 30 日
     │                       │                   │                     │
     ▼                       ▼                   ▼                     ▼
  续期提醒通知           续期申请截止          认证到期              宽限期结束
  Renewal Notice       Renewal Deadline     Expiration          Grace Period End
```

#### 续期步骤 / Renewal Steps

1. **续期提醒 / Renewal Notice**：认证团队**必须**（MUST）在认证到期前 **60 日**发送续期提醒邮件
2. **提交续期申请 / Submit Renewal Application**：厂商**必须**（MUST）在到期前 **30 日**提交续期申请，包含：
   - 设备固件更新情况说明（如有）
   - 参数映射表更新（如有变更）
   - 续期费用支付凭证
3. **续期审核 / Renewal Review**：认证团队**必须**（MUST）在收到续期申请后 **10 个工作日**内完成审核
   - 若设备无重大变更：快速审核，直接续期
   - 若设备有重大变更（如固件大版本升级）：需重新提交自测报告
4. **续期确认 / Renewal Confirmation**：审核通过后，颁发新的认证有效期

#### 宽限期 / Grace Period

认证到期后，厂商享有 **30 日宽限期**（Grace Period）。在宽限期内：

- 认证标识**可以**（MAY）继续使用
- 认证状态在官方网站标记为「宽限期中 / In Grace Period」
- 宽限期结束后未续期，视为认证失效

### 7.3 认证撤销 / Certification Revocation

#### 撤销条件 / Revocation Conditions

以下情况，认证**必须**（MUST）被撤销：

| 编号 / ID | 撤销条件 / Revocation Condition | 说明 / Description |
|---|---|---|
| RV-01 | 未续期 / Not Renewed | L2/L3 认证到期后宽限期结束仍未续期 |
| RV-02 | 违反互操作性承诺 / Breach of Interoperability | 设备固件更新后不再符合认证等级技术要求 |
| RV-03 | 违规使用标识 / Improper Use of Mark | 违反第5章标识使用规范，且达到三次违规 |
| RV-04 | 虚假声明 / False Claims | 厂商在认证申请或宣传中提供了虚假信息 |
| RV-05 | 厂商主动申请 / Voluntary Withdrawal | 厂商主动申请撤销认证 |
| RV-06 | 设备停产 / Device Discontinued | 设备已停产且厂商未在 90 日内通知认证团队 |

#### 撤销程序 / Revocation Procedure

1. **调查 / Investigation**：认证团队收到撤销触发信息后，**必须**（MUST）在 10 个工作日内完成调查
2. **通知 / Notification**：调查确认需撤销认证的，**必须**（MUST）在 3 个工作日内向厂商发出《认证撤销通知 / Certification Revocation Notice》，说明撤销原因和生效日期
3. **公告 / Public Notice**：撤销生效后，**必须**（MUST）在官方网站认证设备名录中更新状态
4. **标识移除 / Mark Removal**：厂商**必须**（MUST）在撤销生效后 30 日内，从所有产品和营销材料中移除认证标识

#### 申诉流程 / Appeal Process

厂商**可以**（MAY）在收到《认证撤销通知》后 **15 日**内提交申诉：

1. 申诉**必须**（MUST）以书面形式提交至 `certification@brewcode.dev`
2. 申诉**必须**（MUST）包含申诉理由和支持证据
3. 认证团队**必须**（MUST）在收到申诉后 **15 个工作日**内完成复核并给出最终裁定
4. 最终裁定为终局决定，不可再次申诉

### 7.4 认证状态查询 / Certification Status Inquiry

任何人均**可以**（MAY）通过以下方式查询设备的认证状态：

- **官方网站 / Official Website**：访问 `brewcode.礼字号.中国/compatible`（待上线），输入认证编号或设备型号进行查询
- **API 查询 / API Inquiry**：访问 `api.礼字号.中国/cert/verify?id={认证编号}` 获取 JSON 格式的认证状态信息

---

## 8. 附录 / Appendices

### 附录 A：认证申请表格模板 / Certification Application Form Template

---

#### 中文版 / Chinese Version

```
╔═══════════════════════════════════════════════════════════════╗
║          BrewCode Compatible 认证申请表 v1.0                  ║
║          Certification Application Form                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  【基本信息 / Basic Information】                             ║
║                                                               ║
║  厂商全称：________________________________________________  ║
║  Manufacturer Full Name                                       ║
║                                                               ║
║  厂商官网：________________________________________________  ║
║  Manufacturer Website                                         ║
║                                                               ║
║  联系人姓名：______________________________________________  ║
║  Contact Name                                                 ║
║                                                               ║
║  联系人邮箱：______________________________________________  ║
║  Contact Email                                                ║
║                                                               ║
║  联系人电话：______________________________________________  ║
║  Contact Phone (Optional)                                     ║
║                                                               ║
║  厂商地址：________________________________________________  ║
║  Manufacturer Address                                         ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  【设备信息 / Device Information】                            ║
║                                                               ║
║  设备型号：________________________________________________  ║
║  Device Model                                                 ║
║                                                               ║
║  设备类型（请勾选）：                                        ║
║  Device Type (Please Check)                                   ║
║  □ 手冲设备 / Pour-over Device                               ║
║  □ 意式咖啡机 / Espresso Machine                             ║
║  □ 浸泡式冲煮设备 / Immersion Brewer                         ║
║  □ 研磨设备 / Grinder                                        ║
║  □ 冲煮辅助设备 / Brewing Accessory                          ║
║  □ 其他 / Other：___________                                 ║
║                                                               ║
║  固件版本：________________________________________________  ║
║  Firmware Version                                             ║
║                                                               ║
║  产品页面 URL：_____________________________________________  ║
║  Product Page URL (Optional)                                  ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  【认证信息 / Certification Information】                     ║
║                                                               ║
║  申请等级（请勾选）：                                        ║
║  Applied Level (Please Check)                                 ║
║  □ L1 Ready（就绪级）                                        ║
║  □ L2 Interactive（交互级）                                  ║
║  □ L3 Native（原生级）                                       ║
║                                                               ║
║  参数输入方式：                                              ║
║  Parameter Input Method                                       ║
║  □ API 自动输入 / API Input                                  ║
║  □ 手动输入 / Manual Input                                   ║
║  □ 两者均支持 / Both Supported                               ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  【自述材料 / Self-Description】                              ║
║                                                               ║
║  请简要描述设备的技术特点及其与 .brew 生态系统的兼容性方案    ║
║  Please briefly describe the device's technical features      ║
║  and its compatibility approach with the .brew ecosystem      ║
║  （500字以内 / Within 500 words）                             ║
║                                                               ║
║  ___________________________________________________________ ║
║  ___________________________________________________________ ║
║  ___________________________________________________________ ║
║  ___________________________________________________________ ║
║  ___________________________________________________________ ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  【声明 / Declaration】                                       ║
║                                                               ║
║  本人声明以上信息真实、准确。本人已阅读并同意遵守             ║
║  BrewCode Compatible 认证规范 v1.0 的全部条款。               ║
║                                                               ║
║  I declare that the above information is true and accurate.   ║
║  I have read and agree to comply with all terms of the        ║
║  BrewCode Compatible Certification Specification v1.0.        ║
║                                                               ║
║  签名 / Signature：________________  日期 / Date：__________  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### 附录 B：参数映射表标准模板 / Parameter Mapping Table Template

---

```
╔═══════════════════════════════════════════════════════════════╗
║    BrewCode Compatible 参数映射表 v1.0                         ║
║    Parameter Mapping Table                                     ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  厂商名称 / Manufacturer：________________________________   ║
║  设备型号 / Device Model：________________________________   ║
║  固件版本 / Firmware Version：______________________________ ║
║  认证等级 / Certification Level：□ L1  □ L2  □ L3           ║
║  填表日期 / Date：__________________________________________ ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ A. 核心参数映射 / Core Parameter Mapping               │ ║
║  ├─────┬──────────────┬──────────────┬──────────┬──────────┤ ║
║  │ 序号 │ .brew 字段    │ 设备参数名    │ 映射方式  │ 设备误差  │ ║
║  │  #  │ .brew Field  │ Device Param │ Mapping  │ Dev.Error │ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  1  │ recipe.dose│ ___________  │ 直接/转换 │ ±_______ │ ║
║  │     │ .value      │              │ Direct/  │          │ ║
║  │     │              │              │ Convert  │          │ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  2  │ recipe.waterAmount │ ___________  │ 直接/转换 │ ±_______ │ ║
║  │     │ .value      │              │ Direct/  │          │ ║
║  │     │              │              │ Convert  │          │ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  3  │ recipe.waterTemperature │ ___________  │ 直接/转换 │ ±_______ │ ║
║  │     │ .value      │              │ Direct/  │          │ ║
║  │     │              │              │ Convert  │          │ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  4  │ recipe.grindSize │ ___________  │ 直接/转换 │ ±_______ │ ║
║  │     │ .value        │              │ Direct/  │          │ ║
║  │     │              │              │ Convert  │          │ ║
║  └─────┴──────────────┴──────────────┴──────────┴──────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ B. 步骤动作映射 / Step Action Mapping（L2/L3 必填）     │ ║
║  ├─────┬──────────────┬──────────────┬──────────┬──────────┤ ║
║  │ 序号 │ steps.action  │ 设备动作名    │ 动作参数    │ 是否支持  │ ║
║  │  #  │ Action Type  │ Device Action│ Action    │ Supported│ ║
║  │     │              │              │ Params    │          │ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  1  │ pour         │ ___________  │ ________ │ □ 是 □ 否│ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  2  │ wait         │ ___________  │ ________ │ □ 是 □ 否│ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  3  │ stir         │ ___________  │ ________ │ □ 是 □ 否│ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  4  │ swirl        │ ___________  │ ________ │ □ 是 □ 否│ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  5  │ drain        │ ___________  │ ________ │ □ 是 □ 否│ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  6  │ bloom        │ ___________  │ ________ │ □ 是 □ 否│ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  7  │ 其他/Other:  │ ___________  │ ________ │ □ 是 □ 否│ ║
║  │     │ ______       │              │          │          │ ║
║  └─────┴──────────────┴──────────────┴──────────┴──────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ C. 传感器能力 / Sensor Capability（L3 必填）            │ ║
║  ├─────┬──────────────┬──────────┬──────────┬──────────────┤ ║
║  │ 序号 │ 传感器类型    │ 是否内置  │ 采样频率  │ 精度          │ ║
║  │  #  │ Sensor Type  │ Built-in │ Sampling │ Accuracy     │ ║
║  │     │              │          │  Rate    │              │ ║
║  ├─────┼──────────────┼──────────┼──────────┼──────────────┤ ║
║  │  1  │ 温度传感器    │ □ 是 □ 否│ ___ Hz   │ ±____ °C    │ ║
║  │     │ Temperature  │          │          │              │ ║
║  ├─────┼──────────────┼──────────┼──────────┼──────────────┤ ║
║  │  2  │ 重量传感器    │ □ 是 □ 否│ ___ Hz   │ ±____ g     │ ║
║  │     │ Weight       │          │          │              │ ║
║  ├─────┼──────────────┼──────────┼──────────┼──────────────┤ ║
║  │  3  │ 流量传感器    │ □ 是 □ 否│ ___ Hz   │ ±____ ml/s  │ ║
║  │     │ Flow Rate    │          │          │              │ ║
║  ├─────┼──────────────┼──────────┼──────────┼──────────────┤ ║
║  │  4  │ 其他/Other:  │ □ 是 □ 否│ ___ Hz   │ ±____       │ ║
║  │     │ ______       │          │          │              │ ║
║  └─────┴──────────────┴──────────┴──────────┴──────────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ D. 单位转换支持 / Unit Conversion Support                │ ║
║  ├─────┬──────────────┬──────────┬──────────┬──────────────┤ ║
║  │ 序号 │ 转换类型      │ 是否支持  │ 转换方式  │ 转换精度      │ ║
║  │  #  │ Conversion   │ Supported│ Method   │ Precision    │ ║
║  ├─────┼──────────────┼──────────┼──────────┼──────────────┤ ║
║  │  1  │ g → oz       │ □ 是 □ 否│ 自动/手动 │ ___ 位小数   │ ║
║  ├─────┼──────────────┼──────────┼──────────┼──────────────┤ ║
║  │  2  │ ml → fl oz   │ □ 是 □ 否│ 自动/手动 │ ___ 位小数   │ ║
║  ├─────┼──────────────┼──────────┼──────────┼──────────────┤ ║
║  │  3  │ °C → °F      │ □ 是 □ 否│ 自动/手动 │ ___ 位小数   │ ║
║  └─────┴──────────────┴──────────┴──────────┴──────────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ E. 填写示例 / Example Entry                             │ ║
║  ├─────┬──────────────┬──────────────┬──────────┬──────────┤ ║
║  │  1  │ recipe.dose│ target_weight│ 直接     │ ±0.3g    │ ║
║  │     │ .value      │              │ Direct   │          │ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  2  │ recipe.waterAmount │ target_vol   │ 直接     │ ±3ml     │ ║
║  │     │ .value      │              │ Direct   │          │ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  3  │ recipe.waterTemperature │ target_temp  │ 直接     │ ±1.0°C   │ ║
║  │     │ .value      │              │ Direct   │          │ ║
║  ├─────┼──────────────┼──────────────┼──────────┼──────────┤ ║
║  │  4  │ recipe.grindSize │ grind_level  │ 转换     │ ±2 档位  │ ║
║  │     │ .value        │ (1-30)       │ Convert  │ (steps)  │ ║
║  │     │              │              │ 公式见附注│          │ ║
║  └─────┴──────────────┴──────────────┴──────────┴──────────┘ ║
║                                                               ║
║  附注 / Notes：                                               ║
║  ___________________________________________________________ ║
║  ___________________________________________________________ ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### 附录 C：关键术语词汇表 / Glossary of Key Terms

| 术语 / Term | 英文 / English | 定义 / Definition |
|---|---|---|
| `.brew` 文件 | `.brew` File | BrewCode OS 定义的 JSON 标准文件格式，用于描述咖啡冲煮方案 |
| 冲煮方案 | Brewing Recipe | 一套完整的咖啡冲煮参数和步骤定义 |
| 互操作性 | Interoperability | 不同设备之间交换和使用 `.brew` 文件的能力 |
| 参数映射 | Parameter Mapping | 将 `.brew` 标准字段转换为设备可执行参数的过程 |
| 误差容限 | Error Tolerance | 设备实际输出值与 `.brew` 文件设定值之间的允许偏差范围 |
| 认证标识 | Certification Mark | 表明设备通过 BrewCode Compatible 认证的官方图形标识 |
| 认证编号 | Certification ID | 每个通过认证的设备获得的唯一标识编号 |
| 自测 | Self-Test | 厂商在提交认证前自行完成的合规性测试 |
| 宽限期 | Grace Period | 认证到期后允许厂商续期的缓冲时间 |
| 冲煮记录 | Brewing Record | 冲煮过程中实际采集的数据，写入 `.brew` 文件的 `result` 字段 |
| steps 数组 | steps Array | `.brew` 文件中定义冲煮步骤序列的 JSON 数组 |
| result 字段 | result Field | `.brew` 文件中用于记录实际冲煮数据的字段 |

---

### 附录 D：自测清单模板 / Self-Test Checklist Template

---

```
╔═══════════════════════════════════════════════════════════════╗
║    BrewCode Compatible 自测清单 v1.0                           ║
║    Self-Test Checklist                                         ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  厂商名称 / Manufacturer：________________________________   ║
║  设备型号 / Device Model：________________________________   ║
║  固件版本 / Firmware Version：______________________________ ║
║  申请等级 / Applied Level：□ L1  □ L2  □ L3                 ║
║  测试日期 / Test Date：_____________________________________ ║
║  测试人员 / Tester：________________________________________ ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 1. 核心参数接收测试 / Core Parameter Reception Test     │ ║
║  ├──────┬──────────────────────┬────────┬────────┬─────────┤ ║
║  │ 编号 │ 测试项                │ 测试值  │ 实测值  │ 结果     │ ║
║  │  #  │ Test Item            │ Target │ Actual │ Result  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 1.1  │ 粉量 / Weight        │ 15.0g  │ _____g │ □ 通过  │ ║
║  │      │                      │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 1.2  │ 总水量 / Total Volume│ 250ml  │ ____ml │ □ 通过  │ ║
║  │      │                      │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 1.3  │ 水温 / Temperature   │ 93.0°C │ ____°C │ □ 通过  │ ║
║  │      │                      │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 1.4  │ 研磨度 / Grind Size  │ 600μm  │ ___μm  │ □ 通过  │ ║
║  │      │                      │        │        │ □ 失败  │ ║
║  └──────┴──────────────────────┴────────┴────────┴─────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 2. 参数输入方式测试 / Parameter Input Method Test       │ ║
║  ├──────┬──────────────────────┬────────┬────────┬─────────┤ ║
║  │ 2.1  │ API 输入 / API Input │  N/A   │  N/A   │ □ 通过  │ ║
║  │      │                      │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 2.2  │ 手动输入 / Manual    │  N/A   │  N/A   │ □ 通过  │ ║
║  │      │ Input                │        │        │ □ 失败  │ ║
║  └──────┴──────────────────────┴────────┴────────┴─────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 3. 单位转换测试 / Unit Conversion Test                  │ ║
║  ├──────┬──────────────────────┬────────┬────────┬─────────┤ ║
║  │ 3.1  │ 公制→英制重量        │ 15.0g  │ ___oz  │ □ 通过  │ ║
║  │      │ Metric→Imperial Wt  │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 3.2  │ 摄氏→华氏温度        │ 93.0°C │ ___°F  │ □ 通过  │ ║
║  │      │ °C→°F               │        │        │ □ 失败  │ ║
║  └──────┴──────────────────────┴────────┴────────┴─────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 4. Steps 数组解析与执行测试 / Steps Parsing & Execution │ ║
║  │    （L2/L3 必填 / Required for L2/L3）                  │ ║
║  ├──────┬──────────────────────┬────────┬────────┬─────────┤ ║
║  │ 4.1  │ 解析 3 步方案        │  N/A   │  N/A   │ □ 通过  │ ║
║  │      │ Parse 3-step Recipe │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 4.2  │ 解析 5+ 步方案       │  N/A   │  N/A   │ □ 通过  │ ║
║  │      │ Parse 5+ step Recipe│        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 4.3  │ 顺序执行 / Sequential│  N/A   │  N/A   │ □ 通过  │ ║
║  │      │ Execution            │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 4.4  │ 步骤跳过 / Skip Step │  N/A   │  N/A   │ □ 通过  │ ║
║  │      │                      │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 4.5  │ 步骤暂停 / Pause Step│  N/A   │  N/A   │ □ 通过  │ ║
║  │      │                      │        │        │ □ 失败  │ ║
║  └──────┴──────────────────────┴────────┴────────┴─────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 5. 数据记录与回写测试 / Data Recording & Write-back     │ ║
║  │    （L3 必填 / Required for L3）                        │ ║
║  ├──────┬──────────────────────┬────────┬────────┬─────────┤ ║
║  │ 5.1  │ 温度记录 / Temp Log  │  N/A   │  N/A   │ □ 通过  │ ║
║  │      │                      │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 5.2  │ 水量记录 / Vol Log   │  N/A   │  N/A   │ □ 通过  │ ║
║  │      │                      │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 5.3  │ result 回写 / Write  │  N/A   │  N/A   │ □ 通过  │ ║
║  │      │ result Field         │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 5.4  │ .brew 文件导出       │  N/A   │  N/A   │ □ 通过  │ ║
║  │      │ .brew File Export    │        │        │ □ 失败  │ ║
║  └──────┴──────────────────────┴────────┴────────┴─────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 6. 异常处理测试 / Exception Handling Test               │ ║
║  ├──────┬──────────────────────┬────────┬────────┬─────────┤ ║
║  │ 6.1  │ 无效参数输入 / Invalid│  N/A   │  N/A   │ □ 通过  │ ║
║  │      │ Parameter Input      │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 6.2  │ 传感器故障 / Sensor  │  N/A   │  N/A   │ □ 通过  │ ║
║  │      │ Failure              │        │        │ □ 失败  │ ║
║  ├──────┼──────────────────────┼────────┼────────┼─────────┤ ║
║  │ 6.3  │ 断电恢复 / Power Loss│  N/A   │  N/A   │ □ 通过  │ ║
║  │      │ Recovery             │        │        │ □ 失败  │ ║
║  └──────┴──────────────────────┴────────┴────────┴─────────┘ ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  测试总结 / Test Summary：                                    ║
║  通过项数 / Passed：____ / ____                               ║
║  失败项数 / Failed：____ / ____                               ║
║  不适用项数 / N/A：____ / ____                                ║
║                                                               ║
║  备注 / Remarks：                                             ║
║  ___________________________________________________________ ║
║  ___________________________________________________________ ║
║                                                               ║
║  测试人员签名 / Tester Signature：___________________________ ║
║  日期 / Date：_______________________________________________ ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### 附录 E：测试用例参考 / Reference Test Cases

#### 测试用例 1：L1 基础参数接收 / Test Case 1: L1 Basic Parameter Reception

**测试用 `.brew` 文件 / Test `.brew` File**：

```json
{
  "$schema": "https://brewcode.dev/schemas/brew.schema.json",
  "meta": {
    "name": "BrewCode Compatible L1 Test",
    "version": "1.0.0",
    "brewCodeVersion": "1.0",
    "author": "Certification Test Suite"
  },
  "recipe": {
    "dose": {
      "value": 15.0,
      "unit": "g"
    },
    "waterAmount": {
      "value": 250,
      "unit": "ml"
    },
    "waterTemperature": {
      "value": 93,
      "unit": "°C"
    },
    "grindSize": {
      "value": 600,
      "unit": "μm"
    }
  }
}
```

**预期结果 / Expected Result**：设备应显示粉量 15.0g、水量 250ml、水温 93°C、研磨度 600μm。

---

#### 测试用例 2：L2 步骤序列执行 / Test Case 2: L2 Step Sequence Execution

**测试用 `.brew` 文件 / Test `.brew` File**：

```json
{
  "$schema": "https://brewcode.dev/schemas/brew.schema.json",
  "meta": {
    "name": "BrewCode Compatible L2 Test",
    "version": "1.0.0",
    "brewCodeVersion": "1.0",
    "author": "Certification Test Suite"
  },
  "recipe": {
    "dose": {
      "value": 15.0,
      "unit": "g"
    },
    "waterAmount": {
      "value": 250,
      "unit": "ml"
    },
    "waterTemperature": {
      "value": 93,
      "unit": "°C"
    },
    "grindSize": {
      "value": 600,
      "unit": "μm"
    }
  },
  "steps": [
    {
      "order": 1,
      "action": "bloom",
      "waterAmount": {
        "value": 30,
        "unit": "ml"
      },
      "duration": {
        "value": 30,
        "unit": "s"
      },
      "note": "注入30ml水，等待30秒闷蒸"
    },
    {
      "order": 2,
      "action": "pour",
      "waterAmount": {
        "value": 120,
        "unit": "ml"
      },
      "duration": {
        "value": 30,
        "unit": "s"
      },
      "note": "绕圈注入120ml水"
    },
    {
      "order": 3,
      "action": "wait",
      "duration": {
        "value": 20,
        "unit": "s"
      },
      "note": "等待20秒"
    },
    {
      "order": 4,
      "action": "pour",
      "waterAmount": {
        "value": 100,
        "unit": "ml"
      },
      "duration": {
        "value": 25,
        "unit": "s"
      },
      "note": "中心注入100ml水"
    }
  ]
}
```

**预期结果 / Expected Result**：设备应按顺序执行：闷蒸 30s → 注水 120ml → 等待 20s → 注水 100ml，并在每一步前向用户提示。

---

#### 测试用例 3：L3 数据记录与回写 / Test Case 3: L3 Data Recording and Write-back

**测试用 `.brew` 文件 / Test `.brew` File**：同测试用例 2。

**预期结果 / Expected Result**：冲煮完成后，设备应生成包含以下内容的 `.brew` 文件：

```json
{
  "result": {
    "brewedAt": "2026-06-25T10:30:00.000Z",
    "totalTime": 165,
    "actualCoffeeWeight": 15.2,
    "actualWaterVolume": 248,
    "dataCompleteness": "complete",
    "steps": [
      {
        "order": 1,
        "action": "bloom",
        "targetAmount": 30,
        "actualAmount": 31,
        "targetDuration": 30,
        "actualDuration": 32,
        "actualTemperature": 92.5
      }
    ]
  }
}
```

---

## 文档元信息 / Document Metadata

| 属性 / Property | 值 / Value |
|---|---|
| 文档编号 / Document Number | BC-CERT-2026-001 |
| 版本 / Version | 1.0 |
| 发布日期 / Release Date | 2026-06-25 |
| 发布许可 / License | CC0 1.0 Universal |
| 维护方 / Maintainer | BrewCode OS 项目组 |
| 反馈渠道 / Feedback | certification@brewcode.dev |
| 官方网站 / Official Website | https://brewcode.礼字号.中国 |
| 文档源码 / Source | https://github.com/brewcode-os/brewcode-os/blob/main/docs/brewcode-compatible-spec-v1.0.md |

---

> *BrewCode OS 是为全球咖啡冲煮建立通用数字语言的开放项目。本认证规范以 CC0 1.0 Universal 许可发布，任何人可自由使用、复制、修改和分发。*
>
> *BrewCode OS is an open project building a universal digital language for coffee brewing worldwide. This certification specification is released under CC0 1.0 Universal. Anyone is free to use, copy, modify, and distribute it.*