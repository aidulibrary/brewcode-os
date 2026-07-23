// tests/test-roundtrip.js
// 零依赖单元测试：buildBrewJSON <-> loadBrewJSON 往返一致性

var passed = 0;
var failed = 0;
var total = 0;

function assert(condition, message) {
  total++;
  if (condition) { passed++; console.log('  ✓ ' + message); }
  else { failed++; console.error('  ✗ FAIL: ' + message); }
}

function assertEqual(actual, expected, message) {
  total++;
  if (actual === expected) { passed++; console.log('  ✓ ' + message); }
  else { failed++; console.error('  ✗ FAIL: ' + message + ' (期望: ' + expected + ', 实际: ' + actual + ')'); }
}

// ---- Mock 环境 ----
global.window = global;
global.document = {
  cookie: '',
  addEventListener: function() {},
  querySelector: function() { return { onclick: null, style: {}, innerHTML: '' }; },
  querySelectorAll: function() { return []; },
  createElement: function() { return { appendChild: function() {}, style: {}, href: '', download: '', click: function() {} }; },
  body: { appendChild: function() {}, removeChild: function() {} },
  getElementById: function() { return { style: {}, innerHTML: '', onclick: null, textContent: '', value: '' }; }
};
global.localStorage = { getItem: function() { return null; }, setItem: function() {} };
global.BrewCodeConfig = { playerUrl: 'https://player.brewcode.dev', forgeUrl: 'https://forge.brewcode.dev', repoUrl: 'https://repo.brewcode.dev' };
global.BrewCodeI18n = {
  t: function(k) { return k; },
  setLang: function() {},
  onReady: function() {},
  load: function() {},
  getLang: function() { return 'zh'; }
};
global.URL = { createObjectURL: function() { return ''; }, revokeObjectURL: function() {} };
global.Blob = function() {};
global.console = console;
global.process = process;

// 加载 forge.js（此时 editorState 会被 forge.js 初始化为默认值）
try {
  var fs = require('fs');
  var forgeCode = fs.readFileSync(__dirname + '/../../forge/forge.js', 'utf-8');
  forgeCode = forgeCode.replace(/'use strict';/, '// use strict removed for test');
  (0, eval)(forgeCode);
  console.log('forge.js 加载成功');
} catch (e) {
  console.error('forge.js 加载失败: ' + e.message);
  process.exit(1);
}

// 加载后设置测试状态（覆盖 forge.js 的默认 editorState）
editorState.meta.name = '测试方案';
editorState.meta.version = '1.0.0';
editorState.meta.author = '测试作者';
editorState.meta.description = '测试描述';
editorState.meta.license = 'CC0';
editorState.meta.tags = ['V60', '浅烘'];
editorState.meta.brewCodeVersion = '1.0';
editorState.meta.createdAt = '2026-01-01T00:00:00.000Z';

editorState.coffee.name = '埃塞俄比亚 耶加雪菲';
editorState.coffee.producer = '测试庄园';
editorState.coffee.origin = { country: '埃塞俄比亚', region: '耶加雪菲', farm: '测试农场', altitude: '1800m' };
editorState.coffee.variety = 'Heirloom';
editorState.coffee.process = '日晒';
editorState.coffee.roastLevel = '浅烘';
editorState.coffee.roastDate = '2026-01-01';
editorState.coffee.roaster = '测试烘焙商';
editorState.coffee.flavorNotes = ['茉莉花', '柑橘', '蜂蜜'];

editorState.equipment.brewer = 'V60';
editorState.equipment.brewerMaterial = '陶瓷';
editorState.equipment.brewerSize = '01';
editorState.equipment.filter = 'Hario V60 01';
editorState.equipment.grinder = 'C40';
editorState.equipment.kettle = 'Brewista';
editorState.equipment.scale = 'Acaia';
editorState.equipment.server = 'Hario';

editorState.recipe.dose = { value: 15, unit: 'g' };
editorState.recipe.waterAmount = { value: 225, unit: 'ml' };
editorState.recipe.ratio = '1:15';
editorState.recipe.grindSize = { value: 22, unit: 'C40 click', description: '细砂糖' };
editorState.recipe.waterTemperature = { value: 93, unit: '°C' };
editorState.recipe.waterType = '过滤水';
editorState.recipe.waterTDS = 80;
editorState.recipe.brewTime = { value: 150, unit: 's' };
editorState.recipe.bloomRatio = '1:3';
editorState.recipe.bloomTime = { value: 30, unit: 's' };
editorState.recipe.targetTDS = 1.35;
editorState.recipe.targetExtraction = 20.5;

editorState.steps = [
  { order: 1, action: 'bloom', waterAmount: { value: 45, unit: 'ml' }, duration: { value: 30, unit: 's' }, description: '闷蒸' },
  { order: 2, action: 'pour', waterAmount: { value: 90, unit: 'ml' }, duration: { value: 30, unit: 's' }, description: '注水', pourStyle: 'circlePour' },
  { order: 3, action: 'pour', waterAmount: { value: 90, unit: 'ml' }, duration: { value: 30, unit: 's' }, description: '注水', pourStyle: 'centerPour' }
];

editorState.result.rating = 8.5;
editorState.result.actualBrewTime = { value: 145, unit: 's' };
editorState.result.finalYield = { value: 190, unit: 'ml' };
editorState.result.measuredTDS = 1.32;
editorState.result.extractionYield = 19.8;

// ---- 测试用例 ----
console.log('=== 测试1：buildBrewJSON 返回有效对象 ===');
var brewObj = buildBrewJSON();
assert(typeof brewObj === 'object' && brewObj !== null, 'buildBrewJSON 返回对象');
assertEqual(typeof brewObj.meta, 'object', '包含 meta 段');
assertEqual(typeof brewObj.coffee, 'object', '包含 coffee 段');
assertEqual(typeof brewObj.recipe, 'object', '包含 recipe 段');
assert(Array.isArray(brewObj.steps), 'steps 为数组');

console.log('\n=== 测试2：往返一致性 — 核心字段 ===');
var jsonStr = JSON.stringify(brewObj, null, 2);
var parsed = JSON.parse(jsonStr);
assertEqual(parsed.meta.name, '测试方案', 'meta.name 保留');
assertEqual(parsed.meta.version, '1.0.0', 'meta.version 保留');
assertEqual(parsed.meta.author, '测试作者', 'meta.author 保留');
assertEqual(parsed.coffee.name, '埃塞俄比亚 耶加雪菲', 'coffee.name 保留');
assertEqual(parsed.coffee.variety, 'Heirloom', 'coffee.variety 保留');
assertEqual(parsed.coffee.roastLevel, '浅烘', 'coffee.roastLevel 保留');
assertEqual(parsed.recipe.dose.value, 15, 'recipe.dose.value 保留');
assertEqual(parsed.recipe.waterAmount.value, 225, 'recipe.waterAmount.value 保留');
assertEqual(parsed.recipe.waterTemperature.value, 93, 'recipe.waterTemperature.value 保留');
assertEqual(parsed.steps.length, 3, 'steps 数量保留');
assertEqual(parsed.steps[0].action, 'bloom', 'steps[0].action 保留');
assertEqual(parsed.steps[1].pourStyle, 'circlePour', 'steps[1].pourStyle 保留');
assertEqual(parsed.result.rating, 8.5, 'result.rating 保留');

console.log('\n=== 测试3：loadBrewJSON 还原状态 ===');
editorState.meta.name = '__CLEARED__';
editorState.coffee.name = '__CLEARED__';
editorState.recipe.dose = { value: 0, unit: 'g' };
editorState.steps = [];

loadBrewJSON(jsonStr);

assertEqual(editorState.meta.name, '测试方案', 'loadBrewJSON 还原 meta.name');
assertEqual(editorState.coffee.name, '埃塞俄比亚 耶加雪菲', 'loadBrewJSON 还原 coffee.name');
assertEqual(editorState.recipe.dose.value, 15, 'loadBrewJSON 还原 recipe.dose.value');
assert(editorState.steps.length === 3, 'loadBrewJSON 还原 steps（共' + editorState.steps.length + '步）');
assertEqual(editorState.steps[0].action, 'bloom', 'loadBrewJSON 还原 steps[0].action');

console.log('\n=== 测试4：空 steps 往返 ===');
editorState.steps = [];
var brewObj2 = buildBrewJSON();
var parsed2 = JSON.parse(JSON.stringify(brewObj2));
assert(Array.isArray(parsed2.steps) && parsed2.steps.length === 0, '空 steps 序列化后仍为空数组');

// ---- 结果 ----
console.log('\n' + '='.repeat(40));
console.log(passed + '/' + total + ' 通过');
if (failed > 0) { console.log(failed + ' 失败'); process.exit(1); }
