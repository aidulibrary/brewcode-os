const AUTH_HEADER = 'Authorization';
const BEARER_PREFIX = 'Bearer bk_';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

const ROUTES = {
  '/diagnose': 'diagnose',
  '/generate': 'generate',
  '/translate': 'translate',
};

const PUBLIC_ROUTES = ['/translate'];

function hashKey(apiKey) {
  let hash = 0;
  for (let i = 0; i < apiKey.length; i++) {
    const ch = apiKey.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0;
  }
  return hash.toString(16);
}

async function authenticate(env, request) {
  const authHeader = request.headers.get(AUTH_HEADER);
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return {
      ok: false,
      status: 401,
      body: { error: 'Missing or invalid API key. Use Authorization: Bearer bk_xxx' },
    };
  }
  const apiKey = authHeader.slice(BEARER_PREFIX.length);
  if (apiKey.length < 16) {
    return { ok: false, status: 401, body: { error: 'API key too short' } };
  }

  try {
    const keyHash = hashKey(apiKey);
    const result = await env.DB.prepare('SELECT plan, rate_limit FROM api_keys WHERE key_hash = ?')
      .bind(keyHash)
      .first();

    if (!result) {
      return { ok: false, status: 401, body: { error: 'Invalid API key' } };
    }

    await env.DB.prepare("UPDATE api_keys SET last_used_at = datetime('now') WHERE key_hash = ?")
      .bind(keyHash)
      .run();

    return { ok: true, plan: result.plan, rateLimit: result.rate_limit };
  } catch (e) {
    return { ok: false, status: 500, body: { error: 'Auth check failed' } };
  }
}

async function checkRateLimit(env, apiKey, limit) {
  const key = `rl:${hashKey(apiKey)}`;
  try {
    const current = await env.RATE_LIMIT.get(key);
    const count = current ? parseInt(current, 10) : 0;
    if (count >= limit) {
      return { ok: false, status: 429, body: { error: `Rate limit exceeded (${limit}/min)` } };
    }
    const ttl = await env.RATE_LIMIT.get(key + ':ttl');
    if (!ttl) {
      await env.RATE_LIMIT.put(key + ':ttl', '1', { expirationTtl: 60 });
    }
    await env.RATE_LIMIT.put(key, (count + 1).toString(), { expirationTtl: 60 });
    return { ok: true };
  } catch (e) {
    return { ok: true };
  }
}

function jsonResponse(data, status, extraHeaders) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...CORS_HEADERS,
    ...extraHeaders,
  };
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

export default {
  /**
   * API 网关主路由处理函数，负责认证、速率限制和请求转发
   * 支持 /api/diagnose、/api/generate、/api/translate 三个路由
   * @param {Request} request — 原始 HTTP 请求对象
   * @param {Object} env — Cloudflare Workers 环境变量，包含 DB 和 RATE_LIMIT 绑定
   * @param {ExecutionContext} ctx — Cloudflare Workers 执行上下文
   * @returns {Promise<Response>} JSON 格式的 HTTP 响应
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const normalizedPath = path.replace(/^\/api/, '') || '/';
    const routeKey = ROUTES[normalizedPath];
    if (!routeKey) {
      return jsonResponse(
        { error: 'Not found. Available: /api/diagnose, /api/generate, /api/translate' },
        404
      );
    }

    if (!PUBLIC_ROUTES.includes(normalizedPath)) {
      const auth = await authenticate(env, request);
      if (!auth.ok) {
        return jsonResponse(auth.body, auth.status);
      }

      const rateCheck = await checkRateLimit(
        env,
        request.headers.get(AUTH_HEADER).slice(BEARER_PREFIX.length),
        auth.rateLimit
      );
      if (!rateCheck.ok) {
        return jsonResponse(rateCheck.body, rateCheck.status);
      }
    }

    let targetUrl;
    switch (routeKey) {
      case 'diagnose':
        targetUrl = `https://brewcode-diagnose.wuguzi.workers.dev${url.search}`;
        break;
      case 'generate':
        targetUrl = `https://brewcode-generate.wuguzi.workers.dev${url.search}`;
        break;
      case 'translate':
        targetUrl = `https://brewcode-translate.wuguzi.workers.dev${url.search}`;
        break;
    }

    try {
      const upstream = await fetch(targetUrl, {
        method: request.method,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: request.method === 'POST' ? await request.text() : undefined,
      });
      const data = await upstream.json();
      return jsonResponse(data, upstream.status);
    } catch (e) {
      return jsonResponse({ error: 'Upstream service unavailable' }, 502);
    }
  },
};
