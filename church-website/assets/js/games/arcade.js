/* ARCADE | Manna Catch, Word Search, Bible Trivia, Memory Match, in tabs. Stamps on finishing any game. */
(function () {
  'use strict';
  const { $, $$, el, esc, shuffle, pick, fmtTime, Passport, Toast, Sfx } = window.App; const D = window.DATA;
  let host, ctx, manna, timers = [];
  const T = fn => { const t = setInterval(fn, 1000); timers.push(t); return t; };

  window.Games.arcade = {
    mount(h, c) {
      host = h; ctx = c;
      host.innerHTML = `
        <div class="tabs" role="tablist">
          <button class="tab" role="tab" aria-selected="true" data-tab="manna">🍞 Manna Catch</button>
          <button class="tab" role="tab" aria-selected="false" data-tab="words">🔤 Word Search</button>
          <button class="tab" role="tab" aria-selected="false" data-tab="trivia">❓ Trivia</button>
          <button class="tab" role="tab" aria-selected="false" data-tab="memory">🐘 Memory</button>
        </div>
        <section class="tab-panel" data-panel="manna"></section>
        <section class="tab-panel" data-panel="words" hidden></section>
        <section class="tab-panel" data-panel="trivia" hidden></section>
        <section class="tab-panel" data-panel="memory" hidden></section>`;
      $$('.tab', host).forEach(t => t.addEventListener('click', () => { $$('.tab', host).forEach(x => x.setAttribute('aria-selected', x === t ? 'true' : 'false')); $$('.tab-panel', host).forEach(p => p.hidden = p.dataset.panel !== t.dataset.tab); if (t.dataset.tab !== 'manna') Manna.stop(); Sfx.play('tap'); }));
      Manna.init($('[data-panel="manna"]', host)); Words.init($('[data-panel="words"]', host)); Trivia.init($('[data-panel="trivia"]', host)); Memory.init($('[data-panel="memory"]', host));
    },
    unmount() { Manna.stop(); timers.forEach(clearInterval); timers = []; }
  };
  const stamp = label => ctx.stamp(label);

  /* ================= MANNA CATCH ================= */
  const Manna = {
    W: 720, H: 480, DURATION: 45, running: false,
    init(p) {
      p.innerHTML = `<div class="g-top"><p>Bread is falling from heaven. Drag the basket with your finger or mouse, or use <kbd>←</kbd> <kbd>→</kbd>. Golden manna is worth five. 45 seconds.</p>
        <div class="scoreboard"><div class="stat"><div class="label">Score</div><div class="value" id="mc-score">0</div></div><div class="stat"><div class="label">Time</div><div class="value" id="mc-time">45</div></div><div class="stat"><div class="label">Best</div><div class="value" id="mc-best">${Passport.score('Manna Catch') || 0}</div></div></div></div>
        <canvas class="game-canvas" id="mc-canvas" width="720" height="480" style="aspect-ratio:3/2"></canvas>
        <div class="btn-row" style="margin-top:12px"><button class="btn" type="button" id="mc-start">Start</button><span class="g-msg" id="mc-msg" style="margin:0"></span></div>`;
      this.cv = $('#mc-canvas', p); this.ctx = this.cv.getContext('2d'); this.basketX = this.W / 2; this.keys = {}; this.items = []; this.score = 0;
      $('#mc-start', p).addEventListener('click', () => this.start());
      const move = x => { const r = this.cv.getBoundingClientRect(); this.basketX = Math.max(45, Math.min(this.W - 45, (x - r.left) / r.width * this.W)); };
      this.cv.addEventListener('pointermove', e => move(e.clientX)); this.cv.addEventListener('pointerdown', e => move(e.clientX));
      this.kd = e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { this.keys[e.key] = true; if (this.running) e.preventDefault(); } }; this.ku = e => { this.keys[e.key] = false; };
      document.addEventListener('keydown', this.kd); document.addEventListener('keyup', this.ku);
      this.draw(); const c = this.ctx; c.fillStyle = 'rgba(43,42,40,.75)'; c.font = '800 26px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('Press Start to catch the manna', this.W / 2, this.H / 2);
    },
    start() { this.items = []; this.score = 0; this.timeLeft = this.DURATION; this.running = true; this.spawnAcc = 0; this.elapsed = 0; this.last = performance.now(); $('#mc-score', host).textContent = 0; $('#mc-msg', host).textContent = ''; $('#mc-start', host).textContent = 'Restart'; cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(t => this.loop(t)); },
    stop() { this.running = false; cancelAnimationFrame(this.raf); if (this.kd) { document.removeEventListener('keydown', this.kd); document.removeEventListener('keyup', this.ku); } },
    loop(t) {
      if (!this.running) return;
      const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; this.elapsed += dt; this.timeLeft -= dt;
      if (this.keys.ArrowLeft) this.basketX = Math.max(45, this.basketX - 420 * dt); if (this.keys.ArrowRight) this.basketX = Math.min(this.W - 45, this.basketX + 420 * dt);
      const rate = 0.9 - Math.min(0.5, this.elapsed / 90); this.spawnAcc += dt;
      while (this.spawnAcc > rate) { this.spawnAcc -= rate; this.items.push({ x: 30 + Math.random() * (this.W - 60), y: -20, v: 120 + Math.random() * 80 + this.elapsed * 3, gold: Math.random() < 0.12, r: 14, rot: Math.random() * 6 }); }
      this.items.forEach(it => { it.y += it.v * dt; it.rot += dt * 2; });
      const by = this.H - 60;
      this.items = this.items.filter(it => { if (it.y > by - 10 && it.y < by + 20 && Math.abs(it.x - this.basketX) < 48) { this.score += it.gold ? 5 : 1; Sfx.play(it.gold ? 'coin' : 'tap'); return false; } return it.y < this.H + 30; });
      $('#mc-score', host).textContent = this.score; $('#mc-time', host).textContent = Math.max(0, Math.ceil(this.timeLeft));
      this.draw(); if (this.timeLeft <= 0) return this.finish(); this.raf = requestAnimationFrame(tt => this.loop(tt));
    },
    finish() { this.running = false; const best = Passport.best('Manna Catch', this.score); $('#mc-best', host).textContent = Passport.score('Manna Catch'); $('#mc-msg', host).textContent = best ? `New best: ${this.score}!` : `You gathered ${this.score} manna.`; this.draw(true); Sfx.play('win'); stamp('Played Manna Catch'); },
    draw(over) {
      const c = this.ctx, W = this.W, H = this.H; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#bfdde6'); g.addColorStop(1, '#eef6f8'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = '#9cc985'; c.fillRect(0, H - 34, W, 34); c.fillStyle = '#78ad63'; c.fillRect(0, H - 34, W, 6);
      c.fillStyle = 'rgba(255,255,255,.85)'; [[90, 70, 42], [560, 110, 50], [330, 50, 32]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x, y, r, r * .45, 0, 0, 7); c.ellipse(x + r * .6, y - 8, r * .6, r * .4, 0, 0, 7); c.fill(); });
      (this.items || []).forEach(it => { c.save(); c.translate(it.x, it.y); c.rotate(Math.sin(it.rot) * .3); c.fillStyle = it.gold ? '#f2c94c' : '#f6e7c1'; c.strokeStyle = it.gold ? '#c9a24a' : '#d9b77a'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, 0, it.r + 4, it.r - 2, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(-4, -4, 5, 3, 0, 0, 7); c.fill(); c.restore(); });
      const bx = this.basketX, by = H - 60; c.fillStyle = '#8f6b4a'; c.beginPath(); c.moveTo(bx - 48, by); c.lineTo(bx + 48, by); c.lineTo(bx + 36, by + 36); c.lineTo(bx - 36, by + 36); c.closePath(); c.fill();
      c.strokeStyle = '#6b4f36'; c.lineWidth = 3; for (let i = -36; i <= 36; i += 12) { c.beginPath(); c.moveTo(bx + i * 1.3, by); c.lineTo(bx + i, by + 36); c.stroke(); }
      c.strokeStyle = '#a0785a'; c.lineWidth = 5; c.beginPath(); c.arc(bx, by, 30, Math.PI, 0); c.stroke(); c.fillStyle = '#6b4f36'; c.fillRect(bx - 50, by - 4, 100, 8);
      if (over) { c.fillStyle = 'rgba(43,42,40,.78)'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '700 40px Fraunces, Georgia, serif'; c.fillText('Time!', W / 2, H / 2 - 20); c.font = '800 22px Nunito, sans-serif'; c.fillText(`${this.score} manna gathered`, W / 2, H / 2 + 20); }
    }
  };

  /* ================= WORD SEARCH ================= */
  const Words = {
    N: 11, COUNT: 7,
    init(p) {
      this.p = p; p.innerHTML = `<div class="g-top"><p>Seven words hide in every direction. Press and drag across the letters.</p>
        <div class="scoreboard"><div class="stat"><div class="label">Found</div><div class="value"><span id="ws-found">0</span>/<span id="ws-total">7</span></div></div><div class="stat"><div class="label">Time</div><div class="value" id="ws-time">00:00</div></div></div></div>
        <div class="ws-wrap"><div class="ws-grid" id="ws-grid"></div><div><ul class="ws-words" id="ws-words"></ul><div class="btn-row" style="margin-top:12px"><button class="btn secondary sm" type="button" id="ws-new">New puzzle</button></div></div></div>`;
      $('#ws-new', p).addEventListener('click', () => this.newGame()); this.newGame();
    },
    newGame() {
      if (this.timer) clearInterval(this.timer); this.seconds = 0; $('#ws-time', this.p).textContent = '00:00'; this.started = false;
      const words = pick(D.wordBank.filter(w => w.length <= this.N), this.COUNT);
      this.grid = Array.from({ length: this.N }, () => Array(this.N).fill('')); this.placed = [];
      const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
      words.forEach(w => { for (let tries = 0; tries < 300; tries++) { const [dr, dc] = dirs[Math.floor(Math.random() * 8)]; const r0 = Math.floor(Math.random() * this.N), c0 = Math.floor(Math.random() * this.N); const r1 = r0 + dr * (w.length - 1), c1 = c0 + dc * (w.length - 1); if (r1 < 0 || r1 >= this.N || c1 < 0 || c1 >= this.N) continue; let ok = true; for (let i = 0; i < w.length; i++) { const ch = this.grid[r0 + dr * i][c0 + dc * i]; if (ch && ch !== w[i]) { ok = false; break; } } if (!ok) continue; for (let i = 0; i < w.length; i++) this.grid[r0 + dr * i][c0 + dc * i] = w[i]; this.placed.push({ w, cells: Array.from({ length: w.length }, (_, i) => `${r0 + dr * i},${c0 + dc * i}`), found: false }); break; } });
      const A = 'ABCDEFGHIJKLMNOPRSTUVWY'; for (let r = 0; r < this.N; r++) for (let c = 0; c < this.N; c++) if (!this.grid[r][c]) this.grid[r][c] = A[Math.floor(Math.random() * A.length)];
      this.render();
    },
    render() {
      const g = $('#ws-grid', this.p); g.innerHTML = ''; g.style.gridTemplateColumns = `repeat(${this.N}, 1fr)`;
      for (let r = 0; r < this.N; r++) for (let c = 0; c < this.N; c++) g.append(el('div', { class: 'ws-cell', 'data-rc': `${r},${c}`, text: this.grid[r][c] }));
      const ul = $('#ws-words', this.p); ul.innerHTML = ''; this.placed.forEach(pl => ul.append(el('li', { text: pl.w, 'data-w': pl.w })));
      $('#ws-found', this.p).textContent = 0; $('#ws-total', this.p).textContent = this.placed.length; this.sel = null;
      g.onpointerdown = e => { const t = e.target.closest('.ws-cell'); if (!t) return; this.startTimer(); this.sel = { a: t.dataset.rc, b: t.dataset.rc }; this.paint(); g.setPointerCapture(e.pointerId); };
      g.onpointermove = e => { if (!this.sel) return; const t = document.elementFromPoint(e.clientX, e.clientY); const cell = t && t.closest('.ws-cell'); if (cell) { this.sel.b = cell.dataset.rc; this.paint(); } };
      g.onpointerup = () => { if (!this.sel) return; this.check(); this.sel = null; this.paint(); }; g.onpointercancel = () => { this.sel = null; this.paint(); };
    },
    line() { if (!this.sel) return []; const [r0, c0] = this.sel.a.split(',').map(Number), [r1, c1] = this.sel.b.split(',').map(Number); const dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0); const len = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0)); if (!(dr === 0 || dc === 0 || Math.abs(r1 - r0) === Math.abs(c1 - c0))) return [this.sel.a]; return Array.from({ length: len + 1 }, (_, i) => `${r0 + dr * i},${c0 + dc * i}`); },
    paint() { const cells = new Set(this.line()); $$('.ws-cell', this.p).forEach(c => c.classList.toggle('sel', cells.has(c.dataset.rc))); },
    check() {
      const cells = this.line(); const key = cells.join('|'), rev = cells.slice().reverse().join('|');
      const hit = this.placed.find(pl => !pl.found && (pl.cells.join('|') === key || pl.cells.join('|') === rev));
      if (!hit) { if (cells.length > 1) Sfx.play('bad'); return; }
      hit.found = true; Sfx.play('good'); cells.forEach(rc => $(`.ws-cell[data-rc="${rc}"]`, this.p).classList.add('found')); $(`#ws-words li[data-w="${hit.w}"]`, this.p).classList.add('found');
      const nf = this.placed.filter(x => x.found).length; $('#ws-found', this.p).textContent = nf; if (nf === this.placed.length) this.finish();
    },
    startTimer() { if (this.started) return; this.started = true; this.timer = T(() => { this.seconds++; $('#ws-time', this.p).textContent = fmtTime(this.seconds); }); },
    finish() { clearInterval(this.timer); Sfx.play('win'); if (Passport.best('Word Search (fastest seconds)', this.seconds, true)) Toast.show('New fastest time: ' + fmtTime(this.seconds), 'gold'); else Toast.show(`All words found in ${fmtTime(this.seconds)}.`); stamp('Completed a Word Search'); }
  };

  /* ================= TRIVIA ================= */
  const Trivia = {
    ROUNDS: 10,
    init(p) {
      this.p = p; p.innerHTML = `<div class="g-top"><p>Ten questions about the Bible, St. Alphonsa, and the Syro-Malabar Church. Every answer comes with its reference.</p>
        <div class="scoreboard"><div class="stat"><div class="label">Question</div><div class="value"><span id="tq-n">1</span>/10</div></div><div class="stat"><div class="label">Correct</div><div class="value" id="tq-score">0</div></div><div class="stat"><div class="label">Best</div><div class="value" id="tq-best">${Passport.score('Bible Trivia') || 0}</div></div></div></div>
        <div id="tq-game"><h3 id="tq-q" style="margin:10px 0"></h3><div class="options" id="tq-options"></div><div class="g-msg" id="tq-feedback"></div><div class="btn-row" style="margin-top:8px"><button class="btn hidden" type="button" id="tq-next">Next question</button></div></div>
        <div id="tq-done" class="result hidden"><div class="big" id="tq-emoji">🏆</div><h3 id="tq-title"></h3><p id="tq-summary"></p><div class="btn-row" style="justify-content:center"><button class="btn" type="button" id="tq-again">Play again</button></div></div>`;
      $('#tq-next', p).addEventListener('click', () => this.next()); $('#tq-again', p).addEventListener('click', () => this.start()); this.start();
    },
    start() { this.qs = pick(D.trivia, this.ROUNDS); this.i = 0; this.score = 0; $('#tq-done', this.p).classList.add('hidden'); $('#tq-game', this.p).classList.remove('hidden'); $('#tq-score', this.p).textContent = 0; this.show(); },
    show() { const q = this.qs[this.i]; $('#tq-n', this.p).textContent = this.i + 1; $('#tq-q', this.p).textContent = q.q; $('#tq-feedback', this.p).textContent = ''; $('#tq-next', this.p).classList.add('hidden'); const box = $('#tq-options', this.p); box.innerHTML = ''; q.a.forEach((opt, idx) => box.append(el('button', { class: 'option', type: 'button', text: opt, onclick: () => this.answer(idx) }))); },
    answer(idx) {
      const q = this.qs[this.i]; const btns = $$('#tq-options .option', this.p); btns.forEach(b => b.disabled = true); btns[q.c].classList.add('correct');
      if (idx === q.c) { this.score++; $('#tq-feedback', this.p).innerHTML = `Correct! <span class="verse-ref">${esc(q.ref)}</span>`; Sfx.play('good'); } else { btns[idx].classList.add('wrong'); $('#tq-feedback', this.p).innerHTML = `The answer is ${esc(q.a[q.c])}. <span class="verse-ref">${esc(q.ref)}</span>`; Sfx.play('bad'); }
      $('#tq-score', this.p).textContent = this.score; const nx = $('#tq-next', this.p); nx.classList.remove('hidden'); nx.textContent = this.i === this.ROUNDS - 1 ? 'See results' : 'Next question'; nx.focus();
    },
    next() { this.i++; if (this.i >= this.ROUNDS) return this.finish(); this.show(); },
    finish() { $('#tq-game', this.p).classList.add('hidden'); $('#tq-done', this.p).classList.remove('hidden'); const s = this.score; $('#tq-emoji', this.p).textContent = s >= 9 ? '🏆' : s >= 6 ? '🌟' : '📚'; $('#tq-title', this.p).textContent = s >= 9 ? 'Scholar of the Scriptures' : s >= 6 ? 'Well studied' : 'A good start'; $('#tq-summary', this.p).textContent = `You answered ${s} of ${this.ROUNDS} correctly.`; if (Passport.best('Bible Trivia', s)) $('#tq-best', this.p).textContent = s; Sfx.play('win'); stamp('Completed Bible Trivia'); }
  };

  /* ================= MEMORY ================= */
  const Memory = {
    PAIRS: 8,
    init(p) {
      this.p = p; p.innerHTML = `<div class="g-top"><p>The animals boarded two by two. Flip the cards and find every pair.</p>
        <div class="scoreboard"><div class="stat"><div class="label">Pairs</div><div class="value"><span id="mm-pairs">0</span>/8</div></div><div class="stat"><div class="label">Moves</div><div class="value" id="mm-moves">0</div></div><div class="stat"><div class="label">Best</div><div class="value" id="mm-best">${Passport.score('Memory Match (fewest moves)') || '--'}</div></div></div></div>
        <div class="memory-grid" id="mm-grid"></div><div class="btn-row" style="margin-top:12px;justify-content:center"><button class="btn secondary sm" type="button" id="mm-new">Shuffle and restart</button></div>`;
      $('#mm-new', p).addEventListener('click', () => this.newGame()); this.newGame();
    },
    newGame() {
      const animals = pick(D.arkAnimals, this.PAIRS); this.deck = shuffle(animals.concat(animals)); this.open = []; this.moves = 0; this.matched = 0; this.lock = false;
      $('#mm-moves', this.p).textContent = 0; $('#mm-pairs', this.p).textContent = 0; const g = $('#mm-grid', this.p); g.innerHTML = '';
      this.deck.forEach((a, i) => { const card = el('button', { class: 'mcard', type: 'button', 'aria-label': 'Card ' + (i + 1), 'data-i': i }); card.innerHTML = `<div class="inner"><div class="face front">✝</div><div class="face back">${a}</div></div>`; card.addEventListener('click', () => this.flip(card)); g.append(card); });
    },
    flip(card) {
      if (this.lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
      card.classList.add('flipped'); Sfx.play('tap'); this.open.push(card); if (this.open.length < 2) return;
      this.moves++; $('#mm-moves', this.p).textContent = this.moves; const [a, b] = this.open;
      if (this.deck[a.dataset.i] === this.deck[b.dataset.i]) { a.classList.add('matched'); b.classList.add('matched'); this.open = []; this.matched++; $('#mm-pairs', this.p).textContent = this.matched; Sfx.play('good'); if (this.matched === this.PAIRS) this.finish(); }
      else { this.lock = true; setTimeout(() => { a.classList.remove('flipped'); b.classList.remove('flipped'); this.open = []; this.lock = false; }, 800); }
    },
    finish() { Sfx.play('win'); if (Passport.best('Memory Match (fewest moves)', this.moves, true)) { $('#mm-best', this.p).textContent = this.moves; Toast.show('New best: ' + this.moves + ' moves.', 'gold'); } else Toast.show('Every animal is aboard in ' + this.moves + ' moves.'); stamp("Won Noah's Ark Memory Match"); }
  };
})();
