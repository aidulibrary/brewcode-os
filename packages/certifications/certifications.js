(function () {
  'use strict';

  var $ = function (s) {
    return document.querySelector(s);
  };

  /* ── Mock Data ── */
  var MOCK_DEVICES = [
    {
      id: 'BC-L1-2026-0001',
      manufacturer: 'Fellow',
      model: 'Stagg EKG 智能温控手冲壶',
      level: 'L1',
      certified_date: '2026-06-25',
      description: '可变温控（40-100°C，±1°C），LCD 实时温度。通过 Fellow Updater 接收远程参数设置，支持 .brew waterTemperature 字段直接映射。',
      logo_url: '',
      product_url: 'https://fellowproducts.com/products/stagg-ekg',
    },
    {
      id: 'BC-L1-2026-0002',
      manufacturer: 'Acaia',
      model: 'Lunar 智能咖啡秤',
      level: 'L1',
      certified_date: '2026-06-25',
      description: '0.1g 精度，20ms 响应，蓝牙连接 Acaia Brewguide。支持接收 .brew 的 dose/waterAmount 参数并实时显示目标重量。',
      logo_url: '',
      product_url: 'https://acaia.co/products/acaia-lunar-2021',
    },
    {
      id: 'BC-L2-2026-0001',
      manufacturer: 'Acaia',
      model: 'Pearl Model S 智能咖啡秤',
      level: 'L2',
      certified_date: '2026-06-25',
      description: '高亮点阵屏显示冲煮食谱与流速曲线。通过 App 导入 .brew 完整 steps 数组，分步引导注水节奏与重量目标，实时记录冲煮数据。',
      logo_url: '',
      product_url: 'https://acaia.co/products/acaia-pearl-model-s',
    },
    {
      id: 'BC-L2-2026-0002',
      manufacturer: 'Fellow',
      model: 'Aiden 智能手冲机',
      level: 'L2',
      certified_date: '2026-06-25',
      description: 'App 控制，±1°C 精确控温，单杯至 10 杯批量。解析 .brew 完整配方，按 steps 数组自动执行注水时序与温度调节。',
      logo_url: '',
      product_url: 'https://fellowproducts.com/products/aiden',
    },
    {
      id: 'BC-L3-2026-0001',
      manufacturer: 'xBloom',
      model: 'Studio 全自动手冲系统',
      level: 'L3',
      certified_date: '2026-06-25',
      description: '内置磨豆机+智能秤+自动注水一体化。导入 .brew 文件执行全流程，实时采集温度/流量/萃取率数据，回写 result 字段生成冲煮记录。',
      logo_url: '',
      product_url: 'https://xbloom.com/pages/studio',
    },
    {
      id: 'BC-L3-2026-0002',
      manufacturer: 'Decent Espresso',
      model: 'DE1PRO 智能意式机',
      level: 'L3',
      certified_date: '2026-06-25',
      description: '全数字控制，压力/流量/温度实时曲线编辑。通过 API 导入 .brew espresso 方案，实时记录并回写压力曲线与萃取数据。',
      logo_url: '',
      product_url: 'https://decentespresso.com/model?de1pro',
    },
    {
      id: 'BC-L1-2026-0003',
      manufacturer: 'Timemore 泰摩',
      model: 'Black Mirror Basic 智能咖啡秤',
      level: 'L1',
      certified_date: '2026-07-01',
      description: '0.1g 精度，内置计时器+流速显示。支持接收 .brew 的 dose/waterAmount 参数。超高性价比入门级冲煮辅助设备。',
      logo_url: '',
      product_url: 'https://www.timemore.com',
    },
    {
      id: 'BC-L1-2026-0004',
      manufacturer: 'Felicita',
      model: 'Arc 蓝牙智能咖啡秤',
      level: 'L1',
      certified_date: '2026-07-01',
      description: '蓝牙连接，自动计时+自动去皮，流速追踪与冲泡记录。支持接收 .brew 的重量和时间参数并显示冲煮预设。',
      logo_url: '',
      product_url: 'https://felicitaofficial.com',
    },
    {
      id: 'BC-L1-2026-0005',
      manufacturer: 'IKAPE',
      model: 'KAPO K2 Pro 便携意式机',
      level: 'L1',
      certified_date: '2026-07-15',
      description: '58mm 标准粉碗，蓝牙 App 实时监控萃取参数，陶瓷加热 2 分钟至 93°C。支持接收 .brew 的 temperature/pressure 参数映射。',
      logo_url: '',
      product_url: 'https://ikapestore.com',
    },
    {
      id: 'BC-L1-2026-0006',
      manufacturer: 'Comandante',
      model: 'C40 MK4 手摇磨豆机',
      level: 'L1',
      certified_date: '2026-06-17',
      description: '高精度手摇磨豆机，click 刻度系统可映射至微米级研磨度。已通过语义翻译 API 实现 setting→micron 标准化转换。',
      logo_url: '',
      product_url: 'https://www.comandantegrinder.com',
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
    if (device.param_mapping_url || device.product_url) {
      mappingLink.href = device.param_mapping_url || device.product_url;
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
