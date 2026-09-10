/* =====================================================================
   MAP  |  Landing page behaviour: building list, passport stars,
   service times, verse of the day, and Treasure Hunt mode.
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, el, Passport, Hunt, Toast, Modal, Sfx, verseOfDay, building } = window.App;
  const D = window.DATA, C = window.CHURCH;

  document.addEventListener('DOMContentLoaded', () => {
    renderList();
    renderStars();
    renderServiceTimes();
    renderVerse();
    initHunt();
  });

  function renderList() {
    const ul = $('#bld-list');
    D.buildings.forEach(b => {
      const a = el('a', { href: b.page });
      a.innerHTML = `<span class="ico" aria-hidden="true">${b.icon}</span><span><span class="name">${b.name}</span><br><span class="desc">${b.blurb}</span></span>${Passport.has(b.id) ? '<span class="stamped" title="Stamped">★</span>' : ''}`;
      ul.append(el('li', {}, [a]));
    });
  }

  function renderStars() {
    $$('.star').forEach(s => s.classList.toggle('on', Passport.has(s.dataset.for)));
  }

  function renderServiceTimes() {
    const ul = $('#service-times');
    C.serviceTimes.forEach(s => ul.append(el('li', { html: `<strong>${s.day} ${s.time}</strong> · ${s.label}` })));
  }

  function renderVerse() {
    const v = verseOfDay();
    $('#votd-text').textContent = v.text;
    $('#votd-ref').textContent = v.ref;
  }

  /* ---------- Treasure hunt mode ---------- */
  function initHunt() {
    const params = new URLSearchParams(location.search);
    if (params.get('hunt') === '1') {
      const s = Hunt.get();
      if (!s.active && !Hunt.complete()) { s.active = true; Hunt.set(s); }
      history.replaceState(null, '', 'index.html');
    }
    renderHuntBanner();

    $('#hunt-hint').addEventListener('click', () => {
      const cur = Hunt.current(); if (cur) Toast.show('Hint: ' + cur.hint, 'gold', 4000);
    });
    $('#hunt-quit').addEventListener('click', () => { Hunt.stop(); renderHuntBanner(); Toast.show('Hunt paused. Resume any time from the Bell Tower.'); });

    $$('.bld').forEach(a => {
      a.addEventListener('click', e => {
        const s = Hunt.get();
        if (!s.active) return; // normal navigation
        e.preventDefault();
        const id = a.dataset.id;
        const r = Hunt.tryBuilding(id);
        if (r.ok) {
          Sfx.play('coin');
          a.classList.remove('found'); void a.offsetWidth; a.classList.add('found');
          sparkleAt(a);
          renderStars();
          showFound(r, a.getAttribute('href'));
        } else if (r.clue) {
          Sfx.play('bad');
          a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake');
          Toast.show(`Not here. ${building(id).name} holds no relic for this clue.`);
        }
        renderHuntBanner();
      });
    });
  }

  function renderHuntBanner() {
    const s = Hunt.get();
    const banner = $('#hunt-banner');
    const cur = D.hunt[s.step];
    banner.classList.toggle('on', s.active && !!cur);
    if (!cur) return;
    $('#hunt-step').textContent = s.step + 1;
    $('#hunt-total').textContent = D.hunt.length;
    $('#hunt-clue').textContent = cur.clue;
    const found = $('#hunt-found'); found.innerHTML = '';
    D.hunt.forEach((h, i) => found.append(el('span', { class: i < s.step ? 'got' : '', title: i < s.step ? h.item : 'Not found yet', text: i < s.step ? h.emoji : '?' })));
  }

  function showFound(r, href) {
    const f = r.found;
    const s = Hunt.get();
    const words = D.hunt.map((h, i) => i < s.step ? h.word : '____').join(' ');
    let body = `
      <div class="center"><div style="font-size:3.4rem">${f.emoji}</div>
      <h2>You found the ${f.item}!</h2>
      <p class="muted">Hidden word revealed: <strong>${f.word}</strong></p>
      <p class="verse" style="font-size:1.1rem">${words}</p></div>`;
    if (r.done) {
      body += `<div class="card sand"><h3 class="center">Treasure Hunt complete</h3>
        <p class="verse center">Seek and you will find.<br><span class="verse-ref">Matthew 7:7</span></p>
        <p class="center muted">The Bell Tower stamp is now in your Passport.</p></div>
        <div class="btn-row" style="justify-content:center;margin-top:16px"><button class="btn gold" type="button" id="found-passport">Open Passport</button><a class="btn secondary" href="tower.html">Back to the Bell Tower</a></div>`;
    } else {
      body += `<div class="card sand"><strong class="small" style="letter-spacing:.1em;text-transform:uppercase;color:var(--terracotta)">Next clue</strong><p class="verse" style="font-size:1.1rem;margin:6px 0 0">${r.next.clue}</p></div>
        <div class="btn-row" style="justify-content:center;margin-top:16px"><button class="btn" type="button" id="found-continue">Keep searching</button><a class="btn ghost sm" href="${href}">Peek inside this building</a></div>`;
    }
    Modal.open(body);
    const c = $('#found-continue'); if (c) c.addEventListener('click', () => Modal.close());
    const p = $('#found-passport'); if (p) p.addEventListener('click', () => { Modal.close(); window.App.openPassport(); });
    if (r.done) Sfx.play('win');
  }

  function sparkleAt(node) {
    const layer = $('#sparkle-layer');
    const box = node.getBBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    for (let i = 0; i < 12; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const ang = (i / 12) * Math.PI * 2, rad = Math.min(box.width, box.height) * 0.35;
      c.setAttribute('cx', cx + Math.cos(ang) * rad); c.setAttribute('cy', cy + Math.sin(ang) * rad);
      c.setAttribute('r', 5 + Math.random() * 5); c.setAttribute('fill', i % 2 ? '#ffd166' : '#fff');
      layer.append(c); setTimeout(() => c.remove(), 1100);
    }
  }
})();
