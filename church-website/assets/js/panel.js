/* =====================================================================
   PANEL + OVERLAY  |  the detail card that slides in when a place is
   tapped, and the full-screen game overlay.
   Games register as window.Games[key] = { mount(container, ctx), unmount() }
   ===================================================================== */
window.Games = window.Games || {};
(function () {
  'use strict';
  const { $, el, esc, Passport, Sfx, item } = window.App;
  const C = window.CHURCH;

  const Panel = {
    node: null, body: null, current: null,
    init() {
      this.node = $('#panel'); this.body = $('#panel-body');
      $('#panel-close').addEventListener('click', () => { this.close(); if (this.onClose) this.onClose(); });
      // swipe-down to close on phones
      let sy = null; this.node.addEventListener('touchstart', e => { sy = e.touches[0].clientY; }, { passive: true });
      this.node.addEventListener('touchend', e => { if (sy !== null && e.changedTouches[0].clientY - sy > 90 && this.body.scrollTop < 10) { this.close(); if (this.onClose) this.onClose(); } sy = null; });
    },
    isMobile() { return window.matchMedia('(max-width: 899px)').matches; },
    region() {
      const stage = $('#stage').getBoundingClientRect();
      if (this.isMobile()) return { x: 0, y: 0.04, w: 1, h: Math.max(0.3, Math.min(0.5, (window.innerHeight * 0.36 - 20) / stage.height)) };
      return { x: 0.02, y: 0.05, w: Math.max(0.4, (stage.width - 440) / stage.width), h: 0.9 };
    },
    open(id) {
      const it = item(id); this.current = id;
      const img = C.images[it.imageKey];
      const stamped = Passport.has(id);
      this.body.innerHTML = `
        <div class="p-img">
          <span class="ph" aria-hidden="true">${it.icon}</span>
          <span class="ph-note">Add ${esc(img.split('/').pop())} to assets/img to show a photo</span>
          <img src="${esc(img)}" alt="${esc(it.name)}" onerror="this.remove()" onload="this.previousElementSibling.remove(); this.previousElementSibling.remove()">
        </div>
        <div class="eyebrow">${esc(C.shortName)} · Campus</div>
        <h2>${esc(it.name)}</h2>
        <div class="kind">${esc(it.kind)}</div>
        <div class="meta">${it.meta.map(([k, v]) => `<div><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('')}</div>
        <p class="desc">${esc(it.description)}</p>
        <details><summary>Did you know?</summary><ul>${it.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul></details>
        <div class="play-card">
          <span class="ico" aria-hidden="true">${gameIcon(it.game)}</span>
          <div><div class="t">${esc(it.gameName)}</div><div class="b">${esc(it.gameBlurb)}</div></div>
          <button class="btn gold" type="button" id="play-btn">${stamped ? 'Play again' : 'Play'}</button>
        </div>
        ${stamped ? '<div class="stamped-note">★ Stamped in your Passport</div>' : '<div class="stamped-note muted" style="color:var(--ink-soft)">Finish the game to earn this stamp</div>'}`;
      this.body.scrollTop = 0;
      $('#play-btn').addEventListener('click', () => { Sfx.play('tap'); Overlay.open(it.game, id); });
      this.node.hidden = false; requestAnimationFrame(() => this.node.classList.add('open'));
    },
    close() { if (!this.node) return; this.node.classList.remove('open'); this.current = null; const n = this.node; setTimeout(() => { if (!n.classList.contains('open')) n.hidden = true; }, 450); },
    onClose: null
  };
  function gameIcon(k) { return { treasure: '🗝️', arcade: '🕹️', basketball: '🏀', parking: '🚗', fishing: '🎣' }[k] || '🎮'; }

  const Overlay = {
    node: null, body: null, active: null,
    init() {
      this.node = $('#overlay'); this.body = $('#overlay-body');
      $('#overlay-close').addEventListener('click', () => this.close());
      $('#overlay-passport').addEventListener('click', () => window.App.openPassport());
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !this.node.hidden && !window.App.Modal.node) this.close(); });
    },
    open(gameKey, itemId) {
      const g = window.Games[gameKey]; if (!g) { window.App.Toast.show('This game is still being built.'); return; }
      this.close();
      const it = item(itemId);
      $('#overlay-ico').textContent = gameIcon(gameKey); $('#overlay-title').textContent = `${it.gameName} · ${it.name}`;
      this.body.innerHTML = ''; const host = el('div', { class: 'game' }); this.body.append(host);
      this.node.hidden = false; document.body.style.overflow = 'hidden';
      this.active = g;
      g.mount(host, { itemId, item: it, close: () => this.close(), stamp: label => Passport.stamp(itemId, label), startHunt: () => { this.close(); if (this.onStartHunt) this.onStartHunt(); } });
      history.pushState({ overlay: gameKey }, '');
    },
    close() {
      if (this.node.hidden) return;
      try { if (this.active && this.active.unmount) this.active.unmount(); } catch (e) {}
      this.active = null; this.node.hidden = true; this.body.innerHTML = ''; document.body.style.overflow = '';
      if (history.state && history.state.overlay) history.back();
    },
    onStartHunt: null
  };
  window.addEventListener('popstate', () => { if (!Overlay.node.hidden) { try { if (Overlay.active && Overlay.active.unmount) Overlay.active.unmount(); } catch (e) {} Overlay.active = null; Overlay.node.hidden = true; Overlay.body.innerHTML = ''; document.body.style.overflow = ''; } });

  window.Panel = Panel; window.Overlay = Overlay;
})();
