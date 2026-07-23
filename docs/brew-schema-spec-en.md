# .brew Schema Specification

**Version:** 0.1
**Status:** Draft
**Date:** 2026-06-18
**Author:** BrewCode OS Project
**License:** This specification document is licensed under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Normative References](#2-normative-references)
3. [Document Conventions](#3-document-conventions)
4. [Top-Level Structure](#4-top-level-structure)
5. [The `meta` Object](#5-the-meta-object)
6. [The `coffee` Object](#6-the-coffee-object)
7. [The `equipment` Object](#7-the-equipment-object)
8. [The `recipe` Object](#8-the-recipe-object)
9. [The `steps` Array](#9-the-steps-array)
10. [Step Operation Types](#10-step-operation-types)
11. [The `result` Object](#11-the-result-object)
12. [Complete Example](#12-complete-example)
13. [Conformance](#13-conformance)
14. [Security Considerations](#14-security-considerations)

**Appendix A.** [JSON Schema Reference](#appendix-a-json-schema-reference)
**Appendix B.** [Glossary](#appendix-b-glossary)
**Appendix C.** [Revision History](#appendix-c-revision-history)

---

## 1. Introduction

### 1.1 Purpose

This document defines the `.brew` file format — a JSON-based data interchange format for describing coffee brewing recipes. The `.brew` format provides a machine-readable, human-readable, and reproducible representation of the complete parameters required to brew a cup of coffee: dose, water temperature, grind size, and every pour step in sequence.

### 1.2 Scope

This specification covers:

- The structural definition of a `.brew` file as a JSON document
- The six top-level objects that compose a brewing recipe
- All 13 step operation types and their parameters
- Validation rules and conformance requirements

This specification does **not** cover:

- The BrewCode OS tooling ecosystem (BrewPlayer, BrewRepo, BrewForge)
- The AI service layer implementation
- Transport or API protocols

### 1.3 Design Principles

The `.brew` format is designed according to the following principles:

1. **Human-Readable**: A `.brew` file should be understandable by a coffee enthusiast without tooling. Field names are descriptive, and the structure follows a logical order familiar to brewers.
2. **Machine-Validatable**: Every `.brew` file can be validated against a JSON Schema, ensuring structural correctness before use.
3. **Reproducible**: Given a `.brew` file and equivalent equipment, two brewers should be able to produce cups with similar flavor profiles.
4. **Extensible but Strict**: Implementations MUST reject unknown properties (via `additionalProperties: false`). New fields require a schema version update.
5. **Zero-Dependency**: The format itself imposes no runtime dependencies. The schema is defined in JSON Schema Draft 2020-12 and the reference implementation is a static JSON file.

### 1.4 Relationship to BrewCode OS

The `.brew` format is the foundational standard of the BrewCode OS project. All tools in the ecosystem (BrewPlayer, BrewRepo, BrewForge) consume and produce `.brew` files conforming to this specification. The schema is published under the **CC0 1.0 Universal** license (public domain dedication).

---

## 2. Normative References

| Identifier | Reference |
|------------|-----------|
| **RFC 8259** | T. Bray, Ed., "The JavaScript Object Notation (JSON) Data Interchange Format", RFC 8259, December 2017. |
| **JSON Schema** | "JSON Schema: A Media Type for Describing JSON Documents", Draft 2020-12. |
| **ISO 8601** | "Data elements and interchange formats — Information interchange — Representation of dates and times", ISO 8601:2004. |
| **SemVer** | T. Preston-Werner, "Semantic Versioning 2.0.0". |
| **SPDX** | "Software Package Data Exchange (SPDX) License List". |

---

## 3. Document Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

### 3.1 Data Types

| Type | JSON Equivalent | Examples |
|------|----------------|----------|
| `string` | JSON string | `"V60"`, `"2026-06-14T00:00:00Z"` |
| `number` | JSON number | `15`, `1.35`, `20.5` |
| `integer` | JSON number (no fractional part) | `1`, `22` |
| `boolean` | JSON boolean | `true`, `false` |
| `array` | JSON array | `["蓝莓", "草莓"]` |
| `object` | JSON object | `{"value": 15, "unit": "g"}` |

### 3.2 Measurement Objects

Many fields in this specification use a common **measurement object** pattern:

```json
{
  "value": <number>,
  "unit": "<string>"
}
```

This pattern ensures that numeric values are always accompanied by their unit of measurement, making the data self-describing without external context.

---

## 4. Top-Level Structure

A `.brew` file is a single JSON object with the following top-level fields:

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `$schema` | No | `string` | URI reference to the BrewCode OS schema for validation |
| `meta` | **Yes** | `object` | Recipe metadata: identity, version, authorship |
| `coffee` | **Yes** | `object` | Coffee bean information |
| `equipment` | No | `object` | Brewing equipment used |
| `recipe` | **Yes** | `object` | Core brewing parameters |
| `steps` | **Yes** | `array` | Ordered list of brewing steps |
| `result` | No | `object` | Brewing results and tasting notes |

**Additional properties are not allowed** at the top level. Implementations MUST reject documents containing unknown top-level fields.

### 4.1 Required Fields

The following top-level fields are REQUIRED:

- `meta`
- `coffee`
- `recipe`
- `steps`

A valid `.brew` file MUST contain all four of these fields. The `equipment` and `result` fields are OPTIONAL. The `$schema` field is OPTIONAL but RECOMMENDED for automatic schema association.

---

## 5. The `meta` Object

The `meta` object contains identification, versioning, and attribution information for the recipe.

### 5.1 Required Properties

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `name` | `string` | 1–200 characters | Human-readable recipe name |
| `version` | `string` | SemVer pattern | Recipe version (e.g., `"1.0.0"`) |
| `brewCodeVersion` | `string` | `MAJOR.MINOR` pattern | BrewCode OS specification version used |

### 5.2 Optional Properties

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `author` | `string` | — | Author name or ID |
| `description` | `string` | ≤ 2000 characters | Recipe summary or flavor description |
| `license` | `string` | — | SPDX license identifier (e.g., `"CC0-1.0"`, `"MIT"`) |
| `tags` | `array` of `string` | Unique items | Searchable tags for categorization |
| `createdAt` | `string` | ISO 8601 `date-time` | Creation timestamp |
| `updatedAt` | `string` | ISO 8601 `date-time` | Last modification timestamp |
| `source` | `string` | URI format | Reference URL for the recipe origin |

### 5.3 Validation Rules

- `name` MUST NOT be empty and MUST NOT exceed 200 characters.
- `version` MUST conform to Semantic Versioning 2.0.0: `MAJOR.MINOR.PATCH` with optional pre-release and build metadata.
- `brewCodeVersion` MUST conform to the pattern `MAJOR.MINOR` (e.g., `"0.1"`).
- `tags` array items MUST be unique. Duplicate tags are invalid.
- `createdAt` and `updatedAt`, if present, MUST be valid ISO 8601 date-time strings.

### 5.4 Example

```json
{
  "name": "夏季八冲 · 埃塞俄比亚 耶加雪菲 日晒 浅烘",
  "version": "1.0.0",
  "brewCodeVersion": "0.1",
  "author": "brewcode-os/genesis",
  "description": "经典夏季八冲法，高温快萃，突出耶加雪菲日晒的莓果与花香。",
  "license": "CC0-1.0",
  "tags": ["V60", "一刀流", "浅烘", "日晒", "埃塞俄比亚"],
  "createdAt": "2026-06-14T00:00:00Z",
  "source": "https://github.com/aidulibrary/brewcode-os"
}
```

---

## 6. The `coffee` Object

The `coffee` object describes the coffee beans used in the recipe.

### 6.1 Required Properties

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `name` | `string` | 1–200 characters | Coffee bean name |

### 6.2 Optional Properties

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `producer` | `string` | — | Producer or estate name |
| `origin` | `object` | See §6.3 | Origin information |
| `variety` | `string` | — | Coffee variety (e.g., `"Heirloom"`, `"Bourbon"`, `"Geisha"`) |
| `process` | `string` | — | Processing method (e.g., `"日晒"`, `"水洗"`, `"蜜处理"`) |
| `roastLevel` | `string` | Enumerated set | Roast level |
| `roastDate` | `string` | ISO 8601 `date` | Roast date |
| `roaster` | `string` | — | Roaster name |
| `flavorNotes` | `array` of `string` | Unique items | Official flavor descriptors |

### 6.3 The `origin` Sub-Object

| Property | Type | Description |
|----------|------|-------------|
| `country` | `string` | Country of origin (ISO 3166-1 alpha-2 or Chinese name) |
| `region` | `string` | Growing region (e.g., `"古吉"`, `"耶加雪菲"`) |
| `farm` | `string` | Farm or processing station name |
| `altitude` | `string` | Altitude range (e.g., `"1900-2100m"`) |

### 6.4 Roast Level Enumeration

The `roastLevel` field accepts one of the following values:

| Value | English Equivalent |
|-------|--------------------|
| `"极浅烘"` | Cinnamon / Extra Light |
| `"浅烘"` | Light |
| `"中浅烘"` | Medium-Light |
| `"中烘"` | Medium |
| `"中深烘"` | Medium-Dark |
| `"深烘"` | Dark |
| `"极深烘"` | Extra Dark / French |

### 6.5 Example

```json
{
  "name": "埃塞俄比亚 耶加雪菲 日晒 浅烘",
  "producer": "耶加雪菲合作社",
  "origin": {
    "country": "埃塞俄比亚",
    "region": "耶加雪菲",
    "farm": "Aricha 处理站",
    "altitude": "1900-2100m"
  },
  "variety": "Heirloom",
  "process": "日晒",
  "roastLevel": "浅烘",
  "roastDate": "2026-06-07",
  "roaster": "brewcode-os",
  "flavorNotes": ["蓝莓", "草莓", "紫罗兰", "蜂蜜"]
}
```

---

## 7. The `equipment` Object

The `equipment` object describes the brewing equipment used. This field is OPTIONAL at the top level — a recipe may omit equipment details when the parameters are equipment-agnostic.

### 7.1 Properties

All properties in the `equipment` object are OPTIONAL.

| Property | Type | Description |
|----------|------|-------------|
| `brewer` | `string` | Brewing device type (e.g., `"V60"`, `"Kalita Wave"`, `"Origami"`, `"Chemex"`, `"法压壶"`, `"爱乐压"`) |
| `brewerMaterial` | `string` | Dripper material (e.g., `"陶瓷"`, `"树脂"`, `"玻璃"`, `"金属"`) |
| `brewerSize` | `string` | Dripper size (e.g., `"01"`, `"02"`) |
| `filter` | `string` | Filter paper type (e.g., `"V60 漂白"`, `"V60 原色"`, `"Kalita 波浪"`) |
| `grinder` | `string` | Grinder model (e.g., `"C40"`, `"Kinu M47"`, `"EK43"`) |
| `kettle` | `string` | Kettle model |
| `scale` | `string` | Scale model |
| `server` | `string` | Carafe or server model |

### 7.2 Example

```json
{
  "brewer": "V60",
  "brewerMaterial": "树脂",
  "brewerSize": "01",
  "filter": "V60 漂白 01",
  "grinder": "Comandante C40",
  "kettle": "Brewista 温控壶",
  "scale": "Acaia Pearl",
  "server": "Hario 01 分享壶"
}
```

---

## 8. The `recipe` Object

The `recipe` object contains the core brewing parameters. This is the quantitative heart of the `.brew` file.

### 8.1 Required Properties

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `dose` | `object` | Measurement object (unit: `"g"`) | Coffee dose |
| `waterAmount` | `object` | Measurement object (unit: `"ml"` or `"g"`) | Total water volume |
| `ratio` | `string` | Pattern: `1:N` | Brew ratio (e.g., `"1:15"`, `"1:16.7"`) |
| `grindSize` | `object` | See §8.2 | Grind size specification |
| `waterTemperature` | `object` | Measurement object (unit: `"°C"` or `"°F"`) | Water temperature |

### 8.2 The `grindSize` Sub-Object

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| `value` | **Yes** | `number` (≥ 0) | Grind size numerical value |
| `unit` | No | `string` | Reference system (e.g., `"C40 click"`, `"μm"`) |
| `description` | No | `string` | Verbal description (e.g., `"细砂糖粗细"`) |

### 8.3 Optional Properties

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `waterType` | `string` | — | Water source (e.g., `"农夫山泉"`, `"调配水"`) |
| `waterTDS` | `number` | ≥ 0 | Water TDS in ppm |
| `brewTime` | `object` | Measurement (unit: `"s"` or `"min"`) | Target total brew time |
| `bloomRatio` | `string` | Pattern: `1:N` | Bloom water ratio (e.g., `"1:2"`, `"1:3"`) |
| `bloomTime` | `object` | Measurement (unit: `"s"` or `"min"`) | Bloom duration |
| `targetTDS` | `number` | ≥ 0 | Target coffee TDS (%) |
| `targetExtraction` | `number` | ≥ 0 | Target extraction yield (%) |

### 8.4 Validation Rules

- `dose.value` MUST be greater than 0 (strictly positive).
- `waterAmount.value` MUST be greater than 0.
- `waterTemperature.value` MUST be greater than 0.
- `ratio` MUST match the pattern `1:<number>` (e.g., `"1:15"`, `"1:16.7"`).
- `bloomRatio`, if present, MUST match the same `1:<number>` pattern.
- `grindSize.value` MUST be ≥ 0.

### 8.5 Example

```json
{
  "dose": { "value": 15, "unit": "g" },
  "waterAmount": { "value": 225, "unit": "ml" },
  "ratio": "1:15",
  "grindSize": {
    "value": 22,
    "unit": "C40 click",
    "description": "细砂糖粗细，比手冲标准略细半格"
  },
  "waterTemperature": { "value": 93, "unit": "°C" },
  "waterType": "农夫山泉",
  "waterTDS": 45,
  "brewTime": { "value": 150, "unit": "s" },
  "bloomRatio": "1:3",
  "bloomTime": { "value": 30, "unit": "s" },
  "targetTDS": 1.35,
  "targetExtraction": 20.5
}
```

---

## 9. The `steps` Array

The `steps` array contains the ordered sequence of brewing actions. Each element represents one step in the brewing process.

### 9.1 Structure

The `steps` array MUST contain at least one element. Each element is a step object.

### 9.2 Step Object Properties

| Property | Required | Type | Constraints | Description |
|----------|----------|------|-------------|-------------|
| `order` | **Yes** | `integer` | ≥ 1, sequential | Step sequence number |
| `action` | **Yes** | `string` | Enumerated (see §10) | Operation type |
| `description` | No | `string` | ≤ 500 characters | Detailed step instructions |
| `duration` | No | `object` | Measurement (unit: `"s"` or `"min"`) | Expected step duration |
| `waterAmount` | No | `object` | Measurement (unit: `"ml"` or `"g"`) | Water poured in this step |
| `cumulativeWater` | No | `object` | Measurement (unit: `"ml"` or `"g"`) | Cumulative water at end of step |
| `targetWeight` | No | `object` | Measurement (unit: `"g"`) | Target scale reading |
| `pourStyle` | No | `string` | — | Pouring technique |
| `pourIntensity` | No | `string` | — | Pour flow rate |
| `temperature` | No | `object` | Measurement (unit: `"°C"` or `"°F"`) | Step-specific temperature |

### 9.3 Pouring Parameters

The `pourStyle` and `pourIntensity` fields provide qualitative guidance for pour steps:

**Pour Style** values include (but are not limited to): `"中心注水"` (center pour), `"绕圈注水"` (spiral pour), `"定点注水"` (spot pour), `"搅拌注水"` (stir pour).

**Pour Intensity** values include: `"细水流"` (slow stream), `"中水流"` (medium stream), `"大水流"` (fast stream).

---

## 10. Step Operation Types

The `action` field in a step object MUST be one of the following 13 operation types. Each type has specific semantics, parameters, and applicable constraints.

### 10.1 `prepare`

**Description:** Setup and preparation before brewing begins.

**Typical Parameters:** `description`
**Duration:** Typically none

**Example:**
```json
{
  "order": 1,
  "action": "prepare",
  "description": "折好滤纸放入 V60 01 滤杯，用热水冲洗滤纸，预热滤杯和分享壶，倒掉废水"
}
```

---

### 10.2 `rinse`

**Description:** Rinsing filter paper, preheating equipment, or rinsing the dripper.

**Typical Parameters:** `description`, `waterAmount`
**Duration:** Typically short

---

### 10.3 `grind`

**Description:** Grinding coffee beans. Indicates the point at which beans are ground to prevent pre-grinding staleness.

**Typical Parameters:** `description`
**Duration:** None (not a timed step)

**Example:**
```json
{
  "order": 2,
  "action": "grind",
  "description": "称取 15g 咖啡豆，C40 研磨 22 格，倒入滤杯，轻拍使粉层平整"
}
```

---

### 10.4 `dose`

**Description:** Dosing ground coffee into the brewing device. Distinct from `grind` to allow pre-ground coffee workflows.

**Typical Parameters:** `description`
**Duration:** None

---

### 10.5 `bloom`

**Description:** The bloom phase — pouring a small amount of water to saturate the grounds and release CO2.

**Required Parameters:** `duration`, `waterAmount`
**Recommended Parameters:** `cumulativeWater`, `pourStyle`, `pourIntensity`

**Validation:** A `bloom` step SHOULD include `duration` and `waterAmount`.

**Example:**
```json
{
  "order": 3,
  "action": "bloom",
  "description": "93°C 热水注入 45ml，从中心向外绕圈，30 秒内完成",
  "duration": { "value": 30, "unit": "s" },
  "waterAmount": { "value": 45, "unit": "ml" },
  "cumulativeWater": { "value": 45, "unit": "ml" },
  "pourStyle": "绕圈注水",
  "pourIntensity": "细水流"
}
```

---

### 10.6 `pour`

**Description:** A main pour step. Recipes may have multiple `pour` steps (e.g., pulse pouring).

**Recommended Parameters:** `waterAmount`, `cumulativeWater`, `duration`, `pourStyle`, `pourIntensity`, `targetWeight`

**Example:**
```json
{
  "order": 4,
  "action": "pour",
  "description": "中心定点注水至 225ml，水流稳定，高度约 5cm",
  "duration": { "value": 30, "unit": "s" },
  "waterAmount": { "value": 180, "unit": "ml" },
  "cumulativeWater": { "value": 225, "unit": "ml" },
  "pourStyle": "中心注水",
  "pourIntensity": "中水流"
}
```

---

### 10.7 `stir`

**Description:** Stirring the coffee slurry — typically with a spoon or paddle — to ensure even extraction or break up clumps.

**Typical Parameters:** `duration`, `description`
**Duration:** Typically 5–10 seconds

---

### 10.8 `swirl`

**Description:** Swirling the dripper or carafe to settle the coffee bed evenly, preventing channeling.

**Typical Parameters:** `duration`, `description`
**Duration:** Typically 5 seconds

**Example:**
```json
{
  "order": 5,
  "action": "swirl",
  "description": "注水完成后，轻轻旋转滤杯两圈，使粉层均匀沉降",
  "duration": { "value": 5, "unit": "s" }
}
```

---

### 10.9 `drawdown`

**Description:** The drawdown phase — waiting for water to pass through the coffee bed. This step begins when the final pour ends and continues until the water level drops below the coffee bed.

**Typical Parameters:** `duration`, `description`
**Duration:** Typically 30–90 seconds

**Example:**
```json
{
  "order": 6,
  "action": "drawdown",
  "description": "等待咖啡液完全滴滤。目标总时间 2:00-2:30",
  "duration": { "value": 85, "unit": "s" }
}
```

---

### 10.10 `wait`

**Description:** A deliberate pause between actions. Used in pulse-pour recipes to allow water to partially drain between pours.

**Required Parameters:** `duration`
**Typical Parameters:** `description`

---

### 10.11 `measure`

**Description:** Taking a measurement — typically weighing the final yield or checking TDS.

**Typical Parameters:** `description`, `targetWeight`
**Duration:** None

**Example:**
```json
{
  "order": 7,
  "action": "measure",
  "description": "移开滤杯，称量最终咖啡液重量，检查是否接近 225ml 目标"
}
```

---

### 10.12 `taste`

**Description:** The tasting step. Describes how to evaluate the brewed coffee — aroma, flavor, mouthfeel.

**Typical Parameters:** `description`
**Duration:** None (not a timed step)

**Example:**
```json
{
  "order": 8,
  "action": "taste",
  "description": "轻晃分享壶使浓度均匀。倒入杯中，先闻湿香，再小口啜饮。注意蓝莓、草莓前调，紫罗兰花香，蜂蜜甜感"
}
```

---

### 10.13 `note`

**Description:** A free-form note or annotation step. Used to add observations, reminders, or context that does not correspond to a physical action.

**Typical Parameters:** `description`
**Duration:** None

---

### 10.14 Operation Type Summary

| Action | Timed | Water | Primary Purpose |
|--------|-------|-------|-----------------|
| `prepare` | No | — | Setup and preparation |
| `rinse` | Yes | Optional | Rinse and preheat |
| `grind` | No | — | Grind beans |
| `dose` | No | — | Dose grounds |
| `bloom` | Yes | Required | CO2 release and saturation |
| `pour` | Yes | Recommended | Main water delivery |
| `stir` | Yes | — | Agitation for even extraction |
| `swirl` | Yes | — | Bed settling |
| `drawdown` | Yes | — | Water drainage |
| `wait` | Yes | — | Pause between actions |
| `measure` | No | — | Measurement |
| `taste` | No | — | Sensory evaluation |
| `note` | No | — | Annotation |

---

## 11. The `result` Object

The `result` object records the actual brewing outcome and tasting evaluation. This field is OPTIONAL.

### 11.1 Brewing Metrics

| Property | Type | Description |
|----------|------|-------------|
| `actualBrewTime` | Measurement (unit: `"s"` or `"min"`) | Actual total brew time |
| `finalYield` | Measurement (unit: `"g"` or `"ml"`) | Final coffee liquid weight |
| `measuredTDS` | `number` (≥ 0) | Measured TDS (%) |
| `extractionYield` | `number` (≥ 0) | Measured extraction yield (%) |
| `rating` | `number` (0–10) | Overall rating |

### 11.2 Tasting Dimensions

Each tasting dimension is an object with `rating` (0–10) and `notes` (≤ 500 characters):

| Dimension | Description |
|-----------|-------------|
| `aroma` | Dry/wet aroma evaluation |
| `flavor` | Flavor evaluation |
| `aftertaste` | Aftertaste/finish evaluation |
| `acidity` | Acidity evaluation |
| `body` | Body/mouthfeel evaluation |
| `balance` | Balance evaluation |
| `sweetness` | Sweetness evaluation |
| `cleanCup` | Clean cup evaluation |
| `overall` | Overall impression (notes ≤ 1000 characters) |

### 11.3 Additional Result Properties

| Property | Type | Constraints | Description |
|----------|------|-------------|-------------|
| `tastingNotes` | `array` of `string` | Unique items | Flavor tasting notes |
| `improvements` | `string` | ≤ 2000 characters | Suggestions for next brew |
| `photoUrls` | `array` of `string` | URI format | Photo URLs of the brewed coffee |

### 11.4 Example

```json
{
  "actualBrewTime": { "value": 155, "unit": "s" },
  "finalYield": { "value": 212, "unit": "g" },
  "measuredTDS": 1.32,
  "extractionYield": 20.1,
  "rating": 8.5,
  "aroma": { "rating": 9.0, "notes": "强烈的蓝莓与草莓香气，干香阶段已能闻到紫罗兰花香" },
  "flavor": { "rating": 8.5, "notes": "蓝莓与草莓风味突出，伴随蜂蜜甜感" },
  "tastingNotes": ["蓝莓", "草莓", "紫罗兰", "蜂蜜", "柑橘"],
  "improvements": "可尝试研磨度再细半格（21格），提升萃取率至 21%"
}
```

---

## 12. Complete Example

The following is a complete, valid `.brew` file demonstrating all major features of the schema. This example brews an Ethiopian Yirgacheffe Natural on a V60 using the "Summer 8-Pour" method.

```json
{
  "$schema": "https://brewcode.dev/schemas/brew.schema.json",
  "meta": {
    "name": "夏季八冲 · 埃塞俄比亚 耶加雪菲 日晒 浅烘",
    "version": "1.0.0",
    "brewCodeVersion": "0.1",
    "author": "brewcode-os/genesis",
    "description": "经典夏季八冲法，高温快萃，突出耶加雪菲日晒的莓果与花香。一刀流注水，减少扰动，追求干净度与甜感平衡。",
    "license": "CC0-1.0",
    "tags": ["V60", "夏季八冲", "一刀流", "浅烘", "日晒", "埃塞俄比亚", "耶加雪菲"],
    "createdAt": "2026-06-14T00:00:00Z",
    "source": "https://github.com/aidulibrary/brewcode-os"
  },
  "coffee": {
    "name": "埃塞俄比亚 耶加雪菲 日晒 浅烘",
    "producer": "耶加雪菲合作社",
    "origin": {
      "country": "埃塞俄比亚",
      "region": "耶加雪菲",
      "farm": "Aricha 处理站",
      "altitude": "1900-2100m"
    },
    "variety": "Heirloom",
    "process": "日晒",
    "roastLevel": "浅烘",
    "roastDate": "2026-06-07",
    "roaster": "brewcode-os",
    "flavorNotes": ["蓝莓", "草莓", "紫罗兰", "蜂蜜"]
  },
  "equipment": {
    "brewer": "V60",
    "brewerMaterial": "树脂",
    "brewerSize": "01",
    "filter": "V60 漂白 01",
    "grinder": "Comandante C40",
    "kettle": "Brewista 温控壶",
    "scale": "Acaia Pearl",
    "server": "Hario 01 分享壶"
  },
  "recipe": {
    "dose": { "value": 15, "unit": "g" },
    "waterAmount": { "value": 225, "unit": "ml" },
    "ratio": "1:15",
    "grindSize": {
      "value": 22,
      "unit": "C40 click",
      "description": "细砂糖粗细，比手冲标准略细半格"
    },
    "waterTemperature": { "value": 93, "unit": "°C" },
    "waterType": "农夫山泉",
    "waterTDS": 45,
    "brewTime": { "value": 150, "unit": "s" },
    "bloomRatio": "1:3",
    "bloomTime": { "value": 30, "unit": "s" },
    "targetTDS": 1.35,
    "targetExtraction": 20.5
  },
  "steps": [
    {
      "order": 1,
      "action": "prepare",
      "description": "折好滤纸放入 V60 01 滤杯，用热水冲洗滤纸，预热滤杯和分享壶，倒掉废水"
    },
    {
      "order": 2,
      "action": "grind",
      "description": "称取 15g 咖啡豆，C40 研磨 22 格，倒入滤杯，轻拍使粉层平整"
    },
    {
      "order": 3,
      "action": "bloom",
      "description": "93°C 热水注入 45ml，从中心向外绕圈，30 秒内完成，确保所有粉被浸润",
      "duration": { "value": 30, "unit": "s" },
      "waterAmount": { "value": 45, "unit": "ml" },
      "cumulativeWater": { "value": 45, "unit": "ml" },
      "pourStyle": "绕圈注水",
      "pourIntensity": "细水流"
    },
    {
      "order": 4,
      "action": "pour",
      "description": "闷蒸结束，中心定点注水至 225ml（累计 225ml）。水流稳定，高度约 5cm",
      "duration": { "value": 30, "unit": "s" },
      "waterAmount": { "value": 180, "unit": "ml" },
      "cumulativeWater": { "value": 225, "unit": "ml" },
      "pourStyle": "中心注水",
      "pourIntensity": "中水流"
    },
    {
      "order": 5,
      "action": "swirl",
      "description": "注水完成后，轻轻旋转滤杯两圈，使粉层均匀沉降，避免通道效应",
      "duration": { "value": 5, "unit": "s" }
    },
    {
      "order": 6,
      "action": "drawdown",
      "description": "等待咖啡液完全滴滤。目标总时间 2:00-2:30",
      "duration": { "value": 85, "unit": "s" }
    },
    {
      "order": 7,
      "action": "measure",
      "description": "移开滤杯，称量最终咖啡液重量，检查是否接近 225ml 目标"
    },
    {
      "order": 8,
      "action": "taste",
      "description": "轻晃分享壶使浓度均匀。倒入杯中，先闻湿香，再小口啜饮。注意蓝莓、草莓前调，紫罗兰花香，蜂蜜甜感"
    }
  ],
  "result": {
    "actualBrewTime": { "value": 155, "unit": "s" },
    "finalYield": { "value": 212, "unit": "g" },
    "measuredTDS": 1.32,
    "extractionYield": 20.1,
    "rating": 8.5,
    "aroma": { "rating": 9.0, "notes": "强烈的蓝莓与草莓香气，干香阶段已能闻到紫罗兰花香" },
    "flavor": { "rating": 8.5, "notes": "蓝莓与草莓风味突出，伴随蜂蜜甜感，酸质明亮不尖锐" },
    "aftertaste": { "rating": 8.0, "notes": "余韵中长，莓果甜感持续，回甘明显" },
    "acidity": { "rating": 8.5, "notes": "柑橘类酸质，活泼明亮，像新鲜柠檬汁" },
    "body": { "rating": 7.5, "notes": "中低醇厚度，口感轻盈顺滑，如红茶般" },
    "balance": { "rating": 8.5, "notes": "酸甜平衡良好，风味层次分明" },
    "sweetness": { "rating": 9.0, "notes": "蜂蜜甜感贯穿始终，回甘悠长" },
    "cleanCup": { "rating": 8.5, "notes": "干净度好，无杂味，风味清晰" },
    "overall": {
      "rating": 8.5,
      "notes": "经典的夏季八冲方案，操作简单但效果出色。适合日常冲煮，稳定输出耶加日晒的莓果花香"
    },
    "tastingNotes": ["蓝莓", "草莓", "紫罗兰", "蜂蜜", "柑橘"],
    "improvements": "可尝试研磨度再细半格（21格），提升萃取率至 21%，观察甜感是否增强"
  }
}
```

### 12.1 Key Annotations

1. **`$schema`** (line 2): Links to the BrewCode OS schema URI, enabling automatic validation in JSON-schema-aware editors.
2. **`meta.brewCodeVersion`** (line 6): Declares compliance with BrewCode OS specification version 0.1.
3. **`recipe.bloomRatio`** (line 24): Follows the `1:N` pattern, expressing the bloom ratio as `1:3` (1 part coffee to 3 parts water).
4. **`steps`** (lines 44–95): An 8-step sequence covering the full brew lifecycle: prepare → grind → bloom → pour → swirl → drawdown → measure → taste.
5. **`result`** (lines 96–120): A complete cup evaluation with 9 tasting dimensions, TDS measurement, and improvement suggestions.

---

## 13. Conformance

### 13.1 Validator Requirements

A conforming `.brew` validator MUST:

1. Validate the JSON document against the [brew.schema.json](#appendix-a-json-schema-reference) using a JSON Schema Draft 2020-12 validator.
2. Reject documents containing unknown properties at any level (enforced by `additionalProperties: false` throughout the schema).
3. Verify that all four required top-level fields (`meta`, `coffee`, `recipe`, `steps`) are present.
4. Verify that `steps` contains at least one element.
5. Verify that all `action` values are one of the 13 enumerated operation types.
6. Verify that all measurement objects with `unit` fields use valid unit values for their context.
7. Verify that all numeric values respect their minimum/maximum constraints.

### 13.2 Producer Requirements

A conforming `.brew` producer (e.g., BrewForge, a script, or any software generating `.brew` files) MUST:

1. Produce syntactically valid JSON conforming to [RFC 8259].
2. Ensure all required fields are present and valid.
3. Use sequential `order` values starting from 1 in the `steps` array.
4. Use ISO 8601 format for all date and date-time fields.
5. Use SemVer-compliant strings for `meta.version`.

### 13.3 Consumer Requirements

A conforming `.brew` consumer (e.g., BrewPlayer, BrewRepo, or any software parsing `.brew` files) MUST:

1. Accept any valid `.brew` document conforming to this specification.
2. Gracefully handle the absence of optional fields (`equipment`, `result`, and optional properties within objects).
3. NOT assume the presence of any optional field.
4. Preserve the `order` field when rendering or displaying steps.

### 13.4 Error Handling Guidelines

When validation fails, implementations SHOULD:

1. Report the specific field or property that caused the failure.
2. Provide a human-readable message describing the expected format.
3. Include the location (JSON path) of the error when possible.
4. Continue validation to report ALL errors, rather than failing on the first error.

---

## 14. Security Considerations

### 14.1 Arbitrary String Content

Several fields in a `.brew` file accept arbitrary strings (e.g., `description`, `notes`, `improvements`). Implementations that render these strings in HTML contexts MUST properly escape or sanitize the content to prevent cross-site scripting (XSS) attacks.

### 14.2 URI Fields

The `$schema`, `source`, and `photoUrls` fields contain URI values. Implementations that resolve these URIs automatically SHOULD validate the scheme (`https:` only) and SHOULD NOT follow redirects to untrusted domains.

### 14.3 File Size

While this specification does not impose an explicit size limit on `.brew` files, the `maxLength` constraints on description fields (500–2000 characters) naturally bound the size. Implementations MAY impose a reasonable upper limit (e.g., 100 KB) to prevent resource exhaustion.

### 14.4 External References

The `$schema` field references an external URI. Validators SHOULD cache the schema locally rather than fetching it on every validation. Implementations using the schema for real-time validation SHOULD bundle the schema file rather than relying on network access.

---

## Appendix A. JSON Schema Reference

The authoritative JSON Schema for `.brew` files is available at:

- **Repository:** `packages/standards/brew.schema.json` in the [BrewCode OS repository](https://github.com/aidulibrary/brewcode-os)
- **Schema URI:** `https://brewcode.dev/schemas/brew.schema.json`

The schema is defined using JSON Schema Draft 2020-12 and is licensed under CC0 1.0 Universal.

---

## Appendix B. Glossary

| Term | Definition |
|------|------------|
| **.brew** | The file extension and format name for BrewCode OS brewing recipes. |
| **BrewCode OS** | The umbrella project developing the `.brew` standard and its ecosystem of tools. |
| **Bloom** | The initial phase of brewing where a small amount of water is poured over coffee grounds to release CO2. |
| **Drawdown** | The phase where water drains through the coffee bed after the final pour. |
| **Measurement Object** | A JSON object with `value` and `unit` fields, used throughout the schema for quantitative parameters. |
| **Pulse Pour** | A pouring technique where water is added in multiple discrete pours rather than a single continuous pour. |
| **TDS** | Total Dissolved Solids — a measure of coffee concentration, expressed as a percentage. |
| **Extraction Yield** | The percentage of coffee solubles extracted from the dry grounds into the brew. |

---

## Appendix C. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-06-18 | Initial draft specification. Defines six top-level fields, 13 step operation types, measurement object pattern, and conformance requirements. |

---

> **License:** This specification document is licensed under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). The schema definition is also CC0 1.0. All code in the BrewCode OS repository is [MIT](https://opensource.org/licenses/MIT).