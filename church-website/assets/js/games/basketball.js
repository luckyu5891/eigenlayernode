/* HOOPS | flick-to-shoot basketball. 60 seconds, the hoop moves after each basket. */
(function () {
  'use strict';
  const { $, Passport, Sfx } = window.App;
  const W = 720, H = 480, FLOOR = H - 40, G = 1100, R = 14;
  let cv, c, host, ctx, raf, last, state;

  window.Games.basketball = {
    mount(h, cx) {
      host = h; ctx = cx;
      host.innerHTML = `<div class="g-top"><p>Flick the ball toward the hoop: press, drag in the direction of the shot, release. Longer drags shoot harder. Shots from behind the arc count three.</p>
        <div class="scoreboard"><div class="stat"><div class="label">Points</div><div class="value" id="bb-score">0</div></div><div class="stat"><div class="label">Time</div><div class="value" id="bb-time">60</div></div><div class="stat"><div class="label">Best</div><div class="value" id="bb-best">${Passport.score('Hoops') || 0}</div></div></div></div>
        <canvas class="game-canvas" id="bb-canvas" width="720" height="480" style="aspect-ratio:3/2"></canvas>
        <div class="btn-row" style="margin-top:12px"><button class="btn" type="button" id="bb-start">Start</button><span class="g-msg" id="bb-msg" style="margin:0"></span></div>`;
      cv = $('#bb-canvas', host); c = cv.getContext('2d');
      $('#bb-start', host).addEventListener('click', start);
      wire(); reset(false); draw();
      c.fillStyle = 'rgba(20,33,61,.8)'; c.font = '800 26px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('Press Start, then flick to shoot', W / 2, H / 2 - 40);
    },
    unmount() { cancelAnimationFrame(raf); if (state) state.running = false; }
  };

  function launchSpeed(len) { const pw = Math.min(len, 260) / 260; return 400 + pw * 500; }
  function reset(running) {
    state = { running, score: 0, time: 60, ball: newBall(), hoop: { x: 585, y: 215 }, drag: null, trail: [], flash: 0, made: 0, shots: 0, msg: '' };
  }
  function newBall() { return { x: 120 + Math.random() * 160, y: FLOOR - R, vx: 0, vy: 0, live: false, scored: false, above: false, rest: 0, threePt: false }; }
  function start() { reset(true); last = performance.now(); $('#bb-msg', host).textContent = ''; $('#bb-start', host).textContent = 'Restart'; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
  function toLocal(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
  function wire() {
    cv.addEventListener('pointerdown', e => { if (!state.running || state.ball.live) return; cv.setPointerCapture(e.pointerId); state.drag = { a: toLocal(e), b: toLocal(e) }; });
    cv.addEventListener('pointermove', e => { if (state.drag) state.drag.b = toLocal(e); });
    const up = e => {
      if (!state.drag) return; const d = state.drag; state.drag = null;
      const dx = d.b[0] - d.a[0], dy = d.b[1] - d.a[1]; const len = Math.hypot(dx, dy); if (len < 12) return;
      const speed = launchSpeed(len);
      state.ball.vx = dx / len * speed; state.ball.vy = dy / len * speed; state.ball.live = true; state.ball.threePt = state.ball.x < 250; state.shots++; state.trail = []; Sfx.play('whoosh');
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { state.drag = null; });
  }
  function loop(t) {
    if (!state.running) return;
    const dt = Math.min(0.033, (t - last) / 1000); last = t; state.time -= dt;
    step(dt); draw();
    $('#bb-score', host).textContent = state.score; $('#bb-time', host).textContent = Math.max(0, Math.ceil(state.time));
    if (state.time <= 0) return finish();
    raf = requestAnimationFrame(loop);
  }
  function step(dt) {
    const b = state.ball, hp = state.hoop; if (state.flash > 0) state.flash -= dt;
    if (!b.live) return;
    b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (state.trail.length === 0 || Math.hypot(b.x - state.trail[state.trail.length - 1][0], b.y - state.trail[state.trail.length - 1][1]) > 14) state.trail.push([b.x, b.y]);
    if (state.trail.length > 18) state.trail.shift();
    // floor
    if (b.y + R > FLOOR) { b.y = FLOOR - R; b.vy = -b.vy * .55; b.vx *= .8; if (Math.abs(b.vy) < 40) { b.vy = 0; b.rest += dt; } }
    // walls
    if (b.x - R < 0) { b.x = R; b.vx = -b.vx * .6; } if (b.x + R > W) { b.x = W - R; b.vx = -b.vx * .6; }
    // backboard: vertical plane at hp.x + 44, from hp.y - 70 to hp.y + 10
    const bbx = hp.x + 44; if (b.x + R > bbx && b.x < bbx + 10 && b.y > hp.y - 70 && b.y < hp.y + 12 && b.vx > 0) { b.x = bbx - R; b.vx = -b.vx * .5; Sfx.play('bump'); }
    // rim: two end points, circle collisions
    [[hp.x, hp.y], [hp.x + 44, hp.y]].forEach(([rx, ry]) => { const dx = b.x - rx, dy = b.y - ry, dist = Math.hypot(dx, dy); if (dist < R + 3 && dist > 0) { const nx = dx / dist, ny = dy / dist; const dot = b.vx * nx + b.vy * ny; if (dot < 0) { b.vx -= 1.6 * dot * nx; b.vy -= 1.6 * dot * ny; b.vx *= .8; b.vy *= .8; } b.x = rx + nx * (R + 3); b.y = ry + ny * (R + 3); } });
    // scoring: pass downward through the rim span
    if (b.y < hp.y - 4) b.above = true;
    if (!b.scored && b.above && b.vy > 0 && b.y > hp.y && b.y < hp.y + 18 && b.x > hp.x + 4 && b.x < hp.x + 40) {
      b.scored = true; const pts = b.threePt ? 3 : 2; state.score += pts; state.made++; state.flash = .6; state.msg = pts === 3 ? 'Three!' : 'Swish!'; Sfx.play('swish');
      setTimeout(() => { state.hoop = { x: 470 + Math.random() * 150, y: 165 + Math.random() * 100 }; }, 300);
    }
    if (b.rest > .5 || b.y > H + 60 || (b.scored && b.y > FLOOR - R - 1) || (b.live && b.y + R >= FLOOR && Math.abs(b.vx) < 8 && Math.abs(b.vy) < 8)) { if (!b.scored && b.live) state.msg = ['So close', 'Try a softer touch', 'Follow through', 'Almost'][Math.floor(Math.random() * 4)]; state.ball = newBall(); state.trail = []; }
  }
  function finish() {
    state.running = false; draw(true);
    const best = Passport.best('Hoops', state.score); $('#bb-best', host).textContent = Passport.score('Hoops');
    $('#bb-msg', host).textContent = best ? `New best: ${state.score} points!` : `${state.score} points, ${state.made} of ${state.shots} shots.`;
    Sfx.play('win'); ctx.stamp('Played Hoops');
  }
  function draw(over) {
    const hp = state.hoop, b = state.ball;
    const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1f3358'); sky.addColorStop(.6, '#5d86c4'); sky.addColorStop(1, '#a9c8e8'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
    // distant church silhouette
    c.fillStyle = 'rgba(20,33,61,.35)'; c.beginPath(); c.moveTo(40, FLOOR - 80); c.lineTo(40, FLOOR - 140); c.lineTo(110, FLOOR - 180); c.lineTo(180, FLOOR - 140); c.lineTo(180, FLOOR - 80); c.closePath(); c.fill(); c.fillRect(107, FLOOR - 205, 6, 26); c.fillRect(98, FLOOR - 196, 24, 6);
    // court
    c.fillStyle = '#e8843f'; c.fillRect(0, FLOOR, W, H - FLOOR); c.fillStyle = '#c9632f'; c.fillRect(0, FLOOR, W, 6);
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(250, FLOOR); c.lineTo(250, FLOOR + 40); c.stroke(); c.font = '800 12px Nunito, sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('3 PT', 250, FLOOR + 30);
    // pole, backboard, rim, net
    c.fillStyle = '#4b4f57'; c.fillRect(hp.x + 60, hp.y - 30, 10, FLOOR - hp.y + 30); c.fillRect(hp.x + 50, hp.y - 40, 20, 8);
    c.fillStyle = '#f4f4f4'; c.fillRect(hp.x + 44, hp.y - 70, 8, 82); c.strokeStyle = '#c33'; c.lineWidth = 2; c.strokeRect(hp.x + 44, hp.y - 40, 8, 30);
    c.strokeStyle = '#ff7a1a'; c.lineWidth = 4; c.beginPath(); c.moveTo(hp.x, hp.y); c.lineTo(hp.x + 44, hp.y); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.5; for (let i = 0; i <= 5; i++) { const x0 = hp.x + i * 8.8, x1 = hp.x + 8 + i * 5.6; c.beginPath(); c.moveTo(x0, hp.y + 2); c.lineTo(x1, hp.y + 34); c.stroke(); } for (let k = 1; k <= 3; k++) { c.beginPath(); c.moveTo(hp.x + k * 3, hp.y + k * 11); c.lineTo(hp.x + 44 - k * 3, hp.y + k * 11); c.stroke(); }
    if (state.flash > 0) { c.fillStyle = `rgba(255,209,102,${state.flash})`; c.beginPath(); c.arc(hp.x + 22, hp.y, 40 + (0.6 - state.flash) * 60, 0, 7); c.fill(); }
    // trail
    state.trail.forEach(([x, y], i) => { c.fillStyle = `rgba(255,255,255,${i / state.trail.length * .5})`; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); });
    // aim preview
    if (state.drag) { const dx = state.drag.b[0] - state.drag.a[0], dy = state.drag.b[1] - state.drag.a[1]; const len = Math.hypot(dx, dy); if (len > 12) { const sp = launchSpeed(len); let px = b.x, py = b.y, vx = dx / len * sp, vy = dy / len * sp; c.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 22; i++) { vy += G * .04; px += vx * .04; py += vy * .04; if (py > FLOOR) break; c.beginPath(); c.arc(px, py, 3 - i * .1, 0, 7); c.fill(); } } }
    // ball
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(b.x, FLOOR - 2, R * (1 - Math.min(.6, (FLOOR - b.y) / 600)), 4, 0, 0, 7); c.fill();
    c.fillStyle = '#ff7a1a'; c.beginPath(); c.arc(b.x, b.y, R, 0, 7); c.fill(); c.strokeStyle = '#8a3d0e'; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); c.moveTo(b.x - R, b.y); c.lineTo(b.x + R, b.y); c.moveTo(b.x, b.y - R); c.lineTo(b.x, b.y + R); c.stroke(); c.beginPath(); c.arc(b.x - R * .9, b.y, R * .8, -1, 1); c.stroke(); c.beginPath(); c.arc(b.x + R * .9, b.y, R * .8, Math.PI - 1, Math.PI + 1); c.stroke();
    // message
    if (state.msg) { c.fillStyle = '#fff'; c.font = '700 22px Fraunces, Georgia, serif'; c.textAlign = 'center'; c.fillText(state.msg, W / 2, 50); }
    if (over) { c.fillStyle = 'rgba(20,33,61,.8)'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '700 40px Fraunces, Georgia, serif'; c.fillText('Buzzer!', W / 2, H / 2 - 20); c.font = '800 22px Nunito, sans-serif'; c.fillText(`${state.score} points`, W / 2, H / 2 + 20); }
  }
})();
