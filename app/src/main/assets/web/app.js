/* Home: a lightweight Android TV home screen. Talks to Android via window.TV (MainActivity.Bridge). */
(function () {
  'use strict';

  /* ---------- Settings you may want to change ---------- */
  var CITY = { name: 'Hyderabad', lat: 17.385, lon: 78.4867 };
  var FAVOURITES = [            // shown first, in this order, until you rearrange
    'com.google.android.youtube.tv', 'com.netflix.ninja', 'com.amazon.amazonvideo.livingroom',
    'in.startv.hotstar', 'com.spotify.tv.android'
  ];
  var HIDE_BY_DEFAULT = /(setupwizard|factory|com\.android\.tv\.settings|\.dummy|feedback|tvrecommendations|fallbackhome|mstar|mediatek|hisense|disclaimer|netflixobserver|^com\.google\.android\.music$|^com\.google\.android\.videos$|^com\.google\.android\.play\.games$)/i;
  var COLS = 5, X0 = 102, COL_W = 354, GRID_TOP = 0, ROW_H = 250;
  var LONG_PRESS_MS = 550;

  /* ---------- Bridge (with a fake one for desktop previews) ---------- */
  var TV = window.TV || {
    apps: function () { return JSON.stringify([
      { appId: 'com.google.android.youtube.tv', name: 'YouTube', banner: '', icon: '' },
      { appId: 'com.netflix.ninja', name: 'Netflix', banner: '', icon: '' },
      { appId: 'in.startv.hotstar', name: 'JioHotstar', banner: '', icon: '' },
      { appId: 'com.android.vending', name: 'Google Play Store', banner: '', icon: '' }]); },
    inputs: function () { return JSON.stringify([{ id: 'hdmi1', label: 'HDMI 1' }, { id: 'hdmi2', label: 'HDMI 2' }]); },
    launch: function () { return true; }, openSettings: function () { return true; }, openWifi: function () { return true; },
    appInfo: function () { return true; }, openInput: function () { return true; }, openLiveTv: function () { return true; }
  };

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var STORE = 'home.v2';
  function load() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(prefs)); } catch (e) { } }
  var prefs = load();
  prefs.order = prefs.order || []; prefs.hidden = prefs.hidden || []; prefs.wall = prefs.wall || 0;

  var ICON = {
    inputs: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    wifi: '<svg viewBox="0 0 24 24"><path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/></svg>',
    wallpaper: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="15.5" cy="8.5" r="1.5"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    move: '<svg viewBox="0 0 24 24"><path d="M5 9l-3 3 3 3M19 9l3 3-3 3M2 12h20"/></svg>',
    hide: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.7M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>',
    show: '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    tv: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M8 2l4 4 4-4"/></svg>'
  };
  var UTILS = [
    { id: 'inputs', label: 'Inputs' }, { id: 'wifi', label: 'Wi-Fi' },
    { id: 'wallpaper', label: 'Wallpaper' }, { id: 'settings', label: 'Settings' }
  ];

  /* ---------- State ---------- */
  var all = {};          // appId -> app
  var visible = [];      // appIds shown in the row, in order
  var zone = 'apps', ai = 0, ui = 0;
  var panel = null;      // { title, items:[{label, icon, run}], i, hint }
  var moving = null;     // appId being moved

  /* ---------- Fit 1920x1080 stage to the screen ---------- */
  var stage = $('stage');
  function fit() {
    var de = document.documentElement;
    var w = window.innerWidth || de.clientWidth, h = window.innerHeight || de.clientHeight;
    if (!w || !h) { setTimeout(fit, 100); return; }
    var s = Math.min(w / 1920, h / 1080);
    stage.style.transform = 'scale(' + s + ')';
    stage.style.left = Math.max(0, (w - 1920 * s) / 2) + 'px';
    stage.style.top = Math.max(0, (h - 1080 * s) / 2) + 'px';
  }

  /* ---------- Apps ---------- */
  function loadApps() {
    var list = [];
    try { list = JSON.parse(TV.apps()) || []; } catch (e) { list = []; }
    all = {};
    list.forEach(function (a) { if (a && a.appId) all[a.appId] = a; });
    var order = prefs.order.filter(function (id) { return all[id]; });
    var fresh = Object.keys(all).filter(function (id) { return order.indexOf(id) < 0; });
    fresh.sort(function (a, b) {
      var fa = FAVOURITES.indexOf(a), fb = FAVOURITES.indexOf(b);
      if (fa >= 0 || fb >= 0) return (fa < 0 ? 99 : fa) - (fb < 0 ? 99 : fb);
      return all[a].name.toLowerCase().localeCompare(all[b].name.toLowerCase());
    });
    fresh.forEach(function (id) {
      if ((HIDE_BY_DEFAULT.test(id) || all[id].tv === false) && prefs.hidden.indexOf(id) < 0) prefs.hidden.push(id);
      var f = FAVOURITES.indexOf(id);
      if (f >= 0 && !prefs.order.length) order.push(id); else if (f >= 0) order.unshift(id); else order.push(id);
    });
    prefs.order = order; save();
    var current = visible[ai];
    visible = order.filter(function (id) { return prefs.hidden.indexOf(id) < 0; });
    ai = current && visible.indexOf(current) >= 0 ? visible.indexOf(current) : clamp(ai, 0, Math.max(0, visible.length - 1));
    renderRow();
  }

  function tileHtml(id, i) {
    var a = all[id], r = Math.floor(i / COLS), c = i % COLS;
    var inner = a.banner ? '<img class="banner" src="' + esc(a.banner) + '" alt="">'
      : '<div class="fb">' + (a.icon ? '<img src="' + esc(a.icon) + '" alt="">' : '<span>' + esc(a.name) + '</span>') + '</div>';
    return '<div class="cell" style="left:' + (X0 + c * COL_W) + 'px;top:' + (GRID_TOP + r * ROW_H) + 'px">'
      + '<div class="tile">' + inner + '</div><div class="name">' + esc(a.name) + '</div></div>';
  }
  function renderRow() {
    var g = $('grid');
    g.innerHTML = visible.map(tileHtml).join('');
    g.style.height = (Math.ceil(visible.length / COLS) * ROW_H + 200) + 'px';
    renderFocus();
  }

  function renderFocus() {
    var cells = $('grid').children, i;
    for (i = 0; i < cells.length; i++) {
      cells[i].className = 'cell' + (zone === 'apps' && i === ai ? (moving ? ' moving' : ' focus') : '');
    }
    var row = Math.floor(ai / COLS), y = 0;
    if (zone === 'apps' && row > 0) y = 600 + row * ROW_H - 330;
    $('page').style.transform = 'translateY(' + (-y) + 'px)';
    stage.className = 'stage' + (y > 0 ? ' deep' : '');
    var btns = $('utils').children;
    for (i = 0; i < btns.length; i++) btns[i].className = 'u' + (zone === 'utils' && i === ui ? ' focus' : '');
    $('utilName').textContent = zone === 'utils' ? UTILS[ui].label : '';
  }

  function launch(id) {
    if (!TV.launch(id)) toast('Couldn’t open ' + (all[id] ? all[id].name : 'that app'));
  }

  /* ---------- Utilities ---------- */
  function renderUtils() {
    $('utils').innerHTML = UTILS.map(function (u) { return '<div class="u">' + ICON[u.id] + '</div>'; }).join('');
  }
  function runUtil(id) {
    if (id === 'settings') { if (!TV.openSettings()) toast('Couldn’t open Settings'); }
    else if (id === 'wifi') { if (!TV.openWifi()) toast('Couldn’t open Wi-Fi settings'); }
    else if (id === 'wallpaper') nextWallpaper();
    else if (id === 'inputs') openInputs();
  }
  function openInputs() {
    var list = [];
    try { list = JSON.parse(TV.inputs()) || []; } catch (e) { list = []; }
    var items = list.map(function (inp) {
      return { label: inp.label, icon: ICON.inputs, run: function () { if (!TV.openInput(inp.id)) toast('Couldn’t switch to ' + inp.label); } };
    });
    items.push({ label: 'TV & inputs app', icon: ICON.tv, run: function () { if (!TV.openLiveTv()) toast('Couldn’t open the TV app'); } });
    openPanel('Inputs', items, list.length ? '' : 'This TV didn’t list its inputs here. The TV & inputs app has them all.');
  }

  /* ---------- App menu (hold OK on an app) ---------- */
  function openAppMenu() {
    var id = visible[ai]; if (!id) return;
    var items = [
      { label: 'Move', icon: ICON.move, run: function () { moving = id; renderFocus(); } },
      { label: 'Hide from Home', icon: ICON.hide, run: function () {
        prefs.hidden.push(id); save(); loadApps(); toast(all[id].name + ' hidden'); } },
      { label: 'App info', icon: ICON.info, run: function () { TV.appInfo(id); } }
    ];
    var hiddenNow = prefs.hidden.filter(function (h) { return all[h]; });
    if (hiddenNow.length) items.push({ label: 'Show hidden apps (' + hiddenNow.length + ')', icon: ICON.show, run: openHidden });
    openPanel(all[id].name, items, '');
  }
  function openHidden() {
    var items = prefs.hidden.filter(function (h) { return all[h]; }).map(function (h) {
      return { label: all[h].name, icon: ICON.show, run: function () {
        prefs.hidden = prefs.hidden.filter(function (x) { return x !== h; }); save(); loadApps(); toast(all[h].name + ' is back'); } };
    });
    openPanel('Hidden apps', items, 'Choose an app to show it on Home again.');
  }
  function moveBy(d) {
    var j = clamp(ai + d, 0, visible.length - 1); if (j === ai) return;
    var id = visible[ai];
    visible.splice(ai, 1); visible.splice(j, 0, id);
    var hidden = prefs.order.filter(function (x) { return visible.indexOf(x) < 0; });
    prefs.order = visible.concat(hidden); ai = j;
    renderRow();
  }
  function endMove() { moving = null; save(); renderFocus(); }

  /* ---------- Panel ---------- */
  function openPanel(title, items, hint) {
    panel = { title: title, items: items, i: 0, hint: hint || '' };
    renderPanel();
  }
  function closePanel() { panel = null; renderPanel(); }
  function renderPanel() {
    $('panel').className = 'panel' + (panel ? '' : ' hidden');
    if (!panel) return;
    $('panelTitle').textContent = panel.title;
    $('panelList').innerHTML = panel.items.map(function (it, i) {
      return '<div class="panel-item' + (i === panel.i ? ' focus' : '') + '">' + (it.icon || '') + '<span>' + esc(it.label) + '</span></div>';
    }).join('');
    $('panelHint').textContent = panel.hint;
    $('panelList').scrollTop = Math.max(0, panel.i * 88 - 600);
  }

  var toastTimer;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.className = 'toast';
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'toast hidden'; }, 2600);
  }

  /* ---------- Wallpaper ---------- */
  var WALLS = window.WALLPAPERS || [], front = 'wallA';
  function showWallpaper(first) {
    if (!WALLS.length) return;
    prefs.wall = ((prefs.wall % WALLS.length) + WALLS.length) % WALLS.length;
    var w = WALLS[prefs.wall], back = front === 'wallA' ? 'wallB' : 'wallA';
    var target = first ? $(front) : $(back);
    target.style.objectPosition = w.pos || '50% 50%';
    target.onload = function () {
      if (!first) { $(back).className = 'wall-img on'; $(front).className = 'wall-img'; front = back; }
    };
    target.src = w.file;
    if (w.blur) $('bgBlur').src = w.blur;
    $('credit').textContent = w.credit ? 'Photo: ' + w.credit + ' · Unsplash' : '';
  }
  function nextWallpaper() { prefs.wall++; save(); showWallpaper(false); }

  /* ---------- Clock ---------- */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var clockTimer;
  function updateClock() {
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    $('time').textContent = ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m;
    $('ampm').textContent = h < 12 ? 'AM' : 'PM';
    $('date').textContent = DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
    clearTimeout(clockTimer);
    clockTimer = setTimeout(updateClock, (60 - d.getSeconds()) * 1000 + 50);
  }

  /* ---------- Weather (Open-Meteo, no account needed) ---------- */
  var WX_KEY = 'home.weather', WX_MAX_AGE = 30 * 60 * 1000;
  var W_ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="#ffd166" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="#e8e6ff" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
    partly: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3.2" stroke="#ffd166"/><path d="M8 1.8v1.4M2 8h1.4M3.8 3.8l1 1M12.2 3.8l-1 1" stroke="#ffd166"/><path d="M7 20h10.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.6 13.1 3.5 3.5 0 0 0 7 20z" stroke="#fff"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"><path d="M6.5 19h11a4.5 4.5 0 0 0 .7-8.95A6 6 0 0 0 6.6 11.2 4 4 0 0 0 6.5 19z"/></svg>',
    fog: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M3 9h18M5 13h14M3 17h18M7 21h10"/></svg>',
    rain: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 15h11a4.5 4.5 0 0 0 .7-8.95A6 6 0 0 0 6.6 7.2 4 4 0 0 0 6.5 15z" stroke="#fff"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" stroke="#7cc4ff"/></svg>',
    storm: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 15h11a4.5 4.5 0 0 0 .7-8.95A6 6 0 0 0 6.6 7.2 4 4 0 0 0 6.5 15z" stroke="#fff"/><path d="M12.5 15l-2.5 4h3.5l-2 4" stroke="#ffd166"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/></svg>'
  };
  function describe(code, day) {
    if (code === 0) return [day ? 'sun' : 'moon', 'Clear'];
    if (code === 1) return [day ? 'sun' : 'moon', 'Mostly clear'];
    if (code === 2) return ['partly', 'Partly cloudy'];
    if (code === 3) return ['cloud', 'Cloudy'];
    if (code === 45 || code === 48) return ['fog', 'Fog'];
    if (code >= 51 && code <= 57) return ['rain', 'Drizzle'];
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return ['rain', code >= 80 ? 'Showers' : 'Rain'];
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['snow', 'Snow'];
    if (code >= 95) return ['storm', 'Thunderstorm'];
    return ['cloud', ''];
  }
  function showWeather(d) {
    try {
      var c = d.current, info = describe(c.weather_code, c.is_day === 1);
      $('wIcon').innerHTML = W_ICONS[info[0]];
      $('wTemp').textContent = Math.round(c.temperature_2m) + '°';
      $('wLine').textContent = info[1] + ' · H ' + Math.round(d.daily.temperature_2m_max[0]) + '°  L ' + Math.round(d.daily.temperature_2m_min[0]) + '°';
      $('weather').className = 'weather';
    } catch (e) { }
  }
  function updateWeather(force) {
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(WX_KEY)); } catch (e) { }
    if (cached && cached.data) showWeather(cached.data);
    if (!force && cached && Date.now() - cached.t < WX_MAX_AGE) return;
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + CITY.lat + '&longitude=' + CITY.lon
      + '&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1';
    var x = new XMLHttpRequest();
    x.open('GET', url); x.timeout = 10000;
    x.onload = function () {
      if (x.status !== 200) return;
      try {
        var data = JSON.parse(x.responseText);
        try { localStorage.setItem(WX_KEY, JSON.stringify({ t: Date.now(), data: data })); } catch (e) { }
        showWeather(data);
      } catch (e) { }
    };
    x.send();
  }

  /* ---------- Remote control ---------- */
  var KEYS = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 27: 'back', 8: 'back' };
  var okTimer = null, okHandled = false;

  function press(k) {
    if (panel) {
      if (k === 'up') panel.i = clamp(panel.i - 1, 0, panel.items.length - 1);
      else if (k === 'down') panel.i = clamp(panel.i + 1, 0, panel.items.length - 1);
      else if (k === 'back' || k === 'left') { closePanel(); return; }
      else if (k === 'ok') { var it = panel.items[panel.i]; closePanel(); if (it) it.run(); return; }
      renderPanel(); return;
    }
    if (moving) {
      if (k === 'left' && ai % COLS > 0) moveBy(-1);
      else if (k === 'right' && ai % COLS < COLS - 1) moveBy(1);
      else if (k === 'up') moveBy(-COLS);
      else if (k === 'down') moveBy(COLS);
      else if (k === 'ok' || k === 'back') endMove();
      return;
    }
    if (zone === 'apps') {
      var n = visible.length;
      if (k === 'left' && ai % COLS > 0) ai--;
      else if (k === 'right' && ai % COLS < COLS - 1 && ai + 1 < n) ai++;
      else if (k === 'down' && ai + COLS < n) ai += COLS;
      else if (k === 'down' && Math.floor(ai / COLS) < Math.floor((n - 1) / COLS)) ai = n - 1;
      else if (k === 'up') { if (ai >= COLS) ai -= COLS; else zone = 'utils'; }
      else if (k === 'back') ai = 0;
      else if (k === 'ok' && visible[ai]) launch(visible[ai]);
    } else {
      if (k === 'left') ui = clamp(ui - 1, 0, UTILS.length - 1);
      else if (k === 'right') ui = clamp(ui + 1, 0, UTILS.length - 1);
      else if (k === 'down' || k === 'back') zone = 'apps';
      else if (k === 'ok') runUtil(UTILS[ui].id);
    }
    renderFocus();
  }

  document.addEventListener('keydown', function (ev) {
    var k = KEYS[ev.keyCode];
    if (!k) return;
    ev.preventDefault();
    if (k === 'ok' && zone === 'apps' && !panel && !moving) {
      // Hold OK on an app for the menu; a short press opens the app (on key up).
      if (ev.repeat || okTimer) return;
      okHandled = false;
      okTimer = setTimeout(function () { okTimer = null; okHandled = true; openAppMenu(); }, LONG_PRESS_MS);
      return;
    }
    if (k === 'ok' && ev.repeat) return;
    press(k);
  });
  document.addEventListener('keyup', function (ev) {
    if (KEYS[ev.keyCode] !== 'ok') return;
    if (okTimer) { clearTimeout(okTimer); okTimer = null; if (!okHandled) press('ok'); }
  });

  /* Called from Android */
  window.homeResume = function () { fit(); loadApps(); updateClock(); updateWeather(false); stage.focus(); };
  window.homeReset = function () {
    panel = null; renderPanel(); if (moving) endMove();
    zone = 'apps'; ai = 0; renderFocus();
  };

  /* ---------- Start ---------- */
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  fit(); setTimeout(fit, 300); setTimeout(fit, 1500);
  renderUtils();
  showWallpaper(true);
  loadApps();
  updateClock();
  updateWeather(false);
  setInterval(function () { updateWeather(false); }, WX_MAX_AGE);
  stage.focus();
})();
