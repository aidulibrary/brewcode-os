var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// index.js
var DEEPSEEK_API_BASE = "https://api.deepseek.com/v1";
var GENERATE_MODEL = "deepseek-chat";
var REQUEST_TIMEOUT = 25e3;
var MAX_RETRIES = 3;
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*"
};
var BREW_SCHEMA_TIPS = `.brew \u6587\u4EF6\u5FC5\u987B\u5305\u542B\u4EE5\u4E0B 5 \u4E2A\u9876\u5C42\u5B57\u6BB5\uFF1A

1. meta (\u65B9\u6848\u5143\u4FE1\u606F)\uFF1A
   - name (string): \u65B9\u6848\u540D\u79F0
   - author (string): \u4F5C\u8005 GitHub \u7528\u6237\u540D\u6216\u540D\u79F0
   - version (string): \u7248\u672C\u53F7\uFF0C\u5982 "1.0"
   - createdAt (string): \u521B\u5EFA\u65E5\u671F ISO \u683C\u5F0F\uFF0C\u5982 "2026-06-16"
   - tags (array of string): \u6807\u7B7E\u6570\u7EC4\uFF0C\u5982 ["\u624B\u51B2", "V60"]

2. coffee (\u5496\u5561\u8C46\u4FE1\u606F)\uFF1A
   - name (string): \u8C46\u5B50\u540D\u79F0
   - origin (string): \u4EA7\u5730\u56FD\u5BB6/\u5730\u533A\uFF0C\u5982 "\u57C3\u585E\u4FC4\u6BD4\u4E9A\u8036\u52A0\u96EA\u83F2"
   - roastLevel (string): \u70D8\u7119\u5EA6\uFF0C\u5FC5\u987B\u662F\u4EE5\u4E0B\u4E4B\u4E00\uFF1A\u6D45\u70D8\u3001\u4E2D\u6D45\u70D8\u3001\u4E2D\u70D8\u3001\u4E2D\u6DF1\u70D8\u3001\u6DF1\u70D8\u3001\u6781\u6DF1\u70D8
   - process (string): \u5904\u7406\u6CD5\uFF0C\u5982 "\u6C34\u6D17"
   - roastDate (string, optional): \u70D8\u7119\u65E5\u671F YYYY-MM-DD

3. equipment (\u5668\u5177\u4FE1\u606F)\uFF1A
   - dripper (string): \u6EE4\u676F\u7C7B\u578B\uFF0C\u5982 "V60"
   - grinder (string): \u78E8\u8C46\u673A\u578B\u53F7\uFF0C\u5982 "Comandante C40"
   - brewer (string, optional): \u51B2\u716E\u5668\u5177
   - kettle (string, optional): \u624B\u51B2\u58F6

4. recipe (\u51B2\u716E\u53C2\u6570)\uFF1A
   - dose: { value: \u6570\u5B57, unit: "g", description?: \u5B57\u7B26\u4E32 } \u7C89\u91CF
   - waterAmount: { value: \u6570\u5B57, unit: "g", description?: \u5B57\u7B26\u4E32 } \u6C34\u91CF
   - ratio: \u6570\u5B57 \u7C89\u6C34\u6BD4\uFF0C\u5982 1:16 \u5199 16
   - grindSize: { value: "22", unit: "\u683C", micron?: \u6570\u5B57, description?: \u5B57\u7B26\u4E32 } \u7814\u78E8\u5EA6
   - waterTemperature: { value: \u6570\u5B57, unit: "\xB0C", description?: \u5B57\u7B26\u4E32 } \u6C34\u6E29
   - brewTime: { value: \u6570\u5B57, unit: "s", description?: \u5B57\u7B26\u4E32 } \u603B\u51B2\u716E\u65F6\u95F4

5. steps (\u51B2\u716E\u6B65\u9AA4\u5217\u8868\uFF0C\u6570\u7EC4)\uFF1A
   \u6BCF\u4E2A\u6B65\u9AA4\u5FC5\u987B\u5305\u542B\uFF1A
   - step: \u5E8F\u53F7\uFF08\u6570\u5B57\uFF09
   - action: \u52A8\u4F5C\u7C7B\u578B\uFF0C\u5FC5\u987B\u662F\u4EE5\u4E0B\u4E4B\u4E00\uFF1A\u95F7\u84B8\u3001\u6CE8\u6C34\u3001\u6405\u62CC\u3001\u9759\u7F6E\u3001\u5012\u51FA
   - waterAmount: { value: \u6570\u5B57, unit: "g" }\uFF08\u5982\u679C\u4E0D\u52A0\u6C34\u53EF\u4EE5\u4E0D\u586B\uFF09
   - duration: { value: \u6570\u5B57, unit: "s" } \u8BE5\u6B65\u9AA4\u505C\u7559\u65F6\u95F4
   - description?: \u63CF\u8FF0\u6587\u5B57

\u603B\u6B65\u9AA4\u4E00\u822C\u4E3A 3~5 \u6B65\uFF0C\u4F8B\u5982\uFF1A\u95F7\u84B8 \u2192 \u7B2C\u4E00\u6B21\u6CE8\u6C34 \u2192 \u7B2C\u4E8C\u6B21\u6CE8\u6C34 \u2192 \u5B8C\u6210\u5012\u51FA\u3002`;
var SYSTEM_PROMPT = `\u4F60\u662F BrewCode OS AI \u65B9\u6848\u751F\u6210\u5F15\u64CE\u3002\u6839\u636E\u7528\u6237\u63D0\u4F9B\u7684\u5496\u5561\u8C46\u4FE1\u606F\u3001\u62E5\u6709\u7684\u5668\u5177\u548C\u53E3\u5473\u504F\u597D\uFF0C\u751F\u6210\u4E00\u4EFD\u5B8C\u6574\u7684\u51B2\u716E\u65B9\u6848\uFF0C\u8F93\u51FA\u4E25\u683C\u7B26\u5408 .brew JSON Schema\u3002

\u89C4\u5219\uFF1A
1. \u8F93\u51FA\u5FC5\u987B\u662F\u5355\u4E00\u3001\u5B8C\u6574\u3001\u5408\u6CD5\u7684 JSON \u5BF9\u8C61\uFF0C\u5C31\u662F .brew \u6587\u4EF6\u672C\u8EAB
2. \u4E0D\u8981\u8F93\u51FA\u4EFB\u4F55\u89E3\u91CA\u6587\u5B57\uFF0C\u4E0D\u8981\u7528 markdown \u4EE3\u7801\u5757\u5305\u88F9\uFF0C\u4E0D\u8981\u52A0\u53CD\u5F15\u53F7
3. \u5FC5\u987B\u5305\u542B\u5168\u90E8 5 \u4E2A\u9876\u5C42\u5B57\u6BB5\uFF1Ameta, coffee, equipment, recipe, steps
4. \u5FC5\u987B\u4E25\u683C\u9075\u5B88\u5B57\u6BB5\u7ED3\u6784\u548C\u679A\u4E3E\u503C\u8981\u6C42
5. \u6839\u636E\u53E3\u5473\u504F\u597D\u8C03\u6574\u53C2\u6570\uFF1A
   - "\u660E\u4EAE\u679C\u9178" / "\u5E72\u51C0\u9178\u5EA6" \u2192 \u7814\u78E8\u504F\u7C97\u3001\u6C34\u6E29\u7A0D\u4F4E\uFF0890-92\xB0C\uFF09\u3001\u8403\u53D6\u65F6\u95F4\u8F83\u77ED
   - "\u9187\u539A\u751C\u611F" / "body \u539A\u91CD" \u2192 \u7814\u78E8\u504F\u7EC6\u3001\u6C34\u6E29\u7A0D\u9AD8\uFF0892-95\xB0C\uFF09\u3001\u8403\u53D6\u65F6\u95F4\u7A0D\u957F
   - "\u5747\u8861\u5E73\u8861" \u2192 \u4E2D\u5EB8\u53C2\u6570
   - "\u4F4E\u82E6\u4F4E\u9178" \u2192 \u6C34\u6E29\u504F\u4F4E\u3001\u65F6\u95F4\u9002\u4E2D
6. \u5982\u679C\u7528\u6237\u6CA1\u63D0\u4F9B\u7C89\u6C34\u6BD4\u504F\u597D\uFF0C\u4E2D\u70D8\u8C46\u4E00\u822C 1:15 ~ 1:17
7. \u6BCF\u4E2A\u6B65\u9AA4\u5FC5\u987B\u6709\u5408\u7406\u7684\u6CE8\u6C34\u91CF\uFF0C\u95F7\u84B8\u4E00\u822C\u662F\u7C89\u91CF\u7684 2~3 \u500D\u6C34
8. \u65E5\u671F\u4F7F\u7528\u4ECA\u5929\u7684\u65E5\u671F\uFF1A${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}

${BREW_SCHEMA_TIPS}

\u8BB0\u4F4F\uFF1A\u53EA\u8F93\u51FA JSON\uFF0C\u4E0D\u8981\u8F93\u51FA\u5176\u4ED6\u4EFB\u4F55\u4E1C\u897F\u3002`;
function buildUserPrompt(input) {
  const parts = [];
  const { coffee, equipment, preference } = input;
  if (coffee) {
    const c = [];
    if (coffee.name) c.push(`\u540D\u79F0: ${coffee.name}`);
    if (coffee.origin) c.push(`\u4EA7\u5730: ${coffee.origin}`);
    if (coffee.roastLevel) c.push(`\u70D8\u7119\u5EA6: ${coffee.roastLevel}`);
    if (coffee.process) c.push(`\u5904\u7406\u6CD5: ${coffee.process}`);
    if (c.length > 0) parts.push(`\u5496\u5561\u8C46\u4FE1\u606F\uFF1A
${c.join("\n")}`);
  }
  if (equipment && Array.isArray(equipment) && equipment.length > 0) {
    parts.push(`\u7528\u6237\u62E5\u6709\u8BBE\u5907\uFF1A
${equipment.map((e) => `- ${e}`).join("\n")}`);
  }
  if (preference && preference.trim()) {
    parts.push(`\u7528\u6237\u53E3\u5473\u504F\u597D\uFF1A
${preference}`);
  }
  return parts.join("\n\n");
}
__name(buildUserPrompt, "buildUserPrompt");
function validateBrewStructure(brew) {
  const missing = [];
  if (!brew || typeof brew !== "object") {
    return { valid: false, missing: ["\u9876\u5C42\u4E0D\u662F\u5BF9\u8C61"] };
  }
  if (!brew.meta || typeof brew.meta !== "object") missing.push("meta");
  if (!brew.coffee || typeof brew.coffee !== "object") missing.push("coffee");
  if (!brew.equipment || typeof brew.equipment !== "object") missing.push("equipment");
  if (!brew.recipe || typeof brew.recipe !== "object") missing.push("recipe");
  if (!Array.isArray(brew.steps)) missing.push("steps (\u5FC5\u987B\u662F\u6570\u7EC4)");
  if (Array.isArray(brew.steps) && brew.steps.length === 0) {
    missing.push("steps (\u81F3\u5C11\u4E00\u4E2A\u6B65\u9AA4)");
  }
  if (brew.recipe && !brew.recipe.dose) missing.push("recipe.dose");
  if (brew.recipe && !brew.recipe.waterAmount) missing.push("recipe.waterAmount");
  if (brew.recipe && !brew.recipe.grindSize) missing.push("recipe.grindSize");
  if (brew.recipe && !brew.recipe.waterTemperature) missing.push("recipe.waterTemperature");
  return missing.length === 0 ? { valid: true } : { valid: false, missing };
}
__name(validateBrewStructure, "validateBrewStructure");
function extractBrewJSON(rawText) {
  if (!rawText || !rawText.trim()) return null;
  const cleaned = rawText.trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch (_) {
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch (_) {
    return null;
  }
  return null;
}
__name(extractBrewJSON, "extractBrewJSON");
function buildRetryPrompt(lastOutput, missing) {
  return `\u4F60\u4E0A\u4E00\u6B21\u8F93\u51FA\u4E0D\u7B26\u5408 .brew Schema \u7ED3\u6784\uFF0C\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5\uFF1A${missing.join(", ")}\u3002\u8BF7\u4FEE\u6B63\u7ED3\u6784\uFF0C\u91CD\u65B0\u8F93\u51FA\u5B8C\u6574 JSON\u3002

\u8BB0\u4F4F\uFF1A
1. \u5FC5\u987B\u5305\u542B\u5168\u90E8\u4E94\u4E2A\u9876\u5C42\u5B57\u6BB5\uFF1Ameta, coffee, equipment, recipe, steps
2. steps \u5FC5\u987B\u662F\u6570\u7EC4\u4E14\u81F3\u5C11\u6709\u4E00\u4E2A\u5143\u7D20
3. recipe \u5FC5\u987B\u5305\u542B dose, waterAmount, grindSize, waterTemperature
4. \u53EA\u8F93\u51FA JSON\uFF0C\u4E0D\u8981\u8F93\u51FA\u4EFB\u4F55\u6587\u5B57\u89E3\u91CA`;
}
__name(buildRetryPrompt, "buildRetryPrompt");
function json(data, status) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}
__name(json, "json");
async function callDeepSeek(apiKey, messages) {
  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: GENERATE_MODEL,
          messages,
          temperature: 0.5,
          max_tokens: 2e3
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        return { ok: true, content };
      }
      const errBody = await response.text();
      lastError = { status: response.status, body: errBody };
      if (response.status === 429 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1e3 * (attempt + 1)));
        continue;
      }
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      break;
    } catch (e) {
      lastError = { status: 0, body: e.name === "AbortError" ? "Request timeout" : e.message };
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
    }
  }
  return { ok: false, error: lastError };
}
__name(callDeepSeek, "callDeepSeek");
var index_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed. Use POST." }, 405);
    }
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return json({ error: "Invalid JSON body." }, 400);
    }
    const { coffee, equipment, preference } = body || {};
    if (!coffee || typeof coffee !== "object") {
      return json(
        { error: 'Missing "coffee". Must be an object with origin, roastLevel, process.' },
        400
      );
    }
    if (!coffee.origin || !coffee.roastLevel || !coffee.process) {
      return json(
        { error: "Missing required coffee fields: origin, roastLevel, process are all required." },
        400
      );
    }
    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === "\u5F85\u586B\u5165") {
      return json(
        { error: "DeepSeek API key not configured. Set DEEPSEEK_API_KEY in wrangler.toml [vars]." },
        500
      );
    }
    const userPrompt = buildUserPrompt({ coffee, equipment, preference });
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ];
    let retries = 0;
    let brew = null;
    let validated = false;
    let validationResult = null;
    let lastContent = "";
    for (let attempt = 0; attempt <= 1; attempt++) {
      const result = await callDeepSeek(apiKey, messages);
      if (!result.ok) {
        return json(
          {
            error: "DeepSeek API call failed after retries",
            detail: result.error
          },
          502
        );
      }
      lastContent = result.content;
      brew = extractBrewJSON(result.content);
      if (!brew) {
        messages.push({
          role: "user",
          content: "Failed to parse JSON from your output. Please output a single valid JSON object without any surrounding text or code blocks."
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
        role: "assistant",
        content: result.content
      });
      messages.push({
        role: "user",
        content: buildRetryPrompt(brew, validationResult.missing)
      });
      retries++;
    }
    if (!brew) {
      return json(
        {
          error: "Failed to extract valid JSON after retries",
          raw: lastContent,
          retries
        },
        422
      );
    }
    if (!validated && validationResult) {
      return json(
        {
          brew,
          validated: false,
          retries,
          missing: validationResult.missing,
          raw: lastContent
        },
        200
      );
    }
    return json(
      {
        brew,
        validated: true,
        retries
      },
      200
    );
  }
};

// C:/Users/LENOVO/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// C:/Users/LENOVO/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-tvyjRA/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = index_default;

// C:/Users/LENOVO/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-tvyjRA/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
