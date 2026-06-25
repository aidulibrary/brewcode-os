(function () {
  'use strict';

  var currentFilter = 'all';

  var certifiedDevices = [
    {
      id: 'BC-L1-2026-0001',
      manufacturer: 'BrewCode 实验室',
      manufacturerEn: 'BrewCode Lab',
      model: 'BC-Scale Pro',
      deviceType: '冲煮辅助设备',
      deviceTypeEn: 'Brewing Accessory',
      level: 'L1',
      firmwareVersion: 'v2.1.0',
      certifiedDate: '2026-06-20T00:00:00Z',
      mappingUrl: 'https://brewcode.dev/certified/BC-L1-2026-0001/mapping',
      contactEmail: 'lab@brewcode.dev',
    },
    {
      id: 'BC-L2-2026-0001',
      manufacturer: 'BrewCode 实验室',
      manufacturerEn: 'BrewCode Lab',
      model: 'BC-Brewer One',
      deviceType: '手冲设备',
      deviceTypeEn: 'Pour-over Device',
      level: 'L2',
      firmwareVersion: 'v3.0.0',
      certifiedDate: '2026-06-25T00:00:00Z',
      mappingUrl: '',
      contactEmail: 'lab@brewcode.dev',
    },
  ];

  var LEVEL_LABELS = {
    zh: { L1: 'L1 Ready', L2: 'L2 Interactive', L3: 'L3 Native' },
    en: { L1: 'L1 Ready', L2: 'L2 Interactive', L3: 'L3 Native' },
  };

  var DEVICE_TYPE_LABELS = {
    zh: {
      手冲设备: '手冲设备',
      意式咖啡机: '意式咖啡机',
      浸泡式冲煮设备: '浸泡式冲煮设备',
      研磨设备: '研磨设备',
      冲煮辅助设备: '冲煮辅助设备',
      其他: '其他',
    },
    en: {
      手冲设备: 'Pour-over Device',
      意式咖啡机: 'Espresso Machine',
      浸泡式冲煮设备: 'Immersion Brewer',
      研磨设备: 'Grinder',
      冲煮辅助设备: 'Brewing Accessory',
      其他: 'Other',
    },
  };

  function getLang() {
    if (typeof BrewCodeI18n !== 'undefined' && typeof BrewCodeI18n.getLang === 'function') {
      return BrewCodeI18n.getLang();
    }
    return 'zh';
  }

  function t(key) {
    if (typeof BrewCodeI18n !== 'undefined' && typeof BrewCodeI18n.t === 'function') {
      var val = BrewCodeI18n.t(key);
      if (val && val !== key) return val;
    }
    var lang = getLang();
    if (key === 'certified.filter.all') return lang === 'zh' ? '全部' : 'All';
    if (key === 'certified.card.certifiedDate')
      return lang === 'zh' ? '认证日期' : 'Certified Date';
    if (key === 'certified.card.firmware') return lang === 'zh' ? '固件版本' : 'Firmware';
    if (key === 'certified.card.mapping') return lang === 'zh' ? '参数映射表' : 'Parameter Mapping';
    if (key === 'certified.card.deviceType') return lang === 'zh' ? '设备类型' : 'Device Type';
    if (key === 'certified.card.certId') return lang === 'zh' ? '认证编号' : 'Certification ID';
    if (key === 'certified.empty') return lang === 'zh' ? '暂无已认证设备' : 'No Certified Devices';
    if (key === 'certified.emptyHint')
      return lang === 'zh'
        ? '认证设备名录即将上线，敬请期待。'
        : 'The certified device directory is coming soon.';
    return key;
  }

  function formatDate(isoString) {
    var d = new Date(isoString);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function getDeviceName(device) {
    var lang = getLang();
    var mfr = lang === 'en' ? device.manufacturerEn || device.manufacturer : device.manufacturer;
    return mfr + ' ' + device.model;
  }

  function getDeviceTypeLabel(device) {
    var lang = getLang();
    var types = DEVICE_TYPE_LABELS[lang] || DEVICE_TYPE_LABELS.zh;
    var typeKey = device.deviceType;
    return types[typeKey] || typeKey;
  }

  function getLevelLabel(level) {
    var lang = getLang();
    var labels = LEVEL_LABELS[lang] || LEVEL_LABELS.zh;
    return labels[level] || level;
  }

  function renderCertifiedDevices(filter) {
    filter = filter || currentFilter;
    currentFilter = filter;

    var grid = document.getElementById('card-grid');
    var empty = document.getElementById('empty-state');
    var count = document.getElementById('results-count');

    if (!grid || !empty || !count) return;

    var filtered = certifiedDevices;
    if (filter !== 'all') {
      filtered = certifiedDevices.filter(function (d) {
        return d.level === filter;
      });
    }

    var lang = getLang();
    count.textContent =
      (lang === 'zh' ? '显示 ' : 'Showing ') +
      filtered.length +
      (lang === 'zh' ? ' 个设备' : ' device(s)');

    if (filtered.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var dev = filtered[i];
      var deviceName = getDeviceName(dev);
      var deviceType = getDeviceTypeLabel(dev);
      var levelLabel = getLevelLabel(dev.level);
      var certDate = formatDate(dev.certifiedDate);
      var levelClass = 'badge-level-' + dev.level.toLowerCase();

      html += '<div class="cert-card">';
      html += '<div class="cert-card-header">';
      html += '<span class="cert-level-badge ' + levelClass + '">' + levelLabel + '</span>';
      html += '</div>';
      html += '<div class="cert-card-body">';
      html += '<h3 class="cert-device-name">' + escHtml(deviceName) + '</h3>';
      html += '<div class="cert-meta">';
      html += '<span class="cert-meta-item">';
      html += '<span class="cert-meta-label">' + t('certified.card.deviceType') + '</span>';
      html += '<span class="cert-meta-value">' + escHtml(deviceType) + '</span>';
      html += '</span>';
      html += '</div>';
      html += '<div class="cert-specs">';
      html += '<div class="cert-spec-item">';
      html += '<span class="cert-spec-label">' + t('certified.card.certifiedDate') + '</span>';
      html += '<span class="cert-spec-value">' + certDate + '</span>';
      html += '</div>';
      html += '<div class="cert-spec-item">';
      html += '<span class="cert-spec-label">' + t('certified.card.firmware') + '</span>';
      html += '<span class="cert-spec-value">' + escHtml(dev.firmwareVersion) + '</span>';
      html += '</div>';
      html += '</div>';
      html += '<div class="cert-links">';
      if (dev.mappingUrl) {
        html +=
          '<a class="cert-link" href="' +
          escHtml(dev.mappingUrl) +
          '" target="_blank" rel="noopener">' +
          t('certified.card.mapping') +
          ' →</a>';
      }
      html +=
        '<span class="cert-id">' + t('certified.card.certId') + ': ' + escHtml(dev.id) + '</span>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }

    grid.innerHTML = html;
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function bindFilterEvents() {
    var pills = document.querySelectorAll('#filter-pills .pill');
    for (var i = 0; i < pills.length; i++) {
      pills[i].addEventListener('click', function () {
        var filter = this.getAttribute('data-filter');
        for (var j = 0; j < pills.length; j++) {
          pills[j].classList.remove('active');
        }
        this.classList.add('active');
        renderCertifiedDevices(filter);
      });
    }
  }

  function init() {
    bindFilterEvents();
    renderCertifiedDevices('all');
  }

  window.renderCertifiedDevices = renderCertifiedDevices;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
