/* =====================================================================
   COMMON  |  Header/footer, passport progress, toasts, modal, sounds.
   Loaded on every page after config.js and data.js.
   ===================================================================== */
(function () {
  'use strict';

  const C = window.CHURCH;
  const D = window.DATA;
  const STORE_KEY = 'church_passport_v1';
  const HUNT_KEY = 'church_hunt_v1';
  const SOUND_KEY = 'church_sound';

  /* ---------- small helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const el = (tag, attrs, children) => {
    const n = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    (children || []).forEach(c => n.append(c));
    return n;
  };
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (arr, n) => shuffle(arr).slice(0, n);
  const pad = n => String(n).padStart(2, '0');
  const fmtTime = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

  function safeGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode etc. */ }
  }

  /* ---------- Passport (progress) ---------- */
  const Passport = {
    get() { return safeGet(STORE_KEY, { stamps: {}, scores: {} }); },
    has(id) { return !!this.get().stamps[id]; },
    stamp(id, label) {
      const p = this.get();
      if (p.stamps[id]) return false;
      p.stamps[id] = { at: Date.now(), label: label || '' };
      safeSet(STORE_KEY, p);
      updateHeaderCount();
      Toast.show(`Passport stamped: ${buildingName(id)}`, 'gold');
      Sfx.play('stamp');
      if (this.count() === D.buildings.length) setTimeout(() => Toast.show('All six stamps collected. Open your Passport for the certificate.', 'gold', 5000), 1200);
      return true;
    },
    count() { return Object.keys(this.get().stamps).length; },
    best(key, value) {
      const p = this.get();
      const prev = p.scores[key];
      if (prev === undefined || value > prev) { p.scores[key] = value; safeSet(STORE_KEY, p); return true; }
      return false;
    },
    score(key) { return this.get().scores[key]; },
    reset() { try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(HUNT_KEY); } catch (e) {} updateHeaderCount(); }
  };

  /* ---------- Treasure hunt state (shared by tower + map) ---------- */
  const Hunt = {
    get() { return safeGet(HUNT_KEY, { active: false, step: 0, found: [] }); },
    set(s) { safeSet(HUNT_KEY, s); },
    start() { this.set({ active: true, step: 0, found: [] }); },
    stop() { const s = this.get(); s.active = false; this.set(s); },
    current() { const s = this.get(); return D.hunt[s.step] || null; },
    complete() { return this.get().step >= D.hunt.length; },
    tryBuilding(id) {
      const s = this.get();
      const cur = D.hunt[s.step];
      if (!s.active || !cur) return { ok: false, done: true };
      if (cur.target !== id) return { ok: false, clue: cur };
      s.found.push({ target: id, item: cur.item, emoji: cur.emoji, word: cur.word });
      s.step += 1;
      const done = s.step >= D.hunt.length;
      if (done) { s.active = false; }
      this.set(s);
      if (done) Passport.stamp('tower', 'Completed the Treasure Hunt');
      return { ok: true, found: cur, done, next: D.hunt[s.step] || null };
    }
  };

  function buildingName(id) { const b = D.buildings.find(x => x.id === id); return b ? b.name : id; }
  function building(id) { return D.buildings.find(x => x.id === id); }

  /* ---------- Toast ---------- */
  const Toast = {
    host: null,
    show(msg, kind, ms) {
      if (!this.host) { this.host = el('div', { class: 'toast-host', 'aria-live': 'polite' }); document.body.append(this.host); }
      const t = el('div', { class: 'toast' + (kind ? ' ' + kind : ''), text: msg });
      this.host.append(t);
      setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 320); }, ms || 2600);
    }
  };

  /* ---------- Modal ---------- */
  const Modal = {
    node: null,
    open(html, opts) {
      opts = opts || {};
      this.close();
      const dialog = el('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true' });
      dialog.innerHTML = html;
      const close = el('button', { class: 'close', 'aria-label': 'Close', text: '✕', onclick: () => this.close() });
      dialog.prepend(close);
      this.node = el('div', { class: 'modal' }, [dialog]);
      this.node.addEventListener('click', e => { if (e.target === this.node && !opts.sticky) this.close(); });
      document.body.append(this.node);
      document.addEventListener('keydown', this._esc);
      const focusable = dialog.querySelector('button:not(.close), a, input');
      (focusable || close).focus();
      return dialog;
    },
    close() { if (this.node) { this.node.remove(); this.node = null; document.removeEventListener('keydown', this._esc); } },
    _esc(e) { if (e.key === 'Escape') Modal.close(); }
  };

  /* ---------- Tiny sound effects (WebAudio, no files) ---------- */
  const Sfx = {
    ctx: null,
    enabled() { return safeGet(SOUND_KEY, true); },
    toggle() { const v = !this.enabled(); safeSet(SOUND_KEY, v); return v; },
    play(name) {
      if (!this.enabled()) return;
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this.ctx;
        const notes = {
          tap: [[660, 0, .06]],
          good: [[523, 0, .09], [659, .09, .09], [784, .18, .14]],
          bad: [[220, 0, .12], [180, .12, .16]],
          stamp: [[392, 0, .1], [523, .1, .1], [659, .2, .1], [1046, .3, .25]],
          coin: [[988, 0, .06], [1319, .06, .12]],
          win: [[523, 0, .12], [659, .12, .12], [784, .24, .12], [1046, .36, .3]]
        }[name] || [[440, 0, .08]];
        notes.forEach(([f, t, d]) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'triangle'; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + t + .01);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + d);
          o.connect(g); g.connect(ctx.destination);
          o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d + .02);
        });
      } catch (e) { /* audio unavailable */ }
    }
  };

  /* ---------- Verse of the day ---------- */
  function verseOfDay() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((now - start) / 86400000);
    return D.dailyVerses[day % D.dailyVerses.length];
  }

  /* ---------- Header & footer ---------- */
  function updateHeaderCount() {
    const n = $('#passport-count'); if (n) n.textContent = `${Passport.count()}/${D.buildings.length}`;
  }

  function renderChrome() {
    const page = document.body.dataset.page || '';
    const header = el('header', { class: 'site-header' });
    header.innerHTML = `
      <div class="wrap">
        <a class="brand" href="index.html" aria-label="${C.name} home">
          <span class="brand-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3v18M7 8h10"/></svg>
          </span>
          <span><span class="brand-name">${C.name}</span><br><span class="brand-tag">${C.tagline}</span></span>
        </a>
        <nav class="nav" aria-label="Main">
          <a href="index.html" class="${page === 'index' ? 'active' : ''}">Campus Map</a>
          <a href="welcome.html" class="${page === 'welcome' ? 'active' : ''}">Visit</a>
          <button type="button" id="passport-btn">Passport <span class="pill-count" id="passport-count">0/6</span></button>
          <button type="button" id="sound-btn" aria-label="Toggle sound" title="Toggle sound">${Sfx.enabled() ? '🔊' : '🔇'}</button>
        </nav>
      </div>`;
    document.body.prepend(header);

    const footer = el('footer', { class: 'site-footer' });
    footer.innerHTML = `
      <div class="wrap">
        <div><strong>${C.name}</strong> · ${C.address} · ${C.phone}</div>
        <div><a href="index.html">Campus Map</a> · <a href="welcome.html">Plan a Visit</a> · <a href="garden.html">Prayer Wall</a></div>
      </div>`;
    document.body.append(footer);

    $('#passport-btn').addEventListener('click', openPassport);
    $('#sound-btn').addEventListener('click', e => { const on = Sfx.toggle(); e.currentTarget.textContent = on ? '🔊' : '🔇'; if (on) Sfx.play('tap'); });
    updateHeaderCount();

    $$('[data-church]').forEach(n => { const k = n.dataset.church; if (C[k] !== undefined) n.textContent = C[k]; });
    document.title = document.title.replace('{church}', C.name);
  }

  function openPassport() {
    const p = Passport.get();
    const stamps = D.buildings.map(b => {
      const done = !!p.stamps[b.id];
      return `<div class="stamp ${done ? 'done' : ''}" title="${done ? 'Stamped' : 'Not yet'}"><span><span class="ico">${done ? b.icon : '·'}</span>${b.name}</span></div>`;
    }).join('');
    const all = Passport.count() === D.buildings.length;
    const scores = Object.entries(p.scores).map(([k, v]) => `<li><strong>${k.replace(' (fastest seconds)', ' (fastest time)')}</strong>: ${/seconds/.test(k) ? fmtTime(v) : v}</li>`).join('');
    Modal.open(`
      <h2>Campus Passport</h2>
      <p class="muted">Finish an activity in each building to earn its stamp. Progress is saved on this device.</p>
      <div class="passport-grid">${stamps}</div>
      <div class="progress" aria-label="Passport progress"><span style="width:${(Passport.count() / D.buildings.length) * 100}%"></span></div>
      ${all ? `<div class="card sand" style="margin-top:16px"><h3>Certificate of Exploration</h3><p>This certifies that you have explored every corner of ${C.name}. Show this screen at the Welcome Center on Sunday to claim a small gift.</p><p class="verse">Well done, good and faithful servant.<br><span class="verse-ref">Matthew 25:23</span></p></div>` : ''}
      ${scores ? `<div class="divider"></div><h3>Best scores</h3><ul>${scores}</ul>` : ''}
      <div class="btn-row" style="margin-top:16px">
        <a class="btn" href="index.html">Back to the map</a>
        <button class="btn ghost sm" type="button" id="passport-reset">Reset progress</button>
      </div>`);
    $('#passport-reset').addEventListener('click', () => { if (confirm('Clear all stamps and scores on this device?')) { Passport.reset(); Modal.close(); Toast.show('Passport cleared.'); } });
  }

  /* ---------- Expose ---------- */
  window.App = { $, $$, el, shuffle, pick, fmtTime, Passport, Hunt, Toast, Modal, Sfx, verseOfDay, buildingName, building, openPassport };

  document.addEventListener('DOMContentLoaded', renderChrome);
})();
