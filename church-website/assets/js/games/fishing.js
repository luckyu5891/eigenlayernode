/* GONE FISHING | hold to cast, tap on the bite, hold to reel. Each catch unlocks a pond fact. */
(function () {
  'use strict';
  const { $, esc, Passport, Sfx } = window.App; const D = window.DATA;
  const W = 720, H = 480, WATER = 250;
  let cv, c, host, ctx, raf, last, st, holding = false;

  window.Games.fishing = {
    mount(h, cx) {
      host = h; ctx = cx;
      host.innerHTML = `<div class="g-top"><p>Press and hold to charge your cast, release to throw. When the bobber dips, tap fast. Then hold to reel and let go when the line turns red. Three catches earn the stamp.</p>
        <div class="scoreboard"><div class="stat"><div class="label">Catches</div><div class="value" id="fs-n">0</div></div><div class="stat"><div class="label">Points</div><div class="value" id="fs-pts">0</div></div><div class="stat"><div class="label">Best</div><div class="value" id="fs-best">${Passport.score('Gone Fishing') || 0}</div></div></div></div>
        <canvas class="game-canvas" id="fs-canvas" width="720" height="480" style="aspect-ratio:3/2"></canvas>
        <div class="g-msg" id="fs-msg"></div>
        <div id="fs-facts" class="stack"></div>`;
      cv = $('#fs-canvas', host); c = cv.getContext('2d');
      st = { phase: 'ready', power: 0, t: 0, catches: 0, pts: 0, facts: [], bobber: null, fish: null, tension: 0, progress: 0, msg: 'Hold to cast', ripples: [], splash: 0 };
      const down = e => { e.preventDefault(); holding = true; onDown(); }; const up = e => { holding = false; onUp(); };
      cv.addEventListener('pointerdown', down); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', () => { if (holding) { holding = false; onUp(); } });
      this.kd = e => { if (e.code === 'Space' && !holding) { e.preventDefault(); holding = true; onDown(); } }; this.ku = e => { if (e.code === 'Space') { holding = false; onUp(); } };
      document.addEventListener('keydown', this.kd); document.addEventListener('keyup', this.ku);
      last = performance.now(); raf = requestAnimationFrame(loop);
    },
    unmount() { cancelAnimationFrame(raf); document.removeEventListener('keydown', this.kd); document.removeEventListener('keyup', this.ku); }
  };

  function onDown() {
    if (st.phase === 'ready' || st.phase === 'result') { st.phase = 'charging'; st.power = 0; st.msg = 'Release to cast'; }
    else if (st.phase === 'bite') hook();
    else if (st.phase === 'waiting') { st.msg = 'Patience… wait for the dip'; }
  }
  function onUp() {
    if (st.phase === 'charging') cast();
  }
  function cast() {
    const p = Math.max(.15, st.power); st.phase = 'flying'; st.t = 0; Sfx.play('whoosh');
    const dist = 120 + p * 480; st.bobber = { x0: 120, y0: 170, x1: 120 + dist, y1: WATER + 30 + p * 120, x: 120, y: 170 }; st.castPower = p; st.msg = '';
  }
  function land() {
    st.phase = 'waiting'; st.t = 0; st.biteAt = 1.6 + Math.random() * 3.5; st.nibbleAt = st.biteAt * (0.35 + Math.random() * .3); st.nibbled = false; st.msg = 'Waiting for a bite…'; Sfx.play('splash'); st.splash = .6; addRipple();
  }
  function bite() { st.phase = 'bite'; st.t = 0; st.msg = 'Now! Tap!'; Sfx.play('coin'); addRipple(); }
  function hook() {
    st.phase = 'reeling'; st.t = 0; st.tension = .3; st.progress = 0;
    const roll = Math.random(), far = st.castPower;
    let pool = D.fish.filter(f => f.name !== 'Old Boot'); if (roll < 0.1) pool = D.fish.filter(f => f.name === 'Old Boot');
    else if (far > .7 && roll < .5) pool = pool.filter(f => f.pts >= 25);
    st.fish = pool[Math.floor(Math.random() * pool.length)]; st.fishPull = st.fish.pts >= 25 ? 1.35 : 1; st.msg = 'Hold to reel, release when red';
  }
  function caught() {
    st.phase = 'result'; st.t = 0; st.catches++; st.pts += st.fish.pts; st.msg = `${st.fish.emoji} ${st.fish.name}! +${st.fish.pts}`; Sfx.play('win');
    $('#fs-n', host).textContent = st.catches; $('#fs-pts', host).textContent = st.pts;
    if (!st.facts.includes(st.fish.fact)) { st.facts.push(st.fish.fact); const d = document.createElement('div'); d.className = 'card sand'; d.style.padding = '12px 14px'; d.innerHTML = `<strong>${st.fish.emoji} ${esc(st.fish.name)}</strong><div class="small">${esc(st.fish.fact)}</div>`; $('#fs-facts', host).prepend(d); }
    if (Passport.best('Gone Fishing', st.pts)) $('#fs-best', host).textContent = st.pts;
    if (st.catches === 3) ctx.stamp('Caught three fish');
    $('#fs-msg', host).textContent = st.catches >= 3 ? 'Stamp earned. Keep fishing for a high score.' : `${3 - st.catches} more for the stamp.`;
  }
  function lost(why) { st.phase = 'result'; st.t = 0; st.msg = why; Sfx.play('bad'); st.fish = null; }
  function addRipple() { if (st.bobber) st.ripples.push({ x: st.bobber.x, y: st.bobber.y, r: 4, a: .8 }); }

  function loop(t) {
    const dt = Math.min(0.04, (t - last) / 1000); last = t; step(dt); draw(); raf = requestAnimationFrame(loop);
  }
  function step(dt) {
    st.t += dt; if (st.splash > 0) st.splash -= dt;
    st.ripples.forEach(r => { r.r += 28 * dt; r.a -= .6 * dt; }); st.ripples = st.ripples.filter(r => r.a > 0);
    if (st.phase === 'charging') { st.power = Math.min(1, st.power + dt * .9); }
    else if (st.phase === 'flying') { const u = Math.min(1, st.t / .9), b = st.bobber; b.x = b.x0 + (b.x1 - b.x0) * u; b.y = b.y0 + (b.y1 - b.y0) * u - Math.sin(u * Math.PI) * 140; if (u >= 1) { b.y = b.y1; land(); } }
    else if (st.phase === 'waiting') {
      st.bobber.y = st.bobber.y1 + Math.sin(st.t * 2) * 2;
      if (!st.nibbled && st.t > st.nibbleAt) { st.nibbled = true; st.bobber.y1 += 0; addRipple(); st.msg = 'A nibble… not yet'; }
      if (st.t > st.biteAt) bite();
      if (Math.random() < dt * .4) addRipple();
    }
    else if (st.phase === 'bite') { st.bobber.y = st.bobber.y1 + 10 + Math.sin(st.t * 18) * 4; if (st.t > 1.0) lost('It got away. Cast again.'); }
    else if (st.phase === 'reeling') {
      const pull = st.fishPull * (0.9 + Math.sin(st.t * 3.1) * .5);
      if (holding) { st.tension += dt * (1.1 * pull); st.progress += dt * (st.tension < .75 ? .42 : .15); } else st.tension -= dt * 1.3;
      st.tension = Math.max(0, st.tension);
      st.bobber.x -= dt * 40 * st.progress; st.bobber.y = st.bobber.y1 + Math.sin(st.t * 12) * 3;
      if (st.tension > 1) return lost('Snap! The line broke. Ease off when it turns red.');
      if (st.progress >= 1) caught();
    }
    else if (st.phase === 'result') { if (st.t > 2.2) { st.phase = 'ready'; st.msg = 'Hold to cast'; st.bobber = null; } }
  }
  function draw() {
    // sky
    const sky = c.createLinearGradient(0, 0, 0, WATER); sky.addColorStop(0, '#f6a56b'); sky.addColorStop(.5, '#f2c6a0'); sky.addColorStop(1, '#a9d0e6'); c.fillStyle = sky; c.fillRect(0, 0, W, WATER);
    c.fillStyle = '#ffe08a'; c.beginPath(); c.arc(600, 90, 34, 0, 7); c.fill();
    // far bank with church silhouette and trees
    c.fillStyle = '#6fa35a'; c.fillRect(0, WATER - 36, W, 36);
    c.fillStyle = '#f2e8d5'; c.fillRect(330, WATER - 78, 120, 44); c.fillStyle = '#c2553d'; c.beginPath(); c.moveTo(322, WATER - 78); c.lineTo(390, WATER - 110); c.lineTo(458, WATER - 78); c.closePath(); c.fill(); c.fillStyle = '#f0d78a'; c.fillRect(388, WATER - 132, 4, 22); c.fillRect(382, WATER - 126, 16, 4);
    [[60, 12], [140, 16], [230, 11], [520, 14], [600, 12], [680, 15]].forEach(([x, r]) => { c.fillStyle = '#7a5236'; c.fillRect(x - 2, WATER - 44 - r, 4, r + 10); c.fillStyle = '#3f8f3f'; c.beginPath(); c.arc(x, WATER - 46 - r, r + 6, 0, 7); c.fill(); });
    // water
    const wg = c.createLinearGradient(0, WATER, 0, H); wg.addColorStop(0, '#6fc2e6'); wg.addColorStop(1, '#1f5f8f'); c.fillStyle = wg; c.fillRect(0, WATER, W, H - WATER);
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.5; for (let i = 0; i < 9; i++) { const y = WATER + 20 + i * 24; c.beginPath(); c.moveTo(20 + (i % 2) * 60 + Math.sin(performance.now() / 900 + i) * 12, y); c.lineTo(120 + (i % 2) * 60 + Math.sin(performance.now() / 900 + i) * 12, y); c.stroke(); }
    // reeds foreground
    c.strokeStyle = '#2f7a44'; c.lineWidth = 3; [[660, 0], [676, 1], [692, 0], [40, 1], [58, 0]].forEach(([x, k]) => { c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x + 6, H - 50, x + 2 + k * 6, H - 90); c.stroke(); });
    st.ripples.forEach(r => { c.strokeStyle = `rgba(255,255,255,${r.a})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(r.x, r.y, r.r, r.r * .45, 0, 0, 7); c.stroke(); });
    // dock and angler
    c.fillStyle = '#8f6b4a'; c.fillRect(0, WATER - 6, 150, 14); for (let x = 20; x < 150; x += 40) c.fillRect(x, WATER + 8, 8, 70);
    c.fillStyle = '#2f5d50'; c.fillRect(96, WATER - 62, 22, 56); c.fillStyle = '#f2c9a0'; c.beginPath(); c.arc(107, WATER - 74, 11, 0, 7); c.fill(); c.fillStyle = '#c2553d'; c.fillRect(94, WATER - 90, 26, 8); c.fillRect(100, WATER - 96, 14, 8);
    // rod
    const rodTip = [150, 150]; c.strokeStyle = '#3b2b1e'; c.lineWidth = 3; c.beginPath(); c.moveTo(112, WATER - 40); c.lineTo(...rodTip); c.stroke();
    // line & bobber
    if (st.bobber) {
      const b = st.bobber; c.strokeStyle = st.phase === 'reeling' ? (st.tension > .75 ? '#e63946' : '#fff') : 'rgba(255,255,255,.8)'; c.lineWidth = st.phase === 'reeling' ? 2 : 1;
      c.beginPath(); c.moveTo(...rodTip); c.quadraticCurveTo((rodTip[0] + b.x) / 2, Math.max(rodTip[1], b.y) - (st.phase === 'flying' ? 60 : -20), b.x, b.y); c.stroke();
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(b.x, b.y, 7, Math.PI, 0); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(b.x, b.y, 7, 0, Math.PI); c.fill();
      if (st.phase === 'bite') { c.fillStyle = '#ffd166'; c.font = '900 30px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('!', b.x, b.y - 18); }
      if (st.phase === 'reeling' && st.fish) { c.fillStyle = 'rgba(20,33,61,.5)'; c.beginPath(); c.ellipse(b.x + 24 + Math.sin(st.t * 6) * 6, b.y + 26, 18, 8, .3, 0, 7); c.fill(); }
    }
    if (st.splash > 0 && st.bobber) { c.fillStyle = `rgba(255,255,255,${st.splash})`; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(st.bobber.x + Math.cos(i) * 14 * (1 - st.splash), st.bobber.y - 10 * (1 - st.splash) * Math.sin(i * 1.3), 3, 0, 7); c.fill(); } }
    // power meter
    if (st.phase === 'charging') { c.fillStyle = 'rgba(20,33,61,.6)'; c.fillRect(30, 30, 200, 18); c.fillStyle = st.power > .8 ? '#ffd166' : '#06d6a0'; c.fillRect(32, 32, 196 * st.power, 14); c.fillStyle = '#fff'; c.font = '800 13px Nunito, sans-serif'; c.textAlign = 'left'; c.fillText('Power', 34, 62); }
    // tension meter
    if (st.phase === 'reeling') {
      c.fillStyle = 'rgba(20,33,61,.6)'; c.fillRect(W / 2 - 150, 24, 300, 46);
      c.fillStyle = '#06d6a0'; c.fillRect(W / 2 - 146, 28, 292 * .75, 16); c.fillStyle = '#e63946'; c.fillRect(W / 2 - 146 + 292 * .75, 28, 292 * .25, 16);
      c.fillStyle = '#fff'; c.fillRect(W / 2 - 148 + 292 * Math.min(1, st.tension), 24, 4, 24);
      c.fillStyle = '#ffd166'; c.fillRect(W / 2 - 146, 50, 292 * st.progress, 14); c.fillStyle = '#fff'; c.font = '800 11px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('LINE TENSION  ·  REEL PROGRESS', W / 2, 61);
    }
    if (st.msg) { c.fillStyle = 'rgba(20,33,61,.75)'; const tw = c.measureText(st.msg).width; c.font = '700 20px Fraunces, Georgia, serif'; c.textAlign = 'center'; const w2 = c.measureText(st.msg).width + 40; c.fillRect(W / 2 - w2 / 2, H - 60, w2, 40); c.fillStyle = '#fff'; c.fillText(st.msg, W / 2, H - 32); }
  }
})();
