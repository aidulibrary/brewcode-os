// ============================================================
// BrewCode OS — 风味诊断 Worker (v1.0)
// 路径: workers/diagnose/index.js
// 功能: 接收 .brew 文件 + 用户问题，调用 DeepSeek 返回参数调整建议
// 请求: POST /api/diagnose
// Body: { "brew": { ... }, "issue": "这杯偏苦" }
// 响应: { "issue": "...", "suggestions": [...], "raw": "..." }
// ============================================================

const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1';
const DIAGNOSE_MODEL = 'deepseek-chat';
const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES = 2;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
};

const SYSTEM_PROMPT = `你是一位世界级咖啡冲煮专家。用户正在使用 BrewCode OS，向你描述一杯咖啡的问题。
请根据用户提供的 .brew 方案文件和问题描述，给出具体到操作层面的调整建议。

规则：
1. 只建议参数调整（研磨度、水温、粉水比、注水手法、闷蒸时间、总萃取时间），不评价咖啡豆品质
2. 每条建议必须包含：当前值 → 建议值，以及调整理由（一句话，中文）
3. 输出必须是严格的 JSON 数组，每项包含四个字段：
   - field: 字段名，中文（如 "研磨度"、"水温"、"粉水比"、"注水手法"、"闷蒸时间"、"总萃取时间"）
   - current: 当前值（字符串，从 .brew 方案中提取）
   - suggested: 建议值（字符串，具体到可操作的数值或手法）
   - reason: 调整理由（一句话，中文，不超过30字）
4. 如果用户的问题描述与冲煮参数完全无关，返回空数组 []
5. 不要输出 JSON 之外的任何文字，不要用 markdown 代码块包裹

常见问题对应策略：
- "偏苦" / "焦苦" → 研磨调粗、水温降低、缩短萃取时间
- "偏酸" / "酸涩" → 研磨调细、水温升高、延长萃取时间
- "太淡" / "水感" → 增加粉量、调细研磨、减少注水量
- "太浓" / "厚重" → 减少粉量、调粗研磨、增加注水量
- "涩" / "收敛感" → 降低水温、缩短闷蒸时间、减少搅拌`;

function summaryFromBrew(brew) {
  const recipe = brew.recipe || {};
  const coffee = brew.coffee || {};
  const meta = brew.meta || {};
  const equip = brew.equipment || {};

  const parts = [];

  if (meta.name) parts.push(`方案: ${meta.name}`);
  if (coffee.name) parts.push(`豆子: ${coffee.name}`);
  if (coffee.roastLevel) parts.push(`烘焙: ${coffee.roastLevel}`);
  if (coffee.process) parts.push(`处理法: ${coffee.process}`);
  if (coffee.origin) parts.push(`产地: ${coffee.origin}`);
  if (equip.grinder) parts.push(`磨豆机: ${equip.grinder}`);
  if (equip.dripper) parts.push(`滤杯: ${equip.dripper}`);

  if (recipe.dose) parts.push(`粉量: ${recipe.dose.value}${recipe.dose.unit}`);
  if (recipe.waterAmount) parts.push(`水量: ${recipe.waterAmount.value}${recipe.waterAmount.unit}`);
  if (recipe.ratio) parts.push(`粉水比: ${recipe.ratio}`);
  if (recipe.grindSize)
    parts.push(
      `研磨: ${recipe.grindSize.value}${recipe.grindSize.unit} (${recipe.grindSize.description || '无描述'})`
    );
  if (recipe.waterTemperature)
    parts.push(`水温: ${recipe.waterTemperature.value}${recipe.waterTemperature.unit}`);
  if (recipe.brewTime) parts.push(`总时间: ${recipe.brewTime.value}${recipe.brewTime.unit}`);

  if (brew.steps && brew.steps.length) {
    const stepSummary = brew.steps
      .map(
        (s, i) =>
          `${i + 1}. ${s.action || '未知'}${s.waterAmount ? ' ' + s.waterAmount.value + s.waterAmount.unit : ''}${s.duration ? ' ' + s.duration.value + s.duration.unit : ''}${s.method ? ' (' + s.method + ')' : ''}`
      )
      .join('; ');
    parts.push(`步骤: [${stepSummary}]`);
  }

  return parts.join('\n');
}

function json(data, status) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}

function parseSuggestions(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const cleaned = rawText.trim();

  if (cleaned === '[]') return [];

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {
    /* 继续尝试从文本中提取 */
  }

  const match = cleaned.match(/$$[\s\S]*?$$/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {
    return [];
  }

  return [];
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
          model: DIAGNOSE_MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 800,
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
  /**
   * 风味诊断处理函数，接收 .brew 方案和用户问题描述，调用 DeepSeek AI 返回参数调整建议
   * @param {Request} request — POST 请求，body 包含 brew 和 issue 字段
   * @param {Object} env — Cloudflare Workers 环境变量，包含 DEEPSEEK_API_KEY 密钥
   * @returns {Promise<Response>} JSON 格式的诊断建议列表
   */
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

    const { brew, issue } = body || {};
    if (!brew || typeof brew !== 'object') {
      return json({ error: 'Missing "brew". Must be a valid .brew JSON object.' }, 400);
    }
    if (!issue || typeof issue !== 'string' || !issue.trim()) {
      return json(
        { error: 'Missing "issue". Must be a non-empty string describing the problem.' },
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

    const brewSummary = summaryFromBrew(brew);
    const userMessage = `${brewSummary}\n\n用户问题: ${issue}`;

    const result = await callDeepSeek(apiKey, [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ]);

    if (!result.ok) {
      return json(
        {
          error: 'DeepSeek API call failed after retries',
          detail: result.error,
        },
        502
      );
    }

    const suggestions = parseSuggestions(result.content);

    return json(
      {
        issue,
        suggestions,
        raw: result.content,
      },
      200
    );
  },
};
