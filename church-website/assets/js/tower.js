/* BELL TOWER | treasure hunt hub */
(function () {
  'use strict';
  const { $, el, Hunt, Toast } = window.App;
  const D = window.DATA;

  document.addEventListener('DOMContentLoaded', () => {
    render();
    $('#th-reset').addEventListener('click', () => { if (confirm('Start the treasure hunt over from the first clue?')) { Hunt.set({ active: false, step: 0, found: [] }); render(); Toast.show('Hunt reset.'); } });
  });

  function render() {
    const s = Hunt.get(); const total = D.hunt.length; const done = s.step >= total;
    $('#th-total').textContent = total; $('#th-count').textContent = s.step;
    $('#th-bar').style.width = (s.step / total * 100) + '%';
    $('#th-current').classList.toggle('hidden', done); $('#th-finished').classList.toggle('hidden', !done);
    if (!done) { $('#th-clue').textContent = D.hunt[s.step].clue; $('#th-title').textContent = s.step === 0 ? 'Ready to search?' : 'Keep going'; $('#th-go').textContent = s.step === 0 ? 'Start the hunt on the map' : 'Continue on the map'; }
    else { $('#th-title').textContent = 'Hunt complete'; $('#th-go').textContent = 'Back to the map'; $('#th-go').href = 'index.html'; }
    const grid = $('#th-relics'); grid.innerHTML = '';
    D.hunt.forEach((h, i) => grid.append(el('div', { class: 'stamp' + (i < s.step ? ' done' : ''), html: `<span><span class="ico">${i < s.step ? h.emoji : '?'}</span>${i < s.step ? h.item : 'Relic ' + (i + 1)}</span>` })));
    $('#th-words').textContent = D.hunt.map((h, i) => i < s.step ? h.word : '____').join(' ');
  }
})();
