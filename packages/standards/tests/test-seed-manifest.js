// tests/test-seed-manifest.js
// 零依赖单元测试：seedManifestToBrewData 种子清单转换

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

// ---- Mock 环境（repo.js 需要的最小环境） ----
global.$ = function() { return { onclick: function() {}, on: function() {}, html: function() {}, text: function() {}, append: function() {}, addClass: function() {}, removeClass: function() {} }; };
global.window = global;
function makeMockElement() {
  return { appendChild: function() {}, style: {}, href: '', download: '', click: function() {}, setAttribute: function() {}, textContent: '', innerHTML: '', onclick: null, value: '' };
}
global.document = {
  cookie: '',
  addEventListener: function() {},
  querySelector: function() { return makeMockElement(); },
  querySelectorAll: function() { return []; },
  createElement: function() { return makeMockElement(); },
  body: { appendChild: function() {}, removeChild: function() {} },
  getElementById: function() { return makeMockElement(); },
  createTextNode: function() { return { textContent: '' }; }
};
global.localStorage = { getItem: function() { return null; }, setItem: function() {} };
global.BrewCodeConfig = {
  playerUrl: 'https://player.brewcode.dev',
  forgeUrl: 'https://forge.brewcode.dev',
  repoUrl: 'https://repo.brewcode.dev'
};
global.BrewCodeI18n = {
  t: function(k) { return k; },
  setLang: function() {},
  onReady: function() {},
  load: function() {},
  getLang: function() { return 'zh'; }
};
global.formatDate = function(d) { return d; };
global.console = console;
global.process = process;
global.URL = { createObjectURL: function() { return ''; }, revokeObjectURL: function() {} };
global.Blob = function() {};
global.location = { href: 'http://localhost:8000/', origin: 'http://localhost:8000', pathname: '/' };

// 加载 repo.js
try {
  var fs = require('fs');
  var repoCode = fs.readFileSync(__dirname + '/../../repo/repo.js', 'utf-8');
  repoCode = repoCode.replace(/'use strict';/, '// use strict removed for test');
  (0, eval)(repoCode);
  console.log('repo.js 加载成功\n');
} catch (e) {
  console.error('repo.js 加载失败: ' + e.message);
  process.exit(1);
}

// ---- 测试用例 ----
console.log('=== 测试1：基本种子条目转换 ===');
var entry = {
  file: '01-v60-01-light-yirgacheffe-natural.brew.json',
  name: '经典V60 · 耶加雪菲 日晒 浅烘',
  author: 'brewcode-os/genesis',
  rating: 8.5,
  tags: ['V60', '浅烘', '埃塞俄比亚'],
  coffee: {
    name: '埃塞俄比亚 耶加雪菲',
    country: '埃塞俄比亚',
    region: '耶加雪菲',
    process: '日晒',
    roastLevel: '浅烘',
    variety: 'Heirloom',
    flavorNotes: ['柑橘', '茉莉花'],
    producer: 'Smallholder Farmers'
  },
  equipment: {
    brewer: 'V60',
    brewerSize: '01',
    grinder: 'C40',
    kettle: 'Brewista'
  },
  recipe: {
    dose: '15g',
    waterAmount: '225ml',
    ratio: '1:15',
    waterTemperature: '93°C',
    brewTime: '150s'
  }
};

var result = seedManifestToBrewData(entry);

assertEqual(result.meta.name, '经典V60 · 耶加雪菲 日晒 浅烘', 'meta.name 正确');
assertEqual(result.meta.author, 'brewcode-os/genesis', 'meta.author 正确');
assertEqual(result.meta.rating, 8.5, 'meta.rating 正确');
assertEqual(result.meta.tags.length, 3, 'meta.tags 数量正确');
assertEqual(result.coffee.name, '埃塞俄比亚 耶加雪菲', 'coffee.name 正确');
assertEqual(result.coffee.origin.country, '埃塞俄比亚', 'coffee.origin.country 正确');
assertEqual(result.coffee.origin.region, '耶加雪菲', 'coffee.origin.region 正确');
assertEqual(result.coffee.process, '日晒', 'coffee.process 正确');
assertEqual(result.coffee.roastLevel, '浅烘', 'coffee.roastLevel 正确');
assertEqual(result.coffee.variety, 'Heirloom', 'coffee.variety 正确');
assertEqual(result.coffee.producer, 'Smallholder Farmers', 'coffee.producer 正确');
assertEqual(result.equipment.brewer, 'V60', 'equipment.brewer 正确');
assertEqual(result.equipment.brewerSize, '01', 'equipment.brewerSize 正确');
assertEqual(result.equipment.grinder, 'C40', 'equipment.grinder 正确');
assertEqual(result.equipment.kettle, 'Brewista', 'equipment.kettle 正确');
assertEqual(result.recipe.dose.value, 15, 'recipe.dose.value 解析为数字 15');
assertEqual(result.recipe.waterAmount.value, 225, 'recipe.waterAmount.value 解析为数字 225');
assertEqual(result.recipe.waterTemperature.value, 93, 'recipe.waterTemperature.value 解析为数字 93');
assertEqual(result.recipe.brewTime.value, 150, 'recipe.brewTime.value 解析为数字 150');

console.log('\n=== 测试2：最小化条目（空字段防御） ===');
var minimalEntry = {
  file: 'empty.brew.json',
  name: '',
  author: '',
  tags: [],
  coffee: {},
  equipment: {},
  recipe: {}
};
var result2 = seedManifestToBrewData(minimalEntry);
assertEqual(result2.meta.name, '', '空 name 变为空字符串');
assertEqual(result2.coffee.name, '', '空 coffee.name 变为空字符串');
assertEqual(result2.recipe.dose.value, 0, '空 dose 解析为 0');
assertEqual(result2.recipe.waterAmount.value, 0, '空 waterAmount 解析为 0');
assertEqual(result2.recipe.waterTemperature.value, 0, '空 waterTemperature 解析为 0');

console.log('\n=== 测试3：无 rating 字段 ===');
var noRatingEntry = {
  file: 'test.brew.json',
  name: '测试方案',
  author: '测试',
  tags: [],
  coffee: { name: '咖啡', country: '', region: '', process: '', roastLevel: '', variety: '', flavorNotes: [] },
  equipment: { brewer: 'V60', brewerSize: '', grinder: '' },
  recipe: { dose: '15g', waterAmount: '225ml', ratio: '1:15', waterTemperature: '93°C', brewTime: '150s' }
};
var result3 = seedManifestToBrewData(noRatingEntry);
assert(result3.meta.rating === undefined, '无 rating 字段时不添加 rating 属性');

console.log('\n=== 测试4：可选字段 defense（有则添加，无则跳过） ===');
var entryWithOptions = {
  file: 'test.brew.json',
  name: '测试', author: 'tester', tags: [],
  coffee: { name: 'c', country: 'CN', region: 'R', process: 'P', roastLevel: 'L', variety: 'V', flavorNotes: [], farm: 'Farm X', altitude: '1600m', producer: 'Prod', roaster: 'RoastCo' },
  equipment: { brewer: 'V60', brewerSize: '01', grinder: 'C40', kettle: 'KB', scale: 'S', filter: 'F' },
  recipe: { dose: '18g', waterAmount: '270ml', ratio: '1:15', waterTemperature: '92°C', brewTime: '180s' }
};
var result4 = seedManifestToBrewData(entryWithOptions);
assertEqual(result4.coffee.origin.farm, 'Farm X', 'coffee.origin.farm 可选字段存在');
assertEqual(result4.coffee.origin.altitude, '1600m', 'coffee.origin.altitude 可选字段存在');
assertEqual(result4.coffee.producer, 'Prod', 'coffee.producer 可选字段存在');
assertEqual(result4.coffee.roaster, 'RoastCo', 'coffee.roaster 可选字段存在');
assertEqual(result4.equipment.kettle, 'KB', 'equipment.kettle 可选字段存在');
assertEqual(result4.equipment.scale, 'S', 'equipment.scale 可选字段存在');
assertEqual(result4.equipment.filter, 'F', 'equipment.filter 可选字段存在');

// ---- 结果 ----
console.log('\n' + '='.repeat(40));
console.log(passed + '/' + total + ' 通过');
if (failed > 0) { console.log(failed + ' 失败'); process.exit(1); }
