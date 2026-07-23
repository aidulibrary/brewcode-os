// ============================================================
// BrewCode OS — 语义翻译 Worker (v1.2)
// 路径: workers/translate/index.js
// 功能: 磨豆机刻度 → 微米值翻译，查询 D1 device_registry 表
//       v1.1 扩展返回认证信息字段
//       v1.2 实现向后兼容机制，未认证设备返回 null
// 请求: GET /api/translate?device=Comandante+C40&setting=22
// 响应: { "device": "...", "setting": "...", "micron": 600, "description": "...", "cert": { "level": "L2", "date": "2026-06-25", "firmware": "v2.1.0", "param_mapping_url": "…", "logo_url": "…" } }
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
  /**
   * 翻译处理函数，将磨豆机刻度翻译为微米值
   * 查询 D1 device_registry 表，返回对应设备的微米值和认证信息
   * @param {Request} request — GET 请求，需携带 device 和 setting 查询参数
   * @param {Object} env — Cloudflare Workers 环境变量，包含 DB 绑定
   * @returns {Promise<Response>} JSON 格式的翻译结果
   */
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
        'SELECT device_name, setting, micron_value, description, certification_level, certification_date, firmware_version, param_mapping_url, brewcode_compatible_logo_url FROM device_registry WHERE device_name = ? AND setting = ?'
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

      const isCertified = row.certification_level !== null && row.certification_level !== '';

      const responseBody = {
        device: row.device_name,
        setting: row.setting,
        micron: row.micron_value,
        description: row.description,
        cert: isCertified
          ? {
              level: row.certification_level,
              date: row.certification_date,
              firmware: row.firmware_version,
              param_mapping_url: row.param_mapping_url,
              logo_url: row.brewcode_compatible_logo_url,
            }
          : null,
      };

      return json(responseBody, 200);
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
