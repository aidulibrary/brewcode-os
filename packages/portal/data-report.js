/*
 * BrewCode OS Data Report — SPA 内嵌路由模块
 * 当 URL 路径为 /data-report.html 时激活
 */
(function () {
  'use strict';
  if (window.location.pathname !== '/data-report.html') return;

  // =============================================================
  // 1. 停止 Portal 渲染 & 清理 DOM
  // =============================================================
  document.documentElement.innerHTML = '';

  // =============================================================
  // 2. 注入 CSS
  // =============================================================
  var style = document.createElement('style');
  style.textContent = [
    '*{margin:0;padding:0;box-sizing:border-box}',
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#1a1a2e;color:#e0ddd4;min-height:100vh}',
    '.wrap{max-width:960px;margin:0 auto;padding:40px 20px}',
    'h1{font-size:28px;color:#c8a882;margin-bottom:4px}',
    '.subtitle{font-size:14px;color:#888;margin-bottom:32px}',
    '.stats-row{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:40px}',
    '.stat-card{flex:1;min-width:120px;background:#23233a;border-radius:12px;padding:20px;text-align:center}',
    '.stat-card .num{font-size:32px;font-weight:700;color:#c8a882}',
    '.stat-card .label{font-size:12px;color:#888;margin-top:4px}',
    '.charts{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:40px}',
    '@media(max-width:640px){.charts{grid-template-columns:1fr}}',
    '.chart-box{background:#23233a;border-radius:12px;padding:20px}',
    '.chart-box h3{font-size:14px;color:#b4b2a9;margin-bottom:12px}',
    '.chart-box canvas{max-height:260px}',
    '.footer{text-align:center;font-size:12px;color:#666;padding:20px 0;border-top:1px solid #2a2a40;margin-top:40px}',
    '.loading{text-align:center;padding:80px 0;color:#888;font-size:16px}',
    '.empty{text-align:center;padding:80px 0;color:#666}',
    '.empty h2{font-size:20px;margin-bottom:8px}',
    '.empty p{font-size:14px}',
    '.hidden{display:none!important}',
    '.note{font-size:12px;color:#666;text-align:center;margin-bottom:32px;padding:12px;background:#1f1f35;border-radius:8px}',
    '.back-link{text-align:center;margin-top:20px}',
    '.back-link a{color:#c8a882;text-decoration:none;font-size:14px}',
    '.back-link a:hover{text-decoration:underline}'
  ].join('');
  document.head.appendChild(style);

  // =============================================================
  // 3. 注入 HTML
  // =============================================================
  var html = [
    '<div class="wrap" id="app">',
    '<h1>BrewCode OS · 全球家庭冲煮数据报告</h1>',
    '<p class="subtitle">Global Home Coffee Brewing Data Report</p>',
    '<div class="loading" id="loading">正在加载数据...</div>',
    '<div class="empty hidden" id="empty">',
    '<h2>尚无数据</h2>',
    '<p>匿名数据采集刚刚启动，冲煮方案贡献者的数据将在此聚合展示。</p>',
    '</div>',
    '<div class="hidden" id="content">',
    '<div class="stats-row" id="statsRow"></div>',
    '<div class="note">基于 <strong id="totalNote">0</strong> 次匿名冲煮数据提交。所有数据匿名采集，不含任何个人信息。</div>',
    '<div class="charts">',
    '<div class="chart-box"><h3>产区分布 / Origins</h3><canvas id="chartOrigin"></canvas></div>',
    '<div class="chart-box"><h3>器具分布 / Brewers</h3><canvas id="chartBrewer"></canvas></div>',
    '<div class="chart-box"><h3>烘焙度分布 / Roast Level</h3><canvas id="chartRoast"></canvas></div>',
    '<div class="chart-box"><h3>水温分布 / Water Temperature</h3><canvas id="chartTemp"></canvas></div>',
    '</div></div>',
    '<div class="back-link"><a href="https://brewcode.礼字号.中国">&larr; 返回首页</a></div>',
    '<div class="footer">',
    '<p>BrewCode OS · 开放数据集 · CC0 1.0</p>',
    '<p>本报告仅聚合匿名冲煮参数，不采集任何个人信息或设备标识。</p>',
    '</div></div>'
  ].join('');
  document.body.innerHTML = html;

  // =============================================================
  // 4. 更新标题
  // =============================================================
  document.title = 'BrewCode OS · 全球冲煮数据报告';

  // =============================================================
  // 5. 加载 Chart.js & 渲染
  // =============================================================
  var chartScript = document.createElement('script');
  chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4';
  chartScript.onload = initReport;
  document.head.appendChild(chartScript);

  function initReport() {
    var COLORS = ['#c8a882','#e8a850','#8bc34a','#64b5f6','#ce93d8','#ef5350','#26c6da','#ffca28','#7e57c2','#ec407a'];

    function render(data) {
      document.getElementById('loading').classList.add('hidden');
      if (!data || !data.total || data.total === 0) {
        document.getElementById('empty').classList.remove('hidden');
        return;
      }
      document.getElementById('content').classList.remove('hidden');
      document.getElementById('totalNote').textContent = data.total;

      var stats = [
        { num: data.total, label: '总提交 / Submissions' },
        { num: (data.origins || []).length, label: '产区 / Origins' },
        { num: (data.brewers || []).length, label: '器具 / Brewers' },
        { num: data.temperature && data.temperature.avg ? Math.round(data.temperature.avg * 10) / 10 + '°C' : '--', label: '平均水温 / Avg Temp' }
      ];
      document.getElementById('statsRow').innerHTML = stats.map(function(s) {
        return '<div class="stat-card"><div class="num">' + s.num + '</div><div class="label">' + s.label + '</div></div>';
      }).join('');

      makePie('chartOrigin', (data.origins||[]).map(function(o){return o.origin}), (data.origins||[]).map(function(o){return o.c}));
      makePie('chartBrewer', (data.brewers||[]).map(function(o){return o.brewer}), (data.brewers||[]).map(function(o){return o.c}));
      makePie('chartRoast', (data.roasts||[]).map(function(o){return o.roastLevel||'--'}), (data.roasts||[]).map(function(o){return o.c}));
      makeBar('chartTemp', '水温 (°C)', data.temperature);
    }

    function makePie(id, labels, values) {
      if (!labels.length) { document.getElementById(id).parentElement.querySelector('h3').textContent += ' (暂无)'; return; }
      new Chart(document.getElementById(id), {
        type:'doughnut', data:{labels:labels,datasets:[{data:values,backgroundColor:COLORS}]},
        options:{plugins:{legend:{position:'bottom',labels:{color:'#b4b2a9',font:{size:11}}}}}
      });
    }

    function makeBar(id, label, temps) {
      if (!temps || temps.avg == null) { document.getElementById(id).parentElement.querySelector('h3').textContent += ' (暂无)'; return; }
      new Chart(document.getElementById(id), {
        type:'bar', data:{labels:['最低','平均','最高'],datasets:[{label:label,data:[temps.min,temps.avg,temps.max],backgroundColor:['#8bc34a','#c8a882','#e8a850']}]},
        options:{plugins:{legend:{display:false}},scales:{y:{grid:{color:'#2a2a40'},ticks:{color:'#b4b2a9'}},x:{ticks:{color:'#b4b2a9'}}}}
      });
    }

    fetch('https://api.礼字号.中国/api/brew/stats')
      .then(function(r){return r.json()})
      .then(function(d){
        if (d.error) { render({total:0}); return; }
        render(d);
      })
      .catch(function(e){
        console.error('Data report fetch failed:', e);
        render({total:0});
      });
  }
})();
