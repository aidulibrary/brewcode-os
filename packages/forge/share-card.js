/*
 * BrewCode OS — 分享图片生成器
 * BrewCode OS v0.9
 *
 * 核心职责：
 *   1. 方案编号系统 (BC-2026-0001 格式)
 *   2. 通过 html2canvas 生成分享图片 PNG
 *   3. 自动触发浏览器下载
 *
 * 依赖：html2canvas (CDN 动态加载)
 * 零框架，纯原生 JS
 */

'use strict';

/* ================================================================
 * 种子方案编号映射表
 * 50 个种子方案预分配 BC-2026-0001 ~ BC-2026-0050
 * 用户自创方案从 BC-2026-0051 开始自动递增
 * ================================================================ */

var SEED_IDS = {
  '01-v60-01-light-yirgacheffe-natural.brew.json': 'BC-2026-0001',
  '02-v60-02-medium-huila-washed.brew.json': 'BC-2026-0002',
  '03-kalita-155-medium-yirgacheffe-natural.brew.json': 'BC-2026-0003',
  '04-origami-light-guji-natural.brew.json': 'BC-2026-0004',
  '05-chemex-light-ethiopia-guji-natural.brew.json': 'BC-2026-0005',
  '06-aeropress-medium-yirgacheffe-washed.brew.json': 'BC-2026-0006',
  '07-frenchpress-medium-cerrado-natural.brew.json': 'BC-2026-0007',
  '08-v60-01-medium-antigua-washed.brew.json': 'BC-2026-0008',
  '09-kalita-155-dark-sumatra-mandheling-wet-hulled.brew.json': 'BC-2026-0009',
  '10-origami-light-panama-geisha-natural.brew.json': 'BC-2026-0010',
  '11-v60-01-medium-yirgacheffe-natural.brew.json': 'BC-2026-0011',
  '12-kalita-185-medium-huila-washed.brew.json': 'BC-2026-0012',
  '13-chemex-medium-dark-cerrado-natural.brew.json': 'BC-2026-0013',
  '14-aeropress-light-ethiopia-guji-natural.brew.json': 'BC-2026-0014',
  '15-frenchpress-light-yirgacheffe-washed.brew.json': 'BC-2026-0015',
  '16-v60-02-medium-antigua-washed.brew.json': 'BC-2026-0016',
  '17-origami-medium-dark-bali-kintamani-natural.brew.json': 'BC-2026-0017',
  '18-kalita-155-light-guji-natural.brew.json': 'BC-2026-0018',
  '19-chemex-light-yirgacheffe-washed.brew.json': 'BC-2026-0019',
  '20-aeropress-dark-cerrado-natural.brew.json': 'BC-2026-0020',
  '21-v60-01-dark-mandheling-wet-hulled.brew.json': 'BC-2026-0021',
  '22-kalita-155-medium-costa-rica-tarrazu-washed.brew.json': 'BC-2026-0022',
  '23-chemex-light-guji-natural.brew.json': 'BC-2026-0023',
  '24-origami-medium-yunnan-natural.brew.json': 'BC-2026-0024',
  '25-aeropress-medium-guji-natural.brew.json': 'BC-2026-0025',
  '26-frenchpress-dark-cerrado-natural.brew.json': 'BC-2026-0026',
  '27-v60-02-light-sidamo-washed.brew.json': 'BC-2026-0027',
  '28-kalita-185-medium-dark-antigua-washed.brew.json': 'BC-2026-0028',
  '29-chemex-dark-mandheling-wet-hulled.brew.json': 'BC-2026-0029',
  '30-origami-light-costa-rica-tarrazu-washed.brew.json': 'BC-2026-0030',
  '31-v60-01-light-costa-rica-tarrazu-washed.brew.json': 'BC-2026-0031',
  '32-kalita-155-dark-cerrado-natural.brew.json': 'BC-2026-0032',
  '33-chemex-medium-yunnan-natural.brew.json': 'BC-2026-0033',
  '34-aeropress-medium-sidamo-washed.brew.json': 'BC-2026-0034',
  '35-origami-medium-dark-mandheling-wet-hulled.brew.json': 'BC-2026-0035',
  '36-frenchpress-medium-costa-rica-tarrazu-washed.brew.json': 'BC-2026-0036',
  '37-v60-02-light-guji-natural.brew.json': 'BC-2026-0037',
  '38-kalita-185-medium-yunnan-natural.brew.json': 'BC-2026-0038',
  '39-chemex-light-sidamo-washed.brew.json': 'BC-2026-0039',
  '40-aeropress-medium-dark-antigua-washed.brew.json': 'BC-2026-0040',
  '41-v60-01-medium-dark-yunnan-natural.brew.json': 'BC-2026-0041',
  '42-kalita-155-light-sidamo-washed.brew.json': 'BC-2026-0042',
  '43-origami-medium-dark-cerrado-natural.brew.json': 'BC-2026-0043',
  '44-aeropress-light-costa-rica-tarrazu-washed.brew.json': 'BC-2026-0044',
  '45-frenchpress-medium-dark-yunnan-natural.brew.json': 'BC-2026-0045',
  '46-v60-02-medium-dark-cerrado-natural.brew.json': 'BC-2026-0046',
  '47-chemex-medium-dark-sidamo-washed.brew.json': 'BC-2026-0047',
  '48-kalita-185-light-guji-natural.brew.json': 'BC-2026-0048',
  '49-origami-light-yunnan-natural.brew.json': 'BC-2026-0049',
  '50-v60-01-medium-dark-sidamo-washed.brew.json': 'BC-2026-0050',
};

/* ================================================================
 * 方案编号生成
 * 格式：BC-{年份}-{四位顺序号}
 * 种子方案 0001-0050 已预分配，用户自创从 0051 开始
 * ================================================================ */

var BREWCODE_COUNTER_KEY = 'brewcode_counter';

function generateBrewId() {
  var year = new Date().getFullYear();
  var stored = localStorage.getItem(BREWCODE_COUNTER_KEY);
  var counter = 51;
  if (stored) {
    counter = parseInt(stored, 10) || 51;
  }
  var id = 'BC-' + year + '-' + String(counter).padStart(4, '0');
  localStorage.setItem(BREWCODE_COUNTER_KEY, String(counter + 1));
  return id;
}

function getBrewIdForSeed(filename) {
  return SEED_IDS[filename] || null;
}

function ensureBrewId(brewData, seedFilename) {
  if (brewData.meta && brewData.meta.brewId) {
    return brewData.meta.brewId;
  }
  if (seedFilename) {
    var seedId = getBrewIdForSeed(seedFilename);
    if (seedId) {
      brewData.meta = brewData.meta || {};
      brewData.meta.brewId = seedId;
      return seedId;
    }
  }
  var newId = generateBrewId();
  brewData.meta = brewData.meta || {};
  brewData.meta.brewId = newId;
  return newId;
}

/* ================================================================
 * html2canvas 动态加载
 * ================================================================ */

function loadHtml2Canvas() {
  return new Promise(function (resolve, reject) {
    if (typeof html2canvas !== 'undefined') return resolve();
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.onload = resolve;
    script.onerror = function () {
      reject(new Error('html2canvas 加载失败'));
    };
    document.head.appendChild(script);
  });
}

/* ================================================================
 * 分享图片 HTML 构建
 * ================================================================ */

function buildShareCardHTML(brewData, options) {
  var opts = options || {};
  var includeNotes = opts.includeNotes !== false;
  var includeSource = opts.includeSource !== false;

  var brewId = brewData.meta && brewData.meta.brewId ? brewData.meta.brewId : '';

  var name = (brewData.meta && brewData.meta.name) || '未命名方案';
  var coffeeInfo = buildCoffeeInfo(brewData);
  var flavorStr = buildFlavorString(brewData);
  var paramsLine1 = buildParamsLine1(brewData);
  var paramsLine2 = buildParamsLine2(brewData);
  var stepsHTML = buildStepsHTML(brewData);
  var keynote = buildKeynote(brewData);
  var author = (brewData.meta && brewData.meta.author) || '';
  var source = (brewData.meta && brewData.meta.source) || '';

  var html = '';

  html += '<div class="share-card">';

  html += '<div class="share-card-id">' + escHTML(brewId) + '</div>';

  html += '<div class="share-card-header">';
  html += '<span class="share-card-brace">{</span>';
  html += '<div class="share-card-title-group">';
  html += '<div class="share-card-name">' + escHTML(name) + '</div>';
  if (coffeeInfo) {
    html += '<div class="share-card-coffee-info">' + escHTML(coffeeInfo) + '</div>';
  }
  html += '</div>';
  html += '</div>';

  if (flavorStr) {
    html += '<div class="share-card-flavors">' + escHTML(flavorStr) + '</div>';
  }

  html += '<div class="share-card-separator"></div>';

  if (paramsLine1 || paramsLine2) {
    html += '<div class="share-card-params">';
    if (paramsLine1) {
      html += '<div class="share-card-params-line">' + escHTML(paramsLine1) + '</div>';
    }
    if (paramsLine2) {
      html += '<div class="share-card-params-line-secondary">' + escHTML(paramsLine2) + '</div>';
    }
    html += '</div>';
  }

  html += '<div class="share-card-separator"></div>';

  if (stepsHTML) {
    html += '<div class="share-card-steps">' + stepsHTML + '</div>';
  }

  if (includeNotes && keynote) {
    html += '<div class="share-card-keynote">' + escHTML(keynote) + '</div>';
  }

  html += '<div class="share-card-meta">';
  if (author) {
    html += '<div class="share-card-author">' + '冲煮者：' + escHTML(author) + '</div>';
  }
  if (includeSource && source) {
    html += '<div class="share-card-source">' + '基于 ' + escHTML(source) + ' 方案' + '</div>';
  }
  html += '</div>';

  html += '<div class="share-card-footer">';
  html += '<div class="share-card-url">brewcode.礼字号.中国</div>';
  html += '<div class="share-card-cc0">可自由使用修改分享 · CC0</div>';
  html += '</div>';

  html += '</div>';

  return html;
}

function escHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCoffeeInfo(brewData) {
  var parts = [];
  var coffee = brewData.coffee;
  if (!coffee) return '';

  if (coffee.origin && coffee.origin.country) {
    parts.push(coffee.origin.country);
    if (coffee.origin.region) {
      parts[parts.length - 1] += ' ' + coffee.origin.region;
    }
  }
  if (coffee.process) parts.push(coffee.process);
  if (coffee.roastLevel) parts.push(coffee.roastLevel);

  return parts.join(' · ');
}

function buildFlavorString(brewData) {
  var coffee = brewData.coffee;
  if (!coffee) return '';

  var notes = coffee.flavorNotes;
  if (!notes || !notes.length) return '';

  return notes.join(' · ');
}

function buildParamsLine1(brewData) {
  var r = brewData.recipe;
  if (!r) return '';

  var parts = [];
  if (r.dose && r.dose.value) {
    parts.push(r.dose.value + (r.dose.unit || 'g'));
  }
  if (r.waterAmount && r.waterAmount.value) {
    parts.push(r.waterAmount.value + (r.waterAmount.unit || 'ml'));
  }
  if (r.waterTemperature && r.waterTemperature.value) {
    parts.push(r.waterTemperature.value + (r.waterTemperature.unit || '°C'));
  }
  return parts.join(' · ');
}

function buildParamsLine2(brewData) {
  var r = brewData.recipe;
  if (!r) return '';

  var parts = [];
  if (r.grindSize && r.grindSize.value) {
    var grindStr = r.grindSize.value + '';
    if (r.grindSize.unit) grindStr += ' ' + r.grindSize.unit;
    parts.push(grindStr);
  }
  if (r.ratio) {
    parts.push(r.ratio);
  }
  return parts.join(' · ');
}

function buildStepsHTML(brewData) {
  var steps = brewData.steps;
  if (!steps || !steps.length) return '';

  var html = '';
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i];
    var stepText = buildStepText(s, i + 1);
    if (stepText) {
      html += '<div class="share-card-step">' + escHTML(stepText) + '</div>';
    }
  }
  return html;
}

function buildStepText(step, orderNum) {
  var parts = [];
  parts.push(orderNumToUnicode(orderNum));

  if (step.action) {
    var actionLabel = stepActionLabel(step.action);
    parts.push(actionLabel);
  }

  if (step.waterAmount && step.waterAmount.value) {
    parts.push(step.waterAmount.value + (step.waterAmount.unit || 'ml'));
  }

  if (step.duration && step.duration.value) {
    parts.push(step.duration.value + (step.duration.unit || 's'));
  }

  if (step.description) {
    parts.push(step.description);
  }

  return parts.join(' ');
}

function orderNumToUnicode(n) {
  var circled = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  if (n <= 10) return circled[n - 1];
  return n + '.';
}

function stepActionLabel(action) {
  var labels = {
    prepare: '准备',
    rinse: '冲洗',
    grind: '研磨',
    dose: '投粉',
    bloom: '闷蒸',
    pour: '注水',
    stir: '搅拌',
    swirl: '摇晃',
    drawdown: '滴滤',
    wait: '等待',
    measure: '测量',
    taste: '品鉴',
    note: '备注',
  };
  return labels[action] || action;
}

function buildKeynote(brewData) {
  if (brewData.result && brewData.result.improvements) {
    return brewData.result.improvements;
  }
  return '';
}

/* ================================================================
 * 分享图片生成主函数
 * ================================================================ */

function generateShareCard(brewData, options) {
  var opts = options || {};
  var seedFilename = opts.seedFilename || null;

  ensureBrewId(brewData, seedFilename);

  var html = buildShareCardHTML(brewData, opts);

  var container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:750px;z-index:-1;';
  container.innerHTML = html;
  document.body.appendChild(container);

  var linkEl = document.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = getShareCardCSSPath();

  return new Promise(function (resolveCss, rejectCss) {
    linkEl.onload = resolveCss;
    linkEl.onerror = function () {
      console.warn('share-card.css 加载失败，使用内联样式回退');
      resolveCss();
    };
    document.head.appendChild(linkEl);
  })
    .then(function () {
      return loadHtml2Canvas();
    })
    .then(function () {
      return html2canvas(container.firstChild, {
        backgroundColor: '#1a1a2e',
        scale: 2,
        useCORS: true,
        logging: false,
      });
    })
    .then(function (canvas) {
      document.body.removeChild(container);
      if (linkEl.parentNode) linkEl.parentNode.removeChild(linkEl);
      return canvas;
    })
    .catch(function (err) {
      document.body.removeChild(container);
      if (linkEl.parentNode) linkEl.parentNode.removeChild(linkEl);
      throw err;
    })
    .then(function (canvas) {
      var brewId = brewData.meta && brewData.meta.brewId ? brewData.meta.brewId : 'BC-0000';
      var name = (brewData.meta && brewData.meta.name) || 'untitled';
      var safeName = name.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-');
      var filename = brewId + '-' + safeName + '.png';

      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    });
}

function getShareCardCSSPath() {
  var isLocal =
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isLocal) {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;
      if (src && src.indexOf('share-card.js') !== -1) {
        return src.replace('share-card.js', 'share-card.css');
      }
    }
    return '../common/share-card.css';
  }

  return '/common/share-card.css';
}
