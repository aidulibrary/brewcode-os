/*
 * BrewForge — 可视化 .brew 方案编辑器
 * BrewCode OS v0.6
 *
 * 核心职责：
 *   1. 提供 .brew 文件的表单化编辑界面
 *   2. 实时 JSON 预览与校验
 *   3. 导入/导出 .brew 文件
 *   4. 与 BrewRepo 和 BrewPlayer 互通
 *
 * 数据结构：遵循 packages/standards/brew.schema.json (v0.1)
 *   顶层六段：meta / coffee / equipment / recipe / steps / result
 */

'use strict';

function $(sel) {
  return document.querySelector(sel);
}

function refreshI18nTexts() {
  var elements = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var key = el.getAttribute('data-i18n');
    if (key) {
      var tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        el.placeholder = BrewCodeI18n.t(key);
      } else {
        el.textContent = BrewCodeI18n.t(key);
      }
    }
  }
}
window.refreshI18nTexts = refreshI18nTexts;

/* Schema & CodeMirror 运行态 */
var brewSchemaValidator = null;
var cmView = null;

/* ================================================================
 * 编辑器状态
 * ================================================================ */

var editorState = {
  meta: {
    name: '',
    version: '1.0.0',
    brewCodeVersion: '1.0',
    author: '',
    description: '',
    license: 'CC0',
    tags: [],
    createdAt: new Date().toISOString(),
    source: '',
    brewId: '',
  },
  coffee: {
    name: '',
    producer: '',
    origin: {
      country: '',
      region: '',
      farm: '',
      altitude: '',
    },
    variety: '',
    process: '',
    roastLevel: '中烘',
    roastDate: '',
    roaster: '',
    flavorNotes: [],
  },
  equipment: {
    brewer: '',
    brewerMaterial: '',
    brewerSize: '',
    filter: '',
    grinder: '',
    kettle: '',
    scale: '',
    server: '',
  },
  recipe: {
    dose: { value: 15, unit: 'g' },
    waterAmount: { value: 225, unit: 'ml' },
    ratio: '1:15',
    grindSize: { value: 22, unit: 'C40 click', description: '' },
    waterTemperature: { value: 93, unit: '°C' },
    waterType: '',
    waterTDS: null,
    brewTime: { value: 150, unit: 's' },
    bloomRatio: '1:3',
    bloomTime: { value: 30, unit: 's' },
    targetTDS: null,
    targetExtraction: null,
  },
  steps: [],
  result: {
    actualBrewTime: null,
    finalYield: null,
    measuredTDS: null,
    extractionYield: null,
    rating: null,
    aroma: { rating: null, notes: '' },
    flavor: { rating: null, notes: '' },
    aftertaste: { rating: null, notes: '' },
    acidity: { rating: null, notes: '' },
    body: { rating: null, notes: '' },
    balance: { rating: null, notes: '' },
    sweetness: { rating: null, notes: '' },
    cleanCup: { rating: null, notes: '' },
    overall: { rating: null, notes: '' },
    tastingNotes: [],
    improvements: '',
  },
};

/* ================================================================
 * 表单同步 — 从 state 写入 DOM
 * ================================================================ */

function syncFormFromState() {
  var s = editorState;

  /* meta */
  $('#inp-meta-name').value = s.meta.name;
  $('#inp-meta-version').value = s.meta.version;
  $('#inp-meta-author').value = s.meta.author;
  $('#inp-meta-desc').value = s.meta.description;
  $('#inp-meta-license').value = s.meta.license;
  $('#inp-meta-tags').value = s.meta.tags.join(', ');
  $('#inp-meta-source').value = s.meta.source;

  /* coffee */
  $('#inp-coffee-name').value = s.coffee.name;
  $('#inp-coffee-producer').value = s.coffee.producer;
  $('#inp-coffee-country').value = s.coffee.origin.country;
  $('#inp-coffee-region').value = s.coffee.origin.region;
  $('#inp-coffee-farm').value = s.coffee.origin.farm;
  $('#inp-coffee-altitude').value = s.coffee.origin.altitude;
  $('#inp-coffee-variety').value = s.coffee.variety;
  $('#inp-coffee-process').value = s.coffee.process;
  $('#inp-coffee-roastLevel').value = s.coffee.roastLevel;
  $('#inp-coffee-roastDate').value = s.coffee.roastDate;
  $('#inp-coffee-roaster').value = s.coffee.roaster;
  $('#inp-coffee-flavorNotes').value = s.coffee.flavorNotes.join(', ');

  /* equipment */
  $('#inp-equip-brewer').value = s.equipment.brewer;
  $('#inp-equip-material').value = s.equipment.brewerMaterial;
  $('#inp-equip-size').value = s.equipment.brewerSize;
  $('#inp-equip-filter').value = s.equipment.filter;
  $('#inp-equip-grinder').value = s.equipment.grinder;
  $('#inp-equip-kettle').value = s.equipment.kettle;
  $('#inp-equip-scale').value = s.equipment.scale;
  $('#inp-equip-server').value = s.equipment.server;

  /* recipe */
  $('#inp-recipe-dose').value = s.recipe.dose.value;
  $('#inp-recipe-waterAmount').value = s.recipe.waterAmount.value;
  $('#inp-recipe-ratio').value = s.recipe.ratio;
  $('#inp-recipe-grindValue').value = s.recipe.grindSize.value;
  $('#inp-recipe-grindUnit').value = s.recipe.grindSize.unit;
  $('#inp-recipe-grindDesc').value = s.recipe.grindSize.description;
  $('#inp-recipe-waterTemp').value = s.recipe.waterTemperature.value;
  $('#inp-recipe-waterType').value = s.recipe.waterType;
  $('#inp-recipe-waterTDS').value = s.recipe.waterTDS != null ? s.recipe.waterTDS : '';
  $('#inp-recipe-brewTime').value = s.recipe.brewTime.value;
  $('#inp-recipe-bloomRatio').value = s.recipe.bloomRatio;
  $('#inp-recipe-bloomTime').value = s.recipe.bloomTime.value;
  $('#inp-recipe-targetTDS').value = s.recipe.targetTDS != null ? s.recipe.targetTDS : '';
  $('#inp-recipe-targetExtraction').value =
    s.recipe.targetExtraction != null ? s.recipe.targetExtraction : '';
}

function syncResultFromState() {
  var r = editorState.result;

  if (r.actualBrewTime) {
    $('#inp-result-brewtime-value').value = r.actualBrewTime.value || '';
    $('#inp-result-brewtime-unit').value = r.actualBrewTime.unit || 's';
  } else {
    $('#inp-result-brewtime-value').value = '';
    $('#inp-result-brewtime-unit').value = 's';
  }

  if (r.finalYield) {
    $('#inp-result-yield-value').value = r.finalYield.value || '';
    $('#inp-result-yield-unit').value = r.finalYield.unit || 'g';
  } else {
    $('#inp-result-yield-value').value = '';
    $('#inp-result-yield-unit').value = 'g';
  }

  $('#inp-result-tds').value = r.measuredTDS != null ? r.measuredTDS : '';
  $('#inp-result-extraction').value = r.extractionYield != null ? r.extractionYield : '';
  $('#inp-result-rating').value = r.rating != null ? r.rating : '';

  var dims = [
    'aroma',
    'flavor',
    'aftertaste',
    'acidity',
    'body',
    'balance',
    'sweetness',
    'cleanCup',
    'overall',
  ];
  for (var i = 0; i < dims.length; i++) {
    var d = r[dims[i]];
    var ratingEl = $('#inp-result-' + dims[i] + '-rating');
    var notesEl = $('#inp-result-' + dims[i] + '-notes');
    if (ratingEl) ratingEl.value = d && d.rating != null ? d.rating : '';
    if (notesEl) notesEl.value = d && d.notes ? d.notes : '';
  }

  $('#inp-result-tastingNotes').value = r.tastingNotes.join(', ');
  $('#inp-result-improvements').value = r.improvements;
}

/* ================================================================
 * 表单同步 — 从 DOM 收集回 state
 * ================================================================ */

function collectFormToState() {
  var s = editorState;

  s.meta.name = $('#inp-meta-name').value.trim();
  s.meta.version = $('#inp-meta-version').value.trim() || '1.0.0';
  s.meta.author = $('#inp-meta-author').value.trim();
  s.meta.description = $('#inp-meta-desc').value.trim();
  s.meta.license = $('#inp-meta-license').value.trim() || 'CC0';
  s.meta.tags = $('#inp-meta-tags')
    .value.split(',')
    .map(function (t) {
      return t.trim();
    })
    .filter(Boolean);
  s.meta.source = $('#inp-meta-source').value.trim();

  s.coffee.name = $('#inp-coffee-name').value.trim();
  s.coffee.producer = $('#inp-coffee-producer').value.trim();
  s.coffee.origin.country = $('#inp-coffee-country').value.trim();
  s.coffee.origin.region = $('#inp-coffee-region').value.trim();
  s.coffee.origin.farm = $('#inp-coffee-farm').value.trim();
  s.coffee.origin.altitude = $('#inp-coffee-altitude').value.trim();
  s.coffee.variety = $('#inp-coffee-variety').value.trim();
  s.coffee.process = $('#inp-coffee-process').value.trim();
  s.coffee.roastLevel = $('#inp-coffee-roastLevel').value;
  s.coffee.roastDate = $('#inp-coffee-roastDate').value;
  s.coffee.roaster = $('#inp-coffee-roaster').value.trim();
  s.coffee.flavorNotes = $('#inp-coffee-flavorNotes')
    .value.split(',')
    .map(function (t) {
      return t.trim();
    })
    .filter(Boolean);

  s.equipment.brewer = $('#inp-equip-brewer').value.trim();
  s.equipment.brewerMaterial = $('#inp-equip-material').value.trim();
  s.equipment.brewerSize = $('#inp-equip-size').value.trim();
  s.equipment.filter = $('#inp-equip-filter').value.trim();
  s.equipment.grinder = $('#inp-equip-grinder').value.trim();
  s.equipment.kettle = $('#inp-equip-kettle').value.trim();
  s.equipment.scale = $('#inp-equip-scale').value.trim();
  s.equipment.server = $('#inp-equip-server').value.trim();

  s.recipe.dose.value = parseFloat($('#inp-recipe-dose').value) || 0;
  s.recipe.waterAmount.value = parseFloat($('#inp-recipe-waterAmount').value) || 0;
  s.recipe.ratio = $('#inp-recipe-ratio').value.trim() || '1:15';
  s.recipe.grindSize.value = parseFloat($('#inp-recipe-grindValue').value) || 0;
  s.recipe.grindSize.unit = $('#inp-recipe-grindUnit').value.trim();
  s.recipe.grindSize.description = $('#inp-recipe-grindDesc').value.trim();
  s.recipe.waterTemperature.value = parseFloat($('#inp-recipe-waterTemp').value) || 0;
  s.recipe.waterType = $('#inp-recipe-waterType').value.trim();
  s.recipe.waterTDS = parseFloat($('#inp-recipe-waterTDS').value) || null;
  s.recipe.brewTime.value = parseFloat($('#inp-recipe-brewTime').value) || 0;
  s.recipe.bloomRatio = $('#inp-recipe-bloomRatio').value.trim() || '1:3';
  s.recipe.bloomTime.value = parseFloat($('#inp-recipe-bloomTime').value) || 0;
  s.recipe.targetTDS = parseFloat($('#inp-recipe-targetTDS').value) || null;
  s.recipe.targetExtraction = parseFloat($('#inp-recipe-targetExtraction').value) || null;
}

function collectResultToState() {
  var r = editorState.result;

  var btVal = parseFloat($('#inp-result-brewtime-value').value);
  if (!isNaN(btVal) && btVal > 0) {
    r.actualBrewTime = { value: btVal, unit: $('#inp-result-brewtime-unit').value };
  } else {
    r.actualBrewTime = null;
  }

  var yVal = parseFloat($('#inp-result-yield-value').value);
  if (!isNaN(yVal) && yVal > 0) {
    r.finalYield = { value: yVal, unit: $('#inp-result-yield-unit').value };
  } else {
    r.finalYield = null;
  }

  r.measuredTDS = parseFloat($('#inp-result-tds').value) || null;
  r.extractionYield = parseFloat($('#inp-result-extraction').value) || null;

  var ratVal = parseFloat($('#inp-result-rating').value);
  r.rating = !isNaN(ratVal) ? ratVal : null;

  var dims = [
    'aroma',
    'flavor',
    'aftertaste',
    'acidity',
    'body',
    'balance',
    'sweetness',
    'cleanCup',
    'overall',
  ];
  for (var i = 0; i < dims.length; i++) {
    var ratingEl = $('#inp-result-' + dims[i] + '-rating');
    var notesEl = $('#inp-result-' + dims[i] + '-notes');
    var dimRating = ratingEl ? parseFloat(ratingEl.value) : NaN;
    var dimNotes = notesEl ? notesEl.value.trim() : '';
    r[dims[i]] = {
      rating: !isNaN(dimRating) ? dimRating : null,
      notes: dimNotes,
    };
  }

  r.tastingNotes = $('#inp-result-tastingNotes')
    .value.split(',')
    .map(function (t) {
      return t.trim();
    })
    .filter(Boolean);
  r.improvements = $('#inp-result-improvements').value.trim();
}

/* ================================================================
 * 全局表单变更监听
 * ================================================================ */

function bindFormEvents() {
  $('#forge-main').addEventListener('input', function () {
    collectFormToState();
    collectResultToState();
    var errors = validateState();
    updateValidationBar(errors);
  });
}
/* ================================================================
 * 实时校验
 * ================================================================ */

/**
 * 表单校验状态机，检查 .brew 方案中各必填字段的完整性
 * @returns {Array<{field: string, label: string, message: string}>} 校验错误列表，空数组表示通过
 */
function validateState() {
  var errors = [];
  var s = editorState;

  if (!s.meta.name || !s.meta.name.trim()) {
    errors.push({
      field: 'meta.name',
      label: BrewCodeI18n.t('validation.fieldName'),
      message: BrewCodeI18n.t('validation.requiredField') + BrewCodeI18n.t('validation.fieldName'),
    });
  }
  if (!s.coffee.name || !s.coffee.name.trim()) {
    errors.push({
      field: 'coffee.name',
      label: BrewCodeI18n.t('validation.fieldCoffeeName'),
      message:
        BrewCodeI18n.t('validation.requiredField') + BrewCodeI18n.t('validation.fieldCoffeeName'),
    });
  }
  if (!s.equipment.brewer || !s.equipment.brewer.trim()) {
    errors.push({
      field: 'equipment.brewer',
      label: BrewCodeI18n.t('validation.fieldBrewer'),
      message:
        BrewCodeI18n.t('validation.requiredField') + BrewCodeI18n.t('validation.fieldBrewer'),
    });
  }

  var dose = s.recipe.dose;
  if (dose.value == null || dose.value === '' || isNaN(dose.value)) {
    errors.push({
      field: 'recipe.dose.value',
      label: BrewCodeI18n.t('validation.fieldDose'),
      message: BrewCodeI18n.t('validation.requiredField') + BrewCodeI18n.t('validation.fieldDose'),
    });
  } else {
    var dv = Number(dose.value);
    if (dv < 1 || dv > 100) {
      errors.push({
        field: 'recipe.dose.value',
        label: BrewCodeI18n.t('validation.fieldDose'),
        message: BrewCodeI18n.t('validation.errDoseRange') + dv,
      });
    }
  }

  var water = s.recipe.waterAmount;
  if (water.value == null || water.value === '' || isNaN(water.value)) {
    errors.push({
      field: 'recipe.waterAmount.value',
      label: BrewCodeI18n.t('validation.fieldWater'),
      message: BrewCodeI18n.t('validation.requiredField') + BrewCodeI18n.t('validation.fieldWater'),
    });
  } else {
    var wv = Number(water.value);
    if (wv < 1 || wv > 2000) {
      errors.push({
        field: 'recipe.waterAmount.value',
        label: BrewCodeI18n.t('validation.fieldWater'),
        message: BrewCodeI18n.t('validation.errWaterRange') + wv,
      });
    }
  }

  var temp = s.recipe.waterTemperature;
  if (temp.value == null || temp.value === '' || isNaN(temp.value)) {
    errors.push({
      field: 'recipe.waterTemperature.value',
      label: BrewCodeI18n.t('validation.fieldTemp'),
      message: BrewCodeI18n.t('validation.requiredField') + BrewCodeI18n.t('validation.fieldTemp'),
    });
  } else {
    var tv = Number(temp.value);
    if (tv < 0 || tv > 100) {
      errors.push({
        field: 'recipe.waterTemperature.value',
        label: BrewCodeI18n.t('validation.fieldTemp'),
        message: BrewCodeI18n.t('validation.errTempRange') + tv,
      });
    }
  }

  return errors;
}

function updateValidationBar(errors) {
  var bar = $('#validation-bar');
  if (!bar) return;

  bar.classList.remove('valid', 'warning');

  if (!errors || errors.length === 0) {
    bar.classList.add('valid');
    bar.classList.add('collapsed');
    bar.querySelector('.val-icon').textContent = '✅';
    bar.querySelector('.val-text').textContent = BrewCodeI18n.t('validation.pass');
    bar.querySelector('.val-details').innerHTML = '';
  } else {
    bar.classList.add('warning');
    bar.classList.remove('collapsed');
    bar.querySelector('.val-icon').textContent = '⚠️';
    bar.querySelector('.val-text').textContent =
      errors.length + BrewCodeI18n.t('validation.required');

    var html = '';
    for (var i = 0; i < errors.length; i++) {
      html +=
        '<div class="val-error-item"><span class="val-error-field">' +
        errors[i].label +
        '</span><span class="val-error-msg">' +
        errors[i].message +
        '</span></div>';
    }
    bar.querySelector('.val-details').innerHTML = html;
  }
}

/* ================================================================
 * Schema 校验 — AJV 编译 + 辅助函数
 * ================================================================ */

function initSchemaValidator() {
  import('ajv')
    .then(function (mod) {
      var Ajv = mod.default;
      return fetch('./brew.schema.json').then(function (res) {
        return res.json().then(function (schema) {
          var ajv = new Ajv({ allErrors: true, strict: false });
          brewSchemaValidator = ajv.compile(schema);
        });
      });
    })
    .catch(function (e) {
      console.warn('BrewForge: Schema 加载失败，代码模式仅做 JSON 语法检查', e);
    });
}

function findErrorLine(text, err) {
  var lines = text.split('\n');
  var ip = err.instancePath || '';
  var kw = err.keyword;
  var parts = ip.split('/').filter(Boolean);

  if (kw === 'required' && err.params && err.params.missingProperty) {
    var missing = err.params.missingProperty;
    if (parts.length === 1) {
      var parentKey = parts[0];
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('"' + parentKey + '"') !== -1) return i + 1;
      }
    }
    // 试图在父对象内找相邻字段定位
    var re = new RegExp('"' + missing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"');
    for (var j = 0; j < lines.length; j++) {
      if (re.test(lines[j])) return j + 1;
    }
  }

  if (parts.length > 0) {
    var k = parts[parts.length - 1];
    var re2 = new RegExp('"' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"\\s*:');
    for (var m = 0; m < lines.length; m++) {
      if (re2.test(lines[m])) return m + 1;
    }
    if (parts.length > 1) {
      k = parts[parts.length - 2];
      re2 = new RegExp('"' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"\\s*:');
      for (var n = 0; n < lines.length; n++) {
        if (re2.test(lines[n])) return n + 1;
      }
    }
  }

  return 1;
}

function formatAJVError(err) {
  var path = err.instancePath || '(根)';
  switch (err.keyword) {
    case 'required':
      return path + ' 缺少必填字段: ' + err.params.missingProperty;
    case 'type':
      return path + ' 类型应为 ' + err.params.type;
    case 'enum':
      return path + ' 不在允许值范围内';
    case 'minLength':
      return path + ' 最少 ' + err.params.limit + ' 个字符';
    case 'maxLength':
      return path + ' 最多 ' + err.params.limit + ' 个字符';
    case 'minItems':
      return path + ' 至少需要 ' + err.params.limit + ' 个元素';
    case 'additionalProperties':
      return path + ' 不允许的字段: ' + err.params.additionalProperty;
    case 'pattern':
      return path + ' 格式应为 ' + err.params.pattern;
    case 'minimum':
      return path + ' 最小值为 ' + err.params.limit;
    case 'maximum':
      return path + ' 最大值为 ' + err.params.limit;
    default:
      return path + ' ' + err.message;
  }
}

/* ================================================================
 * CodeMirror 6 + Lint 集成
 * ================================================================ */

function createCodeLintSource() {
  return function (view) {
    var diagnostics = [];
    var text = view.state.doc.toString();

    if (!text.trim()) {
      diagnostics.push({
        from: 0,
        to: view.state.doc.length,
        severity: 'error',
        message: 'JSON 不能为空',
      });
      return diagnostics;
    }

    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      var pos = 0;
      var match = e.message.match(/position\s+(\d+)/i);
      if (match) pos = parseInt(match[1], 10);
      if (pos < view.state.doc.length) {
        diagnostics.push({
          from: pos,
          to: Math.min(pos + 1, view.state.doc.length),
          severity: 'error',
          message: 'JSON 语法错误: ' + e.message,
        });
      } else {
        diagnostics.push({
          from: 0,
          to: view.state.doc.length,
          severity: 'error',
          message: 'JSON 语法错误: ' + e.message,
        });
      }
      return diagnostics;
    }

    if (!brewSchemaValidator) return diagnostics;

    brewSchemaValidator(data);
    var errs = brewSchemaValidator.errors;
    if (errs && errs.length) {
      for (var i = 0; i < errs.length; i++) {
        var errLine = findErrorLine(text, errs[i]);
        var docLine = view.state.doc.line(errLine);
        diagnostics.push({
          from: docLine.from,
          to: docLine.to,
          severity: 'error',
          message: formatAJVError(errs[i]),
        });
      }
    }

    return diagnostics;
  };
}

function initCodeMirrorEditor(container, initialContent) {
  if (cmView) {
    cmView.destroy();
    cmView = null;
  }

  return Promise.all([
    import('codemirror'),
    import('@codemirror/lang-json'),
    import('@codemirror/lint'),
  ]).then(function (mods) {
    var cm = mods[0];
    var jsonMod = mods[1];
    var lintMod = mods[2];

    cmView = new cm.EditorView({
      doc: initialContent,
      extensions: [
        cm.basicSetup,
        jsonMod.json(),
        lintMod.lintGutter(),
        lintMod.linter(createCodeLintSource(), { delay: 400 }),
        cm.EditorView.theme({
          '&': { backgroundColor: '#16162a', color: '#e0d8c8' },
          '.cm-gutters': {
            backgroundColor: '#1a1a2e',
            color: '#8888aa',
            border: 'none',
          },
          '.cm-activeLineGutter': { backgroundColor: '#222244' },
          '.cm-activeLine': { backgroundColor: 'rgba(232,168,80,0.05)' },
          '.cm-cursor': { borderLeftColor: '#e8a850' },
          '.cm-selectionBackground': { backgroundColor: 'rgba(232,168,80,0.2)' },
          '.cm-matchingBracket': {
            backgroundColor: 'rgba(232,168,80,0.15)',
            outline: '1px solid rgba(232,168,80,0.3)',
          },
          '.cm-lintRange-error': {
            backgroundImage: 'none',
            textDecoration: 'underline wavy #d04040',
          },
          '.cm-tooltip': {
            backgroundColor: '#222244',
            border: '1px solid #444466',
            color: '#e0e0e8',
          },
          '.cm-tooltip-lint': { padding: '6px 10px' },
        }),
        cm.EditorView.updateListener.of(function (update) {
          if (update.docChanged) {
            updateValidationBarFromCode();
          }
        }),
      ],
      parent: container,
    });

    return cmView;
  });
}

function getCodeMirrorContent() {
  return cmView ? cmView.state.doc.toString() : '';
}

function destroyCodeMirror() {
  if (cmView) {
    cmView.destroy();
    cmView = null;
  }
}

function updateValidationBarFromCode() {
  if (!codeMode) return;

  var text = getCodeMirrorContent();
  var errors = [];

  try {
    JSON.parse(text);
  } catch (e) {
    errors.push({
      field: 'json-syntax',
      label: BrewCodeI18n.t('validation.jsonSyntax'),
      message: e.message,
    });
    updateValidationBar(errors);
    return;
  }

  if (brewSchemaValidator) {
    var data = JSON.parse(text);
    brewSchemaValidator(data);
    var errs = brewSchemaValidator.errors;
    if (errs && errs.length) {
      for (var i = 0; i < errs.length; i++) {
        errors.push({
          field: errs[i].instancePath || '/',
          label: errs[i].instancePath || 'Schema',
          message: formatAJVError(errs[i]),
        });
      }
    }
  }

  updateValidationBar(errors);
}
/* ================================================================
 * 步骤管理器 — 渲染 / 增删 / 排序 / 模态框
 * ================================================================ */

var stepEditIndex = -1;

function renderStepList() {
  var list = $('#step-list');
  var steps = editorState.steps;

  if (!steps.length) {
    list.innerHTML = '<p class="step-empty">' + BrewCodeI18n.t('step.noSteps') + '</p>';
    return;
  }

  var showDelete = steps.length > 1;
  var html = '';
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i];
    var metaParts = [];

    if (s.duration && s.duration.value) {
      metaParts.push(
        '<span class="step-meta-tag">' + s.duration.value + s.duration.unit + '</span>'
      );
    }
    if (s.waterAmount && s.waterAmount.value) {
      metaParts.push(
        '<span class="step-meta-tag">' +
          BrewCodeI18n.t('step.pourWater') +
          s.waterAmount.value +
          s.waterAmount.unit +
          '</span>'
      );
    }

    html +=
      '<div class="step-card">' +
      '<div class="step-card-header">' +
      '<span class="step-order">' +
      s.order +
      '</span>' +
      '<span class="step-action-badge badge-' +
      (s.action || 'note') +
      '">' +
      actionLabel(s.action) +
      '</span>' +
      '<div class="step-card-actions">' +
      '<button class="btn-icon-sm" data-step="' +
      i +
      '" data-action="move-up" title="' +
      BrewCodeI18n.t('step.moveUp') +
      '" aria-label="' +
      BrewCodeI18n.t('step.moveUp') +
      '">&#9650;</button>' +
      '<button class="btn-icon-sm" data-step="' +
      i +
      '" data-action="move-down" title="' +
      BrewCodeI18n.t('step.moveDown') +
      '" aria-label="' +
      BrewCodeI18n.t('step.moveDown') +
      '">&#9660;</button>' +
      '<button class="btn-icon-sm" data-step="' +
      i +
      '" data-action="edit" title="' +
      BrewCodeI18n.t('step.edit') +
      '" aria-label="' +
      BrewCodeI18n.t('step.edit') +
      '">&#9998;</button>' +
      (showDelete
        ? '<button class="btn-icon-sm btn-icon-danger" data-step="' +
          i +
          '" data-action="delete" title="' +
          BrewCodeI18n.t('step.delete') +
          '" aria-label="' +
          BrewCodeI18n.t('step.delete') +
          '">&#10005;</button>'
        : '') +
      '</div>' +
      '</div>' +
      '<p class="step-desc">' +
      escapeHTML(s.description || '') +
      '</p>' +
      (metaParts.length ? '<div class="step-meta">' + metaParts.join('') + '</div>' : '') +
      '</div>';
  }

  list.innerHTML = html;
}

function actionLabel(action) {
  return BrewCodeI18n.t('action.' + (action || '')) || action || '';
}

function escapeHTML(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function openStepModal(index) {
  stepEditIndex = index;
  $('#step-modal').classList.remove('hidden');

  if (index >= 0) {
    $('#modal-title').textContent =
      BrewCodeI18n.t('step.editStep') + editorState.steps[index].order;
    syncStepFormFromStep(editorState.steps[index]);
  } else {
    $('#modal-title').textContent = BrewCodeI18n.t('step.addStepTitle');
    clearStepForm();
  }
}

function closeStepModal() {
  $('#step-modal').classList.add('hidden');
  stepEditIndex = -1;
}

function clearStepForm() {
  $('#inp-step-action').value = 'bloom';
  $('#inp-step-description').value = '';
  $('#inp-step-duration-value').value = '30';
  $('#inp-step-duration-unit').value = 's';
  $('#inp-step-water-value').value = '';
  $('#inp-step-water-unit').value = 'ml';
  $('#inp-step-cumulative-value').value = '';
  $('#inp-step-cumulative-unit').value = 'ml';
  $('#inp-step-targetWeight-value').value = '';
  $('#inp-step-pourStyle').value = '';
  $('#inp-step-pourIntensity').value = '';
  $('#inp-step-temp-value').value = '';
  $('#inp-step-temp-unit').value = '°C';
}

function syncStepFormFromStep(step) {
  $('#inp-step-action').value = step.action || 'pour';
  $('#inp-step-description').value = step.description || '';

  if (step.duration) {
    $('#inp-step-duration-value').value = step.duration.value || '';
    $('#inp-step-duration-unit').value = step.duration.unit || 's';
  } else {
    $('#inp-step-duration-value').value = '';
    $('#inp-step-duration-unit').value = 's';
  }

  if (step.waterAmount) {
    $('#inp-step-water-value').value = step.waterAmount.value || '';
    $('#inp-step-water-unit').value = step.waterAmount.unit || 'ml';
  } else {
    $('#inp-step-water-value').value = '';
    $('#inp-step-water-unit').value = 'ml';
  }

  if (step.cumulativeWater) {
    $('#inp-step-cumulative-value').value = step.cumulativeWater.value || '';
    $('#inp-step-cumulative-unit').value = step.cumulativeWater.unit || 'ml';
  } else {
    $('#inp-step-cumulative-value').value = '';
    $('#inp-step-cumulative-unit').value = 'ml';
  }

  if (step.targetWeight) {
    $('#inp-step-targetWeight-value').value = step.targetWeight.value || '';
  } else {
    $('#inp-step-targetWeight-value').value = '';
  }

  $('#inp-step-pourStyle').value = step.pourStyle || '';
  $('#inp-step-pourIntensity').value = step.pourIntensity || '';

  if (step.temperature) {
    $('#inp-step-temp-value').value = step.temperature.value || '';
    $('#inp-step-temp-unit').value = step.temperature.unit || '°C';
  } else {
    $('#inp-step-temp-value').value = '';
    $('#inp-step-temp-unit').value = '°C';
  }
}

function collectStepFormToObject() {
  var step = {};

  step.action = $('#inp-step-action').value;
  step.description = $('#inp-step-description').value.trim();

  var durVal = parseFloat($('#inp-step-duration-value').value);
  if (!isNaN(durVal) && durVal > 0) {
    step.duration = { value: durVal, unit: $('#inp-step-duration-unit').value };
  }

  var watVal = parseFloat($('#inp-step-water-value').value);
  if (!isNaN(watVal) && watVal > 0) {
    step.waterAmount = { value: watVal, unit: $('#inp-step-water-unit').value };
  }

  var cumVal = parseFloat($('#inp-step-cumulative-value').value);
  if (!isNaN(cumVal) && cumVal > 0) {
    step.cumulativeWater = { value: cumVal, unit: $('#inp-step-cumulative-unit').value };
  }

  var twVal = parseFloat($('#inp-step-targetWeight-value').value);
  if (!isNaN(twVal) && twVal > 0) {
    step.targetWeight = { value: twVal, unit: 'g' };
  }

  step.pourStyle = $('#inp-step-pourStyle').value.trim();
  step.pourIntensity = $('#inp-step-pourIntensity').value.trim();

  var tmpVal = parseFloat($('#inp-step-temp-value').value);
  if (!isNaN(tmpVal) && tmpVal > 0) {
    step.temperature = { value: tmpVal, unit: $('#inp-step-temp-unit').value };
  }

  return step;
}

function saveStepFromModal() {
  var step = collectStepFormToObject();
  if (!step.description && !step.duration && !step.waterAmount && !step.cumulativeWater) {
    return;
  }

  if (stepEditIndex >= 0) {
    step.order = editorState.steps[stepEditIndex].order;
    editorState.steps[stepEditIndex] = step;
  } else {
    step.order = editorState.steps.length + 1;
    editorState.steps.push(step);
  }

  closeStepModal();
  renderStepList();
}

function deleteStep(index) {
  editorState.steps.splice(index, 1);
  renumberSteps();
  renderStepList();
}

function moveStep(index, direction) {
  var steps = editorState.steps;
  var target = index + direction;
  if (target < 0 || target >= steps.length) return;

  var tmp = steps[index];
  steps[index] = steps[target];
  steps[target] = tmp;
  renumberSteps();
  renderStepList();
}

function renumberSteps() {
  for (var i = 0; i < editorState.steps.length; i++) {
    editorState.steps[i].order = i + 1;
  }
}

function handleStepListClick(e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;

  var index = parseInt(btn.getAttribute('data-step'), 10);
  var action = btn.getAttribute('data-action');

  switch (action) {
    case 'edit':
      openStepModal(index);
      break;
    case 'delete':
      deleteStep(index);
      break;
    case 'move-up':
      moveStep(index, -1);
      break;
    case 'move-down':
      moveStep(index, 1);
      break;
  }
}

function bindStepEvents() {
  $('#btn-add-step').addEventListener('click', function () {
    openStepModal(-1);
  });

  $('#btn-save-step').addEventListener('click', function () {
    saveStepFromModal();
  });

  $('#btn-cancel-step').addEventListener('click', function () {
    closeStepModal();
  });

  $('#btn-close-modal').addEventListener('click', function () {
    closeStepModal();
  });

  $('#step-modal').addEventListener('click', function (e) {
    if (e.target === $('#step-modal')) {
      closeStepModal();
    }
  });

  $('#step-list').addEventListener('click', handleStepListClick);
}

/* ================================================================
 * .brew 文件导出
 * ================================================================ */

/**
 * 从编辑器状态构建 .brew JSON 结构，包含 meta / coffee / equipment / recipe / steps / result 六个顶层字段
 * @returns {Object} 符合 BrewCode Schema 的完整 .brew JSON 对象
 */
function buildBrewJSON() {
  var out = {};

  out.meta = {
    name: editorState.meta.name,
    version: editorState.meta.version,
    brewCodeVersion: editorState.meta.brewCodeVersion,
    author: editorState.meta.author || undefined,
    description: editorState.meta.description || undefined,
    license: editorState.meta.license,
    tags: editorState.meta.tags.length ? editorState.meta.tags : undefined,
    createdAt: editorState.meta.createdAt,
    source: editorState.meta.source || undefined,
    brewId: editorState.meta.brewId || undefined,
  };

  out.coffee = {
    name: editorState.coffee.name,
    producer: editorState.coffee.producer || undefined,
    origin: {
      country: editorState.coffee.origin.country || undefined,
      region: editorState.coffee.origin.region || undefined,
      farm: editorState.coffee.origin.farm || undefined,
      altitude: editorState.coffee.origin.altitude || undefined,
    },
    variety: editorState.coffee.variety || undefined,
    process: editorState.coffee.process || undefined,
    roastLevel: editorState.coffee.roastLevel,
    roastDate: editorState.coffee.roastDate || undefined,
    roaster: editorState.coffee.roaster || undefined,
    flavorNotes: editorState.coffee.flavorNotes.length ? editorState.coffee.flavorNotes : undefined,
  };

  var eq = editorState.equipment;
  out.equipment = {};
  if (eq.brewer) out.equipment.brewer = eq.brewer;
  if (eq.brewerMaterial) out.equipment.brewerMaterial = eq.brewerMaterial;
  if (eq.brewerSize) out.equipment.brewerSize = eq.brewerSize;
  if (eq.filter) out.equipment.filter = eq.filter;
  if (eq.grinder) out.equipment.grinder = eq.grinder;
  if (eq.kettle) out.equipment.kettle = eq.kettle;
  if (eq.scale) out.equipment.scale = eq.scale;
  if (eq.server) out.equipment.server = eq.server;
  if (!Object.keys(out.equipment).length) delete out.equipment;

  out.recipe = {
    dose: { value: editorState.recipe.dose.value, unit: 'g' },
    waterAmount: { value: editorState.recipe.waterAmount.value, unit: 'ml' },
    ratio: editorState.recipe.ratio,
    grindSize: {
      value: editorState.recipe.grindSize.value,
      unit: editorState.recipe.grindSize.unit || undefined,
      description: editorState.recipe.grindSize.description || undefined,
    },
    waterTemperature: {
      value: editorState.recipe.waterTemperature.value,
      unit: '°C',
    },
    waterType: editorState.recipe.waterType || undefined,
    waterTDS: editorState.recipe.waterTDS,
  };

  if (editorState.recipe.brewTime.value) {
    out.recipe.brewTime = { value: editorState.recipe.brewTime.value, unit: 's' };
  }
  if (editorState.recipe.bloomRatio) {
    out.recipe.bloomRatio = editorState.recipe.bloomRatio;
  }
  if (editorState.recipe.bloomTime.value) {
    out.recipe.bloomTime = { value: editorState.recipe.bloomTime.value, unit: 's' };
  }
  if (editorState.recipe.targetTDS != null) {
    out.recipe.targetTDS = editorState.recipe.targetTDS;
  }
  if (editorState.recipe.targetExtraction != null) {
    out.recipe.targetExtraction = editorState.recipe.targetExtraction;
  }

  out.steps = editorState.steps.map(function (s) {
    var step = { order: s.order, action: s.action };
    if (s.description) step.description = s.description;
    if (s.duration && s.duration.value) step.duration = s.duration;
    if (s.waterAmount && s.waterAmount.value) step.waterAmount = s.waterAmount;
    if (s.cumulativeWater && s.cumulativeWater.value) step.cumulativeWater = s.cumulativeWater;
    if (s.targetWeight && s.targetWeight.value) step.targetWeight = s.targetWeight;
    if (s.pourStyle) step.pourStyle = s.pourStyle;
    if (s.pourIntensity) step.pourIntensity = s.pourIntensity;
    if (s.temperature && s.temperature.value) step.temperature = s.temperature;
    return step;
  });

  var r = editorState.result;
  var hasResult = false;
  out.result = {};

  if (r.actualBrewTime && r.actualBrewTime.value) {
    out.result.actualBrewTime = r.actualBrewTime;
    hasResult = true;
  }
  if (r.finalYield && r.finalYield.value) {
    out.result.finalYield = r.finalYield;
    hasResult = true;
  }
  if (r.measuredTDS != null) {
    out.result.measuredTDS = r.measuredTDS;
    hasResult = true;
  }
  if (r.extractionYield != null) {
    out.result.extractionYield = r.extractionYield;
    hasResult = true;
  }
  if (r.rating != null) {
    out.result.rating = r.rating;
    hasResult = true;
  }

  var dims = [
    'aroma',
    'flavor',
    'aftertaste',
    'acidity',
    'body',
    'balance',
    'sweetness',
    'cleanCup',
    'overall',
  ];
  for (var i = 0; i < dims.length; i++) {
    var d = r[dims[i]];
    if (d && (d.rating != null || d.notes)) {
      out.result[dims[i]] = {};
      if (d.rating != null) out.result[dims[i]].rating = d.rating;
      if (d.notes) out.result[dims[i]].notes = d.notes;
      hasResult = true;
    }
  }

  if (r.tastingNotes.length) {
    out.result.tastingNotes = r.tastingNotes;
    hasResult = true;
  }
  if (r.improvements) {
    out.result.improvements = r.improvements;
    hasResult = true;
  }

  if (!hasResult) delete out.result;

  return JSON.parse(JSON.stringify(out));
}

function exportBrewFile() {
  collectFormToState();
  collectResultToState();

  var brewJSON = buildBrewJSON();
  var jsonStr = JSON.stringify(brewJSON, null, 2);
  var name = editorState.meta.name || 'untitled';
  var filename = name + '.brew.json';

  var blob = new Blob([jsonStr], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  var btn = $('#btn-export');
  var originalText = btn.textContent;
  btn.textContent = BrewCodeI18n.t('common.exported');
  btn.classList.add('btn-success');
  setTimeout(function () {
    btn.textContent = originalText;
    btn.classList.remove('btn-success');
  }, 2000);
}

/* ================================================================
 * 提交到 BrewRepo — GitHub PR 一键创建
 * ================================================================ */

function slugify(text) {
  return text.replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
}

function submitToBrewRepo() {
  collectFormToState();
  collectResultToState();

  var brew = buildBrewJSON();
  var jsonStr = JSON.stringify(brew, null, 2);
  var name = editorState.meta.name || 'untitled';
  var slug = slugify(name);
  var filePath = 'seeds/community/' + slug + '.brew.json';

  var descLines = [];
  descLines.push('## 方案信息');
  descLines.push('');
  descLines.push('**方案名称：** ' + (editorState.meta.name || '未命名'));
  if (editorState.meta.description) {
    descLines.push('**方案描述：** ' + editorState.meta.description);
  }
  descLines.push('');

  descLines.push('## 咖啡豆信息');
  descLines.push('');
  if (editorState.coffee.name) {
    descLines.push('- **咖啡豆：** ' + editorState.coffee.name);
  }
  if (editorState.coffee.variety) {
    descLines.push('- **豆种：** ' + editorState.coffee.variety);
  }
  if (editorState.coffee.origin.country) {
    descLines.push('- **产国：** ' + editorState.coffee.origin.country);
  }
  if (editorState.coffee.origin.region) {
    descLines.push('- **产区：** ' + editorState.coffee.origin.region);
  }
  if (editorState.coffee.origin.altitude) {
    descLines.push('- **海拔：** ' + editorState.coffee.origin.altitude);
  }
  if (editorState.coffee.process) {
    descLines.push('- **处理法：** ' + editorState.coffee.process);
  }
  if (editorState.coffee.roastLevel) {
    descLines.push('- **烘焙度：** ' + editorState.coffee.roastLevel);
  }
  descLines.push('');

  descLines.push('## 器具信息');
  descLines.push('');
  if (editorState.equipment.brewer) {
    descLines.push('- **冲煮器具：** ' + editorState.equipment.brewer);
  }
  if (editorState.equipment.grinder) {
    descLines.push('- **磨豆机：** ' + editorState.equipment.grinder);
  }
  if (editorState.equipment.kettle) {
    descLines.push('- **手冲壶：** ' + editorState.equipment.kettle);
  }
  if (editorState.equipment.scale) {
    descLines.push('- **电子秤：** ' + editorState.equipment.scale);
  }
  descLines.push('');

  descLines.push('## 冲煮参数');
  descLines.push('');
  var dose = editorState.recipe.dose;
  if (dose && dose.value) {
    descLines.push('- **粉量：** ' + dose.value + 'g');
  }
  var water = editorState.recipe.waterAmount;
  if (water && water.value) {
    descLines.push('- **总注水量：** ' + water.value + 'ml');
  }
  if (editorState.recipe.ratio) {
    descLines.push('- **粉水比：** ' + editorState.recipe.ratio);
  }
  var temp = editorState.recipe.waterTemperature;
  if (temp && temp.value) {
    descLines.push('- **水温：** ' + temp.value + '°C');
  }
  descLines.push('');

  descLines.push('## 作者');
  descLines.push('');
  descLines.push(editorState.meta.author || '未署名');

  var prTitle = '[方案提交] ' + name;
  var message = prTitle + '\n\n' + descLines.join('\n');

  var encodedValue = encodeURIComponent(jsonStr);
  var encodedMessage = encodeURIComponent(message);
  var encodedFilename = encodeURIComponent(filePath);

  var url =
    'https://github.com/brewcode-os/brewcode-os/new/main' +
    '?filename=' +
    encodedFilename +
    '&value=' +
    encodedValue +
    '&message=' +
    encodedMessage;

  window.open(url, '_blank');
}

/* ================================================================
 * JSON → State 回填
 * ================================================================ */

/**
 * 解析 .brew JSON 字符串，将数据回填到编辑器状态中，支持表单模式和代码模式切换
 * @param {string} jsonStr — .brew 文件的 JSON 字符串
 * @returns {void}
 */
function loadBrewJSON(jsonStr) {
  var data = JSON.parse(jsonStr);

  if (data.meta) {
    editorState.meta.name = data.meta.name || '';
    editorState.meta.version = data.meta.version || '1.0.0';
    editorState.meta.brewCodeVersion = data.meta.brewCodeVersion || '1.0';
    editorState.meta.author = data.meta.author || '';
    editorState.meta.description = data.meta.description || '';
    editorState.meta.license = data.meta.license || 'CC0';
    editorState.meta.tags = Array.isArray(data.meta.tags) ? data.meta.tags : [];
    editorState.meta.createdAt = data.meta.createdAt || new Date().toISOString();
    editorState.meta.source = data.meta.source || '';
  }

  if (data.coffee) {
    editorState.coffee.name = data.coffee.name || '';
    editorState.coffee.producer = data.coffee.producer || '';
    if (data.coffee.origin) {
      editorState.coffee.origin.country = data.coffee.origin.country || '';
      editorState.coffee.origin.region = data.coffee.origin.region || '';
      editorState.coffee.origin.farm = data.coffee.origin.farm || '';
      editorState.coffee.origin.altitude = data.coffee.origin.altitude || '';
    }
    editorState.coffee.variety = data.coffee.variety || '';
    editorState.coffee.process = data.coffee.process || '';
    editorState.coffee.roastLevel = data.coffee.roastLevel || '中烘';
    editorState.coffee.roastDate = data.coffee.roastDate || '';
    editorState.coffee.roaster = data.coffee.roaster || '';
    editorState.coffee.flavorNotes = Array.isArray(data.coffee.flavorNotes)
      ? data.coffee.flavorNotes
      : [];
  }

  if (data.equipment) {
    editorState.equipment.brewer = data.equipment.brewer || '';
    editorState.equipment.brewerMaterial = data.equipment.brewerMaterial || '';
    editorState.equipment.brewerSize = data.equipment.brewerSize || '';
    editorState.equipment.filter = data.equipment.filter || '';
    editorState.equipment.grinder = data.equipment.grinder || '';
    editorState.equipment.kettle = data.equipment.kettle || '';
    editorState.equipment.scale = data.equipment.scale || '';
    editorState.equipment.server = data.equipment.server || '';
  }

  if (data.recipe) {
    editorState.recipe.dose = data.recipe.dose || { value: 15, unit: 'g' };
    editorState.recipe.waterAmount = data.recipe.waterAmount || { value: 225, unit: 'ml' };
    editorState.recipe.ratio = data.recipe.ratio || '1:15';
    editorState.recipe.grindSize = data.recipe.grindSize || {
      value: 22,
      unit: 'C40 click',
      description: '',
    };
    editorState.recipe.waterTemperature = data.recipe.waterTemperature || {
      value: 93,
      unit: '°C',
    };
    editorState.recipe.waterType = data.recipe.waterType || '';
    editorState.recipe.waterTDS = data.recipe.waterTDS != null ? data.recipe.waterTDS : null;
    editorState.recipe.brewTime = data.recipe.brewTime || { value: 150, unit: 's' };
    editorState.recipe.bloomRatio = data.recipe.bloomRatio || '1:3';
    editorState.recipe.bloomTime = data.recipe.bloomTime || { value: 30, unit: 's' };
    editorState.recipe.targetTDS = data.recipe.targetTDS != null ? data.recipe.targetTDS : null;
    editorState.recipe.targetExtraction =
      data.recipe.targetExtraction != null ? data.recipe.targetExtraction : null;
  }

  editorState.steps = Array.isArray(data.steps) ? data.steps : [];

  if (data.result) {
    var r = editorState.result;
    r.actualBrewTime = data.result.actualBrewTime || null;
    r.finalYield = data.result.finalYield || null;
    r.measuredTDS = data.result.measuredTDS != null ? data.result.measuredTDS : null;
    r.extractionYield = data.result.extractionYield != null ? data.result.extractionYield : null;
    r.rating = data.result.rating != null ? data.result.rating : null;

    var dims = [
      'aroma',
      'flavor',
      'aftertaste',
      'acidity',
      'body',
      'balance',
      'sweetness',
      'cleanCup',
      'overall',
    ];
    for (var i = 0; i < dims.length; i++) {
      var d = data.result[dims[i]];
      r[dims[i]] = {
        rating: d && d.rating != null ? d.rating : null,
        notes: d && d.notes ? d.notes : '',
      };
    }

    r.tastingNotes = Array.isArray(data.result.tastingNotes) ? data.result.tastingNotes : [];
    r.improvements = data.result.improvements || '';
  }
}

/* ================================================================
 * 代码模式切换 — CodeMirror 6 + Schema 校验
 * ================================================================ */

var codeMode = false;

function toggleCodeMode() {
  if (!codeMode) {
    collectFormToState();
    collectResultToState();

    var jsonStr = JSON.stringify(buildBrewJSON(), null, 2);

    document.getElementById('forge-main').style.display = 'none';
    document.getElementById('forge-footer').style.display = 'none';

    var bar = document.getElementById('validation-bar');
    bar.style.display = '';

    var container = document.getElementById('code-editor-container');
    container.classList.remove('hidden');

    document.getElementById('code-error-bar').classList.add('hidden');

    initCodeMirrorEditor(document.getElementById('code-editor'), jsonStr).then(function () {
      updateValidationBarFromCode();
    });

    document.getElementById('btn-toggle-code').textContent = BrewCodeI18n.t('button.form');
    codeMode = true;
  } else {
    var content = getCodeMirrorContent();

    try {
      JSON.parse(content);
    } catch (e) {
      var errBar = document.getElementById('code-error-bar');
      errBar.textContent = BrewCodeI18n.t('validation.jsonSyntaxError') + e.message;
      errBar.classList.remove('hidden');
      return;
    }

    if (brewSchemaValidator) {
      var data = JSON.parse(content);
      var valid = brewSchemaValidator(data);
      if (!valid && brewSchemaValidator.errors && brewSchemaValidator.errors.length) {
        var errBar = document.getElementById('code-error-bar');
        errBar.textContent =
          BrewCodeI18n.t('validation.schemaFail') +
          brewSchemaValidator.errors.length +
          BrewCodeI18n.t('validation.schemaFailSuffix');
        errBar.classList.remove('hidden');
        return;
      }
    }

    try {
      loadBrewJSON(content);
    } catch (e) {
      var errBar2 = document.getElementById('code-error-bar');
      errBar2.textContent = BrewCodeI18n.t('validation.jsonSyntaxError') + e.message;
      errBar2.classList.remove('hidden');
      return;
    }

    destroyCodeMirror();
    document.getElementById('code-editor-container').classList.add('hidden');
    document.getElementById('forge-main').style.display = '';
    document.getElementById('forge-footer').style.display = '';

    syncFormFromState();
    syncResultFromState();
    renderStepList();

    var errors = validateState();
    updateValidationBar(errors);

    document.getElementById('btn-toggle-code').textContent = BrewCodeI18n.t('button.code');
    codeMode = false;
  }
}

/* ================================================================
 * AI 对话框 — 诊断 & 生成
 * ================================================================ */

var AI_API_BASE = 'https://api.礼字号.中国';
var AI_TIMEOUT_MS = 15000;

var LLM_PROVIDERS = {
  deepseek: { apiBase: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  openai: { apiBase: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo' },
  zhipu: { apiBase: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  moonshot: { apiBase: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
};

function loadLLMConfig() {
  try {
    var raw = localStorage.getItem('brewcode_user_llm_config');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveLLMConfig(config) {
  localStorage.setItem('brewcode_user_llm_config', JSON.stringify(config));
}

function clearLLMConfig() {
  localStorage.removeItem('brewcode_user_llm_config');
}

function injectAIStyles() {
  if (document.getElementById('ai-forge-styles')) return;

  var style = document.createElement('style');
  style.id = 'ai-forge-styles';
  style.textContent =
    '.ai-loading { text-align:center; padding:32px 16px; }' +
    '.ai-loading-spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:ai-spin 0.8s linear infinite; margin:0 auto 12px; }' +
    '@keyframes ai-spin { to { transform:rotate(360deg); } }' +
    '.ai-loading p { color:var(--text-muted); font-size:14px; margin:0; }' +
    '.ai-error { background:rgba(212,64,64,0.1); border:1px solid rgba(212,64,64,0.3); color:#d44040; padding:12px 16px; border-radius:6px; font-size:13px; margin-bottom:16px; }' +
    '.ai-result { margin-top:16px; }' +
    '.ai-result-title { font-size:14px; font-weight:600; color:var(--text); margin:0 0 12px; }' +
    '.ai-suggestion-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; }' +
    '.ai-suggestion-item { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:14px; }' +
    '.ai-suggestion-header { margin-bottom:8px; }' +
    '.ai-suggestion-field { font-weight:600; font-size:15px; color:var(--accent); }' +
    '.ai-suggestion-body { display:flex; flex-direction:column; gap:4px; margin-bottom:10px; font-size:13px; color:var(--text-muted); }' +
    '.ai-suggestion-row { display:flex; gap:6px; }' +
    '.ai-label { color:var(--text-muted); flex-shrink:0; }' +
    '.ai-suggested { color:var(--accent); font-weight:600; }' +
    '.btn-sm { font-size:12px; padding:5px 12px; }' +
    '.btn-apply-suggestion { background:var(--accent); color:#1a1a2e; border:none; border-radius:4px; cursor:pointer; font-weight:600; }' +
    '.btn-apply-suggestion:hover { opacity:0.85; }' +
    '.input-error { border-color:#d44040 !important; box-shadow:0 0 0 1px rgba(212,64,64,0.25); }' +
    '.ai-field-error { color:#d44040; font-size:12px; margin-top:4px; }';
  document.head.appendChild(style);
}

function createAIModals() {
  if ($('#ai-diagnose-modal')) return;

  var diagnoseHTML =
    '<div id="ai-diagnose-modal" class="modal-overlay hidden">' +
    '  <div class="modal-panel">' +
    '    <div class="modal-header">' +
    '      <h3 data-i18n="ai.diagnoseTitle">' +
    BrewCodeI18n.t('ai.diagnoseTitle') +
    '</h3>' +
    '<button class="btn-ai-close btn-icon" type="button" aria-label="' +
    BrewCodeI18n.t('common.close') +
    '">&times;</button>' +
    '    </div>' +
    '    <div class="modal-body">' +
    '      <div class="ai-loading hidden">' +
    '        <div class="ai-loading-spinner"></div>' +
    '        <p data-i18n="ai.diagnosing">' +
    BrewCodeI18n.t('ai.diagnosing') +
    '</p>' +
    '      </div>' +
    '      <div class="ai-error hidden"></div>' +
    '      <div class="ai-form">' +
    '        <label class="field">' +
    '          <span class="field-label" data-i18n="ai.issueLabel">' +
    BrewCodeI18n.t('ai.issueLabel') +
    '</span>' +
    '          <textarea id="inp-diagnose-issue" class="input" rows="3" data-i18n="ai.issuePlaceholder" placeholder="' +
    BrewCodeI18n.t('ai.issuePlaceholder') +
    '"></textarea>' +
    '        </label>' +
    '      </div>' +
    '      <div id="ai-diagnose-result" class="ai-result hidden"></div>' +
    '    </div>' +
    '    <div class="modal-footer">' +
    '      <button id="btn-submit-diagnose" class="btn btn-primary" type="button" data-i18n="ai.submitDiagnose">' +
    BrewCodeI18n.t('ai.submitDiagnose') +
    '</button>' +
    '      <button class="btn-ai-close btn btn-ghost" type="button" data-i18n="ai.cancel">' +
    BrewCodeI18n.t('ai.cancel') +
    '</button>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  var generateHTML =
    '<div id="ai-generate-modal" class="modal-overlay hidden">' +
    '  <div class="modal-panel">' +
    '    <div class="modal-header">' +
    '      <h3 data-i18n="ai.generateTitle">' +
    BrewCodeI18n.t('ai.generateTitle') +
    '</h3>' +
    '      <button class="btn-ai-close btn-icon" type="button" aria-label="' +
    BrewCodeI18n.t('common.close') +
    '">&times;</button>' +
    '    </div>' +
    '    <div class="modal-body">' +
    '      <div class="ai-loading hidden">' +
    '        <div class="ai-loading-spinner"></div>' +
    '        <p data-i18n="ai.generating">' +
    BrewCodeI18n.t('ai.generating') +
    '</p>' +
    '      </div>' +
    '      <div class="ai-error hidden"></div>' +
    '      <div class="ai-form">' +
    '        <label class="field field-span-2">' +
    '          <span class="field-label"><span data-i18n="ai.originLabel">' +
    BrewCodeI18n.t('ai.originLabel') +
    '</span><span class="required-hint" data-i18n="field.必填">' +
    BrewCodeI18n.t('field.必填') +
    '</span></span>' +
    '          <input type="text" id="inp-gen-origin" class="input" data-i18n="ai.originPlaceholder" placeholder="' +
    BrewCodeI18n.t('ai.originPlaceholder') +
    '" />' +
    '        </label>' +
    '        <label class="field">' +
    '          <span class="field-label"><span data-i18n="ai.roastLabel">' +
    BrewCodeI18n.t('ai.roastLabel') +
    '</span><span class="required-hint" data-i18n="field.必填">' +
    BrewCodeI18n.t('field.必填') +
    '</span></span>' +
    '          <select id="inp-gen-roast" class="input">' +
    '            <option value="极浅烘">极浅烘</option>' +
    '            <option value="浅烘" selected>浅烘</option>' +
    '            <option value="中浅烘">中浅烘</option>' +
    '            <option value="中烘">中烘</option>' +
    '            <option value="中深烘">中深烘</option>' +
    '            <option value="深烘">深烘</option>' +
    '            <option value="极深烘">极深烘</option>' +
    '          </select>' +
    '        </label>' +
    '        <label class="field">' +
    '          <span class="field-label"><span data-i18n="ai.processLabel">' +
    BrewCodeI18n.t('ai.processLabel') +
    '</span><span class="required-hint" data-i18n="field.必填">' +
    BrewCodeI18n.t('field.必填') +
    '</span></span>' +
    '          <select id="inp-gen-process" class="input">' +
    '            <option value="水洗" selected>水洗</option>' +
    '            <option value="日晒">日晒</option>' +
    '            <option value="蜜处理">蜜处理</option>' +
    '            <option value="厌氧发酵">厌氧发酵</option>' +
    '            <option value="半水洗">半水洗</option>' +
    '            <option value="湿刨法">湿刨法</option>' +
    '          </select>' +
    '        </label>' +
    '        <label class="field field-span-2">' +
    '          <span class="field-label" data-i18n="field.冲煮器具_ai">' +
    BrewCodeI18n.t('field.冲煮器具_ai') +
    '</span>' +
    '          <input type="text" id="inp-gen-equipment" class="input" data-i18n="ai.equipmentPlaceholder" placeholder="' +
    BrewCodeI18n.t('ai.equipmentPlaceholder') +
    '" />' +
    '        </label>' +
    '        <label class="field field-span-2">' +
    '          <span class="field-label" data-i18n="ai.preferenceLabel">' +
    BrewCodeI18n.t('ai.preferenceLabel') +
    '</span>' +
    '          <input type="text" id="inp-gen-preference" class="input" data-i18n="ai.preferencePlaceholder" placeholder="' +
    BrewCodeI18n.t('ai.preferencePlaceholder') +
    '" />' +
    '        </label>' +
    '      </div>' +
    '    </div>' +
    '    <div class="modal-footer">' +
    '      <button id="btn-submit-generate" class="btn btn-primary" type="button" data-i18n="ai.submitGenerate">' +
    BrewCodeI18n.t('ai.submitGenerate') +
    '</button>' +
    '      <button class="btn-ai-close btn btn-ghost" type="button" data-i18n="ai.cancel">' +
    BrewCodeI18n.t('ai.cancel') +
    '</button>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  var app = $('#app');
  app.insertAdjacentHTML('beforeend', diagnoseHTML);
  app.insertAdjacentHTML('beforeend', generateHTML);
}

function closeAIDialog(modal) {
  modal.classList.add('hidden');
  var loading = modal.querySelector('.ai-loading');
  var errorEl = modal.querySelector('.ai-error');
  if (loading) loading.classList.add('hidden');
  if (errorEl) {
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
  }
}

function showAILoading(modal) {
  var loading = modal.querySelector('.ai-loading');
  var errorEl = modal.querySelector('.ai-error');
  var form = modal.querySelector('.ai-form');
  if (loading) loading.classList.remove('hidden');
  if (errorEl) errorEl.classList.add('hidden');
  if (form) form.classList.add('hidden');
}

function hideAILoading(modal) {
  var loading = modal.querySelector('.ai-loading');
  var form = modal.querySelector('.ai-form');
  if (loading) loading.classList.add('hidden');
  if (form) form.classList.remove('hidden');
}

function showAIError(modal, message) {
  var errorEl = modal.querySelector('.ai-error');
  var loading = modal.querySelector('.ai-loading');
  if (loading) loading.classList.add('hidden');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

function clearAIInputErrors(modal) {
  var inputs = modal.querySelectorAll('.input-error');
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].classList.remove('input-error');
  }
  var fieldErrors = modal.querySelectorAll('.ai-field-error');
  for (var j = 0; j < fieldErrors.length; j++) {
    fieldErrors[j].parentNode.removeChild(fieldErrors[j]);
  }
}

function setAIInputError(input, message) {
  input.classList.add('input-error');
  var existing = input.parentNode.querySelector('.ai-field-error');
  if (existing) {
    existing.textContent = message;
  } else {
    var span = document.createElement('span');
    span.className = 'ai-field-error';
    span.textContent = message;
    input.parentNode.insertBefore(span, input.nextSibling);
  }
}

function aiFetch(path, body) {
  var userConfig = loadLLMConfig();
  var apiBase = userConfig && userConfig.apiKey ? userConfig.apiBase : AI_API_BASE;
  var authToken = userConfig && userConfig.apiKey ? userConfig.apiKey : null;

  if (userConfig && userConfig.apiKey && userConfig.model) {
    body = Object.assign({}, body, { model: userConfig.model });
  }

  var controller = new AbortController();
  var timeoutId = setTimeout(function () {
    controller.abort();
  }, AI_TIMEOUT_MS);

  return fetch(apiBase + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + authToken,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(function (res) {
      clearTimeout(timeoutId);
      if (!res.ok) {
        return res
          .json()
          .then(function (err) {
            throw new Error(err.message || BrewCodeI18n.t('ai.apiError') + res.status);
          })
          .catch(function (parseErr) {
            if (
              parseErr.message &&
              parseErr.message.indexOf(BrewCodeI18n.t('ai.apiError').replace(/\s+\d+$/, '')) === 0
            )
              throw parseErr;
            throw new Error(BrewCodeI18n.t('ai.apiError') + res.status);
          });
      }
      return res.json();
    })
    .catch(function (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(BrewCodeI18n.t('ai.timeout'));
      }
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new Error(BrewCodeI18n.t('ai.networkError'));
      }
      throw err;
    });
}

function bindAIDialogEvents() {
  injectAIStyles();
  createAIModals();

  $('#btn-ai-diagnose').addEventListener('click', openAIDiagnoseModal);
  $('#btn-ai-generate').addEventListener('click', openAIGenerateModal);

  $('#btn-submit-diagnose').addEventListener('click', submitDiagnose);
  $('#btn-submit-generate').addEventListener('click', submitGenerate);

  var closeButtons = document.querySelectorAll('.btn-ai-close');
  for (var i = 0; i < closeButtons.length; i++) {
    closeButtons[i].addEventListener('click', function (e) {
      var modal = e.target.closest('.modal-overlay');
      if (modal) closeAIDialog(modal);
    });
  }

  $('#ai-diagnose-modal').addEventListener('click', function (e) {
    if (e.target === this) closeAIDialog(this);
  });
  $('#ai-generate-modal').addEventListener('click', function (e) {
    if (e.target === this) closeAIDialog(this);
  });
}

function openAIDiagnoseModal() {
  closeAIDialog($('#ai-generate-modal'));

  var modal = $('#ai-diagnose-modal');
  modal.classList.remove('hidden');

  var result = modal.querySelector('#ai-diagnose-result');
  var errorEl = modal.querySelector('.ai-error');
  var loading = modal.querySelector('.ai-loading');
  var form = modal.querySelector('.ai-form');

  if (result) result.classList.add('hidden');
  if (errorEl) errorEl.classList.add('hidden');
  if (loading) loading.classList.add('hidden');
  if (form) form.classList.remove('hidden');

  clearAIInputErrors(modal);

  $('#inp-diagnose-issue').value = '';
  $('#btn-submit-diagnose').disabled = false;
  $('#btn-submit-diagnose').textContent = BrewCodeI18n.t('ai.submitDiagnose');
}

function submitDiagnose() {
  var issueEl = $('#inp-diagnose-issue');
  var issue = issueEl.value.trim();
  if (!issue) {
    setAIInputError(issueEl, BrewCodeI18n.t('ai.issueRequired'));
    showAIError($('#ai-diagnose-modal'), BrewCodeI18n.t('ai.issueRequired'));
    return;
  }

  collectFormToState();
  var brew = buildBrewJSON();

  var modal = $('#ai-diagnose-modal');
  var btn = $('#btn-submit-diagnose');
  var result = modal.querySelector('#ai-diagnose-result');

  showAILoading(modal);
  btn.disabled = true;
  btn.textContent = BrewCodeI18n.t('ai.analyzing');

  if (result) result.classList.add('hidden');

  aiFetch('/diagnose', { brew: brew, issue: issue })
    .then(function (data) {
      hideAILoading(modal);
      btn.disabled = false;
      btn.textContent = BrewCodeI18n.t('ai.submitDiagnose');
      if (data.suggestions && data.suggestions.length) {
        renderDiagnoseResult(data.suggestions);
      } else {
        showAIError(modal, BrewCodeI18n.t('ai.emptyResult'));
      }
    })
    .catch(function (err) {
      hideAILoading(modal);
      btn.disabled = false;
      btn.textContent = BrewCodeI18n.t('ai.submitDiagnose');
      showAIError(modal, err.message || BrewCodeI18n.t('ai.diagnoseFail'));
    });
}

function openAIGenerateModal() {
  closeAIDialog($('#ai-diagnose-modal'));

  var modal = $('#ai-generate-modal');
  modal.classList.remove('hidden');

  var errorEl = modal.querySelector('.ai-error');
  var loading = modal.querySelector('.ai-loading');
  var form = modal.querySelector('.ai-form');

  if (errorEl) errorEl.classList.add('hidden');
  if (loading) loading.classList.add('hidden');
  if (form) form.classList.remove('hidden');

  clearAIInputErrors(modal);

  $('#inp-gen-origin').value = '';
  $('#inp-gen-roast').value = '浅烘';
  $('#inp-gen-process').value = '水洗';
  $('#inp-gen-equipment').value = '';
  $('#inp-gen-preference').value = '';
  $('#btn-submit-generate').disabled = false;
  $('#btn-submit-generate').textContent = BrewCodeI18n.t('ai.submitGenerate');
}

function submitGenerate() {
  var originEl = $('#inp-gen-origin');
  var roastEl = $('#inp-gen-roast');
  var processEl = $('#inp-gen-process');
  var origin = originEl.value.trim();
  var roastLevel = roastEl.value;
  var process = processEl.value;
  var equipmentStr = $('#inp-gen-equipment').value.trim();
  var preference = $('#inp-gen-preference').value.trim();

  var hasError = false;
  if (!origin) {
    setAIInputError(originEl, BrewCodeI18n.t('ai.originRequired'));
    hasError = true;
  }
  if (!roastLevel) {
    setAIInputError(roastEl, BrewCodeI18n.t('ai.roastRequired'));
    hasError = true;
  }
  if (!process) {
    setAIInputError(processEl, BrewCodeI18n.t('ai.processRequired'));
    hasError = true;
  }
  if (hasError) {
    showAIError($('#ai-generate-modal'), BrewCodeI18n.t('ai.requiredFields'));
    return;
  }

  var equipment = equipmentStr
    ? equipmentStr
        .split(',')
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean)
    : [];

  var modal = $('#ai-generate-modal');
  var btn = $('#btn-submit-generate');

  showAILoading(modal);
  btn.disabled = true;
  btn.textContent = BrewCodeI18n.t('ai.genInProgress');

  aiFetch('/generate', {
    coffee: { origin: origin, roastLevel: roastLevel, process: process },
    equipment: equipment,
    preference: preference,
  })
    .then(function (data) {
      if (data.brew) {
        loadBrewJSON(JSON.stringify(data.brew));
        syncFormFromState();
        syncResultFromState();
        renderStepList();
        var errors = validateState();
        updateValidationBar(errors);
        closeAIDialog(modal);
      } else {
        hideAILoading(modal);
        btn.disabled = false;
        btn.textContent = BrewCodeI18n.t('ai.submitGenerate');
        showAIError(modal, BrewCodeI18n.t('ai.genFail'));
      }
    })
    .catch(function (err) {
      hideAILoading(modal);
      btn.disabled = false;
      btn.textContent = BrewCodeI18n.t('ai.submitGenerate');
      showAIError(modal, err.message || BrewCodeI18n.t('ai.generateFail'));
    });
}

function renderDiagnoseResult(suggestions) {
  var result = $('#ai-diagnose-result');
  if (!result) return;

  var html =
    '<h4 class="ai-result-title">' +
    BrewCodeI18n.t('ai.diagnoseSuggestions') +
    '</h4><ul class="ai-suggestion-list">';

  for (var i = 0; i < suggestions.length; i++) {
    var s = suggestions[i];
    html +=
      '<li class="ai-suggestion-item">' +
      '<div class="ai-suggestion-header">' +
      '<span class="ai-suggestion-field">' +
      escapeHTML(s.field || '') +
      '</span>' +
      '</div>' +
      '<div class="ai-suggestion-body">' +
      '<div class="ai-suggestion-row"><span class="ai-label">' +
      BrewCodeI18n.t('ai.currentValue') +
      '</span><span>' +
      escapeHTML(String(s.current != null ? s.current : '')) +
      '</span></div>' +
      '<div class="ai-suggestion-row"><span class="ai-label">' +
      BrewCodeI18n.t('ai.suggestedValue') +
      '</span><span class="ai-suggested">' +
      escapeHTML(String(s.suggested != null ? s.suggested : '')) +
      '</span></div>' +
      '<div class="ai-suggestion-row"><span class="ai-label">' +
      BrewCodeI18n.t('ai.reason') +
      '</span><span>' +
      escapeHTML(s.reason || '') +
      '</span></div>' +
      '</div>' +
      '<button class="btn btn-sm btn-apply-suggestion" data-index="' +
      i +
      '" type="button">' +
      BrewCodeI18n.t('ai.applySuggestion') +
      '</button>' +
      '</li>';
  }

  html += '</ul>';
  result.innerHTML = html;
  result.classList.remove('hidden');

  var applyButtons = result.querySelectorAll('.btn-apply-suggestion');
  for (var j = 0; j < applyButtons.length; j++) {
    applyButtons[j].addEventListener('click', function (e) {
      var idx = parseInt(e.target.getAttribute('data-index'), 10);
      applyDiagnoseSuggestion(suggestions[idx]);
    });
  }
}

function applyDiagnoseSuggestion(suggestion) {
  var field = suggestion.field;
  var suggested = suggestion.suggested;

  var fieldMap = {
    研磨度: 'grindSize',
    水温: 'waterTemperature',
    粉量: 'dose',
    水量: 'waterAmount',
    粉水比: 'ratio',
    闷蒸时间: 'bloomTime',
    冲煮时间: 'brewTime',
  };

  var mapped = fieldMap[field];
  if (!mapped) return;

  var recipe = editorState.recipe;

  switch (mapped) {
    case 'grindSize':
      if (typeof suggested === 'number') recipe.grindSize.value = suggested;
      break;
    case 'waterTemperature':
      if (typeof suggested === 'number') recipe.waterTemperature.value = suggested;
      break;
    case 'dose':
      if (typeof suggested === 'number') recipe.dose.value = suggested;
      break;
    case 'waterAmount':
      if (typeof suggested === 'number') recipe.waterAmount.value = suggested;
      break;
    case 'ratio':
      if (typeof suggested === 'string' || typeof suggested === 'number')
        recipe.ratio = String(suggested);
      break;
    case 'bloomTime':
      if (typeof suggested === 'number') recipe.bloomTime.value = suggested;
      break;
    case 'brewTime':
      if (typeof suggested === 'number') recipe.brewTime.value = suggested;
      break;
  }

  syncFormFromState();
  renderStepList();
  var errors = validateState();
  updateValidationBar(errors);
}

/* ================================================================
 * LLM 配置 — 用户自定义大模型
 * ================================================================ */

function bindLLMConfigEvents() {
  var modal = $('#llm-config-modal');
  var btnOpen = $('#btn-llm-config');
  var btnSave = $('#btn-save-llm-config');
  var btnClear = $('#btn-clear-llm-config');
  var btnClose = modal.querySelector('.btn-close-llm-config');
  var providerSelect = $('#inp-llm-provider');
  var apiKeyInput = $('#inp-llm-apikey');
  var apiBaseInput = $('#inp-llm-apibase');
  var modelInput = $('#inp-llm-model');
  var errorEl = $('#llm-config-error');

  function showConfigError(msg) {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }
  }

  function hideConfigError() {
    if (errorEl) {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
    }
  }

  function updateGearIcon() {
    var config = loadLLMConfig();
    if (config && config.apiKey) {
      btnOpen.textContent = '⚙️';
      btnOpen.style.color = '#40a060';
    } else {
      btnOpen.textContent = '⚙️';
      btnOpen.style.color = '';
    }
  }

  function autoFillProvider(provider) {
    var info = LLM_PROVIDERS[provider];
    if (info) {
      apiBaseInput.value = info.apiBase;
      modelInput.value = info.model;
      apiBaseInput.readOnly = false;
      modelInput.readOnly = false;
    } else {
      apiBaseInput.value = '';
      modelInput.value = '';
      apiBaseInput.readOnly = false;
      modelInput.readOnly = false;
    }
  }

  function openConfigModal() {
    var config = loadLLMConfig();
    hideConfigError();

    if (config) {
      providerSelect.value = config.provider || 'deepseek';
      apiKeyInput.value = config.apiKey || '';
      apiBaseInput.value = config.apiBase || '';
      modelInput.value = config.model || '';
    } else {
      providerSelect.value = 'deepseek';
      apiKeyInput.value = '';
      autoFillProvider('deepseek');
    }

    modal.classList.remove('hidden');
  }

  function closeConfigModal() {
    modal.classList.add('hidden');
  }

  providerSelect.addEventListener('change', function () {
    autoFillProvider(this.value);
  });

  btnOpen.addEventListener('click', openConfigModal);

  btnClose.addEventListener('click', closeConfigModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeConfigModal();
  });

  btnSave.addEventListener('click', function () {
    hideConfigError();

    var provider = providerSelect.value;
    var apiKey = apiKeyInput.value.trim();
    var apiBase = apiBaseInput.value.trim();
    var model = modelInput.value.trim();

    if (!apiKey) {
      showConfigError(BrewCodeI18n.t('llm.keyRequired'));
      return;
    }
    if (!apiBase) {
      showConfigError(BrewCodeI18n.t('llm.baseRequired'));
      return;
    }

    saveLLMConfig({
      provider: provider,
      apiKey: apiKey,
      apiBase: apiBase,
      model: model || null,
    });

    updateGearIcon();
    closeConfigModal();
  });

  btnClear.addEventListener('click', function () {
    clearLLMConfig();
    updateGearIcon();
    closeConfigModal();
  });

  updateGearIcon();
}

/* ================================================================
 * 初始化
 * ================================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var savedLang = localStorage.getItem('brewcode_lang');
  if (savedLang) {
    BrewCodeI18n.setLang(savedLang);
  }

  initSchemaValidator();

  syncFormFromState();
  syncResultFromState();
  bindFormEvents();
  bindStepEvents();
  bindAIDialogEvents();
  bindLLMConfigEvents();
  renderStepList();

  refreshI18nTexts();

  $('#btn-export').addEventListener('click', exportBrewFile);
  $('#btn-submit-to-repo').addEventListener('click', submitToBrewRepo);
  $('#btn-open-in-player').addEventListener('click', function () {
    collectFormToState();
    var json = encodeURIComponent(JSON.stringify(buildBrewJSON()));
    window.open(BrewCodeConfig.playerUrl + '?brew=' + json, '_blank');
  });
  $('#btn-toggle-code').addEventListener('click', toggleCodeMode);

  function generateBrewId() {
    return (
      'BC-' +
      Math.floor(Math.random() * 0xffff)
        .toString(16)
        .toUpperCase()
        .padStart(4, '0')
    );
  }

  // 分享按钮 — 使用事件委托确保可靠性
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('#btn-share-card');
    if (!btn) return;
    e.preventDefault();

    var originalText = btn.textContent;
    btn.textContent = '生成中…';
    btn.disabled = true;

    collectFormToState();
    collectResultToState();
    var brewData = buildBrewJSON();

    if (!brewData.meta) brewData.meta = {};
    if (!brewData.meta.brewId) {
      brewData.meta.brewId = generateBrewId();
      editorState.meta.brewId = brewData.meta.brewId;
    }

    generateShareCard(brewData)
      .then(function () {
        btn.textContent = originalText;
        btn.disabled = false;
      })
      .catch(function (err) {
        console.error('BrewForge: 分享图生成失败', err);
        showToast('分享图生成失败，请稍后重试');
        btn.textContent = originalText;
        btn.disabled = false;
      });
  });

  $('#validation-bar').addEventListener('click', function () {
    this.classList.toggle('collapsed');
  });

  var errors = validateState();
  updateValidationBar(errors);

  if (window.location.hash && window.location.hash.indexOf('#brew=') === 0) {
    try {
      var encoded = window.location.hash.slice(6);
      var json = JSON.parse(decodeURIComponent(encoded));
      loadBrewJSON(json);
      syncFormFromState();
      syncResultFromState();
      renderStepList();
      var hashErrors = validateState();
      updateValidationBar(hashErrors);
    } catch (e) {
      console.warn('Forge: 无法解析 URL hash 中的方案数据', e);
    }
  }

  /* ── Toast 提示 ── */
  var toastTimer = null;
  function showToast(msg) {
    var toast = document.getElementById('forge-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'forge-toast';
      toast.style.cssText =
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
        'background:rgba(0,0,0,0.85);color:#fff;padding:10px 24px;' +
        'border-radius:8px;font-size:14px;z-index:9999;' +
        'opacity:0;transition:opacity 0.3s;pointer-events:none;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.style.opacity = '0';
    }, 2000);
  }
});
