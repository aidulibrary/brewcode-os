// ============================================================
// BrewCode OS — 方案生成 Worker (v1.0)
// 路径: workers/generate/index.js
// 功能: 接收豆子信息 + 设备 + 口味偏好，生成完整 .brew JSON 方案
// 请求: POST /api/generate
// Body: { "coffee": { ... }, "equipment": [...], "preference": "..." }
// 响应: { "brew": {...}, "validated": true, "retries": N }
// ============================================================

const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1';
const GENERATE_MODEL = 'deepseek-chat';
const REQUEST_TIMEOUT = 25000;
const MAX_RETRIES = 3;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
};

const BREW_SCHEMA_TIPS = `.brew 文件必须包含以下 5 个顶层字段：

1. meta (方案元信息)：
   - name (string): 方案名称
   - author (string): 作者 GitHub 用户名或名称
   - version (string): 版本号，如 "1.0"
   - createdAt (string): 创建日期 ISO 格式，如 "2026-06-16"
   - tags (array of string): 标签数组，如 ["手冲", "V60"]

2. coffee (咖啡豆信息)：
   - name (string): 豆子名称
   - origin (string): 产地国家/地区，如 "埃塞俄比亚耶加雪菲"
   - roastLevel (string): 烘焙度，必须是以下之一：浅烘、中浅烘、中烘、中深烘、深烘、极深烘
   - process (string): 处理法，如 "水洗"
   - roastDate (string, optional): 烘焙日期 YYYY-MM-DD

3. equipment (器具信息)：
   - dripper (string): 滤杯类型，如 "V60"
   - grinder (string): 磨豆机型号，如 "Comandante C40"
   - brewer (string, optional): 冲煮器具
   - kettle (string, optional): 手冲壶

4. recipe (冲煮参数)：
   - dose: { value: 数字, unit: "g", description?: 字符串 } 粉量
   - waterAmount: { value: 数字, unit: "g", description?: 字符串 } 水量
   - ratio: 数字 粉水比，如 1:16 写 16
   - grindSize: { value: "22", unit: "格", micron?: 数字, description?: 字符串 } 研磨度
   - waterTemperature: { value: 数字, unit: "°C", description?: 字符串 } 水温
   - brewTime: { value: 数字, unit: "s", description?: 字符串 } 总冲煮时间

5. steps (冲煮步骤列表，数组)：
   每个步骤必须包含：
   - step: 序号（数字）
   - action: 动作类型，必须是以下之一：闷蒸、注水、搅拌、静置、倒出
   - waterAmount: { value: 数字, unit: "g" }（如果不加水可以不填）
   - duration: { value: 数字, unit: "s" } 该步骤停留时间
   - description?: 描述文字

总步骤一般为 3~5 步，例如：闷蒸 → 第一次注水 → 第二次注水 → 完成倒出。`;

const SYSTEM_PROMPT = `你是 BrewCode OS AI 方案生成引擎。根据用户提供的咖啡豆信息、拥有的器具和口味偏好，生成一份完整的冲煮方案，输出严格符合 .brew JSON Schema。

规则：
1. 输出必须是单一、完整、合法的 JSON 对象，就是 .brew 文件本身
2. 不要输出任何解释文字，不要用 markdown 代码块包裹，不要加反引号
3. 必须包含全部 5 个顶层字段：meta, coffee, equipment, recipe, steps
4. 必须严格遵守字段结构和枚举值要求
5. 根据口味偏好调整参数：
   - "明亮果酸" / "干净酸度" → 研磨偏粗、水温稍低（90-92°C）、萃取时间较短
   - "醇厚甜感" / "body 厚重" → 研磨偏细、水温稍高（92-95°C）、萃取时间稍长
   - "均衡平衡" → 中庸参数
   - "低苦低酸" → 水温偏低、时间适中
6. 如果用户没提供粉水比偏好，中烘豆一般 1:15 ~ 1:17
7. 每个步骤必须有合理的注水量，闷蒸一般是粉量的 2~3 倍水
8. 日期使用今天的日期：${new Date().toISOString().split('T')[0]}

${BREW_SCHEMA_TIPS}

记住：只输出 JSON，不要输出其他任何东西。`;

function buildUserPrompt(input) {
  const parts = [];
  const { coffee, equipment, preference } = input;

  if (coffee) {
    const c = [];
    if (coffee.name) c.push(`名称: ${coffee.name}`);
    if (coffee.origin) c.push(`产地: ${coffee.origin}`);
    if (coffee.roastLevel) c.push(`烘焙度: ${coffee.roastLevel}`);
    if (coffee.process) c.push(`处理法: ${coffee.process}`);
    if (c.length > 0) parts.push(`咖啡豆信息：\n${c.join('\n')}`);
  }

  if (equipment && Array.isArray(equipment) && equipment.length > 0) {
    parts.push(`用户拥有设备：\n${equipment.map((e) => `- ${e}`).join('\n')}`);
  }

  if (preference && preference.trim()) {
    parts.push(`用户口味偏好：\n${preference}`);
  }

  return parts.join('\n\n');
}

function validateBrewStructure(brew) {
  const missing = [];

  if (!brew || typeof brew !== 'object') {
    return { valid: false, missing: ['顶层不是对象'] };
  }

  if (!brew.meta || typeof brew.meta !== 'object') missing.push('meta');
  if (!brew.coffee || typeof brew.coffee !== 'object') missing.push('coffee');
  if (!brew.equipment || typeof brew.equipment !== 'object') missing.push('equipment');
  if (!brew.recipe || typeof brew.recipe !== 'object') missing.push('recipe');
  if (!Array.isArray(brew.steps)) missing.push('steps (必须是数组)');

  if (Array.isArray(brew.steps) && brew.steps.length === 0) {
    missing.push('steps (至少一个步骤)');
  }

  if (brew.recipe && !brew.recipe.dose) missing.push('recipe.dose');
  if (brew.recipe && !brew.recipe.waterAmount) missing.push('recipe.waterAmount');
  if (brew.recipe && !brew.recipe.grindSize) missing.push('recipe.grindSize');
  if (brew.recipe && !brew.recipe.waterTemperature) missing.push('recipe.waterTemperature');

  return missing.length === 0 ? { valid: true } : { valid: false, missing };
}

function extractBrewJSON(rawText) {
  if (!rawText || !rawText.trim()) return null;

  const cleaned = rawText.trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch (_) {
    /* 继续尝试提取 */
  }

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch (_) {
    return null;
  }

  return null;
}

function buildRetryPrompt(lastOutput, missing) {
  return `你上一次输出不符合 .brew Schema 结构，缺少必填字段：${missing.join(', ')}。请修正结构，重新输出完整 JSON。

记住：
1. 必须包含全部五个顶层字段：meta, coffee, equipment, recipe, steps
2. steps 必须是数组且至少有一个元素
3. recipe 必须包含 dose, waterAmount, grindSize, waterTemperature
4. 只输出 JSON，不要输出任何文字解释`;
}

function json(data, status) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}

async function callDeepSeek(apiKey, messages) {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GENERATE_MODEL,
          messages,
          temperature: 0.5,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        return { ok: true, content };
      }

      const errBody = await response.text();
      lastError = { status: response.status, body: errBody };

      if (response.status === 429 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }

      break;
    } catch (e) {
      lastError = { status: 0, body: e.name === 'AbortError' ? 'Request timeout' : e.message };
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
    }
  }

  return { ok: false, error: lastError };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed. Use POST.' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const { coffee, equipment, preference } = body || {};
    if (!coffee || typeof coffee !== 'object') {
      return json(
        { error: 'Missing "coffee". Must be an object with origin, roastLevel, process.' },
        400
      );
    }
    if (!coffee.origin || !coffee.roastLevel || !coffee.process) {
      return json(
        { error: 'Missing required coffee fields: origin, roastLevel, process are all required.' },
        400
      );
    }

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === '待填入') {
      return json(
        { error: 'DeepSeek API key not configured. Set DEEPSEEK_API_KEY in wrangler.toml [vars].' },
        500
      );
    }

    const userPrompt = buildUserPrompt({ coffee, equipment, preference });
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    let retries = 0;
    let brew = null;
    let validated = false;
    let validationResult = null;
    let lastContent = '';

    for (let attempt = 0; attempt <= 1; attempt++) {
      const result = await callDeepSeek(apiKey, messages);
      if (!result.ok) {
        return json(
          {
            error: 'DeepSeek API call failed after retries',
            detail: result.error,
          },
          502
        );
      }

      lastContent = result.content;
      brew = extractBrewJSON(result.content);

      if (!brew) {
        messages.push({
          role: 'user',
          content:
            'Failed to parse JSON from your output. Please output a single valid JSON object without any surrounding text or code blocks.',
        });
        retries++;
        continue;
      }

      validationResult = validateBrewStructure(brew);
      if (validationResult.valid) {
        validated = true;
        break;
      }

      messages.push({
        role: 'assistant',
        content: result.content,
      });
      messages.push({
        role: 'user',
        content: buildRetryPrompt(brew, validationResult.missing),
      });
      retries++;
    }

    if (!brew) {
      return json(
        {
          error: 'Failed to extract valid JSON after retries',
          raw: lastContent,
          retries: retries,
        },
        422
      );
    }

    if (!validated && validationResult) {
      return json(
        {
          brew: brew,
          validated: false,
          retries: retries,
          missing: validationResult.missing,
          raw: lastContent,
        },
        200
      );
    }

    return json(
      {
        brew: brew,
        validated: true,
        retries: retries,
      },
      200
    );
  },
};
