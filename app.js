/* =========================================================
   ROUGH DRAFT CREATIVES  ·  direction four: THE UNFOLDING

   The background is not an image of paper. It is a sheet of
   their ruled page, built as geometry, lit by one key light,
   and folded by whatever section you are reading.
   ========================================================= */
(function () {
  'use strict';

  /* ==================================================================
     CONFIG  ·  the only lines that need changing before launch

     SUBMIT_ENDPOINT  a form endpoint (Formspree, Netlify Forms, Basin,
                      or your own handler). Takes priority when set, and
                      submits silently without leaving the page.
                      This is the option to use in production.

     SUBMIT_EMAIL     fallback. Opens the visitor's own mail client with
                      the draft already written out.

                      Every form on the site falls back to this address.
     ================================================================== */
  var SUBMIT_ENDPOINT = '';
  var COLLAB_ENDPOINT = '';
  var NEWS_ENDPOINT   = '';   /* a Mailchimp or Buttondown endpoint. Falls back to email. */

  /* ------------------------------------------------------------------
     CONTENT
     Everything editable lives in /content/*.json and is written by the
     admin at /admin/. Nothing here needs touching to add an event, a
     draft, a weaver or a resource.

     The values below are only the fallbacks used if a content file is
     missing or unreachable, so the site still renders rather than
     breaking. The admin is the source of truth.
     ------------------------------------------------------------------ */
  var SUBMIT_EMAIL  = 'connect@roughdraftcreatives.ie';
  var TEAM_FORM_URL = '';
  var INSTAGRAM     = 'https://www.instagram.com/roughdraft.poetry/';

  /* { date:'YYYY-MM-DD', time, title, place, link, flyer, flyerAlt }
     Past dates drop off the list, and off the pop-up, on their own. */
  var EVENTS    = [];
  var PIECES    = [];   /* { no, title, credit, stanzas, audio, artwork, alt, note } */
  var DRAFTS    = [];
  var RESOURCES = [];
  var WEAVERS   = [];

  var CONTENT_FILES = ['events', 'drafts', 'pieces', 'resources', 'weavers', 'settings'];

  /* Reads the content files. Any file that is missing, malformed or slow
     is skipped rather than allowed to hold up the page: the section it
     feeds shows its empty state and the rest of the site is unaffected. */
  function loadContent() {
    function grab(name) {
      return fetch('content/' + name + '.json', { credentials: 'omit', cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) { throw new Error(name + ': HTTP ' + r.status); }
          return r.json();
        })
        .catch(function (err) {
          if (window.console) { console.warn('Content not loaded, ' + err.message); }
          return null;
        });
    }

    function apply(parts) {
      var map = {};
      CONTENT_FILES.forEach(function (name, i) { map[name] = parts[i]; });

      /* The admin writes { "events": [...] }. A bare array is accepted too,
         so a hand-edited file in either shape still works. */
      function listOf(data, key) {
        if (Array.isArray(data)) { return data; }
        if (data && Array.isArray(data[key])) { return data[key]; }
        return null;
      }

      var ev = listOf(map.events,    'events');    if (ev) { EVENTS    = ev; }
      var dr = listOf(map.drafts,    'drafts');    if (dr) { DRAFTS    = dr; }
      var pc = listOf(map.pieces,    'pieces');    if (pc) { PIECES    = pc; }
      var rs = listOf(map.resources, 'resources'); if (rs) { RESOURCES = rs; }
      var wv = listOf(map.weavers,   'weavers');   if (wv) { WEAVERS   = wv; }

      var s = map.settings;
      if (s && typeof s === 'object') {
        if (s.contactEmail) { SUBMIT_EMAIL  = s.contactEmail; }
        if (s.instagram)    { INSTAGRAM     = s.instagram; }
        if (s.teamFormUrl)  { TEAM_FORM_URL = s.teamFormUrl; }
        if (s.donate)       { DONATE        = s.donate; }
      }
    }

    /* The single-file preview has no server to fetch from, so the build
       inlines the same content here instead. */
    if (window.__RD_CONTENT__) {
      apply(CONTENT_FILES.map(function (n) { return window.__RD_CONTENT__[n]; }));
      return Promise.resolve();
    }

    if (!window.fetch) { return Promise.resolve(); }

    var loaded = Promise.all(CONTENT_FILES.map(grab)).then(apply);
    var giveUp = new Promise(function (res) { window.setTimeout(res, 5000); });
    return Promise.race([loaded, giveUp]);
  }

  var root = document.documentElement;
  var calm = root.classList.contains('calm');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var SNAP = /[?&]snap\b/.test(location.search);

  /* the physical state of the sheet in each section */
  /* 27 · the cards she sent. Held at a third strength so they read as tinted
     paper rather than colour blocks, and so type stays readable on them. */
  var CARDS = {
    none:   [1.000, 1.000, 1.000],
    blue:   [0.749, 0.863, 0.902],
    green:  [0.796, 0.890, 0.745],
    pink:   [0.953, 0.796, 0.827],
    yellow: [0.961, 0.894, 0.659]
  };
  function card(name, strength) {
    var c = CARDS[name] || CARDS.none, k = strength === undefined ? 0.35 : strength;
    return [1 + (c[0] - 1) * k, 1 + (c[1] - 1) * k, 1 + (c[2] - 1) * k];
  }

  var STATES = {
    opened:   { crease: .30, crumple: .05, fold: 0,  curl: .09, rotX: .03, z: 0,    tex: 'page',  card: 'none' },
    rest:     { crease: .16, crumple: .03, fold: 0,  curl: .07, rotX: .03, z: 0,    tex: 'quiet', card: 'none' },
    settle:   { crease: .24, crumple: 0,   fold: 0,  curl: .11, rotX: .05, z: 0,    tex: 'quiet', card: 'green' },
    balance:  { crease: .12, crumple: 0,   fold: 0,  curl: .04, rotX: .02, z: 0,    tex: 'quiet', card: 'blue' },
    curl:     { crease: .20, crumple: 0,   fold: 0,  curl: .58, rotX: .06, z: -30,  tex: 'page',  card: 'yellow' },
    gatefold: { crease: .10, crumple: 0,   fold: 30, curl: .05, rotX: .04, z: -40,  tex: 'quiet', card: 'green' },
    many:     { crease: .46, crumple: .10, fold: 0,  curl: .16, rotX: .04, z: -20,  tex: 'quiet', card: 'blue' },
    print:    { crease: .07, crumple: 0,   fold: 0,  curl: .06, rotX: .01, z: 0,    tex: 'cover', card: 'none' },
    lift:     { crease: .20, crumple: 0,   fold: 0,  curl: .38, rotX: .26, z: -190, tex: 'quiet', card: 'yellow' },
    blank:    { crease: .09, crumple: 0,   fold: 0,  curl: .03, rotX: .02, z: 0,    tex: 'quiet', card: 'none' },
    fold:     { crease: .14, crumple: 0,   fold: 14, curl: .06, rotX: .03, z: -20,  tex: 'quiet', card: 'green' },
    portrait: { crease: .13, crumple: 0,   fold: 0,  curl: .08, rotX: .04, z: -10,  tex: 'quiet', card: 'yellow' },
    reach:    { crease: .18, crumple: 0,   fold: 0,  curl: .26, rotX: .09, z: -55,  tex: 'quiet', card: 'blue' },
    crumple:  { crease: .70, crumple: .46, fold: 0,  curl: .10, rotX: .05, z: -60,  x: .46, tex: 'page', card: 'pink', strength: .55 }
  };

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* =========================================================
     THE SHEET
     ========================================================= */
  function createSheet(canvas) {
    if (!window.THREE) { return null; }
    var T = window.THREE, renderer;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
    catch (e) { return null; }
    if (!renderer.getContext()) { return null; }

    var small = window.innerWidth < 760;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(38, 1, 10, 4000);
    camera.position.z = 700;

    var uniforms = {
      uTexA: { value: null }, uTexB: { value: null }, uMix: { value: 0 },
      uCrease: { value: 0 }, uCrumple: { value: 1 }, uFold: { value: 0 }, uCurl: { value: 0 },
      uBall: { value: 190 }, uPanel: { value: 400 }, uTime: { value: 0 },
      uLight: { value: new T.Vector3(-.38, .72, .58) }, uHalf: { value: new T.Vector2(1, 1) },
      uTint: { value: new T.Vector3(1, 1, 1) }
    };

    var vert = [
      'uniform float uCrease, uCrumple, uFold, uCurl, uBall, uPanel, uTime;',
      'uniform vec2 uHalf;',
      'varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; varying float vCrease;',
      'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float vnoise(vec2 p){',
      '  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
      '  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));',
      '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y) * 2.0 - 1.0;',
      '}',
      /* ridged octaves: paper creases are folds, not hills */
      'float creases(vec2 p){',
      '  float s = 0.0, a = 1.0, f = 1.0;',
      '  for (int i = 0; i < 4; i++) { s += a * (1.0 - abs(vnoise(p * f))); f *= 2.13; a *= 0.52; }',
      '  return (s - 1.15) * 13.0;',
      '}',
      'vec3 displace(vec2 xy, vec2 uv){',
      '  vec3 p = vec3(xy, 0.0);',
      '  p.z += creases(xy * 0.0029 + 9.3) * uCrease;',
      /* the three panel fold of a letter */
      '  float t = abs(fract(xy.x / uPanel + 0.5) - 0.5) * 2.0;',
      '  p.z -= (1.0 - t) * uFold;',
      /* the corner that will not lie flat */
      '  float c = smoothstep(0.55, 1.0, uv.x) * smoothstep(0.42, 0.0, uv.y);',
      '  p.z += c * uCurl * 150.0;',
      '  p.x -= c * uCurl * 34.0;',
      /* balled up */
      '  float th = (uv.x - 0.5) * 6.0;',
      '  float ph = (uv.y - 0.5) * 3.0;',
      '  float R = uBall * (1.0 + vnoise(uv * 11.0 + 4.0) * 0.4);',
      '  vec3 ball = vec3(cos(ph) * sin(th), sin(ph), cos(ph) * cos(th)) * R;',
      '  return mix(p, ball, uCrumple);',
      '}',
      'void main(){',
      '  vUv = uv;',
      '  vec2 xy = position.xy;',
      '  float e = 3.0;',
      '  vec3 p0 = displace(xy, uv);',
      '  vec3 px = displace(xy + vec2(e, 0.0), uv + vec2(e / (uHalf.x * 2.0), 0.0));',
      '  vec3 py = displace(xy + vec2(0.0, e), uv + vec2(0.0, e / (uHalf.y * 2.0)));',
      '  vNormal = normalize(cross(px - p0, py - p0));',
      '  vCrease = clamp(-p0.z * 0.02, 0.0, 1.0);',
      '  vec4 mv = modelViewMatrix * vec4(p0, 1.0);',
      '  vView = -mv.xyz;',
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n');

    var frag = [
      'uniform sampler2D uTexA, uTexB; uniform float uMix; uniform vec3 uLight; uniform vec3 uTint;',
      'varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; varying float vCrease;',
      'void main(){',
      '  vec3 tex = mix(texture2D(uTexA, vUv).rgb, texture2D(uTexB, vUv).rgb, uMix) * uTint;',
      '  vec3 N = normalize(vNormal); if (!gl_FrontFacing) { N = -N; }',
      '  vec3 L = normalize(uLight);',
      '  vec3 V = normalize(vView);',
      /* wrapped diffuse, because paper scatters rather than shades hard */
      '  float d = dot(N, L) * 0.5 + 0.5;',
      '  float key = pow(clamp(d, 0.0, 1.0), 1.2) * 0.30 + 0.72;',
      /* light passing through the sheet from behind */
      '  float through = pow(clamp(dot(-N, L), 0.0, 1.0), 2.0) * 0.16;',
      '  float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.5) * 0.10;',
      '  float ao = 1.0 - vCrease * 0.18;',
      '  vec3 c = tex * (key * ao + through) + rim;',
      '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
      '}'
    ].join('\n');

    var mat = new T.ShaderMaterial({ uniforms: uniforms, vertexShader: vert, fragmentShader: frag, side: T.DoubleSide });
    var geo = null, mesh = null;

    /* ---------- the printed surface ---------- */
    var textures = {};
    function paper(w, h, draw) {
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      var x = cv.getContext('2d');
      x.fillStyle = '#FFFEFB'; x.fillRect(0, 0, w, h);
      /* fibre */
      var g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(232,228,216,.55)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      draw(x, w, h);
      var t = new T.CanvasTexture(cv);
      t.anisotropy = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
      t.needsUpdate = true;
      return t;
    }

    function rules(x, w, h, margin) {
      var step = h / 26;
      x.strokeStyle = 'rgba(150,170,195,.28)'; x.lineWidth = Math.max(1, h / 1400);
      for (var y = step * 2; y < h; y += step) {
        x.beginPath(); x.moveTo(w * 0.04, y); x.lineTo(w * 0.96, y); x.stroke();
      }
      if (margin) {
        x.strokeStyle = 'rgba(190,90,80,.3)'; x.lineWidth = Math.max(1, h / 1200);
        x.beginPath(); x.moveTo(w * 0.13, 0); x.lineTo(w * 0.13, h); x.stroke();
      }
    }

    function buildTextures(w, h, coverImg) {
      Object.keys(textures).forEach(function (k) { textures[k].dispose(); });
      textures = {};

      textures.quiet = paper(w, h, function (x, W, H) { rules(x, W, H, true); });

      textures.page = paper(w, h, function (x, W, H) {
        rules(x, W, H, true);
        var step = H / 26, size = step * 0.8;
        x.fillStyle = 'rgba(38,36,32,.17)';
        x.font = '400 ' + size + 'px "Fraunces", Georgia, serif';
        var lines = ['Our lives are poems', 'in rough drafts', 'With experience comes', 'refinement of soft lines'];
        lines.forEach(function (ln, i) { x.fillText(ln, W * 0.46, step * (13 + i) - step * 0.22); });
        /* the crossed out line from their own logo */
        var struck = 'our lives are poems in rough';
        x.fillStyle = 'rgba(38,36,32,.1)';
        x.fillText(struck, W * 0.46, step * 18.3);
        x.strokeStyle = 'rgba(38,36,32,.16)'; x.lineWidth = Math.max(2, H / 900);
        x.beginPath();
        x.moveTo(W * 0.457, step * 18.05);
        x.lineTo(W * 0.46 + x.measureText(struck).width, step * 17.92);
        x.stroke();
      });

      textures.cover = paper(w, h, function (x, W, H) {
        rules(x, W, H, true);
        if (!coverImg) { return; }
        /* the sheet overscans the window by 1.25, so only uv 0.1 to 0.9 is ever
           on screen. keep the drawing inside that band or it runs off the edge. */
        var left = small ? 0.30 : 0.565, right = small ? 0.88 : 0.90;
        var aw = W * (right - left), ah = H * 0.62;
        var k = Math.min(aw / coverImg.naturalWidth, ah / coverImg.naturalHeight);
        var dw = coverImg.naturalWidth * k, dh = coverImg.naturalHeight * k;
        x.save();
        x.globalAlpha = small ? 0.34 : 0.7;
        x.drawImage(coverImg, W * left + (aw - dw) / 2, (H - dh) / 2, dw, dh);
        x.restore();
        /* the reading column stays paper */
        var fade = small ? 0.34 : 0.585;
        var g = x.createLinearGradient(0, 0, W * fade, 0);
        g.addColorStop(0, 'rgba(255,254,251,1)');
        g.addColorStop(0.72, 'rgba(255,254,251,.92)');
        g.addColorStop(1, 'rgba(255,254,251,0)');
        x.fillStyle = g; x.fillRect(0, 0, W * fade, H);
      });

      if (!uniforms.uTexA.value) { uniforms.uTexA.value = textures.page; uniforms.uTexB.value = textures.page; }
    }

    /* ---------- fit the sheet to the window ---------- */
    var coverImg = null;
    function measure() {
      var W = window.innerWidth, H = window.innerHeight;
      small = W < 760;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      var visH = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
      var visW = visH * camera.aspect;
      var pw = visW * 1.25, ph = visH * 1.25;
      uniforms.uHalf.value.set(pw / 2, ph / 2);
      uniforms.uPanel.value = pw / 3;
      uniforms.uBall.value = Math.min(pw, ph) * 0.26;

      if (geo) { geo.dispose(); }
      var sx = small ? 104 : 190, sy = small ? 76 : 136;
      geo = new T.PlaneGeometry(pw, ph, sx, sy);
      if (mesh) { scene.remove(mesh); }
      mesh = new T.Mesh(geo, mat);
      scene.add(mesh);

      var tw = small ? 1024 : 1800;
      buildTextures(tw, Math.round(tw * ph / pw), coverImg);
      if (currentTex) { uniforms.uTexA.value = textures[currentTex]; uniforms.uTexB.value = textures[currentTex]; uniforms.uMix.value = 0; }
    }

    /* ---------- state ---------- */
    var want = Object.assign({}, STATES.rest);
    var now = { crease: 0, crumple: 1, fold: 0, curl: 0, rotX: 0, z: 0, x: 0, tiltZ: 0, rotY: 0 };
    var tintNow = [1, 1, 1], tintWant = [1, 1, 1];
    var currentTex = 'page', fading = false;
    var mouse = { x: 0, y: 0 };
    var spin = 0, introMode = true, running = true, visible = true;

    function setTexture(key) {
      if (!textures[key] || key === currentTex || fading) { return; }
      uniforms.uTexB.value = textures[key];
      fading = true;
      var t0 = performance.now();
      (function step() {
        var k = Math.min(1, (performance.now() - t0) / (SNAP ? 1 : 900));
        uniforms.uMix.value = k * k * (3 - 2 * k);
        if (k < 1) { requestAnimationFrame(step); }
        else { uniforms.uTexA.value = textures[key]; uniforms.uMix.value = 0; currentTex = key; fading = false; }
      })();
    }

    function setState(name, tiltZ) {
      var s = STATES[name];
      if (!s) { return; }
      want = Object.assign({ x: 0 }, s);
      want.tiltZ = tiltZ || 0;
      tintWant = card(s.card, s.strength);
      setTexture(s.tex);
      if (SNAP) {
        ['crease', 'crumple', 'fold', 'curl', 'rotX', 'z', 'x'].forEach(function (k) { now[k] = want[k]; });
        now.tiltZ = want.tiltZ;
        tintNow = tintWant.slice();
        uniforms.uTint.value.set(tintNow[0], tintNow[1], tintNow[2]);
        uniforms.uTexA.value = textures[s.tex]; uniforms.uMix.value = 0; currentTex = s.tex;
      }
    }

    var last = performance.now();
    function frame(t) {
      if (!running) { return; }
      requestAnimationFrame(frame);
      if (!visible) { last = t; return; }
      var dt = Math.min(0.05, (t - last) / 1000); last = t;
      uniforms.uTime.value += dt;
      var k = 1 - Math.pow(1 - (calm ? 1 : 0.045), dt * 60);

      ['crease', 'crumple', 'fold', 'curl', 'rotX', 'z', 'x'].forEach(function (key) {
        now[key] += ((want[key] || 0) - now[key]) * k;
      });
      now.tiltZ += ((want.tiltZ || 0) - now.tiltZ) * k;

      uniforms.uCrease.value = now.crease;
      uniforms.uCrumple.value = now.crumple;
      uniforms.uFold.value = now.fold;
      uniforms.uCurl.value = now.curl;
      for (var c = 0; c < 3; c++) { tintNow[c] += (tintWant[c] - tintNow[c]) * k; }
      uniforms.uTint.value.set(tintNow[0], tintNow[1], tintNow[2]);

      if (mesh) {
        if (introMode) { spin += dt * 0.55; }
        else { spin += (0 - spin) * k * 0.6; }
        var px = fine && !calm ? mouse.y * 0.05 : 0;
        var py = fine && !calm ? mouse.x * 0.07 : 0;
        mesh.rotation.x += (now.rotX + px - mesh.rotation.x) * 0.06;
        mesh.rotation.y += (spin + py - mesh.rotation.y) * 0.06;
        mesh.rotation.z += (now.tiltZ - mesh.rotation.z) * 0.06;
        mesh.position.z += (now.z - mesh.position.z) * 0.06;
        mesh.position.x += (now.x * uniforms.uHalf.value.x - mesh.position.x) * 0.06;
      }
      renderer.render(scene, camera);
    }

    window.addEventListener('pointermove', function (e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; last = performance.now(); });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measure, 160); });

    return {
      init: function (img) {
        coverImg = img;
        measure();
        now.crumple = 1; uniforms.uCrumple.value = 1;
        last = performance.now();
        requestAnimationFrame(frame);
      },
      setState: setState,
      endIntro: function () { introMode = false; },
      camera: function (z) { camera.position.z = z; camera.updateProjectionMatrix(); },
      cameraLerp: function (z, ms) {
        var from = camera.position.z, t0 = performance.now();
        (function step() {
          var k = Math.min(1, (performance.now() - t0) / ms);
          var e = 1 - Math.pow(1 - k, 3);
          camera.position.z = from + (z - from) * e;
          if (k < 1) { requestAnimationFrame(step); }
        })();
      }
    };
  }

  /* =========================================================
     THE OPENING
     ========================================================= */
  var openDone = false, openTimers = [];
  function endOpening(sheet) {
    if (openDone) { return; }
    openDone = true;
    openTimers.forEach(clearTimeout);
    var ov = document.getElementById('opening');
    if (ov) { ov.setAttribute('data-gone', 'true'); }
    root.removeAttribute('data-intro');
    if (sheet) { sheet.endIntro(); sheet.setState('rest'); }
    revealFirst();
  }
  function soon(ms, fn) { var t = setTimeout(fn, ms); openTimers.push(t); return t; }

  function opening(sheet) {
    var ov = document.getElementById('opening');
    var skip = document.getElementById('openingSkip');
    var note = document.getElementById('openingNote');
    if (!ov) { endOpening(sheet); return; }

    root.setAttribute('data-intro', 'on');
    if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
    window.scrollTo(0, 0);
    skip.addEventListener('click', function () { endOpening(sheet); });
    document.addEventListener('keydown', function onK(e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { endOpening(sheet); document.removeEventListener('keydown', onK); }
    });
    soon(14000, function () { endOpening(sheet); });

    sheet.camera(980);
    /* the ball opens */
    soon(700, function () {
      sheet.setState('opened');
      sheet.cameraLerp(700, 3200);
    });
    soon(4100, function () { endOpening(sheet); });
  }

  /* =========================================================
     PAGE
     ========================================================= */
  /* Built with DOM nodes rather than an HTML string. The words come from
     the page today, but the moment headings are fed from a CMS an
     innerHTML version here would execute whatever the editor pasted.
     textContent cannot be parsed as markup, so there is nothing to find. */
  function splitLines() {
    [].slice.call(document.querySelectorAll('[data-split]')).forEach(function (el) {
      var text = el.textContent.trim();
      if (!text) { return; }
      var words = text.split(/\s+/);
      el.setAttribute('aria-label', text);

      var frag = document.createDocumentFragment();
      words.forEach(function (w, i) {
        if (i) { frag.appendChild(document.createTextNode(' ')); }
        var span = document.createElement('span');
        span.className = 'ln';
        span.setAttribute('aria-hidden', 'true');
        span.style.display = 'inline-block';
        var inner = document.createElement('i');
        inner.style.setProperty('--i', String(i % 8));
        inner.textContent = w;
        span.appendChild(inner);
        frag.appendChild(span);
      });

      el.textContent = '';
      el.appendChild(frag);
    });
  }

  function reveals() {
    var items = [].slice.call(document.querySelectorAll('[data-reveal], [data-split]'));
    if (!items.length) { return; }
    if (calm) {
      items.forEach(function (el) { el.setAttribute('data-in', 'true'); });
      return;
    }
    var pending = items.filter(function (el) { return !el.closest('#arrival'); });
    var ticking = false;

    function sweep() {
      ticking = false;
      var line = window.innerHeight * 0.9;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < line) { el.setAttribute('data-in', 'true'); return false; }
        return true;
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(sweep); }
    }, { passive: true });
    window.addEventListener('resize', sweep);
    sweep();
  }

  /* The bridge builds itself as you reach it: the ruled page runs in, the
     tear opens, the span is drawn across the gap, then the ink lands on the
     far side. The same point the drawing makes, made in time. */
  function drawBridge() {
    var wrap = document.getElementById('bridge');
    if (!wrap) { return; }
    var svg = wrap.querySelector('svg');
    if (!svg || calm) { return; }

    var steps = [];
    function queue(sel, start, dur) {
      [].slice.call(svg.querySelectorAll(sel)).forEach(function (el, i) {
        var len = 0;
        try { len = el.getTotalLength(); } catch (e) { return; }
        if (!len) { return; }
        el.style.strokeDasharray = len;
        el.style.strokeDashoffset = len;
        steps.push({ el: el, at: start + i * 110, dur: dur });
      });
    }
    queue('.bridge__ruled path', 0, 560);
    queue('.bridge__tear path', 420, 420);
    queue('.bridge__span path:nth-child(1)', 700, 520);
    queue('.bridge__span path:nth-child(2)', 920, 1000);
    queue('.bridge__span path:nth-child(3)', 1080, 1000);
    queue('.bridge__span path:nth-child(n+4)', 1620, 320);
    queue('.bridge__ink path', 1700, 800);

    var blots = [].slice.call(svg.querySelectorAll('.bridge__ink circle'));
    blots.forEach(function (c) { c.style.opacity = '0'; });

    var done = false, ticking = false;
    function run() {
      if (done) { return; }
      done = true;
      steps.forEach(function (s) {
        window.setTimeout(function () {
          s.el.style.transition = 'stroke-dashoffset ' + s.dur + 'ms cubic-bezier(.33,.9,.4,1)';
          s.el.style.strokeDashoffset = '0';
        }, s.at);
      });
      blots.forEach(function (c, i) {
        window.setTimeout(function () {
          c.style.transition = 'opacity 320ms ease, transform 320ms cubic-bezier(.2,1.4,.4,1)';
          c.style.opacity = '1';
        }, 2050 + i * 80);
      });
    }
    function check() {
      ticking = false;
      if (wrap.getBoundingClientRect().top < window.innerHeight * 0.82) { run(); }
    }
    window.addEventListener('scroll', function () {
      if (!ticking && !done) { ticking = true; requestAnimationFrame(check); }
    }, { passive: true });
    check();
  }

  function revealFirst() {
    [].slice.call(document.querySelectorAll('#arrival [data-reveal], #arrival [data-split]'))
      .forEach(function (el, i) { setTimeout(function () { el.setAttribute('data-in', 'true'); }, 350 + i * 220); });
  }

  var tiltZ = 0, activeState = 'rest';
  function watcher(sheet) {
    var leaves = [].slice.call(document.querySelectorAll('[data-state]'));
    var links = [].slice.call(document.querySelectorAll('.head__nav a[href^="#"]'));
    var head = document.getElementById('head');
    var lastId = '', ticking = false;

    function check() {
      ticking = false;
      if (root.getAttribute('data-intro') === 'on') { return; }
      if (head) { head.setAttribute('data-scrolled', window.scrollY > 30 ? 'true' : 'false'); }
      var mid = window.innerHeight * 0.42, best = leaves[0], bd = Infinity;
      leaves.forEach(function (s) {
        var r = s.getBoundingClientRect();
        var d = (r.top <= mid && r.bottom >= mid) ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (d < bd) { bd = d; best = s; }
      });
      if (best.id === lastId) { return; }
      lastId = best.id;
      activeState = best.getAttribute('data-state');
      if (sheet) { sheet.setState(activeState, activeState === 'balance' ? tiltZ : 0); }
      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + best.id) { a.setAttribute('aria-current', 'true'); }
        else { a.removeAttribute('aria-current'); }
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
    window.addEventListener('resize', check);
    return check;
  }

  function drawBalance(on, tiltZ) {
    var beam = document.getElementById('beam');
    var panL = document.getElementById('panL'), panR = document.getElementById('panR');
    if (!beam) { return; }
    var deg = (tiltZ * 180 / Math.PI) * 2.6;
    beam.style.transform = 'rotate(' + deg.toFixed(2) + 'deg)';
    var back = 'rotate(' + (-deg).toFixed(2) + 'deg)';
    if (panL) { panL.style.transform = back; }
    if (panR) { panR.style.transform = back; }
    var set = function (id, v) { var el = document.getElementById(id); if (el) { el.setAttribute('data-on', v ? 'true' : 'false'); } };
    set('wR', on.words); set('wL', on.emotions); set('hope', on.hope); set('loop', on.time); set('dots', on.motion);
    var rock = document.getElementById('rock');
    if (rock) { rock.setAttribute('data-on', on.motion ? 'true' : 'false'); }
  }

  function equation(sheet) {
    var terms = [].slice.call(document.querySelectorAll('.term'));
    var on = {};
    terms.forEach(function (t) {
      t.addEventListener('click', function () {
        var k = t.getAttribute('data-term');
        on[k] = !on[k];
        t.setAttribute('aria-pressed', on[k] ? 'true' : 'false');
        /* 10 · weight nudges it. 13 · motion is what actually tips it. */
        var load = (on.emotions ? 1.2 : 0) - (on.words ? 1 : 0);
        tiltZ = load * 0.055 * (on.motion ? 1 : 0.28);
        if (sheet && activeState === 'balance') { sheet.setState('balance', tiltZ); }
        drawBalance(on, tiltZ);
      });
    });
  }

  function menu() {
    var b = document.getElementById('menu'), nav = document.getElementById('nav');
    if (!b || !nav) { return; }
    function set(o) {
      b.setAttribute('aria-expanded', o ? 'true' : 'false');
      nav.setAttribute('data-open', o ? 'true' : 'false');
      document.body.setAttribute('data-locked', o ? 'true' : 'false');
    }
    b.addEventListener('click', function () { set(b.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { set(false); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) { set(false); } });
  }

  function anchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) { return; }
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (!el) { return; }
      e.preventDefault();
      el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', a.getAttribute('href'));
    });
  }

  /* ------------------------------------------------------------------
     PATRONS  ·  donations, without any payment code on this site

     Make one payment link per amount in whichever service you use, then
     paste the URLs here. Stripe Payment Links, Ko-fi and Buy Me a Coffee
     all give you a plain URL and need no developer.

     Leave a URL empty and that option is hidden. Leave every URL empty
     and the whole Patrons section stays hidden, so nothing broken ever
     goes live. Drop the `monthly` block entirely if you only want one-offs.
  ------------------------------------------------------------------ */
  var PLEDGE_ENDPOINT = '';   /* a form endpoint for pledges. Falls back to SUBMIT_EMAIL. */

  var DONATE = {
    currency: '\u20AC',
    once: [
      { amount: '5',  url: '' },
      { amount: '10', url: '' },
      { amount: '15', url: '' },
      { label: 'Feel free to surprise us', url: '' }
    ],
    monthly: [
      { amount: '5',  url: '' },
      { amount: '10', url: '' },
      { amount: '15', url: '' },
      { label: 'Feel free to surprise us', url: '' }
    ]
  };

  /* ------------------------------------------------------------------
     ARCHIVED DRAFTS  ·  one entry per gathering, for archived-drafts.html
     Reflection is a half page to a page, written by someone from the room
     after the event, and credited to them. The same text feeds the newsletter.

     { no:'10', title:'Elephant in The Room', date:'2026-08-14', place:'Dublin',
       photo:'assets/Draft_10_-_Elephant_in_The_Room.jpg', alt:'what it shows',
       photographer:'Bim Oyediran',
       writer:'Name of whoever wrote it',
       reflection:['First paragraph.', 'Second paragraph.'] }
  ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------
     SHARED RESOURCES  ·  for shared-resources.html
     Other people's work, websites and things worth passing on.
     Leave `group` out and everything sits in one list. Once there are
     enough entries, give each one a group and they sort themselves into
     headed sections automatically.

     { name:'What it is called', url:'https://...', by:'Whose it is',
       note:'One line on why it is here', group:'Poets' }
  ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------
     SPACE WEAVERS  ·  for space-weavers.html
     People who have facilitated for us, or performed as guests.

     { name:'Their name', credit:'What they did, in a line',
       url:'https://...',            optional
       photo:'assets/...', alt:'...' optional, a portrait if there is one }
  ------------------------------------------------------------------ */

  /* 23 · event recaps. Add an object per gathering.
     { date:'2026-10-18', title:'...', place:'...', words:'a short write up',
       shots:[{ src:'assets/recaps/oct-01.jpg', alt:'what it shows', artist:'name' }] } */
  var RECAPS = [];

  function renderRecaps() {
    var box = document.getElementById('recapList'), empty = document.getElementById('recapEmpty');
    if (!box || !RECAPS.length) { return; }
    var fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    RECAPS.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).forEach(function (r) {
      var art = document.createElement('article');
      art.className = 'recap__item';
      var meta = document.createElement('p');
      meta.className = 'recap__meta';
      meta.textContent = [r.date ? fmt.format(new Date(r.date)) : '', r.place].filter(Boolean).join(', ');
      art.appendChild(meta);
      if (r.title) { var h = document.createElement('h4'); h.className = 'h3'; h.textContent = r.title; art.appendChild(h); }
      if (r.words) { var w = document.createElement('p'); w.textContent = r.words; art.appendChild(w); }
      if (r.shots && r.shots.length) {
        var g = document.createElement('div'); g.className = 'recap__shots';
        r.shots.forEach(function (sh) {
          var fig = document.createElement('figure');
          var im = document.createElement('img'); im.src = sh.src; im.alt = sh.alt || ''; im.loading = 'lazy'; fig.appendChild(im);
          if (sh.artist) { var c = document.createElement('figcaption'); c.className = 'artist'; c.textContent = 'Artist: ' + sh.artist; fig.appendChild(c); }
          g.appendChild(fig);
        });
        art.appendChild(g);
      }
      box.appendChild(art);
    });
    if (empty) { empty.remove(); }
  }

  /* 26 · collaboration enquiries */
  function collabForm() {
    var f = document.getElementById('collabForm'), status = document.getElementById('collabStatus');
    if (!f || !status) { return; }
    var min = new Date(); min.setMonth(min.getMonth() + 2);
    var iso = min.toISOString().slice(0, 10);
    var d = f.elements.date; if (d) { d.min = iso; }
    var hint = document.getElementById('dateHint');
    if (hint) { hint.remove(); }

    function bad(input, msg) {
      var field = input.closest('.f'); if (!field) { return; }
      field.setAttribute('data-invalid', 'true');
      var p = document.createElement('p'); p.className = 'f-err'; p.textContent = msg; field.appendChild(p);
    }
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      [].slice.call(f.querySelectorAll('.f')).forEach(function (el) {
        el.removeAttribute('data-invalid'); var e = el.querySelector('.f-err'); if (e) { e.remove(); }
      });
      var first = null, el = f.elements;
      if (!el.name.value.trim()) { bad(el.name, 'We need a name.'); first = first || el.name; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.email.value.trim())) { bad(el.email, 'That address will not reach you.'); first = first || el.email; }
      if (!el.date.value) { bad(el.date, 'Give us a proposed date.'); first = first || el.date; }
      else if (new Date(el.date.value) < min) { bad(el.date, 'We need at least two months to build something properly.'); first = first || el.date; }
      if (!el.location.value.trim()) { bad(el.location, 'Where would this happen?'); first = first || el.location; }
      if (!el.budget.value.trim()) { bad(el.budget, 'A rough range is fine.'); first = first || el.budget; }
      if (!el.about.value.trim()) { bad(el.about, 'Tell us what you have in mind.'); first = first || el.about; }
      if (first) { first.focus(); status.textContent = 'Almost. Check the notes above.'; return; }

      var data = {}; new FormData(f).forEach(function (v, k) { data[k] = v; });
      if (COLLAB_ENDPOINT) {
        status.textContent = 'Sending.';
        fetch(COLLAB_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) { throw new Error('bad'); } f.reset(); status.textContent = 'It is with us. We will come back to you.'; })
          .catch(function () { status.innerHTML = 'That did not send. Try again, or reach us on <a href="' + INSTAGRAM + '" rel="noopener" target="_blank">Instagram</a>.'; });
        return;
      }
      if (SUBMIT_EMAIL) {
        var body = ['Who: ' + data.who, 'Name: ' + data.name, 'Email: ' + data.email,
                    'Proposed date: ' + data.date, 'Location: ' + data.location, 'Budget: ' + data.budget,
                    '', 'What they have in mind:', data.about].join('\n');
        window.location.href = 'mailto:' + SUBMIT_EMAIL + '?subject=' + encodeURIComponent('Collaboration enquiry from ' + data.name) + '&body=' + encodeURIComponent(body);
        status.textContent = 'Your mail app should be opening with it ready to send.';
        return;
      }
      status.innerHTML = 'Reach us on <a href="' + INSTAGRAM + '" rel="noopener" target="_blank">Instagram</a> until this form goes live.';
    });
  }

  /* ---------- content ---------- */
  function audioBlock(src, label) {
    var w = document.createElement('div'); w.className = 'hear';
    var p = document.createElement('p'); p.className = 'hear__label'; p.textContent = 'hear it read'; w.appendChild(p);
    var a = document.createElement('audio'); a.controls = true; a.preload = 'none'; a.src = src;
    a.setAttribute('aria-label', 'Recording of ' + label); w.appendChild(a); return w;
  }
  function renderPieces() {
    var foot = document.querySelector('#poem-01 .poem__foot');
    if (foot && foot.getAttribute('data-audio')) { foot.innerHTML = ''; foot.appendChild(audioBlock(foot.getAttribute('data-audio'), 'Rough Drafts')); }
    var box = document.getElementById('pieces'), empty = document.getElementById('piecesEmpty');
    if (!box || !PIECES.length) { return; }
    PIECES.forEach(function (p) {
      var art = document.createElement('article'); art.className = 'poem';
      if (p.no) { var n = document.createElement('p'); n.className = 'poem__no'; n.textContent = 'Draft no. ' + p.no; art.appendChild(n); }
      var h = document.createElement('h4'); h.className = 'poem__title'; h.textContent = p.title || 'Untitled'; art.appendChild(h);
      if (p.credit) { var c = document.createElement('p'); c.className = 'fine'; c.textContent = p.credit; art.appendChild(c); }
      if (p.artwork && p.alt) { var im = document.createElement('img'); im.src = p.artwork; im.alt = p.alt; im.loading = 'lazy'; art.appendChild(im); }
      if (p.stanzas && p.stanzas.length) {
        var b = document.createElement('div'); b.className = 'poem__body';
        p.stanzas.forEach(function (st) {
          var para = document.createElement('p');
          st.forEach(function (ln, i) { if (i) { para.appendChild(document.createElement('br')); } para.appendChild(document.createTextNode(ln)); });
          b.appendChild(para);
        });
        art.appendChild(b);
      }
      if (p.audio || p.note) {
        var f = document.createElement('footer'); f.className = 'poem__foot';
        if (p.audio) { f.appendChild(audioBlock(p.audio, p.title || 'this piece')); }
        if (p.note) { var nt = document.createElement('p'); nt.textContent = p.note; f.appendChild(nt); }
        art.appendChild(f);
      }
      box.appendChild(art);
    });
    if (empty) { empty.remove(); }
  }
  function renderEvents() {
    var list = document.getElementById('eventList');
    if (!list) { return; }
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var up = EVENTS.filter(function (e) { return e && e.date && new Date(e.date) >= today; })
                   .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    if (!up.length) {
      var p = document.createElement('p'); p.className = 'dates__empty';
      p.textContent = 'Next dates to be announced.';
      list.parentNode.insertBefore(p, list); list.remove();
      setFlyer(null);
      return;
    }
    var fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });
    up.forEach(function (e) {
      var li = document.createElement('li');
      var w = document.createElement('span'); w.className = 'dates__when';
      w.textContent = fmt.format(new Date(e.date)) + (e.time ? ', ' + e.time : '');
      var what = document.createElement('p'); what.className = 'dates__what';
      if (e.link) { var a = document.createElement('a'); a.href = e.link; a.rel = 'noopener'; a.target = '_blank'; a.textContent = e.title; what.appendChild(a); }
      else { what.textContent = e.title; }
      if (e.place) { var s = document.createElement('span'); s.className = 'dates__where'; s.textContent = e.place; what.appendChild(document.createElement('br')); what.appendChild(s); }
      li.appendChild(w); li.appendChild(what); list.appendChild(li);
    });

    setFlyer(up[0]);
  }

  /* The flyer belongs to the event, so adding an event swaps the artwork
     in the section and in the pop-up at once. No markup to hand-edit. */
  function setFlyer(e) {
    var img = document.getElementById('eventFlyer');
    if (!img) { return; }
    var fig = img.closest ? img.closest('figure') : img.parentNode;
    if (e && e.flyer) {
      img.setAttribute('src', e.flyer);
      img.setAttribute('alt', e.flyerAlt || ('Flyer for ' + (e.title || 'the next gathering')));
      if (fig) { fig.hidden = false; }
    } else if (fig) {
      fig.hidden = true;
    }
  }

  /* =========================================================
     GO
     ========================================================= */
  function newsletterForm() {
    var f = document.getElementById('newsForm'), status = document.getElementById('newsStatus');
    if (!f || !status) { return; }
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      [].slice.call(f.querySelectorAll('.f')).forEach(function (el) {
        el.removeAttribute('data-invalid'); var e = el.querySelector('.f-err'); if (e) { e.remove(); }
      });
      var email = f.elements.email, consent = f.elements.consent, bad = null;
      function fail(input, msg) {
        var field = input.closest('.f'); if (!field) { return; }
        field.setAttribute('data-invalid', 'true');
        var p = document.createElement('p'); p.className = 'f-err'; p.textContent = msg; field.appendChild(p);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { fail(email, 'That address will not reach you.'); bad = bad || email; }
      if (!consent.checked) { fail(consent, 'We need this ticked before we can write to you.'); bad = bad || consent; }
      if (bad) { bad.focus(); status.textContent = 'Almost.'; return; }

      if (NEWS_ENDPOINT) {
        status.textContent = 'Signing you up.';
        fetch(NEWS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email: email.value.trim() }) })
          .then(function (r) { if (!r.ok) { throw new Error('bad'); } f.reset(); status.textContent = 'You are on the list. See you next month.'; })
          .catch(function () { status.innerHTML = 'That did not send. Try again, or reach us on <a href="' + INSTAGRAM + '" rel="noopener" target="_blank">Instagram</a>.'; });
        return;
      }
      if (SUBMIT_EMAIL) {
        window.location.href = 'mailto:' + SUBMIT_EMAIL + '?subject=' + encodeURIComponent('Newsletter signup') +
          '&body=' + encodeURIComponent('Please add me to the Rough Draft newsletter: ' + email.value.trim());
        status.textContent = 'Your mail app should be opening. Press send and you are on the list.';
      }
    });
  }

  /* ---------- the three standalone pages ---------- */
  /* =========================================================
     REFLECTIONS
     A deliberately tiny Markdown renderer: paragraphs, bold,
     italic and links, and nothing else.

     It never parses HTML. The text is tokenised and the result is
     built from createElement and textContent, so markup pasted into
     the editor arrives on the page as visible characters rather than
     as tags. That is what keeps an editor-facing field from becoming
     a stored-XSS hole.
     ========================================================= */

  var MD_TOKEN = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|_([^_\n]+)_|\[([^\]]+)\]\(([^)\s]+)\)/g;

  /* Only ordinary web and mail links. Anything else, javascript: and
     data: above all, is refused and the label is shown as plain text. */
  function safeHref(url) {
    return /^https?:\/\//i.test(url) || /^mailto:[^\s]+@[^\s]+/i.test(url) ? url : null;
  }

  function inlineMarkdown(text, parent) {
    var last = 0, m;
    MD_TOKEN.lastIndex = 0;
    while ((m = MD_TOKEN.exec(text)) !== null) {
      if (m.index > last) {
        parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      }
      if (m[1]) {
        var b = document.createElement('strong'); b.textContent = m[1]; parent.appendChild(b);
      } else if (m[2] || m[3]) {
        var i = document.createElement('em'); i.textContent = m[2] || m[3]; parent.appendChild(i);
      } else if (m[4]) {
        var href = safeHref(m[5]);
        if (href) {
          var a = document.createElement('a');
          a.href = href; a.rel = 'noopener noreferrer'; a.target = '_blank';
          a.textContent = m[4];
          parent.appendChild(a);
        } else {
          parent.appendChild(document.createTextNode(m[4]));
        }
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) {
      parent.appendChild(document.createTextNode(text.slice(last)));
    }
  }

  function renderReflection(src) {
    var frag = document.createDocumentFragment();
    if (!src) { return frag; }

    /* an older entry may still hold an array of paragraphs */
    var blocks = Array.isArray(src)
      ? src.map(String)
      : String(src).replace(/\r\n?/g, '\n').split(/\n{2,}/);

    blocks.forEach(function (block) {
      var text = block.trim();
      if (!text) { return; }
      var p = document.createElement('p');
      /* a single newline is kept as a line break, so what the writer
         typed is what appears */
      text.split('\n').forEach(function (line, i) {
        if (i) { p.appendChild(document.createElement('br')); }
        inlineMarkdown(line, p);
      });
      frag.appendChild(p);
    });
    return frag;
  }

  function renderDrafts() {
    var box = document.getElementById('draftList');
    if (!box) { return; }
    if (!DRAFTS.length) { return; }
    var fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    DRAFTS.forEach(function (d) {
      var art = document.createElement('article');
      art.className = 'entry';

      var fig = document.createElement('figure');
      fig.className = 'entry__plate';
      if (!d.photo && d.comingSoon) {
        var soon = document.createElement('div');
        soon.className = 'entry__soon';
        soon.innerHTML = '<span>Coming soon</span>';
        fig.appendChild(soon);
      }
      if (d.photo) {
        var im = document.createElement('img');
        im.src = d.photo; im.alt = d.alt || ''; im.loading = 'lazy'; im.decoding = 'async';
        fig.appendChild(im);
      }
      if (d.photographer) {
        var pc = document.createElement('figcaption');
        pc.className = 'artist';
        pc.textContent = 'Photographer: ' + d.photographer;
        fig.appendChild(pc);
      }
      art.appendChild(fig);

      var body = document.createElement('div');
      body.className = 'entry__body';

      var no = document.createElement('p');
      no.className = 'entry__no';
      no.textContent = 'Draft ' + d.no;
      body.appendChild(no);

      if (d.title) {
        var h = document.createElement('h2');
        h.className = 'entry__title';
        h.textContent = d.title;
        body.appendChild(h);
      }

      if (d.date || d.place) {
        var meta = document.createElement('p');
        meta.className = 'entry__meta';
        meta.textContent = [d.date ? fmt.format(new Date(d.date)) : '', d.place].filter(Boolean).join(', ');
        body.appendChild(meta);
      }

      if (d.reflection && d.reflection.length) {
        var ref = document.createElement('div');
        ref.className = 'entry__reflection';
        ref.appendChild(renderReflection(d.reflection));
        body.appendChild(ref);
        var writer = d.reflectionBy || d.writer;
        if (writer) {
          var w = document.createElement('p');
          w.className = 'entry__writer';
          w.textContent = 'Written by ' + writer;
          body.appendChild(w);
        }
      } else {
        var wait = document.createElement('p');
        wait.className = 'entry__waiting';
        wait.textContent = d.note || 'Reflections in progress.';
        body.appendChild(wait);
      }

      art.appendChild(body);
      box.appendChild(art);
    });
    var empty = document.getElementById('draftsEmpty');
    if (empty) { empty.remove(); }
  }

  function renderResources() {
    var box = document.getElementById('resourceList');
    if (!box || !RESOURCES.length) { return; }
    var groups = {}, order = [];
    RESOURCES.forEach(function (r) {
      var g = r.group || '';
      if (!(g in groups)) { groups[g] = []; order.push(g); }
      groups[g].push(r);
    });
    order.forEach(function (g) {
      if (g) {
        var h = document.createElement('h2');
        h.className = 'group__head';
        h.textContent = g;
        box.appendChild(h);
      }
      var ul = document.createElement('ul');
      ul.className = 'linklist';
      groups[g].forEach(function (r) {
        var li = document.createElement('li');
        var a = document.createElement(r.url ? 'a' : 'span');
        a.className = 'linklist__name';
        a.textContent = r.name;
        if (r.url) { a.href = r.url; a.rel = 'noopener'; a.target = '_blank'; }
        li.appendChild(a);
        if (r.by) {
          var by = document.createElement('span');
          by.className = 'linklist__by';
          by.textContent = r.by;
          li.appendChild(by);
        }
        if (r.note) {
          var n = document.createElement('p');
          n.className = 'linklist__note';
          n.textContent = r.note;
          li.appendChild(n);
        }
        ul.appendChild(li);
      });
      box.appendChild(ul);
    });
    var empty = document.getElementById('resourcesEmpty');
    if (empty) { empty.remove(); }
  }

  function renderWeavers() {
    var box = document.getElementById('weaverList');
    if (!box || !WEAVERS.length) { return; }
    WEAVERS.forEach(function (w) {
      var li = document.createElement('li');
      li.className = 'weaver';
      if (w.photo) {
        var im = document.createElement('img');
        im.className = 'weaver__face';
        im.src = w.photo; im.alt = w.alt || ''; im.loading = 'lazy';
        li.appendChild(im);
      }
      var t = document.createElement('div');
      var name = document.createElement(w.url ? 'a' : 'p');
      name.className = 'weaver__name';
      name.textContent = w.name;
      if (w.url) { name.href = w.url; name.rel = 'noopener'; name.target = '_blank'; }
      t.appendChild(name);
      if (w.credit) {
        var c = document.createElement('p');
        c.className = 'weaver__credit';
        c.textContent = w.credit;
        t.appendChild(c);
      }
      li.appendChild(t);
      box.appendChild(li);
    });
    var empty = document.getElementById('weaversEmpty');
    if (empty) { empty.remove(); }
  }

  function patrons() {
    var section = document.getElementById('patrons');
    var box = document.getElementById('giveAmounts');
    var note = document.getElementById('giveNote');
    var soon = document.getElementById('giveSoon');
    var when = section ? section.querySelector('.give__when') : null;
    if (!section || !box) { return; }

    function live(key) { return (DONATE[key] || []).filter(function (o) { return o.url; }); }
    var tabs = [].slice.call(section.querySelectorAll('.give__tab'));

    /* nowhere to send people yet: say so plainly rather than showing dead buttons */
    if (!live('once').length && !live('monthly').length) {
      box.setAttribute('hidden', '');
      if (note) { note.setAttribute('hidden', ''); }
      if (when) { when.setAttribute('hidden', ''); }
      return;
    }
    var pledgeBlock = document.getElementById('givePledge');
    if (pledgeBlock) { pledgeBlock.remove(); }
    if (soon) { soon.remove(); }

    tabs.forEach(function (t) {
      if (!live(t.getAttribute('data-when')).length) { t.setAttribute('hidden', ''); }
    });
    var only = tabs.filter(function (t) { return !t.hasAttribute('hidden'); });
    if (only.length < 2 && when) { when.setAttribute('hidden', ''); }

    function paint(key) {
      box.innerHTML = '';
      live(key).forEach(function (o) {
        var a = document.createElement('a');
        a.className = 'give__amount' + (o.label ? ' give__amount--open' : '');
        a.href = o.url; a.rel = 'noopener'; a.target = '_blank';
        a.textContent = o.label ? o.label : DONATE.currency + o.amount;
        if (!o.label && key === 'monthly') {
          var per = document.createElement('span');
          per.className = 'give__per'; per.textContent = 'a month';
          a.appendChild(per);
        }
        box.appendChild(a);
      });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (o) { o.setAttribute('aria-pressed', o === t ? 'true' : 'false'); });
        paint(t.getAttribute('data-when'));
      });
    });
    var first = only[0] || tabs[0];
    tabs.forEach(function (o) { o.setAttribute('aria-pressed', o === first ? 'true' : 'false'); });
    paint(first.getAttribute('data-when'));
  }

  /* The collaboration form belongs to its own route. It starts open in the
     markup so it still works without JavaScript, and is folded away here. */
  function collabToggle() {
    var btn = document.getElementById('openCollab');
    var wrap = document.getElementById('collabWrap');
    if (!btn || !wrap) { return; }
    wrap.setAttribute('hidden', '');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (open) { wrap.setAttribute('hidden', ''); return; }
      wrap.removeAttribute('hidden');
      var first = wrap.querySelector('input, textarea');
      if (first) { first.focus({ preventScroll: true }); }
      wrap.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'nearest' });
    });
  }

  /* Pledges. No money moves here: this collects who, how much and how often,
     so the team can follow up. Replaced by real payment buttons the moment
     DONATE has links in it. */
  function pledge() {
    var box = document.getElementById('pledgeBox');
    var open = document.getElementById('openPledge');
    var close = document.getElementById('closePledge');
    var form = document.getElementById('pledgeForm');
    var status = document.getElementById('pledgeStatus');
    if (!box || !open || !form) { return; }

    var amount = form.elements.amount;
    var otherWrap = document.getElementById('otherWrap');
    amount.addEventListener('change', function () {
      if (amount.value === 'other') { otherWrap.removeAttribute('hidden'); form.elements.otherAmount.focus(); }
      else { otherWrap.setAttribute('hidden', ''); }
    });

    var opener = null;
    function show() {
      opener = document.activeElement;
      if (box.showModal) { box.showModal(); } else { box.setAttribute('open', ''); }
      var first = form.querySelector('input');
      if (first) { first.focus(); }
    }
    function hide() {
      if (box.close) { box.close(); } else { box.removeAttribute('open'); }
      if (opener && opener.focus) { opener.focus(); }
    }
    open.addEventListener('click', show);
    if (close) { close.addEventListener('click', hide); }
    box.addEventListener('click', function (e) { if (e.target === box) { hide(); } });

    function bad(input, msg) {
      var field = input.closest('.f'); if (!field) { return; }
      field.setAttribute('data-invalid', 'true');
      var p = document.createElement('p'); p.className = 'f-err'; p.textContent = msg; field.appendChild(p);
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      [].slice.call(form.querySelectorAll('.f')).forEach(function (el) {
        el.removeAttribute('data-invalid');
        var e = el.querySelector('.f-err'); if (e) { e.remove(); }
      });
      var el = form.elements, first = null;
      if (!el.name.value.trim()) { bad(el.name, 'We need a name to put to this.'); first = first || el.name; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.email.value.trim())) { bad(el.email, 'That address will not reach you.'); first = first || el.email; }
      if (!el.amount.value) { bad(el.amount, 'Choose an amount.'); first = first || el.amount; }
      if (el.amount.value === 'other' && !el.otherAmount.value.trim()) { bad(el.otherAmount, 'How much did you have in mind?'); first = first || el.otherAmount; }
      if (!el.consent.checked) { bad(el.consent, 'We need this before we can contact you.'); first = first || el.consent; }
      if (first) { first.focus(); status.textContent = 'Almost. Check the notes above.'; return; }

      var d = {}; new FormData(form).forEach(function (v, k) { d[k] = v; });
      if (d.amount === 'other') { d.amount = d.otherAmount; }
      delete d.otherAmount;

      if (PLEDGE_ENDPOINT) {
        status.textContent = 'Sending.';
        fetch(PLEDGE_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) })
          .then(function (r) { if (!r.ok) { throw new Error('bad'); } form.reset(); status.textContent = 'Thank you. We will be in touch to arrange it.'; })
          .catch(function () { status.innerHTML = 'That did not send. Try again, or reach us on <a href="' + INSTAGRAM + '" rel="noopener" target="_blank">Instagram</a>.'; });
        return;
      }
      if (SUBMIT_EMAIL) {
        var body = ['Name: ' + d.name, 'Email: ' + d.email, 'Contact number: ' + (d.phone || 'not given'),
                    'Amount: ' + d.amount, 'How often: ' + d.frequency, '', 'Note:', d.note || ''].join('\n');
        window.location.href = 'mailto:' + SUBMIT_EMAIL + '?subject=' + encodeURIComponent('Pledge from ' + d.name) +
          '&body=' + encodeURIComponent(body);
        status.textContent = 'Your mail app should be opening with the pledge in it. Press send and it reaches us.';
      }
    });
  }

  /* The next gathering, announced once when the page settles. It reads the
     first upcoming entry in EVENTS, so it updates itself and disappears on
     its own once that date has passed. The same event stays in the Events
     section either way: this only brings it forward.

     NOTICE_SECONDS  how long it waits before sliding away by itself.
                     The countdown pauses while the pointer is over it or
                     while anything inside it has keyboard focus, so nobody
                     loses it mid-read. Set to 0 to make it stay until closed. */
  var NOTICE_SECONDS = 9;

  function eventNotice() {
    var box = document.getElementById('eventNotice');
    if (!box) { return; }

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var next = EVENTS.filter(function (e) { return e && e.date && new Date(e.date) >= today; })
                     .sort(function (a, b) { return new Date(a.date) - new Date(b.date); })[0];
    if (!next) { return; }                 /* nothing coming up, nothing to announce */

    /* shown once per browsing session, so it does not nag on every page view */
    try {
      if (sessionStorage.getItem('rd-notice') === next.date) { return; }
    } catch (e) {}

    var fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    var title = document.getElementById('noticeTitle');
    var when = document.getElementById('noticeWhen');
    var flyer = document.getElementById('noticeFlyer');
    var source = document.getElementById('eventFlyer');

    if (title) { title.textContent = next.title || 'Our next gathering'; }
    if (when) {
      when.textContent = fmt.format(new Date(next.date)) +
        (next.time ? ', ' + next.time : '') +
        (next.place ? '. ' + next.place : '');
    }
    if (flyer && source) {
      flyer.src = source.getAttribute('src');
      flyer.alt = '';                      /* decorative here; the words beside it carry the meaning */
    } else if (flyer) {
      flyer.remove();
    }

    var timer = null, left = NOTICE_SECONDS * 1000, last = 0, closed = false;
    var bar = document.getElementById('noticeTimer');

    function close() {
      if (closed) { return; }
      closed = true;
      window.clearInterval(timer);
      box.setAttribute('data-going', 'true');
      window.setTimeout(function () { box.setAttribute('hidden', ''); }, calm ? 0 : 500);
      try { sessionStorage.setItem('rd-notice', next.date); } catch (e) {}
    }

    function tick() {
      var now = Date.now();
      var paused = box.matches(':hover') || box.contains(document.activeElement);
      if (!paused) { left -= (now - last); }
      last = now;
      if (bar && NOTICE_SECONDS) {
        bar.style.transform = 'scaleX(' + Math.max(0, left / (NOTICE_SECONDS * 1000)).toFixed(3) + ')';
      }
      if (left <= 0) { close(); }
    }

    var closeBtn = document.getElementById('noticeClose');
    if (closeBtn) { closeBtn.addEventListener('click', close); }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); } });
    /* following the link counts as reading it */
    box.addEventListener('click', function (e) { if (e.target.closest('.notice__link')) { close(); } });

    function show() {
      if (closed) { return; }
      box.removeAttribute('hidden');
      /* a frame later, so the slide has something to animate from */
      requestAnimationFrame(function () { box.setAttribute('data-in', 'true'); });
      if (NOTICE_SECONDS > 0) { last = Date.now(); timer = window.setInterval(tick, 100); }
    }

    /* wait for the paper to finish unfolding, so the two do not collide */
    function whenSettled() {
      if (root.getAttribute('data-intro') === 'on') {
        window.setTimeout(whenSettled, 200);
        return;
      }
      window.setTimeout(show, calm ? 300 : 1100);
    }
    whenSettled();
  }

  function teamLink() {
    if (!TEAM_FORM_URL) { return; }
    var links = [].slice.call(document.querySelectorAll('#teamForm, .volunteer-link'));
    links.forEach(function (a) { a.href = TEAM_FORM_URL; a.target = '_blank'; a.rel = 'noopener'; });
  }

  function start() {
    splitLines(); reveals(); menu(); anchors();
    var standalone = document.body.getAttribute('data-page');
    if (standalone) {
      renderDrafts(); renderResources(); renderWeavers(); newsletterForm();
      var canvas2 = document.getElementById('sheet');
      var sheet2 = createSheet(canvas2);
      if (!sheet2) { root.classList.add('no-gl'); root.removeAttribute('data-intro'); return; }
      var fonts2 = document.fonts && document.fonts.load
        ? Promise.race([document.fonts.load('400 80px "Fraunces"'), wait(1500)]) : Promise.resolve();
      fonts2.then(function () {
        sheet2.init(null);
        sheet2.endIntro();
        sheet2.setState(document.body.getAttribute('data-sheet') || 'blank');
        root.removeAttribute('data-intro');
      });
      return;
    }
    renderPieces(); renderEvents(); renderRecaps(); collabForm(); newsletterForm(); teamLink(); patrons(); pledge(); collabToggle(); drawBridge(); eventNotice();

    var sheet = createSheet(document.getElementById('sheet'));
    equation(sheet);

    if (!sheet) {
      root.classList.add('no-gl');
      endOpening(null);
      watcher(null)();
      return;
    }

    var src = document.querySelector('#anthology .print img');
    var fonts = document.fonts && document.fonts.load
      ? Promise.race([document.fonts.load('400 80px "Fraunces"'), wait(1800)])
      : Promise.resolve();

    var img = new Image();
    var loaded = new Promise(function (res) {
      img.onload = function () { res(img); };
      img.onerror = function () { res(null); };
      img.src = src ? src.getAttribute('src') : '';
    });

    Promise.all([fonts, loaded]).then(function (r) {
      sheet.init(r[1]);
      var check = watcher(sheet);
      var atTop = window.scrollY < 40 && !location.hash;
      if (calm || !atTop) { endOpening(sheet); sheet.setState('rest'); check(); }
      else { opening(sheet); }
    });
  }

  /* Content first, then the page. A failed or slow content file does not
     block this: loadContent() resolves either way and the sections fall
     back to their empty states. */
  function boot() { loadContent().then(start, start); }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); }
  else { boot(); }
})();
