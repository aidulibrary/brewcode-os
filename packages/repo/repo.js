(function () {
  'use strict';

  function refreshI18nTexts() {
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var key = el.getAttribute('data-i18n');
      if (key) {
        var tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
          el.placeholder = BrewCodeI18n.t(key);
        } else {
          el.textContent = BrewCodeI18n.t(key);
        }
      }
    }
  }

  function refreshAll() {
    refreshI18nTexts();
    renderStats();
    renderPills();
    renderCards();
    renderCommunityCards();
  }

  window.refreshI18nTexts = refreshI18nTexts;
  window.refreshRepo = refreshAll;

  const $ = (s) => document.querySelector(s);

  /* ── Player base URL ── */
  const isLocal =
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  const PLAYER_BASE = isLocal ? 'http://localhost:8789' : 'https://player.礼字号.中国';
  const SEEDS_DIR = 'seeds/';
  const SEEDS_BASE = isLocal ? 'http://localhost:8789/seeds/' : 'https://player.礼字号.中国/seeds/';

  /* ── State ── */
  let allRecipes = [];
  let communityRecipes = [];
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

  /* ── Embedded manifest ── */
  const SEEDS_MANIFEST = [
    {
      file: '01-v60-01-light-yirgacheffe-natural.brew.json',
      name: '夏季八冲 · 埃塞俄比亚 耶加雪菲 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '夏季八冲', '一刀流', '浅烘', '日晒', '埃塞俄比亚', '耶加雪菲'],
      coffee: {
        name: '埃塞俄比亚 耶加雪菲 日晒 浅烘',
        country: '埃塞俄比亚',
        region: '耶加雪菲',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['蓝莓', '草莓', '紫罗兰', '蜂蜜'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '93°C',
        brewTime: '150s',
      },
      rating: 8.5,
    },
    {
      file: '02-v60-02-medium-huila-washed.brew.json',
      name: '经典三段式 · 哥伦比亚 蕙兰 水洗 中烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '三段注水', '经典方案', '中烘', '水洗', '哥伦比亚', '蕙兰'],
      coffee: {
        name: '哥伦比亚 蕙兰 水洗 中烘',
        country: '哥伦比亚',
        region: '蕙兰',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Caturra',
        flavorNotes: ['焦糖', '坚果', '巧克力', '红苹果'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '02',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '18g',
        waterAmount: '270ml',
        waterTemperature: '90°C',
        brewTime: '150s',
      },
      rating: 8,
    },
    {
      file: '03-kalita-155-medium-yirgacheffe-natural.brew.json',
      name: '平底慢萃 · 埃塞俄比亚 耶加雪菲 日晒 中烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '平底滤杯', '慢萃', '中烘', '日晒', '埃塞俄比亚', '耶加雪菲'],
      coffee: {
        name: '埃塞俄比亚 耶加雪菲 日晒 中烘',
        country: '埃塞俄比亚',
        region: '耶加雪菲',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Heirloom',
        flavorNotes: ['焦糖', '杏桃', '花香', '柑橘'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '155',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '91°C',
        brewTime: '180s',
      },
      rating: 8.2,
    },
    {
      file: '04-origami-light-guji-natural.brew.json',
      name: '折纸慢萃 · 埃塞俄比亚 古吉 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '折纸滤杯', '浅烘', '日晒', '埃塞俄比亚', '古吉', '快萃'],
      coffee: {
        name: '埃塞俄比亚 古吉 日晒 浅烘',
        country: '埃塞俄比亚',
        region: '古吉',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['草莓', '蓝莓', '百香果', '焦糖'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '93°C',
        brewTime: '180s',
      },
      rating: 8.8,
    },
    {
      file: '05-chemex-light-ethiopia-guji-natural.brew.json',
      name: 'Chemex 大份优雅 · 埃塞俄比亚 古吉 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Chemex', '大份冲煮', '浅烘', '日晒', '埃塞俄比亚', '古吉', '分享'],
      coffee: {
        name: '埃塞俄比亚 古吉 日晒 浅烘',
        country: '埃塞俄比亚',
        region: '古吉',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['蓝莓', '草莓', '热带水果', '伯爵茶'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '6 Cup',
        grinder: 'Mahlkönig EK43',
      },
      recipe: {
        ratio: '1:16',
        dose: '30g',
        waterAmount: '480ml',
        waterTemperature: '93°C',
        brewTime: '270s',
      },
      rating: 8.5,
    },
    {
      file: '06-aeropress-medium-yirgacheffe-washed.brew.json',
      name: '爱乐压经典 · 埃塞俄比亚 耶加雪菲 水洗 中烘',
      author: 'brewcode-os/genesis',
      tags: ['爱乐压', 'Aeropress', '中烘', '水洗', '埃塞俄比亚', '耶加雪菲', '便携'],
      coffee: {
        name: '埃塞俄比亚 耶加雪菲 水洗 中烘',
        country: '埃塞俄比亚',
        region: '耶加雪菲',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Heirloom',
        flavorNotes: ['茉莉花', '柠檬', '蜂蜜', '绿茶'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '标准',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '90°C',
        brewTime: '120s',
      },
      rating: 8,
    },
    {
      file: '07-frenchpress-medium-cerrado-natural.brew.json',
      name: '法压壶经典 · 巴西 喜拉多 日晒 中烘',
      author: 'brewcode-os/genesis',
      tags: ['法压壶', 'French Press', '全浸泡', '中烘', '日晒', '巴西', '喜拉多'],
      coffee: {
        name: '巴西 喜拉多 日晒 中烘',
        country: '巴西',
        region: '喜拉多',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Bourbon',
        flavorNotes: ['坚果', '巧克力', '焦糖', '花生'],
      },
      equipment: {
        brewer: '法压壶',
        brewerSize: '350ml',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '20g',
        waterAmount: '300ml',
        waterTemperature: '92°C',
        brewTime: '540s',
      },
      rating: 8,
    },
    {
      file: '08-v60-01-medium-antigua-washed.brew.json',
      name: '安提瓜经典 · 危地马拉 安提瓜 水洗 中烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '三段注水', '中烘', '水洗', '危地马拉', '安提瓜', '中美洲经典'],
      coffee: {
        name: '危地马拉 安提瓜 水洗 中烘',
        country: '危地马拉',
        region: '安提瓜',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Bourbon',
        flavorNotes: ['可可', '花香', '柑橘', '烤杏仁'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '90°C',
        brewTime: '150s',
      },
      rating: 8.2,
    },
    {
      file: '09-kalita-155-dark-sumatra-mandheling-wet-hulled.brew.json',
      name: '曼特宁慢萃 · 印尼 苏门答腊 曼特宁 湿刨 深烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '深烘', '湿刨', '曼特宁', '印尼', '苏门答腊', '低温慢萃'],
      coffee: {
        name: '印尼 苏门答腊 曼特宁 湿刨 深烘',
        country: '印尼',
        region: '苏门答腊',
        process: '湿刨',
        roastLevel: '深烘',
        variety: 'Typica',
        flavorNotes: ['黑巧克力', '香料', '雪松', '焦糖'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '155',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:14',
        dose: '15g',
        waterAmount: '210ml',
        waterTemperature: '82°C',
        brewTime: '210s',
      },
      rating: 8,
    },
    {
      file: '10-origami-light-panama-geisha-natural.brew.json',
      name: '折纸瑰夏 · 巴拿马 瑰夏 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '瑰夏', 'Geisha', '浅烘', '日晒', '巴拿马', '波奎特', '冠军豆'],
      coffee: {
        name: '巴拿马 瑰夏 日晒 浅烘',
        country: '巴拿马',
        region: '波奎特',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Geisha',
        flavorNotes: ['草莓', '水蜜桃', '茉莉花', '蜂蜜'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'Mahlkönig EK43',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '93°C',
        brewTime: '150s',
      },
      rating: 9,
    },
    {
      file: '11-v60-01-medium-yirgacheffe-natural.brew.json',
      name: '中烘耶加V60 · 埃塞俄比亚 耶加雪菲 日晒 中烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '中烘', '日晒', '埃塞俄比亚', '耶加雪菲', '日常方案'],
      coffee: {
        name: '埃塞俄比亚 耶加雪菲 日晒 中烘',
        country: '埃塞俄比亚',
        region: '耶加雪菲',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Heirloom',
        flavorNotes: ['焦糖', '杏桃', '花香', '柑橘'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '91°C',
        brewTime: '150s',
      },
      rating: 8.2,
    },
    {
      file: '12-kalita-185-medium-huila-washed.brew.json',
      name: '平底大份 · 哥伦比亚 蕙兰 水洗 中烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '185', '大份量', '中烘', '水洗', '哥伦比亚', '蕙兰', '分享'],
      coffee: {
        name: '哥伦比亚 蕙兰 水洗 中烘',
        country: '哥伦比亚',
        region: '蕙兰',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Caturra',
        flavorNotes: ['焦糖', '坚果', '巧克力', '红苹果'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '185',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '24g',
        waterAmount: '360ml',
        waterTemperature: '90°C',
        brewTime: '210s',
      },
      rating: 8,
    },
    {
      file: '13-chemex-medium-dark-cerrado-natural.brew.json',
      name: 'Chemex 中深烘 · 巴西 喜拉多 日晒 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['Chemex', '中深烘', '日晒', '巴西', '喜拉多', '大份量', '家庭分享'],
      coffee: {
        name: '巴西 喜拉多 日晒 中深烘',
        country: '巴西',
        region: '喜拉多',
        process: '日晒',
        roastLevel: '中深烘',
        variety: 'Bourbon',
        flavorNotes: ['焦糖', '黑巧克力', '坚果', '烤面包'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '8 Cup',
        grinder: 'Mahlkönig EK43',
      },
      recipe: {
        ratio: '1:14',
        dose: '40g',
        waterAmount: '560ml',
        waterTemperature: '88°C',
        brewTime: '300s',
      },
      rating: 8,
    },
    {
      file: '14-aeropress-light-ethiopia-guji-natural.brew.json',
      name: '爱乐压浅烘果香 · 埃塞俄比亚 古吉 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['爱乐压', 'Aeropress', '反压法', '浅烘', '日晒', '埃塞俄比亚', '古吉', '便携'],
      coffee: {
        name: '埃塞俄比亚 古吉 日晒 浅烘',
        country: '埃塞俄比亚',
        region: '古吉',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['草莓', '蓝莓', '百香果', '花香'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '标准',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '93°C',
        brewTime: '120s',
      },
      rating: 8.5,
    },
    {
      file: '15-frenchpress-light-yirgacheffe-washed.brew.json',
      name: '法压壶浅烘实验 · 埃塞俄比亚 耶加雪菲 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['法压壶', 'French Press', '浅烘', '水洗', '埃塞俄比亚', '耶加雪菲', '实验方案'],
      coffee: {
        name: '埃塞俄比亚 耶加雪菲 水洗 浅烘',
        country: '埃塞俄比亚',
        region: '耶加雪菲',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['茉莉花', '柠檬', '蜂蜜', '绿茶'],
      },
      equipment: {
        brewer: '法压壶',
        brewerSize: '350ml',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '20g',
        waterAmount: '320ml',
        waterTemperature: '93°C',
        brewTime: '600s',
      },
      rating: 8.5,
    },
    {
      file: '16-v60-02-medium-antigua-washed.brew.json',
      name: '安提瓜大份 · 危地马拉 安提瓜 水洗 中烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '02', '大份量', '中烘', '水洗', '危地马拉', '安提瓜', '分享'],
      coffee: {
        name: '危地马拉 安提瓜 水洗 中烘',
        country: '危地马拉',
        region: '安提瓜',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Bourbon',
        flavorNotes: ['可可', '花香', '柑橘', '烤杏仁'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '02',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '20g',
        waterAmount: '300ml',
        waterTemperature: '90°C',
        brewTime: '180s',
      },
      rating: 8,
    },
    {
      file: '17-origami-medium-dark-bali-kintamani-natural.brew.json',
      name: '巴厘岛异域 · 印尼 巴厘岛 金塔马尼 日晒 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '印尼', '巴厘岛', '金塔马尼', '中深烘', '日晒', '小众产区', '火山咖啡'],
      coffee: {
        name: '印尼 巴厘岛 金塔马尼 日晒 中深烘',
        country: '印尼',
        region: '巴厘岛金塔马尼',
        process: '日晒',
        roastLevel: '中深烘',
        variety: 'Typica',
        flavorNotes: ['柑橘', '焦糖', '香料', '可可'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '88°C',
        brewTime: '180s',
      },
      rating: 8,
    },
    {
      file: '18-kalita-155-light-guji-natural.brew.json',
      name: '古吉平底慢萃 · 埃塞俄比亚 古吉 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '155', '浅烘', '日晒', '埃塞俄比亚', '古吉', '慢萃'],
      coffee: {
        name: '埃塞俄比亚 古吉 日晒 浅烘',
        country: '埃塞俄比亚',
        region: '古吉',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['草莓', '蓝莓', '焦糖', '花香'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '155',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '93°C',
        brewTime: '180s',
      },
      rating: 8.5,
    },
    {
      file: '19-chemex-light-yirgacheffe-washed.brew.json',
      name: 'Chemex 耶加雪菲 · 埃塞俄比亚 耶加雪菲 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Chemex', '浅烘', '水洗', '埃塞俄比亚', '耶加雪菲', '分享', '清爽'],
      coffee: {
        name: '埃塞俄比亚 耶加雪菲 水洗 浅烘',
        country: '埃塞俄比亚',
        region: '耶加雪菲',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['茉莉花', '柠檬', '蜂蜜', '绿茶'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '6 Cup',
        grinder: 'Mahlkönig EK43',
      },
      recipe: {
        ratio: '1:16',
        dose: '30g',
        waterAmount: '480ml',
        waterTemperature: '93°C',
        brewTime: '270s',
      },
      rating: 8.5,
    },
    {
      file: '20-aeropress-dark-cerrado-natural.brew.json',
      name: '爱乐压深烘 · 巴西 喜拉多 日晒 深烘',
      author: 'brewcode-os/genesis',
      tags: ['爱乐压', 'Aeropress', '深烘', '日晒', '巴西', '喜拉多', '低温'],
      coffee: {
        name: '巴西 喜拉多 日晒 深烘',
        country: '巴西',
        region: '喜拉多',
        process: '日晒',
        roastLevel: '深烘',
        variety: 'Bourbon',
        flavorNotes: ['黑巧克力', '坚果', '焦糖', '烤面包'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '标准',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:13.75',
        dose: '16g',
        waterAmount: '220ml',
        waterTemperature: '85°C',
        brewTime: '110s',
      },
      rating: 7.8,
    },
    {
      file: '21-v60-01-dark-mandheling-wet-hulled.brew.json',
      name: '曼特宁V60 · 印尼 苏门答腊 曼特宁 湿刨法 深烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '深烘', '湿刨法', '印尼', '苏门答腊', '曼特宁', '浓郁'],
      coffee: {
        name: '印尼 苏门答腊 曼特宁 湿刨法 深烘',
        country: '印尼',
        region: '苏门答腊',
        process: '湿刨法',
        roastLevel: '深烘',
        variety: 'Typica',
        flavorNotes: ['黑巧克力', '草本', '焦糖', '香料'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:14',
        dose: '15g',
        waterAmount: '210ml',
        waterTemperature: '85°C',
        brewTime: '180s',
      },
      rating: 8,
    },
    {
      file: '22-kalita-155-medium-costa-rica-tarrazu-washed.brew.json',
      name: '塔拉珠平底 · 哥斯达黎加 塔拉珠 水洗 中烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '155', '中烘', '水洗', '哥斯达黎加', '塔拉珠', '蜂蜜'],
      coffee: {
        name: '哥斯达黎加 塔拉珠 水洗 中烘',
        country: '哥斯达黎加',
        region: '塔拉珠',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Caturra',
        flavorNotes: ['蜂蜜', '柑橘', '巧克力', '烤杏仁'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '155',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '90°C',
        brewTime: '180s',
      },
      rating: 8.2,
    },
    {
      file: '23-chemex-light-guji-natural.brew.json',
      name: 'Chemex 古吉 · 埃塞俄比亚 古吉 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Chemex', '浅烘', '日晒', '埃塞俄比亚', '古吉', '大份量', '分享'],
      coffee: {
        name: '埃塞俄比亚 古吉 日晒 浅烘',
        country: '埃塞俄比亚',
        region: '古吉',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['草莓', '百香果', '蓝莓', '焦糖'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '8 Cup',
        grinder: 'Mahlkönig EK43',
      },
      recipe: {
        ratio: '1:16',
        dose: '40g',
        waterAmount: '640ml',
        waterTemperature: '93°C',
        brewTime: '300s',
      },
      rating: 8.5,
    },
    {
      file: '24-origami-medium-yunnan-natural.brew.json',
      name: '云南折纸 · 中国 云南 日晒 中烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '云南', '中国', '中烘', '日晒', '国产咖啡', '焦糖'],
      coffee: {
        name: '中国 云南 日晒 中烘',
        country: '中国',
        region: '云南',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Catimor',
        flavorNotes: ['焦糖', '坚果', '黑巧克力', '烤面包'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '90°C',
        brewTime: '180s',
      },
      rating: 7.8,
    },
    {
      file: '25-aeropress-medium-guji-natural.brew.json',
      name: '爱乐压古吉 · 埃塞俄比亚 古吉 日晒 中烘',
      author: 'brewcode-os/genesis',
      tags: ['爱乐压', 'Aeropress', '中烘', '日晒', '埃塞俄比亚', '古吉', '快速'],
      coffee: {
        name: '埃塞俄比亚 古吉 日晒 中烘',
        country: '埃塞俄比亚',
        region: '古吉',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Heirloom',
        flavorNotes: ['蓝莓', '焦糖', '花香', '柑橘'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '标准',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:14.4',
        dose: '16g',
        waterAmount: '230ml',
        waterTemperature: '90°C',
        brewTime: '120s',
      },
      rating: 8.2,
    },
    {
      file: '26-frenchpress-dark-cerrado-natural.brew.json',
      name: '法压深烘经典 · 巴西 喜拉多 日晒 深烘',
      author: 'brewcode-os/genesis',
      tags: ['法压壶', 'French Press', '深烘', '日晒', '巴西', '喜拉多', '经典'],
      coffee: {
        name: '巴西 喜拉多 日晒 深烘',
        country: '巴西',
        region: '喜拉多',
        process: '日晒',
        roastLevel: '深烘',
        variety: 'Bourbon',
        flavorNotes: ['焦糖', '黑巧克力', '烤面包', '坚果'],
      },
      equipment: {
        brewer: '法压壶',
        brewerSize: '350ml',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:13.6',
        dose: '22g',
        waterAmount: '300ml',
        waterTemperature: '88°C',
        brewTime: '300s',
      },
      rating: 7.8,
    },
    {
      file: '27-v60-02-light-sidamo-washed.brew.json',
      name: '西达摩大份 · 埃塞俄比亚 西达摩 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '02', '大份量', '浅烘', '水洗', '埃塞俄比亚', '西达摩', '分享'],
      coffee: {
        name: '埃塞俄比亚 西达摩 水洗 浅烘',
        country: '埃塞俄比亚',
        region: '西达摩',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['柠檬', '茉莉花', '蜂蜜', '绿茶'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '02',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '20g',
        waterAmount: '320ml',
        waterTemperature: '93°C',
        brewTime: '195s',
      },
      rating: 8.3,
    },
    {
      file: '28-kalita-185-medium-dark-antigua-washed.brew.json',
      name: '安提瓜大平底 · 危地马拉 安提瓜 水洗 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '185', '中深烘', '水洗', '危地马拉', '安提瓜', '大份量'],
      coffee: {
        name: '危地马拉 安提瓜 水洗 中深烘',
        country: '危地马拉',
        region: '安提瓜',
        process: '水洗',
        roastLevel: '中深烘',
        variety: 'Bourbon',
        flavorNotes: ['黑巧克力', '可可', '花香', '焦糖'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '185',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '22g',
        waterAmount: '330ml',
        waterTemperature: '88°C',
        brewTime: '200s',
      },
      rating: 8,
    },
    {
      file: '29-chemex-dark-mandheling-wet-hulled.brew.json',
      name: 'Chemex 曼特宁 · 印尼 苏门答腊 曼特宁 湿刨法 深烘',
      author: 'brewcode-os/genesis',
      tags: ['Chemex', '深烘', '湿刨法', '印尼', '苏门答腊', '曼特宁', '大份量'],
      coffee: {
        name: '印尼 苏门答腊 曼特宁 湿刨法 深烘',
        country: '印尼',
        region: '苏门答腊',
        process: '湿刨法',
        roastLevel: '深烘',
        variety: 'Typica',
        flavorNotes: ['黑巧克力', '草本', '焦糖', '香料'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '6 Cup',
        grinder: 'Mahlkönig EK43',
      },
      recipe: {
        ratio: '1:14',
        dose: '35g',
        waterAmount: '490ml',
        waterTemperature: '85°C',
        brewTime: '270s',
      },
      rating: 8,
    },
    {
      file: '30-origami-light-costa-rica-tarrazu-washed.brew.json',
      name: '塔拉珠折纸 · 哥斯达黎加 塔拉珠 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '浅烘', '水洗', '哥斯达黎加', '塔拉珠', '蜂蜜', '柑橘'],
      coffee: {
        name: '哥斯达黎加 塔拉珠 水洗 浅烘',
        country: '哥斯达黎加',
        region: '塔拉珠',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Caturra',
        flavorNotes: ['蜂蜜', '柑橘', '花香', '焦糖'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '93°C',
        brewTime: '180s',
      },
      rating: 8.5,
    },
    {
      file: '31-v60-01-light-costa-rica-tarrazu-washed.brew.json',
      name: '塔拉珠V60 · 哥斯达黎加 塔拉珠 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '浅烘', '水洗', '哥斯达黎加', '塔拉珠', '蜂蜜', '柑橘'],
      coffee: {
        name: '哥斯达黎加 塔拉珠 水洗 浅烘',
        country: '哥斯达黎加',
        region: '塔拉珠',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Catuai',
        flavorNotes: ['蜂蜜', '柑橘', '花香', '焦糖'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '93°C',
        brewTime: '165s',
      },
      rating: 8.5,
    },
    {
      file: '32-kalita-155-dark-cerrado-natural.brew.json',
      name: '深烘平底 · 巴西 喜拉多 日晒 深烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '155', '深烘', '日晒', '巴西', '喜拉多', '焦糖'],
      coffee: {
        name: '巴西 喜拉多 日晒 深烘',
        country: '巴西',
        region: '喜拉多',
        process: '日晒',
        roastLevel: '深烘',
        variety: 'Mundo Novo',
        flavorNotes: ['焦糖', '黑巧克力', '烤面包', '坚果'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '155',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:14',
        dose: '15g',
        waterAmount: '210ml',
        waterTemperature: '85°C',
        brewTime: '180s',
      },
      rating: 7.8,
    },
    {
      file: '33-chemex-medium-yunnan-natural.brew.json',
      name: 'Chemex 云南 · 中国 云南 日晒 中烘',
      author: 'brewcode-os/genesis',
      tags: ['Chemex', '云南', '中国', '中烘', '日晒', '国产咖啡', '国产云南'],
      coffee: {
        name: '中国 云南 日晒 中烘',
        country: '中国',
        region: '云南',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Catimor',
        flavorNotes: ['焦糖', '坚果', '黑巧克力', '烤面包'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '8 Cup',
        grinder: 'Mahlkönig EK43',
      },
      recipe: {
        ratio: '1:15',
        dose: '40g',
        waterAmount: '600ml',
        waterTemperature: '90°C',
        brewTime: '300s',
      },
      rating: 7.8,
    },
    {
      file: '34-aeropress-medium-sidamo-washed.brew.json',
      name: '爱乐压西达摩 · 埃塞俄比亚 西达摩 水洗 中烘',
      author: 'brewcode-os/genesis',
      tags: ['爱乐压', 'Aeropress', '中烘', '水洗', '埃塞俄比亚', '西达摩', '蜂蜜柠檬'],
      coffee: {
        name: '埃塞俄比亚 西达摩 水洗 中烘',
        country: '埃塞俄比亚',
        region: '西达摩',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Heirloom',
        flavorNotes: ['蜂蜜', '柠檬', '花香', '绿茶'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '标准',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:14.7',
        dose: '15g',
        waterAmount: '220ml',
        waterTemperature: '90°C',
        brewTime: '115s',
      },
      rating: 8.2,
    },
    {
      file: '35-origami-medium-dark-mandheling-wet-hulled.brew.json',
      name: '曼特宁折纸 · 印尼 苏门答腊 曼特宁 湿刨法 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '中深烘', '湿刨法', '印尼', '苏门答腊', '曼特宁', '草本'],
      coffee: {
        name: '印尼 苏门答腊 曼特宁 湿刨法 中深烘',
        country: '印尼',
        region: '苏门答腊',
        process: '湿刨法',
        roastLevel: '中深烘',
        variety: 'Typica',
        flavorNotes: ['黑巧克力', '草本', '焦糖', '香料'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '88°C',
        brewTime: '180s',
      },
      rating: 8,
    },
    {
      file: '36-frenchpress-medium-costa-rica-tarrazu-washed.brew.json',
      name: '法压壶塔拉珠 · 哥斯达黎加 塔拉珠 水洗 中烘',
      author: 'brewcode-os/genesis',
      tags: ['法压壶', 'French Press', '中烘', '水洗', '哥斯达黎加', '塔拉珠', '蜂蜜'],
      coffee: {
        name: '哥斯达黎加 塔拉珠 水洗 中烘',
        country: '哥斯达黎加',
        region: '塔拉珠',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Catuai',
        flavorNotes: ['蜂蜜', '柑橘', '巧克力', '烤杏仁'],
      },
      equipment: {
        brewer: '法压壶',
        brewerSize: '350ml',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '20g',
        waterAmount: '300ml',
        waterTemperature: '90°C',
        brewTime: '540s',
      },
      rating: 8,
    },
    {
      file: '37-v60-02-light-guji-natural.brew.json',
      name: '古吉V60大份 · 埃塞俄比亚 古吉 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '02', '大份量', '浅烘', '日晒', '埃塞俄比亚', '古吉', '草莓'],
      coffee: {
        name: '埃塞俄比亚 古吉 日晒 浅烘',
        country: '埃塞俄比亚',
        region: '古吉',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['草莓', '蓝莓', '百香果', '焦糖'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '02',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '20g',
        waterAmount: '320ml',
        waterTemperature: '93°C',
        brewTime: '195s',
      },
      rating: 8.5,
    },
    {
      file: '38-kalita-185-medium-yunnan-natural.brew.json',
      name: '云南大平底 · 中国 云南 日晒 中烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '185', '云南', '中国', '中烘', '日晒', '国产咖啡', '分享'],
      coffee: {
        name: '中国 云南 日晒 中烘',
        country: '中国',
        region: '云南',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Catimor',
        flavorNotes: ['焦糖', '坚果', '黑巧克力', '烤面包'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '185',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '24g',
        waterAmount: '360ml',
        waterTemperature: '90°C',
        brewTime: '210s',
      },
      rating: 7.8,
    },
    {
      file: '39-chemex-light-sidamo-washed.brew.json',
      name: 'Chemex 西达摩 · 埃塞俄比亚 西达摩 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Chemex', '浅烘', '水洗', '埃塞俄比亚', '西达摩', '柠檬', '茉莉花'],
      coffee: {
        name: '埃塞俄比亚 西达摩 水洗 浅烘',
        country: '埃塞俄比亚',
        region: '西达摩',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['柠檬', '茉莉花', '蜂蜜', '绿茶'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '8 Cup',
        grinder: 'Mahlkönig EK43',
      },
      recipe: {
        ratio: '1:16',
        dose: '40g',
        waterAmount: '640ml',
        waterTemperature: '93°C',
        brewTime: '300s',
      },
      rating: 8.5,
    },
    {
      file: '40-aeropress-medium-dark-antigua-washed.brew.json',
      name: '爱乐压安提瓜 · 危地马拉 安提瓜 水洗 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['爱乐压', 'Aeropress', '中深烘', '水洗', '危地马拉', '安提瓜', '可可'],
      coffee: {
        name: '危地马拉 安提瓜 水洗 中深烘',
        country: '危地马拉',
        region: '安提瓜',
        process: '水洗',
        roastLevel: '中深烘',
        variety: 'Bourbon',
        flavorNotes: ['可可', '黑巧克力', '花香', '焦糖'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '标准',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:13.75',
        dose: '16g',
        waterAmount: '220ml',
        waterTemperature: '86°C',
        brewTime: '110s',
      },
      rating: 8,
    },
    {
      file: '41-v60-01-medium-dark-yunnan-natural.brew.json',
      name: '云南中深烘V60 · 中国 云南 日晒 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '中深烘', '日晒', '中国', '云南', '国产咖啡', '浓郁'],
      coffee: {
        name: '中国 云南 日晒 中深烘',
        country: '中国',
        region: '云南',
        process: '日晒',
        roastLevel: '中深烘',
        variety: 'Catimor',
        flavorNotes: ['焦糖', '黑巧克力', '烤面包', '坚果'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:14',
        dose: '15g',
        waterAmount: '210ml',
        waterTemperature: '87°C',
        brewTime: '180s',
      },
      rating: 7.8,
    },
    {
      file: '42-kalita-155-light-sidamo-washed.brew.json',
      name: '西达摩平底 · 埃塞俄比亚 西达摩 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '155', '浅烘', '水洗', '埃塞俄比亚', '西达摩', '柠檬'],
      coffee: {
        name: '埃塞俄比亚 西达摩 水洗 浅烘',
        country: '埃塞俄比亚',
        region: '西达摩',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['柠檬', '茉莉花', '蜂蜜', '绿茶'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '155',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '93°C',
        brewTime: '180s',
      },
      rating: 8.5,
    },
    {
      file: '43-origami-medium-dark-cerrado-natural.brew.json',
      name: '巴西折纸 · 巴西 喜拉多 日晒 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '中深烘', '日晒', '巴西', '喜拉多', '焦糖', '坚果'],
      coffee: {
        name: '巴西 喜拉多 日晒 中深烘',
        country: '巴西',
        region: '喜拉多',
        process: '日晒',
        roastLevel: '中深烘',
        variety: 'Mundo Novo',
        flavorNotes: ['焦糖', '坚果', '黑巧克力', '烤面包'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '88°C',
        brewTime: '180s',
      },
      rating: 8,
    },
    {
      file: '44-aeropress-light-costa-rica-tarrazu-washed.brew.json',
      name: '爱乐压塔拉珠 · 哥斯达黎加 塔拉珠 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['爱乐压', 'Aeropress', '浅烘', '水洗', '哥斯达黎加', '塔拉珠', '蜂蜜', '柑橘'],
      coffee: {
        name: '哥斯达黎加 塔拉珠 水洗 浅烘',
        country: '哥斯达黎加',
        region: '塔拉珠',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Catuai',
        flavorNotes: ['蜂蜜', '柑橘', '花香', '焦糖'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '标准',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15.3',
        dose: '15g',
        waterAmount: '230ml',
        waterTemperature: '93°C',
        brewTime: '120s',
      },
      rating: 8.5,
    },
    {
      file: '45-frenchpress-medium-dark-yunnan-natural.brew.json',
      name: '法压云南醇厚 · 中国 云南 日晒 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['法压壶', 'French Press', '中深烘', '日晒', '中国', '云南', '国产咖啡', '醇厚'],
      coffee: {
        name: '中国 云南 日晒 中深烘',
        country: '中国',
        region: '云南',
        process: '日晒',
        roastLevel: '中深烘',
        variety: 'Catimor',
        flavorNotes: ['焦糖', '黑巧克力', '烤面包', '坚果'],
      },
      equipment: {
        brewer: '法压壶',
        brewerSize: '350ml',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:13.6',
        dose: '22g',
        waterAmount: '300ml',
        waterTemperature: '88°C',
        brewTime: '480s',
      },
      rating: 7.8,
    },
    {
      file: '46-v60-02-medium-dark-cerrado-natural.brew.json',
      name: '巴西大份V60 · 巴西 喜拉多 日晒 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '02', '大份量', '中深烘', '日晒', '巴西', '喜拉多', '分享'],
      coffee: {
        name: '巴西 喜拉多 日晒 中深烘',
        country: '巴西',
        region: '喜拉多',
        process: '日晒',
        roastLevel: '中深烘',
        variety: 'Mundo Novo',
        flavorNotes: ['焦糖', '坚果', '黑巧克力', '烤面包'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '02',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:14',
        dose: '20g',
        waterAmount: '280ml',
        waterTemperature: '86°C',
        brewTime: '195s',
      },
      rating: 7.8,
    },
    {
      file: '47-chemex-medium-dark-sidamo-washed.brew.json',
      name: 'Chemex 西达摩中深烘 · 埃塞俄比亚 西达摩 水洗 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['Chemex', '中深烘', '水洗', '埃塞俄比亚', '西达摩', '柠檬', '蜂蜜'],
      coffee: {
        name: '埃塞俄比亚 西达摩 水洗 中深烘',
        country: '埃塞俄比亚',
        region: '西达摩',
        process: '水洗',
        roastLevel: '中深烘',
        variety: 'Heirloom',
        flavorNotes: ['柠檬', '蜂蜜', '花香', '焦糖'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '8 Cup',
        grinder: 'Mahlkönig EK43',
      },
      recipe: {
        ratio: '1:15',
        dose: '40g',
        waterAmount: '600ml',
        waterTemperature: '88°C',
        brewTime: '300s',
      },
      rating: 8.2,
    },
    {
      file: '48-kalita-185-light-guji-natural.brew.json',
      name: '古吉大平底 · 埃塞俄比亚 古吉 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '185', '浅烘', '日晒', '埃塞俄比亚', '古吉', '大份量', '分享'],
      coffee: {
        name: '埃塞俄比亚 古吉 日晒 浅烘',
        country: '埃塞俄比亚',
        region: '古吉',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['草莓', '蓝莓', '百香果', '焦糖'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '185',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '24g',
        waterAmount: '384ml',
        waterTemperature: '93°C',
        brewTime: '210s',
      },
      rating: 8.5,
    },
    {
      file: '49-origami-light-yunnan-natural.brew.json',
      name: '云南浅烘折纸 · 中国 云南 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '浅烘', '日晒', '中国', '云南', '国产咖啡', '探索'],
      coffee: {
        name: '中国 云南 日晒 浅烘',
        country: '中国',
        region: '云南',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Catimor',
        flavorNotes: ['焦糖', '柑橘', '花香', '坚果'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '93°C',
        brewTime: '180s',
      },
      rating: 8,
    },
    {
      file: '50-v60-01-medium-dark-sidamo-washed.brew.json',
      name: '西达摩中深烘V60 · 埃塞俄比亚 西达摩 水洗 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '中深烘', '水洗', '埃塞俄比亚', '西达摩', '柠檬蜂蜜'],
      coffee: {
        name: '埃塞俄比亚 西达摩 水洗 中深烘',
        country: '埃塞俄比亚',
        region: '西达摩',
        process: '水洗',
        roastLevel: '中深烘',
        variety: 'Heirloom',
        flavorNotes: ['柠檬', '蜂蜜', '花香', '焦糖'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'Comandante C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '88°C',
        brewTime: '180s',
      },
      rating: 8.2,
    },
  ];

  function loadManifest() {
    try {
      allRecipes = SEEDS_MANIFEST;
      console.log('[BrewRepo] SEEDS_MANIFEST 加载完成，共 ' + allRecipes.length + ' 个方案');
      init();
    } catch (e) {
      $('#stats-text').textContent = BrewCodeI18n.t('repo.loadError') + e.message;
      console.error('[BrewRepo] 初始化失败:', e);
    }
  }

  function loadCommunityRecipes() {
    fetch('community-recipes.json')
      .then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(function (data) {
        communityRecipes = Array.isArray(data) ? data : [];
        console.log('[BrewRepo] 社区方案加载完成，共 ' + communityRecipes.length + ' 个');
        renderCommunityCards();
      })
      .catch(function (e) {
        console.error('[BrewRepo] 社区方案加载失败:', e);
        communityRecipes = [];
        renderCommunityCards();
      });
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
      btn.textContent = BrewCodeI18n.t('repo.filterValue.' + item) || item;
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
    console.log(
      '[BrewRepo] renderCards: allRecipes=' + allRecipes.length + ', filtered=' + filtered.length
    );
    const grid = $('#card-grid');
    grid.innerHTML = '';

    if (filtered.length === 0) {
      $('#empty-state').classList.remove('hidden');
      $('#results-count').textContent = BrewCodeI18n.t('repo.noResults');
    } else {
      $('#empty-state').classList.add('hidden');
      $('#results-count').textContent =
        BrewCodeI18n.t('repo.showing') +
        ' ' +
        filtered.length +
        ' / ' +
        allRecipes.length +
        ' ' +
        BrewCodeI18n.t('repo.recipes');
    }

    filtered.forEach((recipe) => {
      const card = document.createElement('div');
      card.className = 'recipe-card';

      const brewer = normalizeBrewer(recipe.equipment && recipe.equipment.brewer);
      const roast = normalizeRoast(recipe.coffee && recipe.coffee.roastLevel);
      const country = recipe.coffee && recipe.coffee.country;
      const brewerText = BrewCodeI18n.t('repo.filterValue.' + brewer) || brewer;
      const roastText = BrewCodeI18n.t('repo.filterValue.' + roast) || roast;
      const countryText = country ? BrewCodeI18n.t('repo.filterValue.' + country) || country : '';

      card.innerHTML =
        '<div class="card-header">' +
        '<span class="card-name">' +
        escHtml(recipe.name) +
        '</span>' +
        (recipe.rating ? '<span class="card-rating">' + recipe.rating + '</span>' : '') +
        '</div>' +
        '<div class="card-meta">' +
        (countryText ? '<span>' + escHtml(countryText) + '</span>' : '') +
        (countryText && recipe.equipment && recipe.equipment.brewer
          ? '<span class="card-meta-sep">·</span>'
          : '') +
        (recipe.equipment && recipe.equipment.brewer
          ? '<span>' + escHtml(brewerText) + '</span>'
          : '') +
        (roastText
          ? '<span class="card-meta-sep">·</span><span>' + escHtml(roastText) + '</span>'
          : '') +
        '</div>' +
        '<div class="card-tags">' +
        '<span class="card-tag brewer">' +
        escHtml(brewerText) +
        '</span>' +
        '<span class="card-tag roast">' +
        escHtml(roastText) +
        '</span>' +
        (countryText ? '<span class="card-tag country">' + escHtml(countryText) + '</span>' : '') +
        '</div>' +
        '<div class="card-footer">' +
        '<span class="card-author">' +
        escHtml(recipe.author || '') +
        '</span>' +
        '<span class="card-open">' +
        BrewCodeI18n.t('repo.card.viewDetail') +
        '</span>' +
        '</div>';

      card.addEventListener('click', () => openDetail(recipe));
      grid.appendChild(card);
    });
  }

  function renderCommunityCards() {
    var section = $('#community-section');
    var grid = $('#community-grid');
    var empty = $('#community-empty');

    if (!section || !grid || !empty) return;

    if (communityRecipes.length === 0) {
      section.querySelector('.community-title').classList.add('hidden');
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    section.querySelector('.community-title').classList.remove('hidden');
    empty.classList.add('hidden');
    grid.innerHTML = '';

    communityRecipes.forEach(function (recipe) {
      var card = document.createElement('div');
      card.className = 'recipe-card community-card';

      var brewer = recipe.brewer || '';
      var roast = normalizeRoast(recipe.roastLevel);
      var roastText = BrewCodeI18n.t('repo.filterValue.' + roast) || roast;
      var brewerText = BrewCodeI18n.t('repo.filterValue.' + brewer) || brewer;

      card.innerHTML =
        '<div class="card-header">' +
        '<span class="card-name">' +
        escHtml(recipe.name) +
        '</span>' +
        '<span class="community-tag" data-i18n="repo.community.tag">' +
        BrewCodeI18n.t('repo.community.tag') +
        '</span>' +
        '</div>' +
        '<div class="community-author">' +
        (recipe.authorAvatarUrl
          ? '<img class="community-avatar" src="' +
            escHtml(recipe.authorAvatarUrl) +
            '" alt="" width="20" height="20" loading="lazy" />'
          : '') +
        '<span class="community-author-name">' +
        escHtml(recipe.author || '') +
        '</span>' +
        '</div>' +
        '<div class="card-meta">' +
        (recipe.coffeeName ? '<span>' + escHtml(recipe.coffeeName) + '</span>' : '') +
        (recipe.coffeeName && brewer ? '<span class="card-meta-sep">·</span>' : '') +
        (brewer ? '<span>' + escHtml(brewerText) + '</span>' : '') +
        (roastText
          ? '<span class="card-meta-sep">·</span><span>' + escHtml(roastText) + '</span>'
          : '') +
        '</div>' +
        '<div class="card-tags">' +
        (brewerText ? '<span class="card-tag brewer">' + escHtml(brewerText) + '</span>' : '') +
        (roastText ? '<span class="card-tag roast">' + escHtml(roastText) + '</span>' : '') +
        '</div>' +
        '<div class="card-footer">' +
        '<span class="card-author">' +
        escHtml(recipe.author || '') +
        '</span>' +
        '<span class="card-open">' +
        BrewCodeI18n.t('repo.card.viewDetail') +
        '</span>' +
        '</div>';

      card.addEventListener('click', function () {
        openCommunityDetail(recipe);
      });
      grid.appendChild(card);
    });
  }

  function renderStats() {
    const brewers = getUniqueBrewers();
    const countries = getUniqueCountries();
    $('#stats-text').innerHTML =
      BrewCodeI18n.t('repo.stats.total') +
      ' <strong>' +
      allRecipes.length +
      '</strong> ' +
      BrewCodeI18n.t('repo.stats.recipes') +
      ', ' +
      BrewCodeI18n.t('repo.stats.covers') +
      ' <strong>' +
      countries.length +
      '</strong> ' +
      BrewCodeI18n.t('repo.stats.origins') +
      ', <strong>' +
      brewers.length +
      '</strong> ' +
      BrewCodeI18n.t('repo.stats.brewers');
  }

  /* ── Detail overlay ── */
  function openDetail(recipe) {
    const c = recipe.coffee || {};
    const e = recipe.equipment || {};
    const rcp = recipe.recipe || {};

    $('#detail-name').textContent = recipe.name;
    $('#detail-author').textContent = recipe.author
      ? BrewCodeI18n.t('repo.detail.author') + recipe.author
      : '';

    /* coffee grid */
    const coffeeItems = [];
    if (c.name) coffeeItems.push({ label: BrewCodeI18n.t('repo.detail.beans'), value: c.name });
    if (c.country)
      coffeeItems.push({
        label: BrewCodeI18n.t('repo.detail.origin'),
        value:
          (BrewCodeI18n.t('repo.filterValue.' + c.country) || c.country) +
          (c.region ? ' / ' + c.region : ''),
      });
    if (c.process)
      coffeeItems.push({ label: BrewCodeI18n.t('repo.detail.process'), value: c.process });
    if (c.roastLevel)
      coffeeItems.push({
        label: BrewCodeI18n.t('repo.detail.roast'),
        value:
          BrewCodeI18n.t('repo.filterValue.' + normalizeRoast(c.roastLevel)) ||
          normalizeRoast(c.roastLevel),
      });
    if (c.variety)
      coffeeItems.push({ label: BrewCodeI18n.t('repo.detail.variety'), value: c.variety });
    if (e.brewer)
      coffeeItems.push({
        label: BrewCodeI18n.t('repo.detail.brewer'),
        value:
          (BrewCodeI18n.t('repo.filterValue.' + normalizeBrewer(e.brewer)) ||
            normalizeBrewer(e.brewer)) + (e.brewerSize ? ' (' + e.brewerSize + ')' : ''),
      });
    if (e.grinder)
      coffeeItems.push({ label: BrewCodeI18n.t('repo.detail.grinder'), value: e.grinder });

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
    if (rcp.ratio)
      recipeItems.push({ label: BrewCodeI18n.t('repo.detail.ratio'), value: rcp.ratio });
    if (rcp.dose) recipeItems.push({ label: BrewCodeI18n.t('repo.detail.dose'), value: rcp.dose });
    if (rcp.waterAmount)
      recipeItems.push({ label: BrewCodeI18n.t('repo.detail.water'), value: rcp.waterAmount });
    if (rcp.waterTemperature)
      recipeItems.push({ label: BrewCodeI18n.t('repo.detail.temp'), value: rcp.waterTemperature });
    if (rcp.brewTime)
      recipeItems.push({ label: BrewCodeI18n.t('repo.detail.time'), value: rcp.brewTime });

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
      flavorsHtml =
        '<span class="detail-value" style="color:var(--text-dim)">' +
        BrewCodeI18n.t('repo.detail.unspecified') +
        '</span>';
    }
    $('#detail-flavors').innerHTML = flavorsHtml;

    /* actions */
    $('#btn-open-player').onclick = function () {
      const playerUrl = PLAYER_BASE + '?brew=' + encodeURIComponent(SEEDS_BASE + recipe.file);
      window.open(playerUrl, '_blank');
    };

    $('#btn-copy-json').onclick = async function () {
      try {
        const resp = await fetch(SEEDS_BASE + recipe.file);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const text = await resp.text();
        await navigator.clipboard.writeText(text);
        showToast(BrewCodeI18n.t('repo.toast.copied'));
      } catch (e) {
        showToast(BrewCodeI18n.t('repo.toast.copyFailed') + e.message);
      }
    };

    $('#detail-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    $('#detail-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function openCommunityDetail(recipe) {
    var coffeeName = recipe.coffeeName || '';
    var brewerName = recipe.brewer || '';
    var roastLevel = recipe.roastLevel || '';

    $('#detail-name').textContent = recipe.name;
    $('#detail-author').textContent = recipe.author
      ? BrewCodeI18n.t('repo.detail.author') + recipe.author
      : '';

    var coffeeItems = [];
    if (coffeeName)
      coffeeItems.push({ label: BrewCodeI18n.t('repo.detail.beans'), value: coffeeName });
    if (roastLevel)
      coffeeItems.push({
        label: BrewCodeI18n.t('repo.detail.roast'),
        value:
          BrewCodeI18n.t('repo.filterValue.' + normalizeRoast(roastLevel)) ||
          normalizeRoast(roastLevel),
      });
    if (brewerName)
      coffeeItems.push({
        label: BrewCodeI18n.t('repo.detail.brewer'),
        value:
          BrewCodeI18n.t('repo.filterValue.' + normalizeBrewer(brewerName)) ||
          normalizeBrewer(brewerName),
      });

    var coffeeHtml = '';
    coffeeItems.forEach(function (item) {
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

    $('#detail-recipe').innerHTML = '';

    var flavorsHtml =
      '<span class="detail-value" style="color:var(--text-dim)">' +
      BrewCodeI18n.t('repo.detail.unspecified') +
      '</span>';
    $('#detail-flavors').innerHTML = flavorsHtml;

    $('#btn-open-player').onclick = function () {
      var playerUrl = PLAYER_BASE + '?brew=' + encodeURIComponent(recipe.filePath);
      window.open(playerUrl, '_blank');
    };

    $('#btn-copy-json').onclick = async function () {
      try {
        var resp = await fetch(recipe.filePath);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        var text = await resp.text();
        await navigator.clipboard.writeText(text);
        showToast(BrewCodeI18n.t('repo.toast.copied'));
      } catch (e) {
        showToast(BrewCodeI18n.t('repo.toast.copyFailed') + e.message);
      }
    };

    $('#detail-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
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
    console.log('[BrewRepo] init() 开始: allRecipes=' + allRecipes.length);
    var savedLang = localStorage.getItem('brewcode_lang');
    if (savedLang) {
      BrewCodeI18n.setLang(savedLang);
    }
    renderStats();
    renderPills();
    renderCards();
    bindEvents();
    refreshI18nTexts();
    loadCommunityRecipes();
    console.log('[BrewRepo] init() 完成');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadManifest);
  } else {
    loadManifest();
  }
})();
