/* SANCTUARY | verse of the day, service times, Scripture Scramble */
(function () {
  'use strict';
  const { $, el, shuffle, pick, Passport, Toast, Sfx, verseOfDay } = window.App;
  const D = window.DATA, C = window.CHURCH;
  const ROUNDS = 5;
  let verses = [], round = 0, score = 0, answer = [], bank = [], misses = 0;

  document.addEventListener('DOMContentLoaded', () => {
    const v = verseOfDay(); $('#votd-text').textContent = v.text; $('#votd-ref').textContent = v.ref;
    C.serviceTimes.forEach(s => $('#service-times').append(el('li', { html: `<strong>${s.day} ${s.time}</strong> · ${s.label}` })));
    $('#sc-best').textContent = Passport.score('Scripture Scramble') || 0;
    $('#sc-check').addEventListener('click', check);
    $('#sc-clear').addEventListener('click', () => { answer = []; bank = shuffle(verses[round].text.split(' ')); render(); });
    $('#sc-next').addEventListener('click', next);
    $('#sc-again').addEventListener('click', start);
    start();
  });

  function start() {
    verses = pick(D.scrambleVerses, ROUNDS); round = 0; score = 0;
    $('#sc-total').textContent = ROUNDS; $('#sc-done').classList.add('hidden'); $('#sc-game').classList.remove('hidden');
    loadRound();
  }
  function loadRound() {
    answer = []; misses = 0;
    const words = verses[round].text.split(' ');
    do { bank = shuffle(words); } while (bank.join(' ') === words.join(' '));
    $('#sc-round').textContent = round + 1; $('#sc-score').textContent = score;
    $('#sc-feedback').textContent = ''; $('#sc-next').classList.add('hidden'); $('#sc-check').classList.remove('hidden'); $('#sc-clear').classList.remove('hidden');
    render();
  }
  function render() {
    const a = $('#sc-answer'), b = $('#sc-bank'); a.innerHTML = ''; b.innerHTML = '';
    answer.forEach((w, i) => a.append(el('button', { class: 'chip in-answer', type: 'button', text: w, onclick: () => { bank.push(answer.splice(i, 1)[0]); Sfx.play('tap'); render(); } })));
    bank.forEach((w, i) => b.append(el('button', { class: 'chip', type: 'button', text: w, onclick: () => { answer.push(bank.splice(i, 1)[0]); Sfx.play('tap'); render(); } })));
    if (!answer.length) a.append(el('span', { class: 'muted small', text: 'Tap words below to build the verse.' }));
  }
  function check() {
    const v = verses[round];
    if (answer.length !== v.text.split(' ').length) { $('#sc-feedback').textContent = 'Use every word in the bank first.'; return; }
    if (answer.join(' ') === v.text) {
      const gained = Math.max(20, 100 - misses * 20); score += gained;
      $('#sc-score').textContent = score;
      $('#sc-feedback').innerHTML = `Correct! <span class="verse-ref">${v.ref}</span> · +${gained}`;
      $('#sc-answer').querySelectorAll('.chip').forEach(c => c.classList.add('correct'));
      $('#sc-check').classList.add('hidden'); $('#sc-clear').classList.add('hidden'); $('#sc-next').classList.remove('hidden');
      Sfx.play('good');
    } else {
      misses++;
      $('#sc-feedback').textContent = 'Not quite. Tap a word in your verse to send it back and try again.';
      $('#sc-answer').querySelectorAll('.chip').forEach(c => c.classList.add('wrong'));
      setTimeout(() => $('#sc-answer').querySelectorAll('.chip').forEach(c => c.classList.remove('wrong')), 600);
      Sfx.play('bad');
    }
  }
  function next() {
    round++;
    if (round >= ROUNDS) return finish();
    loadRound();
  }
  function finish() {
    $('#sc-game').classList.add('hidden'); $('#sc-done').classList.remove('hidden');
    $('#sc-final').textContent = score;
    if (Passport.best('Scripture Scramble', score)) $('#sc-best').textContent = score;
    Sfx.play('win');
    Passport.stamp('sanctuary', 'Completed Scripture Scramble');
  }
})();
