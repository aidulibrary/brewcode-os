# BrewCode Compatible 参数映射表

**厂商名称**：Comandante
**设备型号**：C40 Nitro Blade
**固件版本**：v2.1.0
**认证等级**：L2 Interactive
**认证编号**：BC-L2-2026-0001
**填表日期**：2026-06-25

---

## A. 核心参数映射

| 序号 | .brew 字段 | 设备参数名 | 映射方式 | 设备误差 |
|:---|:---|:---|:---|:---|
| 1 | `recipe.dose.value` | 目标粉量 | 直接映射 | ±0.3g |
| 2 | `recipe.waterAmount.value` | 目标水量 | 直接映射 | ±3ml |
| 3 | `recipe.waterTemperature.value` | 目标水温 | 直接映射 | ±1.0°C |
| 4 | `recipe.grindSize.value` | 研磨刻度 (Clicks) | 转换映射（见附注） | ±2 clicks |

> **附注**：Comandante C40 的研磨刻度（Clicks）与微米（μm）的对应关系为厂商实验室实测数据。刻度 0 为刀盘闭合位置（零位），每增加 1 click 刀盘间距增加约 30μm。推荐手冲区间为 20-30 clicks（600-900μm）。

---

## B. 研磨度映射对照表

| C40 刻度 (Clicks) | 对应微米 (μm) | 适用场景 |
|:---|:---|:---|
| 15 | 400 | 细研磨，适用于意式浓缩 |
| 22 | 600 | 中细研磨，适用于 V60 手冲 |
| 30 | 900 | 粗研磨，适用于法压壶 |

---

## C. 步骤动作映射（L2 必填）

| 序号 | steps.action | 设备动作名 | 动作参数 | 是否支持 |
|:---|:---|:---|:---|:---|
| 1 | `pour` | 注水 | 注水量 (ml)、注水时间 (s) | ✅ 支持 |
| 2 | `wait` | 等待 | 等待时间 (s) | ✅ 支持 |
| 3 | `stir` | 搅拌 | 搅拌时间 (s) | ✅ 支持 |
| 4 | `swirl` | 摇晃 | 摇晃时间 (s) | ✅ 支持 |
| 5 | `drawdown` | 滴滤 | 无额外参数 | ✅ 支持 |
| 6 | `bloom` | 闷蒸 | 注水量 (ml)、闷蒸时间 (s) | ✅ 支持 |

---

## D. 单位转换支持

| 序号 | 转换类型 | 是否支持 | 转换方式 | 转换精度 |
|:---|:---|:---|:---|:---|
| 1 | g → oz | ✅ 支持 | 自动转换 | 2 位小数 |
| 2 | ml → fl oz | ✅ 支持 | 自动转换 | 2 位小数 |
| 3 | °C → °F | ✅ 支持 | 自动转换 | 1 位小数 |

---

## E. 传感器能力（L2 不适用，保留供未来升级参考）

| 序号 | 传感器类型 | 是否内置 | 采样频率 | 精度 |
|:---|:---|:---|:---|:---|
| 1 | 温度传感器 | ❌ 否 | — | — |
| 2 | 重量传感器 | ❌ 否 | — | — |
| 3 | 流量传感器 | ❌ 否 | — | — |

---

## 填写示例

| .brew 字段 | 设备参数名 | 映射方式 | 示例值 |
|:---|:---|:---|:---|
| `recipe.grindSize.value` | C40 刻度 | 转换映射 | `.brew` 中的 `600μm` → C40 刻度 `22 clicks` |
| `recipe.waterTemperature.value` | 目标水温 | 直接映射 | `.brew` 中的 `93°C` → 设备设定 `93°C` |
| `recipe.dose.value` | 目标粉量 | 直接映射 | `.brew` 中的 `15g` → 设备设定 `15g` |

---

> *本参数映射表由 Comandante 提供，用于 BrewCode Compatible L2 Interactive 认证申请。*
> *This Parameter Mapping Table is provided by Comandante for BrewCode Compatible L2 Interactive certification application.*
