/* =====================================================================
   MAIN  |  wires the map, panel, overlay, treasure hunt mode, and the
   content sections below the map.
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, el, esc, Passport, Hunt, Toast, Modal, Sfx, item } = window.App;
  const C = window.CHURCH, D = window.DATA;

  document.addEventListener('DOMContentLoaded', () => {
    fillChurchFields(); renderLegend(); renderVisit(); renderProject(); renderFooter();
    IsoMap.build($('#iso-map'));
    Panel.init(); Overlay.init();
    D.items.forEach(i => IsoMap.setStamped(i.id, Passport.has(i.id)));
    document.addEventListener('passport:change', () => { D.items.forEach(i => IsoMap.setStamped(i.id, Passport.has(i.id))); renderLegend(); if (Panel.current) Panel.open(Panel.current); });

    IsoMap.onTap = id => { if (Hunt.get().active) huntTap(id); else openItem(id); };
    IsoMap.onDeselectRequest = () => closeItem();
    Panel.onClose = () => IsoMap.deselect();
    Overlay.onStartHunt = () => { closeItem(); Hunt.start(); renderHunt(); scrollToStage(); Toast.show('Read the clue, then tap the matching place on the map.', 'gold', 3500); };

    $('#zoom-in').addEventListener('click', () => IsoMap.zoom(1.3));
    $('#zoom-out').addEventListener('click', () => IsoMap.zoom(1 / 1.3));
    $('#zoom-reset').addEventListener('click', () => { closeItem(); IsoMap.resetView(); });
    initDiscoverability();

    $('#hunt-hint').addEventListener('click', () => { const c = Hunt.current(); if (c) Toast.show('Hint: ' + c.hint, 'gold', 4000); });
    $('#hunt-quit').addEventListener('click', () => { Hunt.stop(); renderHunt(); Toast.show('Hunt paused. Resume from the church card.'); });
    renderHunt();
    // deep link: index.html#church etc.
    const hash = location.hash.replace('#', ''); if (item(hash)) setTimeout(() => openItem(hash), 600);
  });

  function openItem(id) { interacted(); Sfx.play('tap'); Panel.open(id); IsoMap.select(id, Panel.region()); scrollToStage(); }

  /* ---------- Discoverability: tap cue, periodic nudge, floating header ---------- */
  let touched = false, nudgeTimer = null;
  function interacted() {
    if (touched) return; touched = true;
    $('#stage-hint').classList.add('hide'); $('#stage-intro').classList.add('hide');
    clearInterval(nudgeTimer);
  }
  function initDiscoverability() {
    IsoMap.onInteract = interacted;
    // pulse the church label every few seconds until the visitor taps something
    let n = 0; nudgeTimer = setInterval(() => { if (touched || n++ > 6) return clearInterval(nudgeTimer); IsoMap.nudge(D.items[n % D.items.length].id); }, 4200);
    const header = $('.site-header');
    const onScroll = () => { header.classList.toggle('scrolled', window.scrollY > 40); $('#scroll-cue').style.opacity = window.scrollY > 40 ? '0' : ''; if (window.scrollY > 120) $('#stage-intro').classList.add('hide'); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  function closeItem() { Panel.close(); IsoMap.deselect(); }
  function scrollToStage() { if (window.scrollY > 40) window.scrollTo({ top: 0, behavior: 'smooth' }); }

  /* ---------- Treasure hunt on the map ---------- */
  function huntTap(id) {
    const r = Hunt.tryItem(id);
    if (r.ok) {
      Sfx.play('coin'); IsoMap.pulse(id, 'found'); IsoMap.sparkle(id);
      const s = Hunt.get(); const words = D.hunt.map((h, i) => i < r.step ? h.word : '____').join(' ');
      let body = `<div class="center"><div style="font-size:3rem">${r.found.emoji}</div><h2>You found the ${esc(r.found.item)}!</h2>
        <p class="muted small">Hidden word: <strong>${esc(r.found.word)}</strong></p><p class="verse" style="font-size:1.05rem">${esc(words)}</p></div>
        <div class="card sand"><strong class="small" style="letter-spacing:.1em;text-transform:uppercase;color:var(--terracotta)">About St. Alphonsa</strong><p style="margin:6px 0 0;font-size:.95rem">${esc(r.found.fact)}</p></div>`;
      if (r.done) {
        body += `<div class="card sand" style="margin-top:12px"><h3 class="center">Treasure Hunt complete</h3><p class="verse center">${esc(D.huntVerse.text)}<br><span class="verse-ref">${esc(D.huntVerse.ref)}</span></p><p class="center muted small">The church stamp is now in your Passport.</p></div>
          <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn gold" type="button" id="h-passport">Open Passport</button></div>`;
        Sfx.play('win');
      } else {
        body += `<div class="card sand" style="margin-top:12px"><strong class="small" style="letter-spacing:.1em;text-transform:uppercase;color:var(--terracotta)">Next clue</strong><p class="verse" style="font-size:1.05rem;margin:6px 0 0">${esc(r.next.clue)}</p></div>
          <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn" type="button" id="h-continue">Keep searching</button></div>`;
      }
      Modal.open(body);
      const c = $('#h-continue'); if (c) c.addEventListener('click', () => Modal.close());
      const p = $('#h-passport'); if (p) p.addEventListener('click', () => { Modal.close(); window.App.openPassport(); });
    } else if (r.clue) {
      Sfx.play('bad'); IsoMap.pulse(id, 'shake'); Toast.show(`Not here. ${item(id).name} holds no relic for this clue.`);
    }
    renderHunt();
  }
  function renderHunt() {
    const s = Hunt.get(), cur = D.hunt[s.step], b = $('#hunt-banner');
    b.classList.toggle('on', s.active && !!cur); if (!cur) return;
    $('#hunt-step').textContent = s.step + 1; $('#hunt-total').textContent = D.hunt.length; $('#hunt-clue').textContent = cur.clue;
    const f = $('#hunt-found'); f.innerHTML = ''; D.hunt.forEach((h, i) => f.append(el('span', { class: i < s.step ? 'got' : '', title: i < s.step ? h.item : 'Not found yet', text: i < s.step ? h.emoji : '?' })));
  }

  /* ---------- Content sections ---------- */
  function fillChurchFields() { $$('[data-church]').forEach(n => { const k = n.dataset.church; if (C[k] !== undefined && C[k] !== '') n.textContent = C[k]; }); document.title = document.title.replace('{church}', C.name); }
  function renderLegend() {
    const ul = $('#legend'); ul.innerHTML = '';
    D.items.forEach(i => {
      const b = el('button', { type: 'button', html: `<span class="ico" aria-hidden="true">${i.icon}</span><span><span class="name">${esc(i.name)}</span><br><span class="desc">${esc(i.gameName)} · ${esc(i.kind)}</span></span>${Passport.has(i.id) ? '<span class="star" title="Stamped">★</span>' : ''}` });
      b.addEventListener('click', () => openItem(i.id)); ul.append(el('li', {}, [b]));
    });
  }
  function renderVisit() {
    const ul = $('#mass-times'); C.massTimes.forEach(m => ul.append(el('li', { html: `<span class="d">${esc(m.day)}</span><span class="t">${esc(m.time)}</span><span class="l">${esc(m.label)}</span>` })));
    $('#phone-link').href = 'tel:' + C.phone.replace(/[^\d+]/g, ''); $('#email-link').href = 'mailto:' + C.email;
    $('#directions').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(C.name + ', ' + C.address);
    const wl = $('#website-link'); if (wl) { if (C.website) wl.href = C.website; else wl.remove(); }
  }
  function renderProject() {
    const ul = $('#milestones'); C.milestones.forEach(m => ul.append(el('li', { html: `<div class="w">${esc(m.when)}</div><div>${esc(m.what)}</div>` })));
    const row = $('#donate-row');
    if (C.donateUrl) row.append(el('a', { class: 'btn gold', href: C.donateUrl, target: '_blank', rel: 'noopener', text: C.donateLabel }));
    if (C.projectUrl && C.projectUrl !== C.donateUrl) row.append(el('a', { class: 'btn secondary', href: C.projectUrl, target: '_blank', rel: 'noopener', text: 'Project page' }));
    else row.append(el('span', { class: 'placeholder-note', text: 'Add donateUrl in config.js to show the Support the Build button.' }));
    if (C.images.sitePlan) { const img = el('img', { src: C.images.sitePlan, alt: 'Site plan', style: 'width:100%;border-radius:12px;margin-top:14px', onerror: e => e.target.remove() }); row.parentNode.append(img); }
  }
  function renderFooter() {
    const links = [];
    if (C.website) links.push(`<a href="${esc(C.website)}" target="_blank" rel="noopener">Website</a>`);
    if (C.facebook) links.push(`<a href="${esc(C.facebook)}" target="_blank" rel="noopener">Facebook</a>`);
    if (C.youtube) links.push(`<a href="${esc(C.youtube)}" target="_blank" rel="noopener">YouTube</a>`);
    links.push(`<a href="mailto:${esc(C.email)}">Email us</a>`);
    $('#footer-links').innerHTML = links.join(' · ');
  }
})();
