/* ARCADE | Manna Catch (canvas), Word Search, Bible Trivia */
(function () {
  'use strict';
  const { $, $$, el, shuffle, pick, fmtTime, Passport, Toast, Sfx } = window.App;
  const D = window.DATA;

  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    Manna.init();
    Words.init();
    Trivia.init();
  });

  function initTabs() {
    $$('.tab').forEach(t => t.addEventListener('click', () => {
      $$('.tab').forEach(x => x.setAttribute('aria-selected', x === t ? 'true' : 'false'));
      $$('.tab-panel').forEach(p => p.hidden = p.id !== t.getAttribute('aria-controls'));
      if (t.id !== 'tabbtn-manna') Manna.stop();
      Sfx.play('tap');
    }));
  }

  /* ================= MANNA CATCH ================= */
  const Manna = {
    W: 720, H: 480, DURATION: 45,
    init() {
      this.cv = $('#mc-canvas'); this.ctx = this.cv.getContext('2d');
      this.basketX = this.W / 2; this.keys = {};
      $('#mc-best').textContent = Passport.score('Manna Catch') || 0;
      $('#mc-start').addEventListener('click', () => this.start());
      const move = x => { const r = this.cv.getBoundingClientRect(); this.basketX = Math.max(45, Math.min(this.W - 45, (x - r.left) / r.width * this.W)); };
      this.cv.addEventListener('pointermove', e => move(e.clientX));
      this.cv.addEventListener('pointerdown', e => move(e.clientX));
      document.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { this.keys[e.key] = true; if (this.running) e.preventDefault(); } });
      document.addEventListener('keyup', e => { this.keys[e.key] = false; });
      this.drawIdle();
    },
    start() {
      this.items = []; this.score = 0; this.timeLeft = this.DURATION; this.running = true; this.spawnAcc = 0; this.elapsed = 0; this.last = performance.now();
      $('#mc-score').textContent = 0; $('#mc-time').textContent = this.DURATION; $('#mc-msg').textContent = ''; $('#mc-start').textContent = 'Restart';
      cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(t => this.loop(t));
    },
    stop() { this.running = false; cancelAnimationFrame(this.raf); },
    loop(t) {
      if (!this.running) return;
      const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; this.elapsed += dt;
      this.timeLeft -= dt;
      if (this.keys.ArrowLeft) this.basketX = Math.max(45, this.basketX - 420 * dt);
      if (this.keys.ArrowRight) this.basketX = Math.min(this.W - 45, this.basketX + 420 * dt);
      const rate = 0.9 - Math.min(0.5, this.elapsed / 90); // spawn interval shrinks over time
      this.spawnAcc += dt;
      while (this.spawnAcc > rate) { this.spawnAcc -= rate; this.items.push({ x: 30 + Math.random() * (this.W - 60), y: -20, v: 120 + Math.random() * 80 + this.elapsed * 3, gold: Math.random() < 0.12, r: 14, rot: Math.random() * 6 }); }
      this.items.forEach(it => { it.y += it.v * dt; it.rot += dt * 2; });
      const by = this.H - 60;
      this.items = this.items.filter(it => {
        if (it.y > by - 10 && it.y < by + 20 && Math.abs(it.x - this.basketX) < 48) { this.score += it.gold ? 5 : 1; Sfx.play(it.gold ? 'coin' : 'tap'); return false; }
        return it.y < this.H + 30;
      });
      $('#mc-score').textContent = this.score; $('#mc-time').textContent = Math.max(0, Math.ceil(this.timeLeft));
      this.draw();
      if (this.timeLeft <= 0) return this.finish();
      this.raf = requestAnimationFrame(tt => this.loop(tt));
    },
    finish() {
      this.running = false;
      const best = Passport.best('Manna Catch', this.score);
      $('#mc-best').textContent = Passport.score('Manna Catch');
      $('#mc-msg').textContent = best ? `New best: ${this.score} manna!` : `You gathered ${this.score} manna.`;
      this.draw(true); Sfx.play('win');
      Passport.stamp('arcade', 'Played Manna Catch');
    },
    drawIdle() {
      this.draw();
      const c = this.ctx; c.fillStyle = 'rgba(43,42,40,.75)'; c.font = '800 28px Nunito, sans-serif'; c.textAlign = 'center';
      c.fillText('Press Start to catch the manna', this.W / 2, this.H / 2);
    },
    draw(over) {
      const c = this.ctx, W = this.W, H = this.H;
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#bfdde6'); g.addColorStop(1, '#eef6f8');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = '#9cc985'; c.fillRect(0, H - 34, W, 34); c.fillStyle = '#78ad63'; c.fillRect(0, H - 34, W, 6);
      // clouds
      c.fillStyle = 'rgba(255,255,255,.85)'; [[90, 70, 42], [560, 110, 50], [330, 50, 32]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x, y, r, r * .45, 0, 0, 7); c.ellipse(x + r * .6, y - 8, r * .6, r * .4, 0, 0, 7); c.fill(); });
      // items
      (this.items || []).forEach(it => {
        c.save(); c.translate(it.x, it.y); c.rotate(Math.sin(it.rot) * .3);
        c.fillStyle = it.gold ? '#f2c94c' : '#f6e7c1'; c.strokeStyle = it.gold ? '#c9a24a' : '#d9b77a'; c.lineWidth = 2.5;
        c.beginPath(); c.ellipse(0, 0, it.r + 4, it.r - 2, 0, 0, 7); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(-4, -4, 5, 3, 0, 0, 7); c.fill();
        c.restore();
      });
      // basket
      const bx = this.basketX, by = H - 60;
      c.fillStyle = '#8f6b4a'; c.beginPath(); c.moveTo(bx - 48, by); c.lineTo(bx + 48, by); c.lineTo(bx + 36, by + 36); c.lineTo(bx - 36, by + 36); c.closePath(); c.fill();
      c.strokeStyle = '#6b4f36'; c.lineWidth = 3; for (let i = -36; i <= 36; i += 12) { c.beginPath(); c.moveTo(bx + i * 1.3, by); c.lineTo(bx + i, by + 36); c.stroke(); }
      c.strokeStyle = '#a0785a'; c.lineWidth = 5; c.beginPath(); c.arc(bx, by, 30, Math.PI, 0); c.stroke();
      c.fillStyle = '#6b4f36'; c.fillRect(bx - 50, by - 4, 100, 8);
      if (over) { c.fillStyle = 'rgba(43,42,40,.78)'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '700 40px Fraunces, Georgia, serif'; c.fillText('Time!', W / 2, H / 2 - 20); c.font = '800 22px Nunito, sans-serif'; c.fillText(`${this.score} manna gathered`, W / 2, H / 2 + 20); }
    }
  };

  /* ================= WORD SEARCH ================= */
  const Words = {
    N: 12, COUNT: 8,
    init() {
      $('#ws-new').addEventListener('click', () => this.newGame());
      const b = Passport.score('Word Search (fastest seconds)'); $('#ws-best').textContent = b ? fmtTime(b) : '--';
      this.newGame();
    },
    newGame() {
      clearInterval(this.timer); this.seconds = 0; $('#ws-time').textContent = '00:00'; this.started = false;
      this.words = pick(D.wordBank.filter(w => w.length <= this.N), this.COUNT);
      this.grid = Array.from({ length: this.N }, () => Array(this.N).fill(''));
      this.placed = [];
      const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
      this.words.forEach(w => {
        for (let tries = 0; tries < 300; tries++) {
          const [dr, dc] = dirs[Math.floor(Math.random() * 8)];
          const r0 = Math.floor(Math.random() * this.N), c0 = Math.floor(Math.random() * this.N);
          const r1 = r0 + dr * (w.length - 1), c1 = c0 + dc * (w.length - 1);
          if (r1 < 0 || r1 >= this.N || c1 < 0 || c1 >= this.N) continue;
          let ok = true;
          for (let i = 0; i < w.length; i++) { const ch = this.grid[r0 + dr * i][c0 + dc * i]; if (ch && ch !== w[i]) { ok = false; break; } }
          if (!ok) continue;
          for (let i = 0; i < w.length; i++) this.grid[r0 + dr * i][c0 + dc * i] = w[i];
          this.placed.push({ w, cells: Array.from({ length: w.length }, (_, i) => `${r0 + dr * i},${c0 + dc * i}`), found: false });
          break;
        }
      });
      // words that failed to place are dropped from the list so the game stays winnable
      this.words = this.placed.map(p => p.w);
      const A = 'ABCDEFGHIJKLMNOPRSTUVWY';
      for (let r = 0; r < this.N; r++) for (let c = 0; c < this.N; c++) if (!this.grid[r][c]) this.grid[r][c] = A[Math.floor(Math.random() * A.length)];
      this.render();
    },
    render() {
      const g = $('#ws-grid'); g.innerHTML = ''; g.style.gridTemplateColumns = `repeat(${this.N}, 1fr)`;
      for (let r = 0; r < this.N; r++) for (let c = 0; c < this.N; c++) g.append(el('div', { class: 'ws-cell', 'data-rc': `${r},${c}`, text: this.grid[r][c] }));
      const ul = $('#ws-words'); ul.innerHTML = ''; this.placed.forEach(p => ul.append(el('li', { text: p.w, 'data-w': p.w })));
      $('#ws-found').textContent = 0; $('#ws-found').nextSibling.textContent = '/' + this.placed.length;
      this.sel = null;
      g.onpointerdown = e => { const t = e.target.closest('.ws-cell'); if (!t) return; this.startTimer(); this.sel = { a: t.dataset.rc, b: t.dataset.rc }; this.paint(); g.setPointerCapture(e.pointerId); };
      g.onpointermove = e => { if (!this.sel) return; const t = document.elementFromPoint(e.clientX, e.clientY); const cell = t && t.closest('.ws-cell'); if (cell) { this.sel.b = cell.dataset.rc; this.paint(); } };
      g.onpointerup = () => { if (!this.sel) return; this.check(); this.sel = null; this.paint(); };
      g.onpointercancel = () => { this.sel = null; this.paint(); };
    },
    line() {
      if (!this.sel) return [];
      const [r0, c0] = this.sel.a.split(',').map(Number), [r1, c1] = this.sel.b.split(',').map(Number);
      const dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0);
      const len = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
      if (!(dr === 0 || dc === 0 || Math.abs(r1 - r0) === Math.abs(c1 - c0))) return [this.sel.a];
      return Array.from({ length: len + 1 }, (_, i) => `${r0 + dr * i},${c0 + dc * i}`);
    },
    paint() {
      const cells = new Set(this.line());
      $$('.ws-cell').forEach(c => c.classList.toggle('sel', cells.has(c.dataset.rc)));
    },
    check() {
      const cells = this.line(); const key = cells.join('|'), rev = cells.slice().reverse().join('|');
      const hit = this.placed.find(p => !p.found && (p.cells.join('|') === key || p.cells.join('|') === rev));
      if (!hit) { if (cells.length > 1) Sfx.play('bad'); return; }
      hit.found = true; Sfx.play('good');
      cells.forEach(rc => $(`.ws-cell[data-rc="${rc}"]`).classList.add('found'));
      $(`#ws-words li[data-w="${hit.w}"]`).classList.add('found');
      const n = this.placed.filter(p => p.found).length; $('#ws-found').textContent = n;
      if (n === this.placed.length) this.finish();
    },
    startTimer() { if (this.started) return; this.started = true; this.timer = setInterval(() => { this.seconds++; $('#ws-time').textContent = fmtTime(this.seconds); }, 1000); },
    finish() {
      clearInterval(this.timer); Sfx.play('win');
      const prevBest = Passport.score('Word Search (fastest seconds)');
      if (!prevBest || this.seconds < prevBest) { const p = Passport.get(); p.scores['Word Search (fastest seconds)'] = this.seconds; try { localStorage.setItem('church_passport_v1', JSON.stringify(p)); } catch (e) {} $('#ws-best').textContent = fmtTime(this.seconds); Toast.show('New fastest time!', 'gold'); }
      else Toast.show(`All words found in ${fmtTime(this.seconds)}.`);
      Passport.stamp('arcade', 'Completed a Word Search');
    }
  };

  /* ================= TRIVIA ================= */
  const Trivia = {
    ROUNDS: 10,
    init() {
      $('#tq-best').textContent = Passport.score('Bible Trivia') || 0;
      $('#tq-next').addEventListener('click', () => this.next());
      $('#tq-again').addEventListener('click', () => this.start());
      this.start();
    },
    start() {
      this.qs = pick(D.trivia, this.ROUNDS); this.i = 0; this.score = 0;
      $('#tq-done').classList.add('hidden'); $('#tq-game').classList.remove('hidden'); $('#tq-score').textContent = 0;
      this.show();
    },
    show() {
      const q = this.qs[this.i]; $('#tq-n').textContent = this.i + 1; $('#tq-q').textContent = q.q; $('#tq-feedback').textContent = ''; $('#tq-next').classList.add('hidden');
      const box = $('#tq-options'); box.innerHTML = '';
      q.a.forEach((opt, idx) => box.append(el('button', { class: 'option', type: 'button', text: opt, onclick: () => this.answer(idx) })));
    },
    answer(idx) {
      const q = this.qs[this.i]; const btns = $$('#tq-options .option'); btns.forEach(b => b.disabled = true);
      btns[q.c].classList.add('correct');
      if (idx === q.c) { this.score++; $('#tq-feedback').innerHTML = `Correct! <span class="verse-ref">${q.ref}</span>`; Sfx.play('good'); }
      else { btns[idx].classList.add('wrong'); $('#tq-feedback').innerHTML = `The answer is ${q.a[q.c]}. <span class="verse-ref">${q.ref}</span>`; Sfx.play('bad'); }
      $('#tq-score').textContent = this.score; $('#tq-next').classList.remove('hidden'); $('#tq-next').focus();
      if (this.i === this.ROUNDS - 1) $('#tq-next').textContent = 'See results'; else $('#tq-next').textContent = 'Next question';
    },
    next() { this.i++; if (this.i >= this.ROUNDS) return this.finish(); this.show(); },
    finish() {
      $('#tq-game').classList.add('hidden'); $('#tq-done').classList.remove('hidden');
      const s = this.score;
      $('#tq-emoji').textContent = s >= 9 ? '🏆' : s >= 6 ? '🌟' : '📚';
      $('#tq-title').textContent = s >= 9 ? 'Scholar of the Scriptures' : s >= 6 ? 'Well studied' : 'A good start';
      $('#tq-summary').textContent = `You answered ${s} of ${this.ROUNDS} correctly.`;
      if (Passport.best('Bible Trivia', s)) $('#tq-best').textContent = s;
      Sfx.play('win');
      Passport.stamp('arcade', 'Completed Bible Trivia');
    }
  };
})();
