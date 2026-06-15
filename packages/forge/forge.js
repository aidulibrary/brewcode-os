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

/* ================================================================
 * 编辑器状态
 * ================================================================ */

var editorState = {
  meta: {
    name: '',
    version: '1.0.0',
    brewCodeVersion: '0.1',
    author: '',
    description: '',
    license: 'CC0',
    tags: [],
    createdAt: new Date().toISOString(),
    source: '',
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
  });
}

/* ================================================================
 * 步骤管理器 — 渲染 / 增删 / 排序 / 模态框
 * ================================================================ */

var stepEditIndex = -1;

function renderStepList() {
  var list = $('#step-list');
  var steps = editorState.steps;

  if (!steps.length) {
    list.innerHTML = '<p class="step-empty">暂无步骤，点击下方按钮添加</p>';
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
        '<span class="step-meta-tag">注水 ' + s.waterAmount.value + s.waterAmount.unit + '</span>'
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
      '" data-action="move-up" title="上移" aria-label="上移">&#9650;</button>' +
      '<button class="btn-icon-sm" data-step="' +
      i +
      '" data-action="move-down" title="下移" aria-label="下移">&#9660;</button>' +
      '<button class="btn-icon-sm" data-step="' +
      i +
      '" data-action="edit" title="编辑" aria-label="编辑">&#9998;</button>' +
      (showDelete
        ? '<button class="btn-icon-sm btn-icon-danger" data-step="' +
          i +
          '" data-action="delete" title="删除" aria-label="删除">&#10005;</button>'
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
  var map = {
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
  return map[action] || action || '';
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
    $('#modal-title').textContent = '编辑步骤 #' + editorState.steps[index].order;
    syncStepFormFromStep(editorState.steps[index]);
  } else {
    $('#modal-title').textContent = '添加步骤';
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
  btn.textContent = '✓ 已下载';
  btn.classList.add('btn-success');
  setTimeout(function () {
    btn.textContent = originalText;
    btn.classList.remove('btn-success');
  }, 2000);
}

/* ================================================================
 * 初始化
 * ================================================================ */

document.addEventListener('DOMContentLoaded', function () {
  syncFormFromState();
  syncResultFromState();
  bindFormEvents();
  bindStepEvents();
  renderStepList();

  $('#btn-export').addEventListener('click', exportBrewFile);
});
