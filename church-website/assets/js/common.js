/* =====================================================================
   COMMON  |  helpers, passport, toasts, modal, sounds, header/footer.
   ===================================================================== */
(function () {
  'use strict';
  const C = window.CHURCH, D = window.DATA;
  const STORE_KEY = 'sa_passport_v2', HUNT_KEY = 'sa_hunt_v2', SOUND_KEY = 'sa_sound';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, attrs, children) => {
    const n = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') n.className = v; else if (k === 'html') n.innerHTML = v; else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
    });
    (children || []).forEach(c => n.append(c));
    return n;
  };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a, n) => shuffle(a).slice(0, n);
  const pad = n => String(n).padStart(2, '0');
  const fmtTime = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const item = id => D.items.find(i => i.id === id);
  function safeGet(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } }
  function safeSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- Passport ---------- */
  const Passport = {
    get() { return safeGet(STORE_KEY, { stamps: {}, scores: {} }); },
    has(id) { return !!this.get().stamps[id]; },
    count() { return Object.keys(this.get().stamps).length; },
    stamp(id, label) {
      const p = this.get(); if (p.stamps[id]) return false;
      p.stamps[id] = { at: Date.now(), label: label || '' }; safeSet(STORE_KEY, p);
      document.dispatchEvent(new CustomEvent('passport:change'));
      Toast.show(`Passport stamped: ${item(id).name}`, 'gold'); Sfx.play('stamp');
      if (this.count() === D.items.length) setTimeout(() => Toast.show('All five stamps! Open your Passport for the certificate.', 'gold', 5000), 1400);
      return true;
    },
    best(key, value, lowerIsBetter) {
      const p = this.get(); const prev = p.scores[key];
      const better = prev === undefined || (lowerIsBetter ? value < prev : value > prev);
      if (better) { p.scores[key] = value; safeSet(STORE_KEY, p); }
      return better;
    },
    score(key) { return this.get().scores[key]; },
    reset() { try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(HUNT_KEY); } catch (e) {} document.dispatchEvent(new CustomEvent('passport:change')); }
  };

  /* ---------- Treasure hunt state ---------- */
  const Hunt = {
    get() { return safeGet(HUNT_KEY, { active: false, step: 0 }); },
    set(s) { safeSet(HUNT_KEY, s); document.dispatchEvent(new CustomEvent('hunt:change')); },
    start() { const s = this.get(); if (s.step >= D.hunt.length) s.step = 0; s.active = true; this.set(s); },
    stop() { const s = this.get(); s.active = false; this.set(s); },
    reset() { this.set({ active: false, step: 0 }); },
    current() { return D.hunt[this.get().step] || null; },
    complete() { return this.get().step >= D.hunt.length; },
    tryItem(id) {
      const s = this.get(); const cur = D.hunt[s.step];
      if (!s.active || !cur) return { ok: false, done: true };
      if (cur.target !== id) return { ok: false, clue: cur };
      s.step += 1; const done = s.step >= D.hunt.length; if (done) s.active = false; this.set(s);
      if (done) Passport.stamp('church', 'Completed the Treasure Hunt');
      return { ok: true, found: cur, done, next: D.hunt[s.step] || null, step: s.step };
    }
  };

  /* ---------- Toast ---------- */
  const Toast = {
    host: null,
    show(msg, kind, ms) {
      if (!this.host) { this.host = el('div', { class: 'toast-host', 'aria-live': 'polite' }); document.body.append(this.host); }
      const t = el('div', { class: 'toast' + (kind ? ' ' + kind : ''), text: msg }); this.host.append(t);
      setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 320); }, ms || 2600);
    }
  };

  /* ---------- Modal ---------- */
  const Modal = {
    node: null,
    open(html, opts) {
      opts = opts || {}; this.close();
      const dialog = el('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true' }); dialog.innerHTML = html;
      const close = el('button', { class: 'close', 'aria-label': 'Close', text: '✕', onclick: () => this.close() }); dialog.prepend(close);
      this.node = el('div', { class: 'modal' }, [dialog]);
      this.node.addEventListener('click', e => { if (e.target === this.node && !opts.sticky) this.close(); });
      document.body.append(this.node); document.addEventListener('keydown', this._esc);
      (dialog.querySelector('button:not(.close), a') || close).focus();
      return dialog;
    },
    close() { if (this.node) { this.node.remove(); this.node = null; document.removeEventListener('keydown', this._esc); } },
    _esc(e) { if (e.key === 'Escape') Modal.close(); }
  };

  /* ---------- Sound effects (WebAudio, no files) ---------- */
  const Sfx = {
    ctx: null,
    enabled() { return safeGet(SOUND_KEY, true); },
    toggle() { const v = !this.enabled(); safeSet(SOUND_KEY, v); return v; },
    play(name) {
      if (!this.enabled()) return;
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this.ctx; if (ctx.state === 'suspended') ctx.resume();
        const notes = {
          tap: [[660, 0, .06]], good: [[523, 0, .09], [659, .09, .09], [784, .18, .14]], bad: [[220, 0, .12], [180, .12, .16]],
          stamp: [[392, 0, .1], [523, .1, .1], [659, .2, .1], [1046, .3, .25]], coin: [[988, 0, .06], [1319, .06, .12]],
          win: [[523, 0, .12], [659, .12, .12], [784, .24, .12], [1046, .36, .3]], swish: [[900, 0, .05], [1400, .05, .1]],
          bump: [[120, 0, .1]], splash: [[300, 0, .08], [200, .06, .12]], whoosh: [[400, 0, .12]]
        }[name] || [[440, 0, .08]];
        notes.forEach(([f, t, d]) => {
          const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + t + .01); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + d);
          o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d + .02);
        });
      } catch (e) {}
    }
  };

  /* ---------- Header / footer / passport UI ---------- */
  function renderChrome() {
    const header = el('header', { class: 'site-header' });
    header.innerHTML = `
      <div class="wrap">
        <a class="brand" href="#top" aria-label="${esc(C.name)}">
          <span class="brand-mark"><img src="${C.images.logo}" alt="" onerror="this.remove()"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3v18M7 8h10"/></svg></span>
          <span class="brand-text"><span class="brand-name"><span class="full">${esc(C.name)}</span><span class="short">${esc(C.shortName)}</span></span><span class="brand-tag">${esc(C.address)}</span></span>
        </a>
        <nav class="nav" aria-label="Main">
          <a href="#places">Explore</a>
          <a href="#visit">Visit</a>
          ${C.donateUrl ? `<a href="${esc(C.donateUrl)}" target="_blank" rel="noopener" class="donate">${esc(C.donateLabel)}</a>` : ''}
          <button type="button" id="passport-btn">Passport <span class="pill-count" id="passport-count">0/5</span></button>
          <button type="button" id="sound-btn" aria-label="Toggle sound" title="Toggle sound">${Sfx.enabled() ? '🔊' : '🔇'}</button>
        </nav>
      </div>`;
    document.body.prepend(header);
    $('#passport-btn').addEventListener('click', openPassport);
    $('#sound-btn').addEventListener('click', e => { const on = Sfx.toggle(); e.currentTarget.textContent = on ? '🔊' : '🔇'; if (on) Sfx.play('tap'); });
    updateCount(); document.addEventListener('passport:change', updateCount);
    document.title = document.title.replace('{church}', C.name);
  }
  function updateCount() { const n = $('#passport-count'); if (n) n.textContent = `${Passport.count()}/${D.items.length}`; }

  function openPassport() {
    const p = Passport.get(); const all = Passport.count() === D.items.length;
    const stamps = D.items.map(i => `<div class="stamp ${p.stamps[i.id] ? 'done' : ''}"><span><span class="ico">${p.stamps[i.id] ? i.icon : '·'}</span>${esc(i.name)}</span></div>`).join('');
    const scores = Object.entries(p.scores).map(([k, v]) => `<li><strong>${esc(k)}</strong>: ${/seconds/.test(k) ? fmtTime(v) : v}</li>`).join('');
    Modal.open(`
      <h2>Campus Passport</h2>
      <p class="muted">Finish the game in each of the five places to earn its stamp. Saved on this device.</p>
      <div class="passport-grid">${stamps}</div>
      <div class="progress"><span style="width:${Passport.count() / D.items.length * 100}%"></span></div>
      ${all ? `<div class="card sand" style="margin-top:16px"><h3>Certificate of Exploration</h3><p>You have explored every corner of the new ${esc(C.shortName)} campus. Show this screen to a greeter after Holy Qurbana to claim a small gift.</p><p class="verse">Well done, good and faithful servant.<br><span class="verse-ref">Matthew 25:23</span></p></div>` : ''}
      ${scores ? `<div class="divider"></div><h3>Best scores</h3><ul class="scores">${scores}</ul>` : ''}
      <div class="btn-row" style="margin-top:16px"><button class="btn ghost sm" type="button" id="passport-reset">Reset progress</button></div>`);
    $('#passport-reset').addEventListener('click', () => { if (confirm('Clear all stamps and scores on this device?')) { Passport.reset(); Hunt.reset(); Modal.close(); Toast.show('Passport cleared.'); } });
  }

  window.App = { $, $$, el, shuffle, pick, fmtTime, clamp, esc, item, Passport, Hunt, Toast, Modal, Sfx, openPassport };
  document.addEventListener('DOMContentLoaded', renderChrome);
})();
