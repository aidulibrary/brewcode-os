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

  /* ── DOM refs ── */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const loadScreen = $('#load-screen');
  const brewScreen = $('#brew-screen');
  const overview = $('#overview');
  const stepView = $('#step-view');
  const doneView = $('#done-view');

  /* ── State machine ── */
  const STATE = {
    IDLE: 'idle',
    LOADED: 'loaded',
    PLAYING: 'playing',
    PAUSED: 'paused',
    DONE: 'done',
  };
  let state = STATE.IDLE;
  let recipe = null; /* parsed .brew JSON */
  let currentStep = 0; /* 0-based index into recipe.steps */
  let timerSeconds = 0;
  let timerInterval = null;
  let timerRunning = false;

  /* ── Transition ── */
  function setState(newState) {
    state = newState;
    render();
  }

  /* ── Render dispatcher ── */
  function render() {
    if (state === STATE.IDLE) {
      loadScreen.classList.remove('hidden');
      brewScreen.classList.add('hidden');
    } else {
      loadScreen.classList.add('hidden');
      brewScreen.classList.remove('hidden');
      renderOverview();
      renderStep();
      renderDone();
    }
  }

  /* ── Load recipe ── */
  function loadRecipe(jsonText) {
    try {
      const data = JSON.parse(jsonText);

      /* basic validation */
      if (!data.meta || !data.meta.name) throw new Error(BrewCodeI18n.t('player.missingMetaName'));
      if (!data.recipe) throw new Error(BrewCodeI18n.t('player.missingRecipe'));
      if (!data.steps || !Array.isArray(data.steps) || data.steps.length === 0) {
        throw new Error(BrewCodeI18n.t('player.missingSteps'));
      }

      data.steps.sort((a, b) => a.order - b.order);
      recipe = data;
      currentStep = 0;
      stopTimer();
      setState(STATE.LOADED);
      $('#load-error').classList.add('hidden');
    } catch (e) {
      $('#load-error').textContent = BrewCodeI18n.t('player.parseError') + e.message;
      $('#load-error').classList.remove('hidden');
    }
  }

  /* ── Render overview ── */
  function renderOverview() {
    if (state === STATE.LOADED) {
      overview.classList.remove('hidden');
    } else {
      overview.classList.add('hidden');
      return;
    }

    const m = recipe.meta;
    const c = recipe.coffee || {};
    const e = recipe.equipment || {};
    const r = recipe.recipe;

    $('#ov-name').textContent = m.name;
    $('#ov-author').textContent = m.author ? BrewCodeI18n.t('player.author') + m.author : '';
    $('#ov-desc').textContent = m.description || '';

    /* coffee */
    let coffeeParts = [];
    if (c.name) coffeeParts.push(c.name);
    if (c.roaster) coffeeParts.push(c.roaster);
    if (c.roastLevel) coffeeParts.push(c.roastLevel);
    if (c.process) coffeeParts.push(c.process);
    $('#ov-coffee').textContent = coffeeParts.join(' · ') || BrewCodeI18n.t('player.unspecified');

    /* equipment */
    let equipParts = [];
    if (e.brewer) equipParts.push(e.brewer);
    if (e.grinder) equipParts.push(e.grinder);
    if (e.filter) equipParts.push(e.filter);
    $('#ov-equipment').textContent = equipParts.join(' · ') || BrewCodeI18n.t('player.unspecified');

    /* recipe params */
    const params = $('#ov-recipe');
    params.innerHTML = '';

    const addParam = (label, value) => {
      const div = document.createElement('div');
      div.className = 'param-item';
      div.innerHTML =
        '<span class="param-label">' +
        label +
        '</span><span class="param-value">' +
        value +
        '</span>';
      params.appendChild(div);
    };

    if (r.dose) addParam(BrewCodeI18n.t('player.dose'), r.dose.value + r.dose.unit);
    if (r.waterAmount) addParam(BrewCodeI18n.t('player.waterAmount'), r.waterAmount.value + (r.waterAmount.unit || 'ml'));
    if (r.ratio) addParam(BrewCodeI18n.t('player.ratio'), r.ratio);
    if (r.grindSize) {
      let gs = r.grindSize.value + (r.grindSize.unit ? ' ' + r.grindSize.unit : '');
      addParam(BrewCodeI18n.t('player.grindSize'), gs);
    }
    if (r.waterTemperature) {
      addParam(BrewCodeI18n.t('player.waterTemp'), r.waterTemperature.value + (r.waterTemperature.unit || '°C'));
    }
    if (r.brewTime) {
      addParam(BrewCodeI18n.t('player.brewTime'), r.brewTime.value + (r.brewTime.unit || 's'));
    }
  }

  /* ── Action labels ── */
  function actionLabel(action) {
    return BrewCodeI18n.t('action.' + (action || '')) || action || '';
  }

  /* ── Render step ── */
  function renderStep() {
    if (state !== STATE.PLAYING && state !== STATE.PAUSED) {
      stepView.classList.add('hidden');
      return;
    }
    stepView.classList.remove('hidden');

    const steps = recipe.steps;
    const s = steps[currentStep];
    const total = steps.length;

    /* progress */
    const pct = (currentStep / total) * 100;
    $('#progress-fill').style.width = pct + '%';
    $('#progress-text').textContent = BrewCodeI18n.t('player.step') + ' ' + (currentStep + 1) + ' / ' + total;

    /* header */
    $('#header-step').textContent = BrewCodeI18n.t('player.step') + ' ' + (currentStep + 1) + '/' + total;

    /* badge */
    $('#step-badge').textContent = actionLabel(s.action);

    /* action text */
    let actionText = s.description || actionLabel(s.action);
    $('#step-action').textContent = actionText;

    /* description (extra detail) */
    $('#step-desc').textContent = '';

    /* water amount */
    const waterDiv = $('#step-water');
    if (s.waterAmount && s.waterAmount.value > 0) {
      waterDiv.classList.remove('hidden');
      $('#water-value').textContent = s.waterAmount.value + (s.waterAmount.unit || 'ml');

      if (s.cumulativeWater && s.cumulativeWater.value > 0) {
        $('#water-target').textContent =
          BrewCodeI18n.t('player.cumulative') + ' ' + s.cumulativeWater.value + (s.cumulativeWater.unit || 'ml');
      } else if (s.targetWeight && s.targetWeight.value > 0) {
        $('#water-target').textContent = BrewCodeI18n.t('player.targetWeight') + ' ' + s.targetWeight.value + 'g';
      } else {
        $('#water-target').textContent = '';
      }
    } else {
      waterDiv.classList.add('hidden');
    }

    /* pour info */
    const pourDiv = $('#step-pour-info');
    if (s.pourStyle || s.pourIntensity) {
      pourDiv.classList.remove('hidden');
      $('#pour-style').textContent = s.pourStyle || '';
      $('#pour-intensity').textContent = s.pourIntensity || '';
    } else {
      pourDiv.classList.add('hidden');
    }

    /* timer */
    const timerDiv = $('#timer-display');
    const btnTimer = $('#btn-timer');
    if (s.duration && s.duration.value > 0) {
      timerDiv.classList.remove('hidden');
      btnTimer.classList.remove('hidden');
      if (!timerRunning) {
        timerSeconds = durationToSeconds(s.duration);
        updateTimerDisplay();
      }
    } else {
      timerDiv.classList.add('hidden');
      btnTimer.classList.add('hidden');
    }

    if (timerRunning) {
      btnTimer.textContent = BrewCodeI18n.t('player.pause');
      btnTimer.classList.add('btn-ghost');
      btnTimer.classList.remove('btn-timer');
    } else if (s.duration && s.duration.value > 0) {
      btnTimer.textContent = BrewCodeI18n.t('player.startTimer') + ' (' + formatTime(durationToSeconds(s.duration)) + ')';
      btnTimer.classList.add('btn-timer');
      btnTimer.classList.remove('btn-ghost');
    }

    /* next button */
    if (currentStep >= total - 1) {
      $('#btn-next').textContent = BrewCodeI18n.t('player.finish');
    } else {
      $('#btn-next').textContent = BrewCodeI18n.t('player.nextStep');
    }
  }

  function durationToSeconds(d) {
    if (!d) return 0;
    if (d.unit === 'min') return Math.round(d.value * 60);
    return Math.round(d.value);
  }

  function formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function updateTimerDisplay() {
    $('#timer-value').textContent = formatTime(timerSeconds);
  }

  /* ── Timer logic ── */
  function startTimer() {
    if (timerRunning) return;
    if (timerSeconds <= 0) return;
    timerRunning = true;
    timerInterval = setInterval(function () {
      timerSeconds--;
      updateTimerDisplay();
      if (timerSeconds <= 0) {
        stopTimer();
      }
    }, 1000);
    renderStep();
  }

  function stopTimer() {
    timerRunning = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function pauseTimer() {
    stopTimer();
    renderStep();
  }

  /* ── Render done ── */
  function renderDone() {
    if (state !== STATE.DONE) {
      doneView.classList.add('hidden');
      return;
    }
    doneView.classList.remove('hidden');

    const totalSteps = recipe.steps.length;
    $('#done-msg').textContent = BrewCodeI18n.t('player.doneMsg') + ' ' + totalSteps + ' ' + BrewCodeI18n.t('player.doneMsgSuffix');

    const result = recipe.result;
    const resultDiv = $('#done-result');
    const resultContent = $('#done-result-content');

    if (result && Object.keys(result).length > 0) {
      resultDiv.classList.remove('hidden');
      resultContent.innerHTML = '';

      const addResult = function (label, value) {
        var d = document.createElement('div');
        d.className = 'result-item';
        d.innerHTML =
          '<span class="result-label">' +
          label +
          '</span><span class="result-value">' +
          value +
          '</span>';
        resultContent.appendChild(d);
      };

      if (result.actualBrewTime) {
        addResult(BrewCodeI18n.t('player.actualTime'), result.actualBrewTime.value + (result.actualBrewTime.unit || 's'));
      }
      if (result.finalYield) {
        addResult(BrewCodeI18n.t('player.yield'), result.finalYield.value + (result.finalYield.unit || 'g'));
      }
      if (result.measuredTDS != null) addResult('TDS', result.measuredTDS + '%');
      if (result.extractionYield != null) addResult(BrewCodeI18n.t('player.extraction'), result.extractionYield + '%');
      if (result.rating != null) addResult(BrewCodeI18n.t('player.rating'), result.rating + '/10');
    } else {
      resultDiv.classList.add('hidden');
    }

    $('#header-step').textContent = BrewCodeI18n.t('player.completed');
  }

  /* ── Event handlers ── */

  /* Paste */
  $('#btn-paste').addEventListener('click', function () {
    $('#paste-area').classList.toggle('hidden');
  });

  $('#btn-cancel').addEventListener('click', function () {
    $('#paste-area').classList.add('hidden');
    $('#paste-text').value = '';
  });

  $('#btn-load').addEventListener('click', function () {
    var text = $('#paste-text').value.trim();
    if (text) {
      loadRecipe(text);
      $('#paste-area').classList.add('hidden');
    }
  });

  /* File */
  $('#btn-file').addEventListener('click', function () {
    $('#file-input').click();
  });

  $('#file-input').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      loadRecipe(ev.target.result);
    };
    reader.readAsText(file);
    this.value = '';
  });

  /* Start brewing */
  $('#btn-start').addEventListener('click', function () {
    stopTimer();
    currentStep = 0;
    setState(STATE.PLAYING);
  });

  /* Next step */
  $('#btn-next').addEventListener('click', function () {
    if (currentStep < recipe.steps.length - 1) {
      stopTimer();
      currentStep++;
      setState(STATE.PLAYING);
    } else {
      stopTimer();
      setState(STATE.DONE);
    }
  });

  /* Timer button */
  $('#btn-timer').addEventListener('click', function () {
    if (timerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  /* Back to overview */
  $('#btn-back').addEventListener('click', function () {
    stopTimer();
    setState(STATE.LOADED);
  });

  /* Restart */
  $('#btn-restart').addEventListener('click', function () {
    stopTimer();
    currentStep = 0;
    setState(STATE.PLAYING);
  });

  /* New recipe */
  $('#btn-new').addEventListener('click', function () {
    stopTimer();
    recipe = null;
    currentStep = 0;
    setState(STATE.IDLE);
  });

  /* ── URL param: ?brew=JSON or ?brew=URL ── */
  (function () {
    var params = new URLSearchParams(window.location.search);
    var brewParam = params.get('brew');
    if (brewParam) {
      var raw = brewParam;
      if (raw.trim().charAt(0) === '{') {
        /* inline JSON (from Forge) */
        try {
          JSON.parse(raw); /* validate */
          console.log('[BrewPlayer] loading inline JSON, length=' + raw.length);
          loadRecipe(raw);
        } catch (e) {
          console.error('[BrewPlayer] inline JSON parse failed:', e);
          $('#load-error').textContent = BrewCodeI18n.t('player.parseError') + e.message;
          $('#load-error').classList.remove('hidden');
        }
      } else {
        /* remote URL or relative path (from Repo) */
        console.log('[BrewPlayer] fetching remote recipe: ' + raw);
        fetch(raw)
          .then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.text();
          })
          .then(function (jsonText) {
            console.log('[BrewPlayer] remote recipe loaded, length=' + jsonText.length);
            loadRecipe(jsonText);
          })
          .catch(function (e) {
            console.error('[BrewPlayer] remote fetch failed:', e);
            $('#load-error').textContent = BrewCodeI18n.t('player.fetchError') + e.message;
            $('#load-error').classList.remove('hidden');
          });
      }
    }
  })();

  /* Back to Forge */
  $('#btn-back-to-forge').addEventListener('click', function () {
    if (!recipe) return;
    var isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    var forgeBase = isLocal ? 'http://localhost:8788' : 'https://forge.礼字号.中国';
    window.open(forgeBase + '/#brew=' + encodeURIComponent(JSON.stringify(recipe)), '_blank');
  });

  /* language init */
  var savedLang = localStorage.getItem('brewcode_lang');
  if (savedLang) {
    BrewCodeI18n.setLang(savedLang);
  }
  refreshI18nTexts();

  /* initial render */
  render();
})();
