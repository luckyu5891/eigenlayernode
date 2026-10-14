/* PARK IT | top-down parking, tuned for kids. Park once for the stamp, two bonus levels after. */
(function () {
  'use strict';
  const { $, $$, Passport, Sfx } = window.App;
  const W = 720, H = 480, CL = 44, CW = 22;
  let cv, c, host, ctx, raf, last, st, keys = {};

  const LEVELS = [
    { name: 'Drive straight in and stop', start: { x: 120, y: 390 }, slot: { x: 440, y: 150, a: 0 }, cars: [], cones: [] },
    { name: 'Bonus: between the neighbours', start: { x: 90, y: 240 }, slot: { x: 520, y: 300, a: Math.PI / 2 }, cars: [[450, 300, Math.PI / 2, '#118ab2'], [590, 300, Math.PI / 2, '#f4a261'], [300, 120, 0, '#6c757d']], cones: [[300, 400]] },
    { name: 'Bonus: the tight one', start: { x: 360, y: 420 }, slot: { x: 360, y: 120, a: Math.PI / 2 }, cars: [[290, 120, Math.PI / 2, '#e63946'], [430, 120, Math.PI / 2, '#3a86ff'], [150, 300, 0, '#8338ec'], [570, 300, 0, '#f4a261']], cones: [[360, 270]] }
  ];

  window.Games.parking = {
    mount(h, cx) {
      host = h; ctx = cx;
      host.innerHTML = `<div class="g-top"><p>Drive into the glowing P space and stop. Hold Gas to go, tap the arrows to steer. Touching the lines is fine. Park once to earn the stamp.</p>
        <div class="scoreboard"><div class="stat"><div class="label">Level</div><div class="value"><span id="pk-level">1</span>/3</div></div><div class="stat"><div class="label">Time</div><div class="value" id="pk-time">0.0</div></div><div class="stat"><div class="label">Bumps</div><div class="value" id="pk-bumps">0</div></div></div></div>
        <canvas class="game-canvas" id="pk-canvas" width="720" height="480" style="aspect-ratio:3/2"></canvas>
        <div class="controls" id="pk-controls">
          <button type="button" data-k="ArrowLeft" aria-label="Steer left">◀</button><button type="button" data-k="ArrowUp" aria-label="Forward">▲ Gas</button><button type="button" data-k="ArrowRight" aria-label="Steer right">▶</button>
          <button type="button" class="wide" data-k="ArrowDown" aria-label="Reverse">▼ Reverse</button>
        </div>
        <div class="btn-row" style="margin-top:10px;justify-content:center"><button class="btn secondary sm" type="button" id="pk-retry">Retry level</button><span class="g-msg" id="pk-msg" style="margin:0"></span></div>`;
      cv = $('#pk-canvas', host); c = cv.getContext('2d');
      $$('#pk-controls button', host).forEach(b => {
        const on = e => { e.preventDefault(); keys[b.dataset.k] = true; b.classList.add('held'); b.setPointerCapture && b.setPointerCapture(e.pointerId); };
        const off = () => { keys[b.dataset.k] = false; b.classList.remove('held'); };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
      });
      this.kd = e => { if (e.key.startsWith('Arrow')) { keys[e.key] = true; e.preventDefault(); } }; this.ku = e => { keys[e.key] = false; };
      document.addEventListener('keydown', this.kd); document.addEventListener('keyup', this.ku);
      $('#pk-retry', host).addEventListener('click', () => load(st.level));
      window.__parkState = () => st;
      load(0); last = performance.now(); raf = requestAnimationFrame(loop);
    },
    unmount() { cancelAnimationFrame(raf); document.removeEventListener('keydown', this.kd); document.removeEventListener('keyup', this.ku); keys = {}; }
  };

  function load(i) {
    const L = LEVELS[i];
    // the car always starts pointed at the space, so Gas takes you the right way
    const a0 = Math.atan2(L.slot.y - L.start.y, L.slot.x - L.start.x);
    if (i === 0) { // first level: the space lies straight ahead, so holding Gas and stopping is enough
      L.slot.a = a0; const px = -Math.sin(a0), py = Math.cos(a0);
      L.cars = [[L.slot.x + px * 62, L.slot.y + py * 62, a0, '#e63946'], [L.slot.x - px * 62, L.slot.y - py * 62, a0, '#2a9d8f']];
    }
    st = { level: i, L, car: { x: L.start.x, y: L.start.y, a: a0, v: 0 }, time: 0, bumps: 0, hold: 0, done: false, flash: 0, msg: L.name, msgT: 2.2, total: st ? st.total : 0 };
    $('#pk-level', host).textContent = i + 1; $('#pk-bumps', host).textContent = 0; $('#pk-msg', host).textContent = '';
  }
  function corners(x, y, a, l, w) { const ca = Math.cos(a), sa = Math.sin(a); return [[l / 2, w / 2], [l / 2, -w / 2], [-l / 2, -w / 2], [-l / 2, w / 2]].map(([u, v]) => [x + u * ca - v * sa, y + u * sa + v * ca]); }
  function inside(p, poly) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
  function overlap(pa, pb) { return pa.some(p => inside(p, pb)) || pb.some(p => inside(p, pa)); }
  function loop(t) { const dt = Math.min(0.033, (t - last) / 1000); last = t; step(dt); draw(); raf = requestAnimationFrame(loop); }
  function step(dt) {
    if (st.done) return;
    const car = st.car; st.time += dt; if (st.msgT > 0) st.msgT -= dt; if (st.flash > 0) st.flash -= dt;
    const gas = keys.ArrowUp ? 1 : keys.ArrowDown ? -1 : 0;
    if (gas) car.v += gas * 120 * dt; else car.v *= Math.pow(st.hold > 0 || st.nearSlot ? 0.002 : 0.03, dt);
    car.v = Math.max(-70, Math.min(100, car.v));
    const steer = (keys.ArrowLeft ? -1 : 0) + (keys.ArrowRight ? 1 : 0);
    // steering works even when barely moving, and stays gentle at speed
    if (Math.abs(car.v) > 1) car.a += steer * 2.0 * dt * Math.sign(car.v) * Math.max(0.55, Math.abs(car.v) / 100);
    const nx = car.x + Math.cos(car.a) * car.v * dt, ny = car.y + Math.sin(car.a) * car.v * dt;
    const poly = corners(nx, ny, car.a, CL, CW);
    let hit = poly.some(([x, y]) => x < 6 || x > W - 6 || y < 6 || y > H - 6);
    if (!hit) hit = st.L.cars.some(([x, y, a]) => overlap(poly, corners(x, y, a, CL, CW)));
    if (!hit) hit = st.L.cones.some(([x, y]) => poly.some(([px, py]) => Math.hypot(px - x, py - y) < 10) || inside([x, y], poly));
    if (hit) { if (Math.abs(car.v) > 8) { st.bumps++; st.flash = .35; $('#pk-bumps', host).textContent = st.bumps; Sfx.play('bump'); } car.v = -car.v * .3; }
    else { car.x = nx; car.y = ny; }
    // parked: mostly inside the space, roughly straight, nearly stopped
    const S = st.L.slot; const slotPoly = corners(S.x, S.y, S.a, CL + 26, CW + 22); st.nearSlot = Math.hypot(car.x - S.x, car.y - S.y) < 40;
    const inSlot = corners(car.x, car.y, car.a, CL, CW).every(p => inside(p, slotPoly));
    let da = Math.abs(((car.a - S.a) % Math.PI + Math.PI) % Math.PI); da = Math.min(da, Math.PI - da);
    if (inSlot && da < 0.45 && Math.abs(car.v) < 20) { st.hold += dt; if (st.hold > 0.3) success(); } else st.hold = 0;
    $('#pk-time', host).textContent = st.time.toFixed(1);
  }
  function success() {
    st.done = true; Sfx.play('good');
    st.total = (st.total || 0) + st.time; const stars = st.bumps === 0 ? '★★★' : st.bumps < 3 ? '★★☆' : '★☆☆';
    if (st.level === 0) { ctx.stamp('Parked the car'); st.msg = 'Parked! Stamp earned.'; }
    else st.msg = `Parked! ${stars}`;
    st.msgT = 3;
    if (st.level < LEVELS.length - 1) { $('#pk-msg', host).textContent = `${stars} Next up: bonus level ${st.level + 2}`; setTimeout(() => load(st.level + 1), 1600); }
    else {
      $('#pk-msg', host).textContent = `All three parked! ${stars}`; Sfx.play('win');
      const t = Math.round(st.total); if (Passport.best('Park It (fastest seconds)', t, true)) window.App.Toast.show('New best time: ' + t + 's', 'gold');
      st.msg = 'Perfect. Now try it in a real minivan.'; st.msgT = 6;
    }
  }
  function draw() {
    const L = st.L, car = st.car;
    c.fillStyle = '#4b4f57'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; for (let x = 0; x < W; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    c.fillStyle = '#9cc985'; c.fillRect(0, 0, W, 8); c.fillRect(0, H - 8, W, 8); c.fillRect(0, 0, 8, H); c.fillRect(W - 8, 0, 8, H);
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2;
    L.cars.forEach(([x, y, a]) => { const p = corners(x, y, a, CL + 14, CW + 12); c.beginPath(); c.moveTo(...p[0]); c.lineTo(...p[1]); c.moveTo(...p[2]); c.lineTo(...p[3]); c.stroke(); });
    const S = L.slot, sp = corners(S.x, S.y, S.a, CL + 26, CW + 22); const pulse = .35 + Math.sin(performance.now() / 300) * .15;
    c.fillStyle = `rgba(255,209,102,${pulse})`; c.beginPath(); sp.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.fill(); c.strokeStyle = '#ffd166'; c.lineWidth = 3; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '800 22px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('P', S.x, S.y + 8);
    // dotted guide from the car to the space
    c.setLineDash([6, 10]); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(car.x, car.y); c.lineTo(S.x, S.y); c.stroke(); c.setLineDash([]);
    L.cones.forEach(([x, y]) => { c.fillStyle = '#ff7a1a'; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 3.5, 0, 7); c.fill(); });
    L.cars.forEach(([x, y, a, col]) => drawCar(x, y, a, col, false));
    drawCar(car.x, car.y, car.a, '#3a86ff', true);
    if (st.hold > 0) { c.fillStyle = '#fff'; c.font = '800 16px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('Hold it…', car.x, car.y - 30); }
    if (st.flash > 0) { c.fillStyle = `rgba(230,57,70,${st.flash})`; c.fillRect(0, 0, W, H); }
    if (st.msgT > 0 && st.msg) { c.fillStyle = 'rgba(20,33,61,.8)'; c.fillRect(W / 2 - 200, 20, 400, 44); c.fillStyle = '#fff'; c.font = '700 20px Fraunces, Georgia, serif'; c.textAlign = 'center'; c.fillText(st.msg, W / 2, 49); }
  }
  function drawCar(x, y, a, col, player) {
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-CL / 2 + 3, -CW / 2 + 3, CL, CW);
    c.fillStyle = col; roundRect(-CL / 2, -CW / 2, CL, CW, 5); c.fill();
    c.fillStyle = 'rgba(20,33,61,.7)'; roundRect(2, -CW / 2 + 3, 12, CW - 6, 3); c.fill(); roundRect(-14, -CW / 2 + 3, 9, CW - 6, 3); c.fill();
    c.fillStyle = player ? '#fff3c4' : 'rgba(255,255,255,.6)'; c.fillRect(CL / 2 - 3, -CW / 2 + 2, 3, 4); c.fillRect(CL / 2 - 3, CW / 2 - 6, 3, 4);
    c.fillStyle = '#e63946'; c.fillRect(-CL / 2, -CW / 2 + 2, 2, 4); c.fillRect(-CL / 2, CW / 2 - 6, 2, 4);
    if (player) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(CL / 2 + 4, 0); c.lineTo(CL / 2 - 2, -5); c.lineTo(CL / 2 - 2, 5); c.closePath(); c.fill(); }
    c.restore();
  }
  function roundRect(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
})();
