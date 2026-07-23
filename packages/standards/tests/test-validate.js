// tests/test-validate.js
// 零依赖单元测试：validateState 边界条件

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
  t: function(k) {
    var map = {
      'validation.fieldName': '方案名称',
      'validation.fieldCoffeeName': '咖啡豆名称',
      'validation.fieldBrewer': '冲煮器具',
      'validation.fieldDose': '粉量',
      'validation.fieldWater': '水量',
      'validation.fieldTemp': '水温',
      'validation.requiredField': '必填，请输入',
      'validation.errDoseRange': '粉量范围 1-100g，当前值：',
      'validation.errWaterRange': '水量范围 1-2000ml，当前值：',
      'validation.errTempRange': '水温范围 0-100°C，当前值：'
    };
    return map[k] || k;
  },
  setLang: function() {},
  onReady: function() {},
  load: function() {},
  getLang: function() { return 'zh'; }
};

function makeEditorState(overrides) {
  var base = {
    meta: { name: '测试', version: '1.0.0', brewCodeVersion: '1.0', author: '', description: '', license: 'CC0', tags: [], createdAt: '', source: '', brewId: '' },
    coffee: { name: '测试豆', producer: '', origin: { country: '', region: '', farm: '', altitude: '' }, variety: '', process: '', roastLevel: '中烘', roastDate: '', roaster: '', flavorNotes: [] },
    equipment: { brewer: 'V60', brewerMaterial: '', brewerSize: '', filter: '', grinder: '', kettle: '', scale: '', server: '' },
    recipe: { dose: { value: 15, unit: 'g' }, waterAmount: { value: 225, unit: 'ml' }, ratio: '1:15', grindSize: { value: 22 }, waterTemperature: { value: 93, unit: '°C' }, waterType: '', waterTDS: null, brewTime: { value: 150, unit: 's' }, bloomRatio: '', bloomTime: { value: 0, unit: 's' }, targetTDS: null, targetExtraction: null },
    steps: [],
    result: { actualBrewTime: null, finalYield: null, measuredTDS: null, extractionYield: null, rating: null }
  };
  if (overrides) {
    for (var k in overrides) {
      if (typeof overrides[k] === 'object' && overrides[k] !== null && base[k]) {
        Object.assign(base[k], overrides[k]);
      } else {
        base[k] = overrides[k];
      }
    }
  }
  return base;
}

global.console = console;
global.process = process;

// 加载 forge.js
try {
  var fs = require('fs');
  var forgeCode = fs.readFileSync(__dirname + '/../../forge/forge.js', 'utf-8');
  forgeCode = forgeCode.replace(/'use strict';/, '// use strict removed for test');
  (0, eval)(forgeCode);
  console.log('forge.js 加载成功\n');
} catch (e) {
  console.error('forge.js 加载失败: ' + e.message);
  process.exit(1);
}

// ---- 测试用例 ----
console.log('=== 测试1：正常状态无错误 ===');
global.editorState = makeEditorState();
var errors = validateState();
assert(errors.length === 0, '完整状态返回 0 个错误（实际: ' + errors.length + '）');

console.log('\n=== 测试2：空 meta.name 应报错 ===');
global.editorState = makeEditorState({ meta: { name: '' } });
errors = validateState();
assert(errors.length > 0, '空 meta.name 产生错误');
assert(errors.some(function(e) { return e.field === 'meta.name'; }), '错误包含 meta.name 字段');

console.log('\n=== 测试3：空 coffee.name 应报错 ===');
global.editorState = makeEditorState({ coffee: { name: '' } });
errors = validateState();
assert(errors.some(function(e) { return e.field === 'coffee.name'; }), '空 coffee.name 产生错误');

console.log('\n=== 测试4：空 equipment.brewer 应报错 ===');
global.editorState = makeEditorState({ equipment: { brewer: '' } });
errors = validateState();
assert(errors.some(function(e) { return e.field === 'equipment.brewer'; }), '空 equipment.brewer 产生错误');

console.log('\n=== 测试5：粉量边界值 — 0g 非法 ===');
global.editorState = makeEditorState();
global.editorState.recipe.dose.value = 0;
errors = validateState();
assert(errors.some(function(e) { return e.field === 'recipe.dose.value'; }), '0g 粉量产生错误');

console.log('\n=== 测试6：粉量边界值 — 100g 合法 ===');
global.editorState = makeEditorState();
global.editorState.recipe.dose.value = 100;
errors = validateState();
assert(!errors.some(function(e) { return e.field === 'recipe.dose.value'; }), '100g 粉量不产生剂量错误');

console.log('\n=== 测试7：粉量边界值 — 101g 非法 ===');
global.editorState = makeEditorState();
global.editorState.recipe.dose.value = 101;
errors = validateState();
assert(errors.some(function(e) { return e.field === 'recipe.dose.value'; }), '101g 粉量产生错误');

console.log('\n=== 测试8：水量边界值 — 0ml 非法 ===');
global.editorState = makeEditorState();
global.editorState.recipe.waterAmount.value = 0;
errors = validateState();
assert(errors.some(function(e) { return e.field === 'recipe.waterAmount.value'; }), '0ml 水量产生错误');

console.log('\n=== 测试9：水量边界值 — 2000ml 合法 ===');
global.editorState = makeEditorState();
global.editorState.recipe.waterAmount.value = 2000;
errors = validateState();
assert(!errors.some(function(e) { return e.field === 'recipe.waterAmount.value'; }), '2000ml 水量不产生错误');

console.log('\n=== 测试10：水温边界值 — -1°C 非法 ===');
global.editorState = makeEditorState();
global.editorState.recipe.waterTemperature.value = -1;
errors = validateState();
assert(errors.some(function(e) { return e.field === 'recipe.waterTemperature.value'; }), '-1°C 水温产生错误');

console.log('\n=== 测试11：水温边界值 — 100°C 合法 ===');
global.editorState = makeEditorState();
global.editorState.recipe.waterTemperature.value = 100;
errors = validateState();
assert(!errors.some(function(e) { return e.field === 'recipe.waterTemperature.value'; }), '100°C 水温不产生错误');

// ---- 结果 ----
console.log('\n' + '='.repeat(40));
console.log(passed + '/' + total + ' 通过');
if (failed > 0) { console.log(failed + ' 失败'); process.exit(1); }
