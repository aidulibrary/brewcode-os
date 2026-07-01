/*
 * BrewCode OS Portal — 官网首页脚本
 * 功能：i18n 加载、主题切换
 * 零框架依赖，i18n 词条内嵌，file:// 和 HTTP 双环境兼容
 */

(function () {
  'use strict';

  var isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  function getCookie(n) { var m = document.cookie.match(new RegExp('(^| )' + n + '=([^;]+)')); return m ? m[2] : null; }
  function setCookie(n, v) { document.cookie = n + '=' + v + '; path=/; max-age=31536000; SameSite=Lax' + (isLocal ? '' : '; domain=.礼字号.中国'); }

  /* ================================================================
   * i18n 词条（内嵌，零网络请求）
   * ================================================================ */

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
      'nav.certified': '认证设备',
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
      'nav.certified': 'Certified',
    },

  /* ================================================================
   * 主题管理
   * ================================================================ */

  var Theme = {
    get: function () {
      return (
        document.documentElement.getAttribute('data-theme') ||
        getCookie('brewcode_theme') ||
        localStorage.getItem('brewcode_theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      );
    },

    set: function (name) {
      document.documentElement.setAttribute('data-theme', name);
      localStorage.setItem('brewcode_theme', name);
      setCookie('brewcode_theme', name);
      this.updateButton(name);
    },

    toggle: function () {
      var current = this.get();
      this.set(current === 'dark' ? 'light' : 'dark');
    },

    updateButton: function (name) {
      var btn = document.getElementById('btn-theme');
      if (btn) {
        btn.textContent = name === 'dark' ? '☀️ 浅色' : '🌙 深色';
        btn.classList.toggle('active', name === 'light');
      }
    },

    init: function () {
      var current = this.get();
      this.set(current);
      this.updateButton(current);

      var btn = document.getElementById('btn-theme');
      if (btn) {
        btn.addEventListener('click', function () {
          Theme.toggle();
        });
      }

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!getCookie('brewcode_theme') && !localStorage.getItem('brewcode_theme')) {
          Theme.set(e.matches ? 'dark' : 'light');
        }
      });
    },
  };

  /* ================================================================
   * 语言管理
   * ================================================================ */

  var Lang = {
    current: 'zh',

    get: function () {
      var q = new URLSearchParams(window.location.search).get('lang');
      if (q === 'zh' || q === 'en') return q;
      var cookie = getCookie('brewcode_lang');
      if (cookie === 'zh' || cookie === 'en') return cookie;
      var stored = localStorage.getItem('brewcode_lang');
      if (stored === 'zh' || stored === 'en') return stored;
      var nav = (navigator.language || '').toLowerCase();
      return nav.startsWith('zh') ? 'zh' : 'en';
    },

    set: function (lang) {
      this.current = lang;
      localStorage.setItem('brewcode_lang', lang);
      setCookie('brewcode_lang', lang);
      this.updateButton(lang);
    },

    toggle: function () {
      this.set(this.current === 'zh' ? 'en' : 'zh');
    },

    updateButton: function (lang) {
      var btn = document.getElementById('btn-lang');
      if (btn) {
        btn.textContent = lang === 'zh' ? 'EN' : '中';
        btn.classList.toggle('active', lang === 'en');
      }
    },
  };

  /* ================================================================
   * i18n 渲染
   * ================================================================ */

  function renderI18n(lang) {
    var dict = DICT[lang];
    if (!dict) return;

    var els = document.querySelectorAll('[data-i18n]');
    els.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = dict[key];
      if (val !== undefined && val !== null) {
        el.textContent = val;
      }
    });
  }

  /* ================================================================
   * 初始化
   * ================================================================ */

  function init() {
    Theme.init();

    var initialLang = Lang.get();
    Lang.current = initialLang;
    Lang.updateButton(initialLang);
    renderI18n(initialLang);

    var btn = document.getElementById('btn-lang');
    if (btn) {
      btn.addEventListener('click', function () {
        Lang.toggle();
        renderI18n(Lang.current);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();