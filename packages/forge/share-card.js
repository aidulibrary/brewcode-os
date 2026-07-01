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

    var cdns = [
      'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
      'https://lib.baomitu.com/html2canvas/1.4.1/html2canvas.min.js',
      'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js',
    ];
    var idx = 0;

    function tryNext() {
      if (idx >= cdns.length) return reject(new Error('html2canvas 加载失败（已尝试 ' + cdns.length + ' 个 CDN）'));
      var url = cdns[idx++];
      var script = document.createElement('script');
      var settled = false;
      function done() {
        if (!settled) { settled = true; resolve(); }
      }
      function fail() {
        if (!settled) { settled = true; script.parentNode && script.parentNode.removeChild(script); tryNext(); }
      }
      script.onload = done;
      script.onerror = fail;
      script.src = url;
      document.head.appendChild(script);
      setTimeout(fail, 8000);
    }

    tryNext();
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
  var equipmentInfo = buildEquipmentInfo(brewData);
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

  if (equipmentInfo) {
    html += '<div class="share-card-equipment">' + escHTML(equipmentInfo) + '</div>';
  }

  if (flavorStr) {
    var flavorTags = flavorStr.split(' · ').map(function(t) {
      return '<span class="share-card-flavor-tag">' + escHTML(t) + '</span>';
    }).join('');
    html += '<div class="share-card-flavors">' + flavorTags + '</div>';
  }

  html += '<div class="share-card-separator"></div>';

  if (paramsLine1 || paramsLine2) {
    html += '<div class="share-card-params-section"><div class="share-card-params">';
    if (paramsLine1) {
      html += '<div class="share-card-params-line">' + escHTML(paramsLine1) + '</div>';
    }
    if (paramsLine2) {
      html += '<div class="share-card-params-line-secondary">' + escHTML(paramsLine2) + '</div>';
    }
    html += '</div></div>';
  }

  html += '<div class="share-card-separator"></div>';

  if (stepsHTML) {
    html += '<div class="share-card-steps">' + stepsHTML + '</div>';
  }

  html += '<div class="share-card-bottom-line"></div>';
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

  html += '<div class="share-card-brace-right">}</div>';
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
  if (coffee.variety) parts.push(coffee.variety);

  return parts.join(' · ');
}

function buildEquipmentInfo(brewData) {
  var e = brewData.equipment;
  if (!e) return '';

  var parts = [];
  if (e.brewer) {
    var brewerStr = e.brewer;
    if (e.brewerSize) brewerStr += ' (' + e.brewerSize + ')';
    parts.push(brewerStr);
  }
  if (e.grinder) parts.push(e.grinder);
  if (e.kettle) parts.push(e.kettle);
  if (e.scale) parts.push(e.scale);
  if (e.filter) parts.push(e.filter);

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
    parts.push('粉量 ' + r.dose.value + (r.dose.unit || 'g'));
  }
  if (r.waterAmount && r.waterAmount.value) {
    parts.push('水量 ' + r.waterAmount.value + (r.waterAmount.unit || 'ml'));
  }
  if (r.waterTemperature && r.waterTemperature.value) {
    parts.push('水温 ' + r.waterTemperature.value + (r.waterTemperature.unit || '°C'));
  }
  if (r.brewTime && r.brewTime.value) {
    parts.push('时间 ' + r.brewTime.value + (r.brewTime.unit || 's'));
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
    parts.push('研磨 ' + grindStr);
  }
  if (r.ratio) {
    parts.push('粉水比 ' + r.ratio);
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
      var numEnd = stepText.indexOf(' ');
      if (numEnd > 0) {
        var num = stepText.substring(0, numEnd);
        var text = stepText.substring(numEnd + 1);
      } else {
        var num = stepText;
        var text = '';
      }
      html += '<div class="share-card-step">' +
        '<span class="share-card-step-num">' + escHTML(num) + '</span>' +
        '<span class="share-card-step-text">' + escHTML(text) + '</span>' +
        '</div>';
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

function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

function showShareImage(canvas) {
  var overlay = document.getElementById('share-image-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'share-image-overlay';
    overlay.className = 'hidden';
    overlay.innerHTML =
      '<div class="share-image-backdrop"></div>' +
      '<div class="share-image-container">' +
      '<button id="btn-share-image-close" class="btn-close">✕</button>' +
      '<img id="share-image-preview" src="" alt="分享图片" />' +
      '<p class="share-image-hint">长按图片保存或分享</p>' +
      '</div>';
    document.body.appendChild(overlay);
    var backdrop = overlay.querySelector('.share-image-backdrop');
    var closeBtn = overlay.querySelector('#btn-share-image-close');
    function hideOverlay() {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
    }
    closeBtn.onclick = hideOverlay;
    backdrop.onclick = hideOverlay;
  }
  var img = overlay.querySelector('#share-image-preview');
  // 微信环境中 toDataURL 对大图可能造成内存压力，优先用 Blob URL
  if (canvas.toBlob) {
    canvas.toBlob(function (blob) {
      img.src = URL.createObjectURL(blob);
      overlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }, 'image/png');
  } else {
    img.src = canvas.toDataURL('image/png');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
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
    'position:fixed;left:-9999px;top:0;width:640px;z-index:-1;';
  container.innerHTML = html;
  document.body.appendChild(container);

  // 内联注入 CSS，消除外部文件依赖（CF Pages 不部署 common/ 目录）
  injectShareCardCSS();

  return Promise.resolve().then(function () {
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
      return canvas;
    })
    .catch(function (err) {
      document.body.removeChild(container);
      throw err;
    })
    .then(function (canvas) {
      var brewId = brewData.meta && brewData.meta.brewId ? brewData.meta.brewId : 'BC-0000';
      var name = (brewData.meta && brewData.meta.name) || 'untitled';
      var safeName = name.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-');
      var filename = brewId + '-' + safeName + '.png';

      if (isWeChat()) {
        showShareImage(canvas);
        showToast('分享图已生成');
      } else {
        canvas.toBlob(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        });
        showToast('分享图已下载');
      }

      return canvas;
    });
}

/* 内联注入 share-card.css（CF Pages 不部署 common/ 目录） */
function injectShareCardCSS() {
  if (document.getElementById('share-card-inline')) return;
  var css = `.share-card{width:640px;background:#1a1a2e;color:#f0e8d8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans SC',sans-serif;padding:32px;box-sizing:border-box;position:relative}.share-card-id{font-size:13px;font-weight:300;color:#e8a850;letter-spacing:2px;margin-bottom:28px}.share-card-header{display:flex;align-items:center;margin-bottom:18px}.share-card-brace{font-family:Georgia,'Times New Roman',serif;font-size:110px;font-weight:700;color:#e8a850;line-height:1;margin-right:20px;flex-shrink:0}.share-card-title-group{display:flex;flex-direction:column}.share-card-name{font-size:26px;font-weight:700;color:#e8a850;line-height:1.4;margin-bottom:4px}.share-card-coffee-info{font-size:17px;font-weight:400;color:#f0e8d8;line-height:1.5}.share-card-equipment{font-size:15px;font-weight:400;color:#f0e8d8;margin-bottom:8px;line-height:1.5}.share-card-flavors{margin-bottom:20px;line-height:1.5}.share-card-separator{width:100%;height:1px;background:#e8a850;margin:16px 0;opacity:0.6}.share-card-params{display:flex;flex-direction:column;gap:4px;margin-bottom:4px}.share-card-params-line{font-size:16px;font-weight:400;color:#f0e8d8;line-height:1.6}.share-card-params-line-secondary{font-size:15px;font-weight:400;color:#b8a890;line-height:1.6}.share-card-steps{display:flex;flex-direction:column;gap:4px}.share-card-step{display:flex;align-items:baseline;gap:10px;padding:5px 0}.share-card-step-num{flex-shrink:0;width:22px;height:22px;border-radius:50%;border:1px solid rgba(232,168,80,0.5);color:#e8a850;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;line-height:1}.share-card-step-text{flex:1;font-size:14px;font-weight:300;color:#b8a890;line-height:1.6}.share-card-keynote{font-size:14px;font-weight:300;color:#b8a890;margin-top:6px;line-height:1.6;font-style:italic}.share-card-meta{margin-top:20px;display:flex;flex-direction:column;gap:2px}.share-card-author{font-size:12px;font-weight:300;color:#f0e8d8;line-height:1.5}.share-card-source{font-size:12px;font-weight:300;color:#b8a890;line-height:1.5}.share-card-footer{margin-top:20px;display:flex;flex-direction:column;gap:2px}.share-card-url{font-size:11px;font-weight:300;color:#b8a890;letter-spacing:1px;line-height:1.5}.share-card-cc0{font-size:11px;font-weight:300;color:#b8a890;line-height:1.5}.share-card-brace-right{position:absolute;right:32px;bottom:24px;font-family:Georgia,'Times New Roman',serif;font-size:120px;font-weight:700;color:rgba(232,168,80,0.10);line-height:1;pointer-events:none}.share-card-flavor-tag{display:inline-block;font-size:12px;font-weight:400;color:#f0e8d8;background:rgba(232,168,80,0.12);padding:3px 10px;border-radius:12px;margin:0 4px 6px 0;border:1px solid rgba(232,168,80,0.2)}.share-card-params-section{background:rgba(255,255,255,0.025);border-radius:6px;padding:14px 16px;margin:4px 0;border:1px solid rgba(255,255,255,0.04)}.share-card-bottom-line{width:50px;height:1px;background:rgba(232,168,80,0.25);margin-top:24px;margin-bottom:16px}`;
  var style = document.createElement('style');
  style.id = 'share-card-inline';
  style.textContent = css;
  document.head.appendChild(style);
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
