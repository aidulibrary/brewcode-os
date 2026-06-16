// ============================================================
// BrewCode OS — 语义翻译 Worker (v1.0)
// 路径: workers/translate/index.js
// 功能: 磨豆机刻度 → 微米值翻译，查询 D1 device_registry 表
// 请求: GET /api/translate?device=Comandante+C40&setting=22
// 响应: { "device": "...", "setting": "...", "micron": 600, "description": "..." }
// ============================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
};

function json(data, status) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed. Use GET.' }, 405);
    }

    const url = new URL(request.url);
    const device = url.searchParams.get('device');
    const setting = url.searchParams.get('setting');

    if (!device || !setting) {
      return json(
        {
          error: 'Missing query parameters. Required: device, setting.',
          example: '/api/translate?device=Comandante+C40&setting=22',
        },
        400
      );
    }

    try {
      const row = await env.DB.prepare(
        'SELECT device_name, setting, micron_value, description FROM device_registry WHERE device_name = ? AND setting = ?'
      )
        .bind(device, setting)
        .first();

      if (!row) {
        return json(
          {
            error: 'No data found for this device/setting combination.',
            device,
            setting,
            hint: 'Try another device or check available devices with known settings.',
          },
          404
        );
      }

      return json(
        {
          device: row.device_name,
          setting: row.setting,
          micron: row.micron_value,
          description: row.description,
        },
        200
      );
    } catch (e) {
      return json(
        {
          error: 'Database query failed',
          detail: e.message,
        },
        500
      );
    }
  },
};
