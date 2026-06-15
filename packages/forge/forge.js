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

/* ================================================================
 * 全局表单变更监听
 * ================================================================ */

function bindFormEvents() {
  $('#forge-main').addEventListener('input', function () {
    collectFormToState();
  });
}

/* ================================================================
 * 初始化
 * ================================================================ */

document.addEventListener('DOMContentLoaded', function () {
  syncFormFromState();
  bindFormEvents();
});
