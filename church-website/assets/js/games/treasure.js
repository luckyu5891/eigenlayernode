/* TREASURE HUNT | intro + progress screen. The hunt itself happens on the map (main.js). */
(function () {
  'use strict';
  const { $, el, esc, Hunt } = window.App; const D = window.DATA;
  window.Games.treasure = {
    mount(host, ctx) {
      const s = Hunt.get(); const done = s.step >= D.hunt.length; const cur = D.hunt[s.step];
      host.innerHTML = `
        <div class="g-top"><p>Five relics are hidden around the campus. Each clue points to one place on the map. Tap the right place to collect the relic, reveal a word of a hidden verse, and learn something about St. Alphonsa.</p></div>
        <div class="card sand" style="margin-bottom:12px">
          <div class="progress" style="margin-bottom:8px"><span style="width:${s.step / D.hunt.length * 100}%"></span></div>
          <div class="small muted">${s.step} of ${D.hunt.length} relics found</div>
          <div class="passport-grid" style="grid-template-columns:repeat(5,1fr);gap:8px">${D.hunt.map((h, i) => `<div class="stamp ${i < s.step ? 'done' : ''}" style="font-size:.62rem"><span><span class="ico">${i < s.step ? h.emoji : '?'}</span>${i < s.step ? esc(h.item) : 'Relic ' + (i + 1)}</span></div>`).join('')}</div>
          <p class="verse center" style="font-size:1.05rem;margin:6px 0 0">${D.hunt.map((h, i) => i < s.step ? esc(h.word) : '____').join(' ')}</p>
        </div>
        ${done ? `<div class="card"><h3 class="center">Hunt complete</h3><p class="verse center">${esc(D.huntVerse.text)}<br><span class="verse-ref">${esc(D.huntVerse.ref)}</span></p><div class="btn-row" style="justify-content:center"><button class="btn secondary" type="button" id="th-again">Play again</button></div></div>`
               : `<div class="card"><strong class="small" style="letter-spacing:.1em;text-transform:uppercase;color:var(--terracotta)">${s.step === 0 ? 'First clue' : 'Current clue'}</strong><p class="verse" style="font-size:1.1rem;margin:6px 0 14px">${esc(cur.clue)}</p><div class="btn-row"><button class="btn gold lg" type="button" id="th-go">${s.step === 0 ? 'Start searching on the map' : 'Back to the map'}</button>${s.step > 0 ? '<button class="btn ghost sm" type="button" id="th-again">Restart</button>' : ''}</div></div>`}`;
      const go = $('#th-go', host); if (go) go.addEventListener('click', () => ctx.startHunt());
      const again = $('#th-again', host); if (again) again.addEventListener('click', () => { Hunt.reset(); this.mount(host, ctx); });
    },
    unmount() {}
  };
})();
