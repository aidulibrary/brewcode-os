/*
 * BrewCode OS 统一导航栏组件
 * 零框架原生 JS，复用 BrewCodeI18n 多语言模块
 * 用法：createNavbar('home' | 'player' | 'repo' | 'forge')
 */

function createNavbar(currentPage) {
  'use strict';

  /* 确保 i18n 已初始化 */
  if (typeof BrewCodeI18n !== 'undefined' && typeof BrewCodeI18n.load === 'function') {
    BrewCodeI18n.load();
  }

  function getLang() {
    if (typeof BrewCodeI18n !== 'undefined' && typeof BrewCodeI18n.getLang === 'function') {
      return BrewCodeI18n.getLang();
    }
    var nav = (navigator.language || '').toLowerCase();
    return nav.startsWith('zh') ? 'zh' : 'en';
  }

  var lang = getLang();

  var NAV_LABELS = {
    zh: { home: '首页', player: 'Player', repo: 'Repo', forge: 'Forge' },
    en: { home: 'Home', player: 'Player', repo: 'Repo', forge: 'Forge' },
  };

  var t = NAV_LABELS[lang] || NAV_LABELS.zh;

  var NAV_ITEMS = [
    { id: 'home', href: 'https://brewcode.礼字号.中国', label: t.home },
    { id: 'player', href: 'https://player.礼字号.中国', label: t.player },
    { id: 'repo', href: 'https://repo.礼字号.中国', label: t.repo },
    { id: 'forge', href: 'https://forge.礼字号.中国', label: t.forge },
  ];

  var logoHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" aria-label="BrewCode OS">' +
    '<defs><linearGradient id="nb-bean" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#E8A850"/><stop offset="100%" stop-color="#C08030"/>' +
    '</linearGradient></defs>' +
    '<ellipse cx="100" cy="100" rx="70" ry="85" fill="url(#nb-bean)" stroke="#3E2723" stroke-width="2.5"/>' +
    '<path d="M100 18 Q85 100 100 182" stroke="#3E2723" stroke-width="2" fill="none" opacity="0.6"/>' +
    '<text x="65" y="118" font-family="Georgia,serif" font-size="42" font-weight="bold" fill="#3E2723" text-anchor="middle">{</text>' +
    '<text x="135" y="118" font-family="Georgia,serif" font-size="42" font-weight="bold" fill="#3E2723" text-anchor="middle">}</text>' +
    '<line x1="48" y1="75" x2="58" y2="75" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>' +
    '<line x1="48" y1="145" x2="58" y2="145" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>' +
    '<line x1="142" y1="75" x2="152" y2="75" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>' +
    '<line x1="142" y1="145" x2="152" y2="145" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>' +
    '<circle cx="93" cy="98" r="2.5" fill="#3E2723"/>' +
    '</svg>';

  var linksHTML = '';
  for (var i = 0; i < NAV_ITEMS.length; i++) {
    var item = NAV_ITEMS[i];
    var activeClass = item.id === currentPage ? ' class="active"' : '';
    linksHTML += '<li><a href="' + item.href + '"' + activeClass + '>' + item.label + '</a></li>';
  }

  var actionsHTML =
    '<div class="bc-navbar-actions">' +
    '<button class="bc-navbar-btn" id="bc-btn-theme" aria-label="切换主题">☀️</button>' +
    '<button class="bc-navbar-btn" id="bc-btn-lang" aria-label="切换语言">EN</button>' +
    '</div>';

  var nav = document.createElement('nav');
  nav.className = 'bc-navbar';
  nav.setAttribute('aria-label', '站点导航');
  nav.innerHTML =
    '<a class="bc-navbar-logo" href="https://brewcode.礼字号.中国" title="BrewCode OS">' +
    logoHTML +
    '<span class="bc-navbar-logo-text">BrewCode</span>' +
    '</a>' +
    '<button class="bc-navbar-toggle" aria-label="菜单" aria-expanded="false">&#9776;</button>' +
    '<ul class="bc-navbar-links">' +
    linksHTML +
    '</ul>' +
    actionsHTML;

  document.body.insertBefore(nav, document.body.firstChild);

  /* 汉堡菜单交互 */
  var toggle = nav.querySelector('.bc-navbar-toggle');
  var links = nav.querySelector('.bc-navbar-links');

  toggle.addEventListener('click', function () {
    var isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  /* 点击导航链接后自动关闭菜单 */
  var anchors = links.querySelectorAll('a');
  for (var j = 0; j < anchors.length; j++) {
    anchors[j].addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  /* 点击导航栏外部关闭菜单 */
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ================================================================
   * 主题切换
   * ================================================================ */
  var Theme = {
    get: function () {
      return (
        document.documentElement.getAttribute('data-theme') ||
        localStorage.getItem('brewcode-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      );
    },
    set: function (name) {
      document.documentElement.setAttribute('data-theme', name);
      localStorage.setItem('brewcode-theme', name);
      this.updateButton(name);
    },
    toggle: function () {
      var current = this.get();
      this.set(current === 'dark' ? 'light' : 'dark');
    },
    updateButton: function (name) {
      var btn = document.getElementById('btn-theme');
      if (btn) {
        btn.textContent = name === 'dark' ? '☀️' : '🌙';
      }
    },
    init: function () {
      var current = this.get();
      this.set(current);
      var btn = document.getElementById('btn-theme');
      if (btn) {
        btn.addEventListener('click', function () { Theme.toggle(); });
      }
    }
  };

  /* ================================================================
   * 语言切换
   * ================================================================ */
  var Lang = {
    current: lang,

    toggle: function () {
      this.current = this.current === 'zh' ? 'en' : 'zh';
      localStorage.setItem('brewcode-lang', this.current);
      this.updateButton();

      /* 重新渲染导航链接文字 */
      var labels = NAV_LABELS[this.current] || NAV_LABELS.zh;
      var items = links.querySelectorAll('li a');
      for (var k = 0; k < items.length; k++) {
        var itemId = NAV_ITEMS[k] ? NAV_ITEMS[k].id : null;
        if (itemId && labels[itemId]) {
          items[k].textContent = labels[itemId];
        }
      }
    },

    updateButton: function () {
      var btn = document.getElementById('bc-btn-lang');
      if (btn) {
        btn.textContent = this.current === 'zh' ? 'EN' : '中';
      }
    }
  };

  /* 初始化主题和语言按钮 */
  Theme.init();

  var btnLang = document.getElementById('bc-btn-lang');
  if (btnLang) {
    btnLang.addEventListener('click', function () { Lang.toggle(); });
  }
}
