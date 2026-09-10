/* PRAYER GARDEN | prayer wall (local) + quiet moment timer */
(function () {
  'use strict';
  const { $, el, Passport, Toast, Sfx, verseOfDay } = window.App;
  const C = window.CHURCH;
  const KEY = 'church_prayers_v1';
  const SEED = [
    { id: 'seed1', name: 'The Welcome Team', text: 'For every new face that walks through our doors this month, that they would feel at home before the first song ends.', prayed: 0, seed: true },
    { id: 'seed2', name: 'Kids Ministry', text: 'For our volunteers and the children they serve, for patience, joy, and plenty of snacks.', prayed: 0, seed: true },
    { id: 'seed3', name: 'A neighbor', text: 'For healing and strength for a family in our street going through a hard season.', prayed: 0, seed: true }
  ];

  function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v)) return v; } catch (e) {} return SEED.slice(); }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    const ta = $('#pw-text'); ta.addEventListener('input', () => $('#pw-left').textContent = 280 - ta.value.length);
    $('#prayer-form').addEventListener('submit', e => {
      e.preventDefault();
      const text = ta.value.trim(); if (!text) return;
      const list = load(); list.unshift({ id: 'p' + Date.now(), name: $('#pw-name').value.trim() || 'Anonymous', text, prayed: 0, at: Date.now() }); save(list);
      ta.value = ''; $('#pw-left').textContent = 280; render(); Sfx.play('good'); Toast.show('Added to the wall.');
      Passport.stamp('garden', 'Posted a prayer');
    });
    const mail = $('#pw-mail'); mail.addEventListener('click', e => { e.preventDefault(); const body = encodeURIComponent(ta.value.trim() || ''); location.href = `mailto:${C.contactEmail}?subject=${encodeURIComponent('Prayer request')}&body=${body}`; });
    Quiet.init();
  });

  function render() {
    const list = load(); const host = $('#prayer-list'); host.innerHTML = '';
    if (!list.length) host.append(el('p', { class: 'muted', text: 'The wall is empty. Be the first to add a prayer.' }));
    list.forEach(p => {
      const card = el('div', { class: 'prayer-card' });
      card.innerHTML = `<div class="who">${escape(p.name)}${p.seed ? ' · <span class="badge">from the church</span>' : ''}</div><div class="text">${escape(p.text)}</div>`;
      const btn = el('button', { class: 'pray-btn' + (p.mine ? ' done' : ''), type: 'button', text: `🕯️ ${p.mine ? 'Prayed' : 'I prayed'} · ${p.prayed}` });
      btn.addEventListener('click', () => { if (p.mine) return; const l = load(); const t = l.find(x => x.id === p.id); if (t) { t.prayed++; t.mine = true; save(l); } Sfx.play('good'); render(); Passport.stamp('garden', 'Prayed for someone on the wall'); });
      card.append(btn);
      if (!p.seed) card.append(el('button', { class: 'del', type: 'button', 'aria-label': 'Remove', text: '✕', onclick: () => { save(load().filter(x => x.id !== p.id)); render(); } }));
      host.append(card);
    });
  }
  function escape(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  const Quiet = {
    init() {
      const v = verseOfDay(); $('#qm-verse').textContent = v.text; $('#qm-ref').textContent = v.ref;
      $('#qm-start').addEventListener('click', () => this.start());
    },
    start() {
      if (this.timer) return;
      let left = 60; const ball = $('#breath'), label = $('#breath-label'); $('#qm-start').disabled = true;
      const phase = () => { const inhale = ball.classList.toggle('in'); ball.classList.toggle('out', !inhale); label.textContent = inhale ? 'Breathe in' : 'Breathe out'; };
      phase(); this.phaseTimer = setInterval(phase, 4000);
      this.timer = setInterval(() => {
        left--; $('#qm-time').textContent = left + 's';
        if (left <= 0) { clearInterval(this.timer); clearInterval(this.phaseTimer); this.timer = null; ball.classList.remove('in'); ball.classList.add('out'); label.textContent = 'Amen'; $('#qm-time').textContent = ''; $('#qm-start').disabled = false; $('#qm-start').textContent = 'Begin again'; Sfx.play('stamp'); Passport.stamp('garden', 'Took a quiet moment'); }
      }, 1000);
    }
  };
})();
