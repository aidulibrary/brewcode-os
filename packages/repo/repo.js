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

  /* ── Embedded manifest ── */
  const SEEDS_MANIFEST = [
    {
      file: '21-v60-01-dark-panama-geisha-natural.brew.json',
      name: '深烘瑰夏实验 · 巴拿马 瑰夏 日晒 深烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '瑰夏', 'Geisha', '深烘', '日晒', '巴拿马', '实验方案'],
      coffee: {
        name: '巴拿马 瑰夏 日晒 深烘',
        country: '巴拿马',
        region: '波奎特',
        process: '日晒',
        roastLevel: '深烘',
        variety: 'Geisha',
        flavorNotes: ['黑樱桃', '焦糖布丁', '朗姆酒', '黑巧克力'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:13',
        dose: '15g',
        waterAmount: '195ml',
        waterTemperature: '85°C',
        brewTime: '120s',
      },
      rating: 8,
    },
    {
      file: '22-kalita-155-dark-sumatra-wet-hulled.brew.json',
      name: '曼特宁低温慢萃 · 印尼 苏门答腊 湿刨 深烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '曼特宁', '深烘', '湿刨', '印尼', '低温慢萃'],
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
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:14',
        dose: '15g',
        waterAmount: '210ml',
        waterTemperature: '82°C',
        brewTime: '210s',
      },
      rating: 7.8,
    },
    {
      file: '23-origami-mediumdark-kirinyaga-washed.brew.json',
      name: '粕谷哲 4:6 法 · 肯尼亚 基里尼亚加 水洗 中深烘',
      author: 'Tetsu Kasuya',
      tags: ['Origami', '4:6法', '粕谷哲', 'Tetsu Kasuya', '冠军方案', '中深烘', '肯尼亚'],
      coffee: {
        name: '肯尼亚 基里尼亚加 水洗 中深烘',
        country: '肯尼亚',
        region: '基里尼亚加',
        process: '水洗',
        roastLevel: '中深烘',
        variety: 'SL28',
        flavorNotes: ['黑加仑', '红糖', '柑橘', '可可'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '20g',
        waterAmount: '300ml',
        waterTemperature: '90°C',
        brewTime: '210s',
      },
      rating: 8.8,
    },
    {
      file: '24-chemex-dark-papua-new-guinea-washed.brew.json',
      name: 'Chemex 深烘大份 · 巴布亚新几内亚 水洗 深烘',
      author: 'brewcode-os/genesis',
      tags: ['Chemex', '巴布亚新几内亚', '深烘', '水洗', '大份量'],
      coffee: {
        name: '巴布亚新几内亚 水洗 深烘',
        country: '巴布亚新几内亚',
        region: '东部高地',
        process: '水洗',
        roastLevel: '深烘',
        variety: 'Typica',
        flavorNotes: ['黑巧克力', '烤杏仁', '焦糖', '烟草'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '8杯',
        grinder: 'EK43',
      },
      recipe: {
        ratio: '1:14',
        dose: '42g',
        waterAmount: '588ml',
        waterTemperature: '85°C',
        brewTime: '300s',
      },
      rating: 7.8,
    },
    {
      file: '25-aeropress-mediumdark-yunnan-menglian-natural.brew.json',
      name: '云南孟连 · 中国 云南 孟连 日晒 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['爱乐压', 'Aeropress', '中国', '云南', '孟连', '中深烘', '日晒'],
      coffee: {
        name: '中国 云南 孟连 日晒 中深烘',
        country: '中国',
        region: '云南孟连',
        process: '日晒',
        roastLevel: '中深烘',
        variety: 'Catimor',
        flavorNotes: ['红糖', '普洱茶', '梅子', '巧克力'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:13.75',
        dose: '16g',
        waterAmount: '220ml',
        waterTemperature: '88°C',
        brewTime: '150s',
      },
      rating: 8,
    },
    {
      file: '26-frenchpress-light-guji-natural.brew.json',
      name: '浅烘法压实验 · 埃塞俄比亚 古吉 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['法压壶', 'French Press', '浅烘', '日晒', '埃塞俄比亚', '实验方案'],
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
        brewer: '法压壶',
        brewerSize: '350ml',
        grinder: 'C40',
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
      file: '27-v60-02-mediumdark-cerrado-anaerobic-natural.brew.json',
      name: '厌氧日晒 · 巴西 喜拉多 厌氧日晒 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '厌氧日晒', '特殊处理法', '巴西', '中深烘'],
      coffee: {
        name: '巴西 喜拉多 厌氧日晒 中深烘',
        country: '巴西',
        region: '喜拉多',
        process: '厌氧日晒',
        roastLevel: '中深烘',
        variety: 'Bourbon',
        flavorNotes: ['朗姆酒', '熟成菠萝', '焦糖', '可可'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '02',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '18g',
        waterAmount: '270ml',
        waterTemperature: '90°C',
        brewTime: '165s',
      },
      rating: 8.5,
    },
    {
      file: '28-kalita-185-light-huila-anaerobic-washed.brew.json',
      name: '厌氧水洗双人份 · 哥伦比亚 蕙兰 厌氧水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '厌氧水洗', '特殊处理法', '哥伦比亚', '浅烘', '双人份'],
      coffee: {
        name: '哥伦比亚 蕙兰 厌氧水洗 浅烘',
        country: '哥伦比亚',
        region: '蕙兰',
        process: '厌氧水洗',
        roastLevel: '浅烘',
        variety: 'Caturra',
        flavorNotes: ['茉莉花', '青苹果', '蜂蜜', '绿茶'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '185',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '24g',
        waterAmount: '360ml',
        waterTemperature: '93°C',
        brewTime: '210s',
      },
      rating: 8.5,
    },
    {
      file: '29-origami-medium-antigua-honey.brew.json',
      name: '蜜处理折纸 · 危地马拉 安提瓜 蜜处理 中烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '蜜处理', '危地马拉', '中烘', '折纸滤杯'],
      coffee: {
        name: '危地马拉 安提瓜 蜜处理 中烘',
        country: '危地马拉',
        region: '安提瓜',
        process: '蜜处理',
        roastLevel: '中烘',
        variety: 'Bourbon',
        flavorNotes: ['焦糖', '葡萄干', '柑橘', '杏仁'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '91°C',
        brewTime: '165s',
      },
      rating: 8.2,
    },
    {
      file: '30-v60-01-mediumdark-yirgacheffe-barrel.brew.json',
      name: '酒桶发酵 · 埃塞俄比亚 耶加雪菲 酒桶发酵 中深烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '酒桶发酵', '特殊处理法', '埃塞俄比亚', '中深烘', '耶加雪菲'],
      coffee: {
        name: '埃塞俄比亚 耶加雪菲 酒桶发酵 中深烘',
        country: '埃塞俄比亚',
        region: '耶加雪菲',
        process: '酒桶发酵',
        roastLevel: '中深烘',
        variety: 'Heirloom',
        flavorNotes: ['威士忌', '香草', '黑巧克力', '樱桃'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '91°C',
        brewTime: '150s',
      },
      rating: 8.8,
    },
    {
      file: '31-v60-01-light-panama-geisha-natural-hoffmann.brew.json',
      name: 'Hoffmann 瑰夏极简法 · 巴拿马 瑰夏 日晒',
      author: 'James Hoffmann',
      tags: ['V60', 'James Hoffmann', '冠军方案', '瑰夏', '浅烘', '日晒'],
      coffee: {
        name: '巴拿马 瑰夏 日晒',
        country: '巴拿马',
        region: '波奎特',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Geisha',
        flavorNotes: ['茉莉花', '柑橘', '蜂蜜', '佛手柑'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'EK43',
      },
      recipe: {
        ratio: '1:16.7',
        dose: '15g',
        waterAmount: '250ml',
        waterTemperature: '95°C',
        brewTime: '180s',
      },
      rating: 9.2,
    },
    {
      file: '32-kalita-155-light-limu-washed.brew.json',
      name: '利姆慢萃 · 埃塞俄比亚 利姆 水洗',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '利姆', '埃塞俄比亚', '浅烘', '水洗', '小众产区'],
      coffee: {
        name: '埃塞俄比亚 利姆 水洗',
        country: '埃塞俄比亚',
        region: '利姆',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['柑橘', '红茶', '焦糖', '橙花'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '155',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '92°C',
        brewTime: '180s',
      },
      rating: 8,
    },
    {
      file: '33-origami-light-kiambu-washed-kasuya.brew.json',
      name: '粕谷哲 4:6 变体 · 肯尼亚 基安布 水洗',
      author: '粕谷哲',
      tags: ['Origami', '4:6法', '粕谷哲', 'Tetsu Kasuya', '冠军方案', '浅烘', '肯尼亚'],
      coffee: {
        name: '肯尼亚 基安布 水洗',
        country: '肯尼亚',
        region: '基安布',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'SL28',
        flavorNotes: ['黑加仑', '葡萄柚', '红糖', '番茄'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '20g',
        waterAmount: '300ml',
        waterTemperature: '93°C',
        brewTime: '210s',
      },
      rating: 8.8,
    },
    {
      file: '34-aeropress-light-antigua-washed.brew.json',
      name: '浅烘危地马拉爱乐压 · 危地马拉 安提瓜 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['爱乐压', 'Aeropress', '浅烘', '危地马拉', '水洗', '实验方案'],
      coffee: {
        name: '危地马拉 安提瓜 水洗 浅烘',
        country: '危地马拉',
        region: '安提瓜',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Bourbon',
        flavorNotes: ['柑橘', '花香', '绿茶', '焦糖'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '93°C',
        brewTime: '120s',
      },
      rating: 8.2,
    },
    {
      file: '35-frenchpress-light-cauca-natural.brew.json',
      name: '考卡浅烘法压 · 哥伦比亚 考卡 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['法压壶', 'French Press', '浅烘', '日晒', '哥伦比亚', '考卡'],
      coffee: {
        name: '哥伦比亚 考卡 日晒 浅烘',
        country: '哥伦比亚',
        region: '考卡',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Castillo',
        flavorNotes: ['番石榴', '百香果', '焦糖', '花香'],
      },
      equipment: {
        brewer: '法压壶',
        brewerSize: '350ml',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '20g',
        waterAmount: '320ml',
        waterTemperature: '93°C',
        brewTime: '660s',
      },
      rating: 8.2,
    },
    {
      file: '36-v60-02-medium-boquete-natural.brew.json',
      name: '博奎特中烘 · 巴拿马 博奎特 日晒 中烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '巴拿马', '博奎特', '中烘', '日晒'],
      coffee: {
        name: '巴拿马 博奎特 日晒 中烘',
        country: '巴拿马',
        region: '博奎特',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Caturra',
        flavorNotes: ['焦糖', '红苹果', '牛奶巧克力', '坚果'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '02',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '18g',
        waterAmount: '270ml',
        waterTemperature: '91°C',
        brewTime: '165s',
      },
      rating: 8,
    },
    {
      file: '37-kalita-185-medium-kochere-natural.brew.json',
      name: '科契尔中烘 · 埃塞俄比亚 科契尔 日晒 中烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '科契尔', '埃塞俄比亚', '中烘', '日晒', '小众产区'],
      coffee: {
        name: '埃塞俄比亚 科契尔 日晒 中烘',
        country: '埃塞俄比亚',
        region: '科契尔',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Heirloom',
        flavorNotes: ['焦糖', '杏桃', '花香', '柑橘'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '185',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '22g',
        waterAmount: '330ml',
        waterTemperature: '91°C',
        brewTime: '200s',
      },
      rating: 8.2,
    },
    {
      file: '38-chemex-medium-suldeminas-natural.brew.json',
      name: '南米纳斯大份中烘 · 巴西 南米纳斯 日晒 中烘',
      author: 'brewcode-os/genesis',
      tags: ['Chemex', '大份量', '巴西', '南米纳斯', '中烘', '日晒'],
      coffee: {
        name: '巴西 南米纳斯 日晒 中烘',
        country: '巴西',
        region: '南米纳斯',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Mundo Novo',
        flavorNotes: ['焦糖', '坚果', '黑巧克力', '谷物'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '8 Cup',
        grinder: 'EK43',
      },
      recipe: {
        ratio: '1:15',
        dose: '36g',
        waterAmount: '540ml',
        waterTemperature: '91°C',
        brewTime: '270s',
      },
      rating: 8,
    },
    {
      file: '39-origami-medium-tolima-washed.brew.json',
      name: '托利马中烘 · 哥伦比亚 托利马 水洗 中烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '哥伦比亚', '托利马', '中烘', '水洗', '精品产区'],
      coffee: {
        name: '哥伦比亚 托利马 水洗 中烘',
        country: '哥伦比亚',
        region: '托利马',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Caturra',
        flavorNotes: ['焦糖', '红苹果', '可可', '柑橘'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '18g',
        waterAmount: '270ml',
        waterTemperature: '91°C',
        brewTime: '200s',
      },
      rating: 8,
    },
    {
      file: '40-v60-01-medium-muranga-washed-rolf.brew.json',
      name: 'April 风格 · 肯尼亚 穆拉雅 水洗 中烘',
      author: 'Patrik Rolf',
      tags: ['V60', 'Patrik Rolf', 'April Coffee', '冠军方案', '中烘', '水洗', '肯尼亚'],
      coffee: {
        name: '肯尼亚 穆拉雅 水洗 中烘',
        country: '肯尼亚',
        region: '穆拉雅',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'SL34',
        flavorNotes: ['黑加仑', '焦糖', '葡萄柚', '花香'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:18.5',
        dose: '13g',
        waterAmount: '240ml',
        waterTemperature: '93°C',
        brewTime: '120s',
      },
      rating: 8.5,
    },
    {
      file: '41-v60-01-light-loja-washed.brew.json',
      name: '洛哈新星 · 厄瓜多尔 洛哈 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '厄瓜多尔', '洛哈', '浅烘', '水洗', '南美新兴产区'],
      coffee: {
        name: '厄瓜多尔 洛哈 水洗 浅烘',
        country: '厄瓜多尔',
        region: '洛哈',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Typica',
        flavorNotes: ['蜂蜜', '柑橘', '杏仁', '花香'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '92°C',
        brewTime: '160s',
      },
      rating: 7.8,
    },
    {
      file: '42-kalita-155-light-nyamasheke-washed.brew.json',
      name: '尼亚马谢凯慢萃 · 卢旺达 尼亚马谢凯 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '卢旺达', '尼亚马谢凯', '浅烘', '水洗', '非洲小众'],
      coffee: {
        name: '卢旺达 尼亚马谢凯 水洗 浅烘',
        country: '卢旺达',
        region: '尼亚马谢凯',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Bourbon',
        flavorNotes: ['红茶', '焦糖', '柠檬', '梅子'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '155',
        grinder: 'C40',
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
      file: '43-origami-light-mocha-natural.brew.json',
      name: '也门摩卡古典 · 也门 摩卡 日晒 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '也门', '摩卡', '浅烘', '日晒', '古老产区', '文化深度'],
      coffee: {
        name: '也门 摩卡 日晒 浅烘',
        country: '也门',
        region: '摩卡',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['香料', '黑巧克力', '葡萄干', '木质香'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '94°C',
        brewTime: '210s',
      },
      rating: 8.5,
    },
    {
      file: '44-chemex-light-yungas-washed.brew.json',
      name: '永加斯云端 · 玻利维亚 永加斯 水洗 浅烘',
      author: 'brewcode-os/genesis',
      tags: ['Chemex', '玻利维亚', '永加斯', '浅烘', '水洗', '南美高海拔'],
      coffee: {
        name: '玻利维亚 永加斯 水洗 浅烘',
        country: '玻利维亚',
        region: '永加斯',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Caturra',
        flavorNotes: ['花香', '白桃', '蜂蜜', '绿茶'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '6 Cup',
        grinder: 'EK43',
      },
      recipe: {
        ratio: '1:16',
        dose: '25g',
        waterAmount: '400ml',
        waterTemperature: '93°C',
        brewTime: '240s',
      },
      rating: 8.3,
    },
    {
      file: '45-aeropress-medium-chanchamayo-natural.brew.json',
      name: '钱查马约中烘 · 秘鲁 钱查马约 日晒 中烘',
      author: 'brewcode-os/genesis',
      tags: ['爱乐压', 'Aeropress', '秘鲁', '钱查马约', '中烘', '日晒'],
      coffee: {
        name: '秘鲁 钱查马约 日晒 中烘',
        country: '秘鲁',
        region: '钱查马约',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Typica',
        flavorNotes: ['焦糖', '坚果', '牛奶巧克力', '柑橘'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '16g',
        waterAmount: '240ml',
        waterTemperature: '90°C',
        brewTime: '110s',
      },
      rating: 7.8,
    },
    {
      file: '46-frenchpress-medium-ngozi-washed.brew.json',
      name: '恩戈齐中烘 · 布隆迪 恩戈齐 水洗 中烘',
      author: 'brewcode-os/genesis',
      tags: ['法压壶', 'French Press', '布隆迪', '恩戈齐', '中烘', '水洗', '非洲小农'],
      coffee: {
        name: '布隆迪 恩戈齐 水洗 中烘',
        country: '布隆迪',
        region: '恩戈齐',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Bourbon',
        flavorNotes: ['花香', '蜂蜜', '柠檬', '红茶'],
      },
      equipment: {
        brewer: '法压壶',
        brewerSize: '350ml',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '20g',
        waterAmount: '300ml',
        waterTemperature: '92°C',
        brewTime: '420s',
      },
      rating: 8,
    },
    {
      file: '47-v60-02-medium-kilimanjaro-washed.brew.json',
      name: '乞力马扎罗中烘 · 坦桑尼亚 乞力马扎罗 水洗 中烘',
      author: 'brewcode-os/genesis',
      tags: ['V60', '坦桑尼亚', '乞力马扎罗', '中烘', '水洗', '非洲经典'],
      coffee: {
        name: '坦桑尼亚 乞力马扎罗 水洗 中烘',
        country: '坦桑尼亚',
        region: '乞力马扎罗',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Bourbon',
        flavorNotes: ['黑加仑', '柑橘', '焦糖', '可可'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '02',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '18g',
        waterAmount: '270ml',
        waterTemperature: '92°C',
        brewTime: '200s',
      },
      rating: 8,
    },
    {
      file: '48-kalita-185-medium-jinotega-honey.brew.json',
      name: '希诺特加蜜处理 · 尼加拉瓜 希诺特加 蜜处理 中烘',
      author: 'brewcode-os/genesis',
      tags: ['Kalita Wave', '尼加拉瓜', '希诺特加', '中烘', '蜜处理', '中美洲'],
      coffee: {
        name: '尼加拉瓜 希诺特加 蜜处理 中烘',
        country: '尼加拉瓜',
        region: '希诺特加',
        process: '蜜处理',
        roastLevel: '中烘',
        variety: 'Caturra',
        flavorNotes: ['焦糖', '葡萄干', '杏仁', '牛奶巧克力'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '185',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '20g',
        waterAmount: '300ml',
        waterTemperature: '90°C',
        brewTime: '210s',
      },
      rating: 8.2,
    },
    {
      file: '49-origami-dark-sidamo-natural.brew.json',
      name: '西达摩深烘 · 埃塞俄比亚 西达摩 日晒 深烘',
      author: 'brewcode-os/genesis',
      tags: ['Origami', '深烘', '西达摩', '埃塞俄比亚', '日晒', '实验方案', '颠覆性'],
      coffee: {
        name: '埃塞俄比亚 西达摩 日晒 深烘',
        country: '埃塞俄比亚',
        region: '西达摩',
        process: '日晒',
        roastLevel: '深烘',
        variety: 'Heirloom',
        flavorNotes: ['黑巧克力', '莓果', '焦糖', '香料'],
      },
      equipment: {
        brewer: 'Origami',
        brewerSize: 'S',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:13',
        dose: '18g',
        waterAmount: '234ml',
        waterTemperature: '92°C',
        brewTime: '180s',
      },
      rating: 8.2,
    },
    {
      file: '50-v60-01-dark-cauca-washed-hoffmann.brew.json',
      name: 'Hoffmann 深烘哲学 · 哥伦比亚 考卡 水洗 深烘',
      author: 'James Hoffmann',
      tags: ['V60', 'James Hoffmann', '冠军方案', '深烘', '哥伦比亚', '考卡', '收官之作'],
      coffee: {
        name: '哥伦比亚 考卡 水洗 深烘',
        country: '哥伦比亚',
        region: '考卡',
        process: '水洗',
        roastLevel: '深烘',
        variety: 'Castillo',
        flavorNotes: ['黑巧克力', '焦糖', '烤坚果', '可可'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:13',
        dose: '15g',
        waterAmount: '195ml',
        waterTemperature: '88°C',
        brewTime: '150s',
      },
      rating: 8.8,
    },
    {
      file: 'aeropress-dark-sumatra-wet-hulled.brew.json',
      name: '爱乐压 Tim Wendelboe 法 · 印尼 苏门答腊 湿刨',
      author: 'BrewCode社区',
      tags: ['爱乐压', 'Aeropress', '深烘', '湿刨', '印尼'],
      coffee: {
        name: '印尼 苏门答腊 曼特宁 湿刨',
        country: '印尼',
        region: '苏门答腊',
        process: '湿刨',
        roastLevel: '深烘',
        variety: 'Typica',
        flavorNotes: ['黑巧克力', '香料', '烟熏', '焦糖'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:14.3',
        dose: '14g',
        waterAmount: '200ml',
        waterTemperature: '85°C',
        brewTime: '120s',
      },
      rating: 8,
    },
    {
      file: 'aeropress-light-sidamo-natural.brew.json',
      name: '爱乐压西达摩 · 埃塞俄比亚 西达摩 日晒',
      author: 'BrewCode社区',
      tags: ['爱乐压', 'Aeropress', '浅烘', '日晒', '埃塞俄比亚'],
      coffee: {
        name: '埃塞俄比亚 西达摩 日晒',
        country: '埃塞俄比亚',
        region: '西达摩',
        process: '日晒',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['草莓', '蓝莓', '花香', '蜂蜜'],
      },
      equipment: {
        brewer: '爱乐压',
        brewerSize: '',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '92°C',
        brewTime: '120s',
      },
      rating: 8.2,
    },
    {
      file: 'chemex-medium-antigua-washed.brew.json',
      name: 'Chemex 大份优雅 · 危地马拉 安提瓜 水洗',
      author: 'BrewCode社区',
      tags: ['Chemex', '大份冲煮', '中烘', '水洗', '危地马拉'],
      coffee: {
        name: '危地马拉 安提瓜 水洗',
        country: '危地马拉',
        region: '安提瓜',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Bourbon',
        flavorNotes: ['可可', '花香', '柑橘', '烤杏仁'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '6杯',
        grinder: 'EK43',
      },
      recipe: {
        ratio: '1:15',
        dose: '36g',
        waterAmount: '540ml',
        waterTemperature: '92°C',
        brewTime: '270s',
      },
      rating: 8.2,
    },
    {
      file: 'chemex-medium-santa-barbara-washed.brew.json',
      name: 'Chemex 中美洲 · 洪都拉斯 圣巴巴拉 水洗',
      author: 'BrewCode社区',
      tags: ['Chemex', '洪都拉斯', '中烘', '水洗', '大份量'],
      coffee: {
        name: '洪都拉斯 圣巴巴拉 水洗',
        country: '洪都拉斯',
        region: '圣巴巴拉',
        process: '水洗',
        roastLevel: '中烘',
        variety: 'Catuai',
        flavorNotes: ['焦糖', '牛奶巧克力', '麦芽', '柑橘'],
      },
      equipment: {
        brewer: 'Chemex',
        brewerSize: '8杯',
        grinder: 'EK43',
      },
      recipe: {
        ratio: '1:15',
        dose: '40g',
        waterAmount: '600ml',
        waterTemperature: '91°C',
        brewTime: '300s',
      },
      rating: 8,
    },
    {
      file: 'frenchpress-dark-cerrado-natural.brew.json',
      name: '法压壶 James Hoffmann 法 · 巴西 喜拉多 日晒',
      author: 'BrewCode社区',
      tags: ['法压壶', 'French Press', '深烘', '日晒', '巴西'],
      coffee: {
        name: '巴西 喜拉多 日晒',
        country: '巴西',
        region: '喜拉多',
        process: '日晒',
        roastLevel: '深烘',
        variety: 'Bourbon',
        flavorNotes: ['黑巧克力', '烤坚果', '焦糖', '烟丝'],
      },
      equipment: {
        brewer: '法压壶',
        brewerSize: '350ml',
        grinder: 'C40',
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
      file: 'frenchpress-medium-tarrazu-honey.brew.json',
      name: '法压哥斯达黎加 · 哥斯达黎加 塔拉珠 蜜处理',
      author: 'BrewCode社区',
      tags: ['法压壶', 'French Press', '中烘', '蜜处理', '哥斯达黎加'],
      coffee: {
        name: '哥斯达黎加 塔拉珠 蜜处理',
        country: '哥斯达黎加',
        region: '塔拉珠',
        process: '蜜处理',
        roastLevel: '中烘',
        variety: 'Caturra',
        flavorNotes: ['焦糖', '葡萄干', '坚果', '柑橘'],
      },
      equipment: {
        brewer: '法压壶',
        brewerSize: '350ml',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '20g',
        waterAmount: '300ml',
        waterTemperature: '90°C',
        brewTime: '540s',
      },
      rating: 8.2,
    },
    {
      file: 'kalita-155-light-kirinyaga-washed.brew.json',
      name: '基里尼亚加慢萃 · 肯尼亚 基里尼亚加 水洗',
      author: 'BrewCode社区',
      tags: ['Kalita Wave', '肯尼亚', '浅烘', '水洗', '基里尼亚加'],
      coffee: {
        name: '肯尼亚 基里尼亚加 水洗',
        country: '肯尼亚',
        region: '基里尼亚加',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'SL28',
        flavorNotes: ['黑加仑', '乌梅', '红糖', '葡萄柚'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '155',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '15g',
        waterAmount: '225ml',
        waterTemperature: '94°C',
        brewTime: '180s',
      },
      rating: 8.5,
    },
    {
      file: 'kalita-155-light-nyeri-washed.brew.json',
      name: '平底慢萃 · 肯尼亚 涅里 水洗',
      author: 'BrewCode社区',
      tags: ['Kalita Wave', '平底滤杯', '浅烘', '水洗', '肯尼亚'],
      coffee: {
        name: '肯尼亚 涅里 水洗',
        country: '肯尼亚',
        region: '涅里',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'SL28',
        flavorNotes: ['黑加仑', '番茄', '红糖', '葡萄柚'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '155',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '94°C',
        brewTime: '180s',
      },
      rating: 8.5,
    },
    {
      file: 'kalita-185-dark-cerrado-natural.brew.json',
      name: '深烘巴西 · 巴西 喜拉多 日晒 深烘',
      author: 'BrewCode社区',
      tags: ['Kalita Wave', '巴西', '深烘', '日晒', '低温'],
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
        brewer: 'Kalita Wave',
        brewerSize: '185',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:14',
        dose: '20g',
        waterAmount: '280ml',
        waterTemperature: '85°C',
        brewTime: '180s',
      },
      rating: 7.8,
    },
    {
      file: 'kalita-185-medium-cerrado-natural.brew.json',
      name: '平底大份 · 巴西 喜拉多 日晒',
      author: 'BrewCode社区',
      tags: ['Kalita Wave', '平底滤杯', '中烘', '日晒', '巴西'],
      coffee: {
        name: '巴西 喜拉多 日晒',
        country: '巴西',
        region: '喜拉多',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Bourbon',
        flavorNotes: ['坚果', '巧克力', '焦糖', '花生'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '185',
        grinder: 'EK43',
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
      file: 'kalita-185-medium-tarrazu-honey.brew.json',
      name: '哥斯达黎加蜜处理 · 哥斯达黎加 塔拉珠 蜜处理',
      author: 'BrewCode社区',
      tags: ['Kalita Wave', '哥斯达黎加', '中烘', '蜜处理'],
      coffee: {
        name: '哥斯达黎加 塔拉珠 蜜处理',
        country: '哥斯达黎加',
        region: '塔拉珠',
        process: '蜜处理',
        roastLevel: '中烘',
        variety: 'Caturra',
        flavorNotes: ['焦糖', '葡萄干', '杏仁', '柑橘'],
      },
      equipment: {
        brewer: 'Kalita Wave',
        brewerSize: '185',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '20g',
        waterAmount: '300ml',
        waterTemperature: '90°C',
        brewTime: '195s',
      },
      rating: 8,
    },
    {
      file: 'origami-light-guji-natural.brew.json',
      name: '折纸慢萃 · 埃塞俄比亚 古吉 日晒',
      author: 'BrewCode社区',
      tags: ['Origami', '折纸滤杯', '浅烘', '日晒', '埃塞俄比亚'],
      coffee: {
        name: '埃塞俄比亚 古吉 日晒',
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
        grinder: 'C40',
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
      file: 'origami-light-panama-geisha-natural.brew.json',
      name: '折纸瑰夏 · 巴拿马 瑰夏 日晒',
      author: 'BrewCode社区',
      tags: ['Origami', '瑰夏', 'Geisha', '浅烘', '日晒', '巴拿马'],
      coffee: {
        name: '巴拿马 瑰夏 日晒',
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
        grinder: 'EK43',
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
      file: 'v60-01-light-panama-geisha-washed.brew.json',
      name: '瑰夏专属 · 巴拿马 翡翠庄园 水洗瑰夏',
      author: 'BrewCode社区',
      tags: ['V60', '瑰夏', 'Geisha', '浅烘', '水洗', '巴拿马'],
      coffee: {
        name: '巴拿马 翡翠庄园 水洗瑰夏',
        country: '巴拿马',
        region: '波奎特',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Geisha',
        flavorNotes: ['茉莉花', '柑橘', '佛手柑', '蜂蜜'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'EK43',
      },
      recipe: {
        ratio: '1:16',
        dose: '15g',
        waterAmount: '240ml',
        waterTemperature: '94°C',
        brewTime: '150s',
      },
      rating: 9.2,
    },
    {
      file: 'v60-01-light-yirgacheffe-natural.brew.json',
      name: '单点慢注 · 埃塞俄比亚 耶加雪菲 日晒',
      author: 'BrewCode社区',
      tags: ['V60', '单点注水', '浅烘', '日晒', '埃塞俄比亚'],
      coffee: {
        name: '埃塞俄比亚 耶加雪菲 日晒',
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
        grinder: 'C40',
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
      file: 'v60-01-light-yirgacheffe-washed.brew.json',
      name: 'Tetsu Kasuya 4:6 法 · 埃塞俄比亚 耶加雪菲 水洗',
      author: 'BrewCode社区',
      tags: ['V60', '4:6法', '冠军方案', '浅烘', '水洗'],
      coffee: {
        name: '埃塞俄比亚 耶加雪菲 水洗',
        country: '埃塞俄比亚',
        region: '耶加雪菲',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['茉莉花', '柠檬', '绿茶', '蜂蜜'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '01',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '20g',
        waterAmount: '300ml',
        waterTemperature: '93°C',
        brewTime: '210s',
      },
      rating: 8.5,
    },
    {
      file: 'v60-02-dark-antigua-washed.brew.json',
      name: '深烘危地马拉 · 危地马拉 安提瓜 水洗 深烘',
      author: 'BrewCode社区',
      tags: ['V60', '危地马拉', '深烘', '水洗', '低温'],
      coffee: {
        name: '危地马拉 安提瓜 水洗 深烘',
        country: '危地马拉',
        region: '安提瓜',
        process: '水洗',
        roastLevel: '深烘',
        variety: 'Bourbon',
        flavorNotes: ['黑巧克力', '烟熏', '焦糖', '雪松'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '02',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:14',
        dose: '18g',
        waterAmount: '252ml',
        waterTemperature: '85°C',
        brewTime: '150s',
      },
      rating: 7.8,
    },
    {
      file: 'v60-02-light-sidamo-washed.brew.json',
      name: '西达摩经典 · 埃塞俄比亚 西达摩 水洗',
      author: 'BrewCode社区',
      tags: ['V60', '西达摩', '浅烘', '水洗', '埃塞俄比亚'],
      coffee: {
        name: '埃塞俄比亚 西达摩 水洗',
        country: '埃塞俄比亚',
        region: '西达摩',
        process: '水洗',
        roastLevel: '浅烘',
        variety: 'Heirloom',
        flavorNotes: ['柠檬', '红茶', '焦糖', '橙花'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '02',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '18g',
        waterAmount: '270ml',
        waterTemperature: '92°C',
        brewTime: '165s',
      },
      rating: 8.2,
    },
    {
      file: 'v60-02-medium-huila-washed.brew.json',
      name: '经典三段式 · 哥伦比亚 蕙兰 水洗',
      author: 'BrewCode社区',
      tags: ['V60', '三段注水', '经典方案', '中烘', '水洗'],
      coffee: {
        name: '哥伦比亚 蕙兰 水洗',
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
        grinder: 'C40',
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
      file: 'v60-02-medium-narino-natural.brew.json',
      name: '五段慢注 · 哥伦比亚 娜玲珑 日晒',
      author: 'BrewCode社区',
      tags: ['V60', '五段注水', '中烘', '日晒', '哥伦比亚'],
      coffee: {
        name: '哥伦比亚 娜玲珑 日晒',
        country: '哥伦比亚',
        region: '娜玲珑',
        process: '日晒',
        roastLevel: '中烘',
        variety: 'Castillo',
        flavorNotes: ['焦糖', '芒果', '红苹果', '可可'],
      },
      equipment: {
        brewer: 'V60',
        brewerSize: '02',
        grinder: 'C40',
      },
      recipe: {
        ratio: '1:15',
        dose: '18g',
        waterAmount: '270ml',
        waterTemperature: '91°C',
        brewTime: '180s',
      },
      rating: 8,
    },
  ];

  function loadManifest() {
    try {
      allRecipes = SEEDS_MANIFEST;
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
