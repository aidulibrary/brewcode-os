/*
 * BrewCode OS i18n — 通用多语言加载器
 * 零框架依赖，词条内嵌，file:// 和 HTTP 双环境兼容
 * 体积 < 2KB
 */

var BrewCodeI18n = (function () {
  'use strict';

  var lang = 'zh';
  var loaded = false;
  var callbacks = [];

  var DICT = {
    zh: {
      'hero.description':
        'BrewCode OS 是一个开源项目，为全球咖啡冲煮建立通用数字语言。核心资产是一个名为 .brew 的 JSON 标准文件格式。',
      'buttons.player': '打开 Player',
      'buttons.repo': '浏览方案库',
      'buttons.forge': '创建方案',
      'story.title': '诞生记',
      'tools.title': '工具矩阵',
      'tools.player.name': 'BrewPlayer',
      'tools.player.desc': '打开 .brew 文件，获得分步冲煮引导。离线可用，手机放秤旁，扫一眼就够。',
      'tools.repo.name': 'BrewRepo',
      'tools.repo.desc':
        '浏览社区共享的冲煮方案。50个种子方案覆盖20个产区、6种器具，自由筛选检索。',
      'tools.forge.name': 'BrewForge',
      'tools.forge.desc':
        '可视化创建和编辑 .brew 文件。表单模式适合新手，代码模式适合极客。内置 Schema 实时校验。',
      'data.title': '数据叙事',
      'data.recipes': '种子方案',
      'data.origins': '产区覆盖',
      'data.brewers': '冲煮器具',
      'data.champions': '世界冠军署名',
      'community.title': '加入我们',
      'community.desc':
        'BrewCode OS 是一个开放项目。标准、工具、方案——全部开源，全部在 GitHub 上协作。',
      'community.github': 'GitHub 仓库',
      'community.whitepaper': '白皮书',
      'community.contact': '联系方式',
      'community.fork': 'Fork it.',
      'footer.license': '许可证：CC0 1.0（公共领域）',
      'footer.founder': '创始人：李泊言 Bowen Lee',
      'footer.year': '2026',
      'footer.brand': 'BrewCode OS · 礼字号',
    },
    en: {
      'hero.description':
        'BrewCode OS is an open-source project building a universal digital language for coffee brewing. Its core asset is an open JSON file format called .brew.',
      'buttons.player': 'Open Player',
      'buttons.repo': 'Browse Recipes',
      'buttons.forge': 'Create Recipe',
      'story.title': 'Genesis',
      'tools.title': 'Tool Matrix',
      'tools.player.name': 'BrewPlayer',
      'tools.player.desc':
        'Open .brew files, get step-by-step brewing guidance. Works offline. Phone on the scale, glance and go.',
      'tools.repo.name': 'BrewRepo',
      'tools.repo.desc':
        'Browse community-shared brew recipes. 50 seed recipes covering 20 origins and 6 brewers. Filter and search freely.',
      'tools.forge.name': 'BrewForge',
      'tools.forge.desc':
        'Visually create and edit .brew files. Form mode for beginners, code mode for geeks. Built-in Schema real-time validation.',
      'data.title': 'By the Numbers',
      'data.recipes': 'Seed Recipes',
      'data.origins': 'Origins Covered',
      'data.brewers': 'Brewing Devices',
      'data.champions': 'World Champion Signatures',
      'community.title': 'Join Us',
      'community.desc':
        'BrewCode OS is an open project. Standards, tools, recipes—all open source, all collaborating on GitHub.',
      'community.github': 'GitHub Repository',
      'community.whitepaper': 'Whitepaper',
      'community.contact': 'Contact',
      'community.fork': 'Fork it.',
      'footer.license': 'License: CC0 1.0 (Public Domain)',
      'footer.founder': 'Founder: Bowen Lee 李泊言',
      'footer.year': '2026',
      'footer.brand': 'BrewCode OS · 礼字号',
    },
  };

  function detectLang() {
    var q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'zh' || q === 'en') return q;
    var nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('zh')) return 'zh';
    return 'en';
  }

  function load(langOverride) {
    var target = langOverride || detectLang();
    lang = target;
    loaded = true;

    callbacks.forEach(function (cb) {
      cb(lang, DICT[lang] || {});
    });
    callbacks = [];
  }

  function t(path) {
    var dict = DICT[lang] || DICT.zh;
    var val = dict[path];
    return val !== undefined && val !== null ? val : path;
  }

  function onReady(cb) {
    if (loaded) {
      cb(lang, DICT[lang] || {});
    } else {
      callbacks.push(cb);
    }
  }

  function getLang() {
    return lang;
  }

  return {
    load: load,
    t: t,
    onReady: onReady,
    getLang: getLang,
  };
})();
