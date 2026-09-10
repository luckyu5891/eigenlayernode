/* KIDS | Memory Match + Coloring Book */
(function () {
  'use strict';
  const { $, $$, el, shuffle, pick, Passport, Toast, Sfx } = window.App;
  const D = window.DATA;

  document.addEventListener('DOMContentLoaded', () => {
    $$('.tabs[role="tablist"] > .tab').forEach(t => t.addEventListener('click', () => {
      $$('.tabs[role="tablist"] > .tab').forEach(x => x.setAttribute('aria-selected', x === t ? 'true' : 'false'));
      $$('.tab-panel').forEach(p => p.hidden = p.id !== t.getAttribute('aria-controls')); Sfx.play('tap');
    }));
    Memory.init(); Coloring.init();
  });

  /* ================= MEMORY ================= */
  const Memory = {
    PAIRS: 8,
    init() {
      $('#mm-new').addEventListener('click', () => this.newGame());
      const b = Passport.score('Memory Match (fewest moves)'); $('#mm-best').textContent = b || '--';
      this.newGame();
    },
    newGame() {
      const animals = pick(D.arkAnimals, this.PAIRS);
      this.deck = shuffle(animals.concat(animals)); this.open = []; this.moves = 0; this.matched = 0; this.lock = false;
      $('#mm-moves').textContent = 0; $('#mm-pairs').textContent = 0;
      const g = $('#mm-grid'); g.innerHTML = '';
      this.deck.forEach((a, i) => {
        const card = el('button', { class: 'mcard', type: 'button', 'aria-label': 'Card ' + (i + 1), 'data-i': i });
        card.innerHTML = `<div class="inner"><div class="face front">✝</div><div class="face back">${a}</div></div>`;
        card.addEventListener('click', () => this.flip(card));
        g.append(card);
      });
    },
    flip(card) {
      if (this.lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
      card.classList.add('flipped'); Sfx.play('tap'); this.open.push(card);
      if (this.open.length < 2) return;
      this.moves++; $('#mm-moves').textContent = this.moves;
      const [a, b] = this.open;
      if (this.deck[a.dataset.i] === this.deck[b.dataset.i]) {
        a.classList.add('matched'); b.classList.add('matched'); this.open = []; this.matched++; $('#mm-pairs').textContent = this.matched; Sfx.play('good');
        if (this.matched === this.PAIRS) this.finish();
      } else {
        this.lock = true; setTimeout(() => { a.classList.remove('flipped'); b.classList.remove('flipped'); this.open = []; this.lock = false; }, 800);
      }
    },
    finish() {
      Sfx.play('win');
      const prev = Passport.score('Memory Match (fewest moves)');
      if (!prev || this.moves < prev) { const p = Passport.get(); p.scores['Memory Match (fewest moves)'] = this.moves; try { localStorage.setItem('church_passport_v1', JSON.stringify(p)); } catch (e) {} $('#mm-best').textContent = this.moves; Toast.show('New best! All pairs in ' + this.moves + ' moves.', 'gold'); }
      else Toast.show('Every animal is aboard. ' + this.moves + ' moves.');
      Passport.stamp('kids', "Won Noah's Ark Memory Match");
    }
  };

  /* ================= COLORING ================= */
  const Coloring = {
    pages: [
      { name: 'Dove', svg: `
        <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <rect data-fill x="0" y="0" width="400" height="300" fill="#fff"/>
          <circle data-fill cx="330" cy="60" r="34" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M40 260 Q200 220 360 260 L360 300 L40 300 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M120 170 Q160 110 240 130 Q290 140 300 180 Q260 210 200 200 Q140 200 120 170 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M150 150 Q120 90 190 70 Q210 110 220 130 Q180 140 150 150 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M290 160 Q310 130 300 150 Q330 140 350 150 Q325 165 300 180 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M120 175 Q80 180 60 200 Q100 195 125 190 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M300 180 L330 190 L305 190 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <circle cx="285" cy="165" r="4" fill="#2b2a28"/>
          <path data-fill d="M230 200 Q250 240 210 260 Q205 235 195 205 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M190 205 Q180 245 150 255 Q170 230 180 205 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
        </svg>` },
      { name: 'Ark', svg: `
        <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <rect data-fill x="0" y="0" width="400" height="180" fill="#fff"/>
          <rect data-fill x="0" y="180" width="400" height="120" fill="#fff"/>
          <path d="M0 200 Q50 185 100 200 T200 200 T300 200 T400 200" fill="none" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M60 200 Q80 260 200 265 Q320 260 340 200 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <rect data-fill x="120" y="140" width="160" height="60" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <polygon data-fill points="110,140 200,90 290,140" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <rect data-fill x="150" y="160" width="30" height="30" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <rect data-fill x="220" y="160" width="30" height="30" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M40 120 A120 120 0 0 1 280 120 L250 120 A90 90 0 0 0 70 120 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M70 120 A90 90 0 0 1 250 120 L225 120 A65 65 0 0 0 95 120 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <circle data-fill cx="340" cy="50" r="28" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <circle data-fill cx="165" cy="175" r="8" fill="#fff" stroke="#2b2a28" stroke-width="2"/>
          <circle data-fill cx="235" cy="175" r="8" fill="#fff" stroke="#2b2a28" stroke-width="2"/>
        </svg>` },
      { name: 'Cross & Sunrise', svg: `
        <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <rect data-fill x="0" y="0" width="400" height="200" fill="#fff"/>
          <circle data-fill cx="200" cy="200" r="70" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M0 200 Q100 170 200 200 T400 200 L400 300 L0 300 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <rect data-fill x="185" y="60" width="30" height="170" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <rect data-fill x="140" y="100" width="120" height="30" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <g stroke="#2b2a28" stroke-width="3" stroke-linecap="round"><path d="M110 140 L80 120"/><path d="M290 140 L320 120"/><path d="M95 190 L60 185"/><path d="M305 190 L340 185"/></g>
          <path data-fill d="M40 260 Q60 230 80 260 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <path data-fill d="M320 265 Q340 235 360 265 Z" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
          <circle data-fill cx="60" cy="60" r="18" fill="#fff" stroke="#2b2a28" stroke-width="3"/>
        </svg>` }
    ],
    init() {
      this.color = D.coloringPalette[0]; this.page = 0;
      const pal = $('#cb-palette');
      D.coloringPalette.forEach((c, i) => pal.append(el('button', { class: 'swatch', type: 'button', style: `background:${c}`, 'aria-label': 'Color ' + (i + 1), 'aria-pressed': i === 0 ? 'true' : 'false', onclick: e => { this.color = c; $$('.swatch').forEach(s => s.setAttribute('aria-pressed', 'false')); e.currentTarget.setAttribute('aria-pressed', 'true'); Sfx.play('tap'); } })));
      const tabs = $('#cb-pages');
      this.pages.forEach((p, i) => tabs.append(el('button', { class: 'tab', type: 'button', text: p.name, 'aria-selected': i === 0 ? 'true' : 'false', onclick: () => this.load(i) })));
      $('#cb-reset').addEventListener('click', () => this.load(this.page));
      $('#cb-finish').addEventListener('click', () => this.finish());
      $('#cb-download').addEventListener('click', () => this.download());
      this.load(0);
    },
    load(i) {
      this.page = i; $$('#cb-pages .tab').forEach((t, k) => t.setAttribute('aria-selected', k === i ? 'true' : 'false'));
      const stage = $('#cb-stage'); stage.innerHTML = this.pages[i].svg; $('#cb-msg').textContent = '';
      stage.querySelectorAll('[data-fill]').forEach(n => n.addEventListener('click', () => { n.setAttribute('fill', this.color); Sfx.play('tap'); }));
    },
    filledCount() { return $$('#cb-stage [data-fill]').filter(n => n.getAttribute('fill') !== '#fff').length; },
    finish() {
      const n = this.filledCount();
      if (n < 5) { $('#cb-msg').textContent = `Color ${5 - n} more area${5 - n === 1 ? '' : 's'} first.`; Sfx.play('bad'); return; }
      $('#cb-msg').textContent = 'What a masterpiece!'; Sfx.play('win');
      Passport.stamp('kids', 'Finished a coloring page');
    },
    download() {
      const svg = $('#cb-stage svg'); const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image(); const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 900; const c = cv.getContext('2d');
        c.fillStyle = '#fff'; c.fillRect(0, 0, 1200, 900); c.drawImage(img, 0, 0, 1200, 900); URL.revokeObjectURL(url);
        const a = document.createElement('a'); a.download = `coloring-${this.pages[this.page].name.toLowerCase().replace(/[^a-z]+/g, '-')}.png`; a.href = cv.toDataURL('image/png'); a.click();
        Toast.show('Picture saved.');
      };
      img.src = url;
    }
  };
})();
