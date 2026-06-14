(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);

  /* ── Player base URL ── */
  const PLAYER_BASE = '../player/index.html';
  const SEEDS_DIR = '../player/seeds/';

  /* ── State ── */
  let allRecipes = [];
  let activeFilters = { brewer: null, roast: null, country: null };
  let searchQuery = '';

  /* ── Roast level normalization ── */
  function normalizeRoast(raw) {
    if (!raw) return '未知';
    const r = raw.trim();
    if (r.startsWith('浅')) return '浅烘';
    if (r.startsWith('中')) return '中烘';
    if (r.startsWith('深')) return '深烘';
    return r;
  }

  /* ── Brewer normalization ── */
  function normalizeBrewer(raw) {
    if (!raw) return '未知';
    if (raw === 'V60' || raw === 'V60-01' || raw === 'V60-02') return 'V60';
    if (raw.includes('Kalita')) return 'Kalita Wave';
    if (raw.includes('Origami')) return 'Origami';
    if (raw.includes('Chemex')) return 'Chemex';
    if (raw === '爱乐压' || raw === 'Aeropress') return '爱乐压';
    if (raw.includes('法压') || raw === 'French Press') return '法压壶';
    return raw;
  }

  /* ── Fetch manifest ── */
  async function loadManifest() {
    try {
      const resp = await fetch('../player/seeds-manifest.json');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      allRecipes = await resp.json();
      init();
    } catch (e) {
      $('#stats-text').textContent = '加载失败：' + e.message;
      console.error(e);
    }
  }

  /* ── Extract metadata ── */
  function getUniqueBrewers() {
    const set = new Set();
    allRecipes.forEach((r) => {
      const b = normalizeBrewer(r.equipment && r.equipment.brewer);
      if (b) set.add(b);
    });
    return Array.from(set).sort();
  }

  function getUniqueRoasts() {
    const set = new Set();
    allRecipes.forEach((r) => {
      const roast = normalizeRoast(r.coffee && r.coffee.roastLevel);
      if (roast) set.add(roast);
    });
    return Array.from(set).sort();
  }

  function getUniqueCountries() {
    const set = new Set();
    allRecipes.forEach((r) => {
      const country = r.coffee && r.coffee.country;
      if (country) set.add(country);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh'));
  }

  /* ── Build filter pills ── */
  function buildPills(containerId, items, filterKey, currentActive) {
    const container = $('#' + containerId);
    container.innerHTML = '';

    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.className = 'pill' + (currentActive === item ? ' active' : '');
      btn.textContent = item;
      btn.addEventListener('click', () => {
        if (activeFilters[filterKey] === item) {
          activeFilters[filterKey] = null;
        } else {
          activeFilters[filterKey] = item;
        }
        renderPills();
        renderCards();
      });
      container.appendChild(btn);
    });
  }

  function renderPills() {
    buildPills('filter-brewer', getUniqueBrewers(), 'brewer', activeFilters.brewer);
    buildPills('filter-roast', getUniqueRoasts(), 'roast', activeFilters.roast);
    buildPills('filter-country', getUniqueCountries(), 'country', activeFilters.country);
  }

  /* ── Filter logic ── */
  function matchesFilters(recipe) {
    if (activeFilters.brewer) {
      if (normalizeBrewer(recipe.equipment && recipe.equipment.brewer) !== activeFilters.brewer)
        return false;
    }
    if (activeFilters.roast) {
      if (normalizeRoast(recipe.coffee && recipe.coffee.roastLevel) !== activeFilters.roast)
        return false;
    }
    if (activeFilters.country) {
      if ((recipe.coffee && recipe.coffee.country) !== activeFilters.country) return false;
    }
    return true;
  }

  function matchesSearch(recipe) {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const fields = [
      recipe.name,
      recipe.author,
      recipe.coffee && recipe.coffee.name,
      recipe.coffee && recipe.coffee.country,
      recipe.coffee && recipe.coffee.region,
      recipe.tags && recipe.tags.join(' '),
    ];
    return fields.some((f) => f && f.toLowerCase().includes(q));
  }

  function getFiltered() {
    return allRecipes.filter((r) => matchesFilters(r) && matchesSearch(r));
  }

  /* ── Render cards ── */
  function renderCards() {
    const filtered = getFiltered();
    const grid = $('#card-grid');
    grid.innerHTML = '';

    if (filtered.length === 0) {
      $('#empty-state').classList.remove('hidden');
      $('#results-count').textContent = '没有匹配的方案';
    } else {
      $('#empty-state').classList.add('hidden');
      $('#results-count').textContent =
        '显示 ' + filtered.length + ' / ' + allRecipes.length + ' 个方案';
    }

    filtered.forEach((recipe) => {
      const card = document.createElement('div');
      card.className = 'recipe-card';

      const brewer = normalizeBrewer(recipe.equipment && recipe.equipment.brewer);
      const roast = normalizeRoast(recipe.coffee && recipe.coffee.roastLevel);
      const country = recipe.coffee && recipe.coffee.country;

      card.innerHTML =
        '<div class="card-header">' +
        '<span class="card-name">' +
        escHtml(recipe.name) +
        '</span>' +
        (recipe.rating ? '<span class="card-rating">' + recipe.rating + '</span>' : '') +
        '</div>' +
        '<div class="card-meta">' +
        (country ? '<span>' + escHtml(country) + '</span>' : '') +
        (country && recipe.equipment && recipe.equipment.brewer
          ? '<span class="card-meta-sep">·</span>'
          : '') +
        (recipe.equipment && recipe.equipment.brewer
          ? '<span>' + escHtml(brewer) + '</span>'
          : '') +
        (roast ? '<span class="card-meta-sep">·</span><span>' + escHtml(roast) + '</span>' : '') +
        '</div>' +
        '<div class="card-tags">' +
        '<span class="card-tag brewer">' +
        escHtml(brewer) +
        '</span>' +
        '<span class="card-tag roast">' +
        escHtml(roast) +
        '</span>' +
        (country ? '<span class="card-tag country">' + escHtml(country) + '</span>' : '') +
        '</div>' +
        '<div class="card-footer">' +
        '<span class="card-author">' +
        escHtml(recipe.author || '') +
        '</span>' +
        '<span class="card-open">查看详情 →</span>' +
        '</div>';

      card.addEventListener('click', () => openDetail(recipe));
      grid.appendChild(card);
    });
  }

  function renderStats() {
    const brewers = getUniqueBrewers();
    const countries = getUniqueCountries();
    $('#stats-text').innerHTML =
      '共 <strong>' +
      allRecipes.length +
      '</strong> 个方案，覆盖 <strong>' +
      countries.length +
      '</strong> 个产区，<strong>' +
      brewers.length +
      '</strong> 种器具';
  }

  /* ── Detail overlay ── */
  function openDetail(recipe) {
    const c = recipe.coffee || {};
    const e = recipe.equipment || {};
    const rcp = recipe.recipe || {};

    $('#detail-name').textContent = recipe.name;
    $('#detail-author').textContent = recipe.author ? '作者：' + recipe.author : '';

    /* coffee grid */
    const coffeeItems = [];
    if (c.name) coffeeItems.push({ label: '豆子', value: c.name });
    if (c.country)
      coffeeItems.push({ label: '产区', value: c.country + (c.region ? ' / ' + c.region : '') });
    if (c.process) coffeeItems.push({ label: '处理法', value: c.process });
    if (c.roastLevel) coffeeItems.push({ label: '烘焙度', value: normalizeRoast(c.roastLevel) });
    if (c.variety) coffeeItems.push({ label: '品种', value: c.variety });
    if (e.brewer)
      coffeeItems.push({
        label: '器具',
        value: e.brewer + (e.brewerSize ? ' (' + e.brewerSize + ')' : ''),
      });
    if (e.grinder) coffeeItems.push({ label: '磨豆机', value: e.grinder });

    let coffeeHtml = '';
    coffeeItems.forEach((item) => {
      coffeeHtml +=
        '<div class="detail-item">' +
        '<span class="detail-label">' +
        escHtml(item.label) +
        '</span>' +
        '<span class="detail-value">' +
        escHtml(item.value) +
        '</span>' +
        '</div>';
    });
    $('#detail-coffee').innerHTML = coffeeHtml;

    /* recipe grid */
    const recipeItems = [];
    if (rcp.ratio) recipeItems.push({ label: '粉水比', value: rcp.ratio });
    if (rcp.dose) recipeItems.push({ label: '粉量', value: rcp.dose });
    if (rcp.waterAmount) recipeItems.push({ label: '水量', value: rcp.waterAmount });
    if (rcp.waterTemperature) recipeItems.push({ label: '水温', value: rcp.waterTemperature });
    if (rcp.brewTime) recipeItems.push({ label: '冲煮时间', value: rcp.brewTime });

    let recipeHtml = '';
    recipeItems.forEach((item) => {
      recipeHtml +=
        '<div class="detail-item">' +
        '<span class="detail-label">' +
        escHtml(item.label) +
        '</span>' +
        '<span class="detail-value">' +
        escHtml(item.value) +
        '</span>' +
        '</div>';
    });
    $('#detail-recipe').innerHTML = recipeHtml;

    /* flavors */
    let flavorsHtml = '';
    if (c.flavorNotes && c.flavorNotes.length > 0) {
      c.flavorNotes.forEach((f) => {
        flavorsHtml += '<span class="flavor-chip">' + escHtml(f) + '</span>';
      });
    } else {
      flavorsHtml = '<span class="detail-value" style="color:var(--text-dim)">未指定</span>';
    }
    $('#detail-flavors').innerHTML = flavorsHtml;

    /* actions */
    $('#btn-open-player').onclick = function () {
      const playerUrl = PLAYER_BASE + '?brew=' + encodeURIComponent(SEEDS_DIR + recipe.file);
      window.open(playerUrl, '_blank');
    };

    $('#btn-copy-json').onclick = async function () {
      try {
        const resp = await fetch(SEEDS_DIR + recipe.file);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const text = await resp.text();
        await navigator.clipboard.writeText(text);
        showToast('已复制 .brew 内容到剪贴板');
      } catch (e) {
        showToast('复制失败：' + e.message);
      }
    };

    $('#detail-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    $('#detail-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ── Toast ── */
  let toastTimer = null;
  function showToast(msg) {
    let toast = $('#toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
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

    $('#search-input').addEventListener('input', function () {
      searchQuery = this.value.trim();
      if (searchQuery) {
        $('#btn-clear-search').classList.remove('hidden');
      } else {
        $('#btn-clear-search').classList.add('hidden');
      }
      renderCards();
    });

    $('#btn-clear-search').addEventListener('click', function () {
      $('#search-input').value = '';
      searchQuery = '';
      this.classList.add('hidden');
      renderCards();
    });

    $('#btn-reset').addEventListener('click', function () {
      activeFilters = { brewer: null, roast: null, country: null };
      searchQuery = '';
      $('#search-input').value = '';
      $('#btn-clear-search').classList.add('hidden');
      renderPills();
      renderCards();
    });
  }

  /* ── Init ── */
  function init() {
    renderStats();
    renderPills();
    renderCards();
    bindEvents();
  }

  loadManifest();
})();
