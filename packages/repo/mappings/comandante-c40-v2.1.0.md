# BrewCode Compatible 参数映射表 v1.0

## 基本信息

| 项目 | 内容 |
|------|------|
| 厂商名称 / Manufacturer | Comandante |
| 设备型号 / Device Model | C40 |
| 固件版本 / Firmware Version | v2.1.0 |
| 认证等级 / Certification Level | L2 Interactive |
| 填表日期 / Date | 2026-06-25 |

---

## A. 核心参数映射

| 序号 | .brew 字段 | 设备参数名 | 映射方式 | 设备误差 |
|------|-----------|-----------|---------|---------|
| 1 | `recipe.dose.value` | `target_weight` | 直接 / Direct | ±0.5g |
| 2 | `recipe.waterAmount.value` | `target_vol` | 直接 / Direct | ±5ml |
| 3 | `recipe.waterTemperature.value` | `target_temp` | 直接 / Direct | ±1.0°C |
| 4 | `recipe.grindSize.value` | `grind_clicks` | 转换 / Convert | ±2 格 (clicks) |

### 研磨度刻度 → 微米值对应关系（基于 D1 device_registry 真实数据）

| 研磨刻度（格） | 微米值（μm） | 适用场景 |
|:--------:|:---------:|------|
| 15 | 400 | 细研磨，适合意式 |
| 22 | 600 | 中细研磨，适合 V60 |
| 30 | 900 | 粗研磨，适合法压壶 |

> 转换公式：`grind_clicks = grindSize(μm) × (30 / 900)`，即每格约等于 30μm。C40 共有 30 格（15-45），覆盖 400-1350μm 范围。

---

## B. 步骤动作映射（L2 必填）

| 序号 | steps.action | 设备动作名 | 动作参数 | 是否支持 |
|------|-------------|-----------|---------|---------|
| 1 | pour | 注水模式 | 水量(ml) | ✅ 是 |
| 2 | wait | 暂停 | 时长(s) | ✅ 是 |
| 3 | stir | 搅拌提示 | — | ✅ 是 |
| 4 | swirl | 摇晃提示 | — | ✅ 是 |
| 5 | drain | 排液提示 | — | ✅ 是 |
| 6 | bloom | 闷蒸 | 水量(ml)+时长(s) | ✅ 是 |

### C40 22 格 = 600μm 填写示例

```json
{
  "recipe": {
    "dose": { "value": 15.0, "unit": "g" },
    "waterAmount": { "value": 250, "unit": "ml" },
    "waterTemperature": { "value": 93, "unit": "°C" },
    "grindSize": { "value": 600, "unit": "μm" }
  }
}
```

当 `.brew` 文件中 `grindSize.value = 600μm` 时，设备应自动换算为 **C40 刻度 22 格**，实现 V60 中细研磨的标准参数映射。
