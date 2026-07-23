(function () {
  'use strict';

  var $ = function (s) {
    return document.querySelector(s);
  };

  /* ── Mock Data ── */
  var MOCK_DEVICES = [
    {
      id: 'BC-L1-2026-0001',
      manufacturer: 'BrewCode 实验室',
      model: 'BrewCode 智能控温手冲壶 S1',
      level: 'L1',
      certified_date: '2026-06-25',
      description:
        'BrewCode 首款自研温控手冲壶，支持精准控温（±1°C），通过蓝牙接收 .brew 文件核心参数并自动设置目标温度。',
      logo_url: '',
      param_mapping_url:
        'https://github.com/brewcode-os/brewcode-os/blob/main/certifications/param-mappings/BC-L1-2026-0001.md',
    },
    {
      id: 'BC-L2-2026-0001',
      manufacturer: 'BrewCode 实验室',
      model: 'BrewCode 智能冲煮引导系统 T1',
      level: 'L2',
      certified_date: '2026-06-25',
      description:
        'BrewCode 全功能冲煮引导设备，解析 .brew 文件完整 steps 数组，按步骤引导用户完成冲煮流程，支持暂停/跳过操作。',
      logo_url: '',
      param_mapping_url:
        'https://github.com/brewcode-os/brewcode-os/blob/main/certifications/param-mappings/BC-L2-2026-0001.md',
    },
    {
      id: 'BC-L3-2026-0001',
      manufacturer: 'BrewCode 实验室',
      model: 'BrewCode 专业冲煮工作站 P1',
      level: 'L3',
      certified_date: '2026-06-25',
      description:
        'BrewCode 旗舰级专业冲煮工作站，配备全传感器阵列，实时记录水温、流量、时间数据，自动回写完整冲煮记录到 .brew 文件 result 字段。',
      logo_url: '',
      param_mapping_url:
        'https://github.com/brewcode-os/brewcode-os/blob/main/certifications/param-mappings/BC-L3-2026-0001.md',
    },
  ];

  /* ── Level descriptions ── */
  var LEVEL_INFO = {
    L1: {
      nameKey: 'level.l1.name',
      descKey: 'level.l1.desc',
      fullDesc:
        'L1 Ready 就绪级：设备能够接收并处理 .brew 文件的核心参数（粉量、水量、水温、研磨度），通过 API 或手动输入方式设置参数。',
    },
    L2: {
      nameKey: 'level.l2.name',
      descKey: 'level.l2.desc',
      fullDesc:
        'L2 Interactive 交互级：在 L1 基础上，设备能够解析完整的 steps 数组，并按步骤顺序执行冲煮操作，提供步骤提示和交互控制。',
    },
    L3: {
      nameKey: 'level.l3.name',
      descKey: 'level.l3.desc',
      fullDesc:
        'L3 Native 原生级：在 L2 基础上，设备具备完整的数据记录能力，实时采集冲煮过程数据，并回写到 .brew 文件的 result 字段。',
    },
  };

  /* ── State ── */
  var devices = [];
  var activeLevel = null;

  /* ── Load devices ── */
  function loadDevices() {
    showLoading();
    fetch('/api/cert/devices')
      .then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(function (data) {
        devices = data.devices || [];
        if (devices.length === 0) {
          devices = MOCK_DEVICES;
          console.log('[CertPage] API 返回空数据，使用模拟数据');
        }
        render();
      })
      .catch(function (e) {
        console.warn('[CertPage] API 不可用，使用模拟数据:', e.message);
        devices = MOCK_DEVICES;
        render();
      });
  }

  /* ── Show/Hide states ── */
  function showLoading() {
    $('#loading-state').classList.remove('hidden');
    $('#error-state').classList.add('hidden');
    $('#empty-state').classList.add('hidden');
    $('#devices-grid').classList.add('hidden');
  }

  function showError() {
    $('#loading-state').classList.add('hidden');
    $('#error-state').classList.remove('hidden');
    $('#empty-state').classList.add('hidden');
    $('#devices-grid').classList.add('hidden');
  }

  function showEmpty() {
    $('#loading-state').classList.add('hidden');
    $('#error-state').classList.add('hidden');
    $('#empty-state').classList.remove('hidden');
    $('#devices-grid').classList.add('hidden');
  }

  function showDevices() {
    $('#loading-state').classList.add('hidden');
    $('#error-state').classList.add('hidden');
    $('#empty-state').classList.add('hidden');
    $('#devices-grid').classList.remove('hidden');
  }

  /* ── Render ── */
  function render() {
    renderStats();
    renderPills();
    renderCards();
  }

  function renderStats() {
    var total = devices.length;
    var l1 = devices.filter(function (d) {
      return d.level === 'L1';
    }).length;
    var l2 = devices.filter(function (d) {
      return d.level === 'L2';
    }).length;
    var l3 = devices.filter(function (d) {
      return d.level === 'L3';
    }).length;

    $('#stats-text').innerHTML =
      BrewCodeI18n.t('stats.total') +
      ' <strong>' +
      total +
      '</strong> ' +
      BrewCodeI18n.t('stats.devices') +
      ' · L1 <strong>' +
      l1 +
      '</strong> · L2 <strong>' +
      l2 +
      '</strong> · L3 <strong>' +
      l3 +
      '</strong>';
  }

  function renderPills() {
    var container = $('#filter-levels');
    var levels = ['all', 'L1', 'L2', 'L3'];
    var counts = {
      all: devices.length,
      L1: devices.filter(function (d) {
        return d.level === 'L1';
      }).length,
      L2: devices.filter(function (d) {
        return d.level === 'L2';
      }).length,
      L3: devices.filter(function (d) {
        return d.level === 'L3';
      }).length,
    };

    container.innerHTML = '';
    levels.forEach(function (lvl) {
      var btn = document.createElement('button');
      var isActive = (lvl === 'all' && !activeLevel) || activeLevel === lvl;
      btn.className = 'pill' + (isActive ? ' active' : '');
      btn.innerHTML =
        BrewCodeI18n.t('filter.' + (lvl === 'all' ? 'all' : lvl.toLowerCase())) +
        ' <span class="pill-count">' +
        counts[lvl] +
        '</span>';
      btn.addEventListener('click', function () {
        activeLevel = lvl === 'all' ? null : lvl;
        renderPills();
        renderCards();
      });
      container.appendChild(btn);
    });
  }

  function getFiltered() {
    if (!activeLevel) return devices;
    return devices.filter(function (d) {
      return d.level === activeLevel;
    });
  }

  function renderCards() {
    var filtered = getFiltered();

    if (filtered.length === 0) {
      showEmpty();
      return;
    }

    showDevices();
    var grid = $('#devices-grid');
    grid.innerHTML = '';

    filtered.forEach(function (device) {
      var card = document.createElement('div');
      card.className = 'device-card';

      var levelClass = device.level.toLowerCase();
      var levelName = BrewCodeI18n.t('level.' + device.level.toLowerCase() + '.name');

      card.innerHTML =
        '<div class="card-header">' +
        '<div>' +
        '<div class="card-model">' +
        escHtml(device.model) +
        '</div>' +
        '<div class="card-manufacturer">' +
        escHtml(device.manufacturer) +
        '</div>' +
        '</div>' +
        '<span class="level-badge ' +
        levelClass +
        '">' +
        escHtml(levelName) +
        '</span>' +
        '</div>' +
        '<div class="card-meta">' +
        '<span class="card-id">' +
        escHtml(device.id) +
        '</span>' +
        '<span class="card-date">' +
        escHtml(device.certified_date) +
        '</span>' +
        '</div>' +
        '<div class="card-description">' +
        escHtml(device.description) +
        '</div>' +
        '<div class="card-footer">' +
        '<span class="card-open">' +
        BrewCodeI18n.t('detail.close') +
        ' →</span>' +
        '</div>';

      card.addEventListener('click', function () {
        openDetail(device);
      });
      grid.appendChild(card);
    });
  }

  /* ── Detail overlay ── */
  function openDetail(device) {
    var levelClass = device.level.toLowerCase();
    var levelName = BrewCodeI18n.t('level.' + device.level.toLowerCase() + '.name');
    var levelInfo = LEVEL_INFO[device.level];

    $('#detail-model').textContent = device.model;
    $('#detail-manufacturer').textContent = device.manufacturer;
    $('#detail-id').textContent = device.id;
    $('#detail-date').textContent = device.certified_date;
    $('#detail-description').textContent = device.description;

    var badge = $('#detail-level-badge');
    badge.className = 'level-badge ' + levelClass;
    badge.textContent = levelName;

    var logoContainer = $('#detail-logo-container');
    var logoImg = $('#detail-logo');
    if (device.logo_url) {
      logoImg.src = device.logo_url;
      logoImg.alt = device.manufacturer;
      logoImg.style.display = '';
      logoContainer.querySelector('.detail-logo-placeholder') &&
        logoContainer.querySelector('.detail-logo-placeholder').remove();
    } else {
      logoImg.style.display = 'none';
      if (!logoContainer.querySelector('.detail-logo-placeholder')) {
        var placeholder = document.createElement('span');
        placeholder.className = 'detail-logo-placeholder';
        placeholder.textContent = device.manufacturer.charAt(0).toUpperCase();
        logoContainer.appendChild(placeholder);
      }
    }

    $('#detail-level-info').textContent = levelInfo ? levelInfo.fullDesc : '';

    var mappingLink = $('#detail-mapping-link');
    if (device.param_mapping_url) {
      mappingLink.href = device.param_mapping_url;
      mappingLink.classList.remove('hidden');
    } else {
      mappingLink.classList.add('hidden');
    }

    $('#detail-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    $('#detail-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ── Escape HTML ── */
  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Event bindings ── */
  function bindEvents() {
    $('#btn-detail-close').addEventListener('click', closeDetail);
    $('.detail-backdrop').addEventListener('click', closeDetail);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDetail();
    });

    var hamburger = $('.bc-hamburger');
    var links = $('.bc-links');
    if (hamburger && links) {
      hamburger.addEventListener('click', function () {
        links.classList.toggle('open');
      });
      document.addEventListener('click', function (e) {
        if (!e.target.closest('#bc-navbar')) {
          links.classList.remove('open');
        }
      });
    }
  }

  /* ── Init ── */
  function init() {
    var savedLang = localStorage.getItem('brewcode_lang');
    if (savedLang) {
      BrewCodeI18n.setLang(savedLang);
    }
    function getCookie(n) {
      var m = document.cookie.match(new RegExp('(^| )' + n + '=([^;]+)'));
      return m ? m[2] : null;
    }
    var savedTheme =
      getCookie('brewcode_theme') || localStorage.getItem('brewcode_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    bindEvents();
    loadDevices();
  }

  /* ── Expose refresh for language switch ── */
  window.refreshCertPage = function () {
    render();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
