/* =====================================================================
   ISO MAP  |  Generates the isometric campus from a site model (feet),
   handles pan/zoom, hover, selection lift, and stamp stars.
   Site coordinates: x runs along the buildings' long axis, y across.
   Projection: sx = (x + y) * SX, sy = (y - x) * SY - z  (north is up-left)
   ===================================================================== */
window.IsoMap = (function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const SX = 0.866, SY = 0.6;
  const P = (x, y, z) => [(x + y) * SX, (y - x) * SY - (z || 0)];
  const pts = arr => arr.map(p => P(p[0], p[1], p[2]).map(v => v.toFixed(1)).join(',')).join(' ');
  const S = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.round(Math.min(255, r * f)); g = Math.round(Math.min(255, g * f)); b = Math.round(Math.min(255, b * f)); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); };

  /* ---------------- Site model (feet) ---------------- */
  const SITE = { p1: [0, 0], p2: [359, 0], p3: [569, 380], p4: [0, 380] };
  const RD = [210, 380]; const RL = Math.hypot(RD[0], RD[1]);
  const d = [RD[0] / RL, RD[1] / RL];            // along the road
  const n = [-d[1], d[0]];                        // into the site
  const r = t => [359 + RD[0] * t, RD[1] * t];    // point on the frontage line
  const off = (p, k) => [p[0] + n[0] * k, p[1] + n[1] * k];   // offset into the site (k>0) or out (k<0)
  const along = (p, k) => [p[0] + d[0] * k, p[1] + d[1] * k];

  const CHURCH = { x0: 237, y0: 124, x1: 362, y1: 206, h: 22, rh: 18 };
  const CCD = { x0: 32, y0: 258, x1: 157, y1: 340, h: 16, rh: 12 };
  const LOOP = { x0: 190, y0: 78, x1: 425, y1: 262, w: 24, r: 40 };
  const BAYS = [ // parking bays outside the loop
    { x0: 200, y0: 50, x1: 415, y1: 78, dir: 'y', ada: [0, 1] },
    { x0: 425, y0: 95, x1: 447, y1: 235, dir: 'x', ada: [] },
    { x0: 200, y0: 262, x1: 415, y1: 290, dir: 'y', ada: [] },
    { x0: 162, y0: 90, x1: 190, y1: 250, dir: 'x', ada: [16, 17] }
  ];
  const COURTS = [{ x0: 26, y0: 190, x1: 86, y1: 220 }, { x0: 94, y0: 190, x1: 154, y1: 220 }];
  const GATE_T = 0.11;

  /* ---------------- helpers ---------------- */
  function roundedRect(x0, y0, x1, y1, rad, seg) {
    seg = seg || 6; const out = [];
    const corners = [[x1 - rad, y0 + rad, -Math.PI / 2, 0], [x1 - rad, y1 - rad, 0, Math.PI / 2], [x0 + rad, y1 - rad, Math.PI / 2, Math.PI], [x0 + rad, y0 + rad, Math.PI, Math.PI * 1.5]];
    corners.forEach(([cx, cy, a0, a1]) => { for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * i / seg; out.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } });
    return out;
  }
  function ellipsePts(cx, cy, rx, ry, seg, z) { const out = []; for (let i = 0; i < (seg || 24); i++) { const a = i / (seg || 24) * Math.PI * 2; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, z || 0]); } return out; }
  function poly(parent, points3d, attrs) { const p = S('polygon', Object.assign({ points: pts(points3d) }, attrs || {})); parent.append(p); return p; }
  function line(parent, a, b, attrs) { const [x1, y1] = P(a[0], a[1], a[2]), [x2, y2] = P(b[0], b[1], b[2]); return S('line', Object.assign({ x1, y1, x2, y2 }, attrs), parent); }
  function pathFromLoops(loops) { return loops.map(l => 'M' + l.map(p => P(p[0], p[1], p[2]).map(v => v.toFixed(1)).join(',')).join('L') + 'Z').join(''); }
  function shadowFor(parent, footprint, dx, dy, op) {
    const g = S('g', { transform: `translate(${dx || 7},${dy || 6})`, filter: 'url(#blur)', opacity: op || .28 }, parent);
    poly(g, footprint, { fill: '#0b1530' }); return g;
  }
  // Extruded box: draws west (-x) face, south (+y) face and top.
  function box(parent, x0, y0, x1, y1, z0, h, col, extra) {
    const g = S('g', extra || {}, parent);
    poly(g, [[x0, y0, z0], [x0, y1, z0], [x0, y1, z0 + h], [x0, y0, z0 + h]], { fill: shade(col, .78) });
    poly(g, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z0 + h], [x0, y1, z0 + h]], { fill: shade(col, .92) });
    poly(g, [[x0, y0, z0 + h], [x1, y0, z0 + h], [x1, y1, z0 + h], [x0, y1, z0 + h]], { fill: shade(col, 1.08) });
    return g;
  }
  function tree(parent, x, y, h, rad, col) {
    const g = S('g', { class: 'tree' }, parent);
    const [sx, sy] = P(x, y, 0);
    S('ellipse', { cx: sx + 3, cy: sy + 2, rx: rad * 1.05, ry: rad * .5, fill: '#0b1530', opacity: .22 }, g);
    line(g, [x, y, 0], [x, y, h * .55], { stroke: '#7a5236', 'stroke-width': Math.max(2, rad * .28), 'stroke-linecap': 'round' });
    const c = P(x, y, h * .72);
    S('ellipse', { cx: c[0], cy: c[1] + rad * .15, rx: rad, ry: rad * .95, fill: shade(col, .82) }, g);
    S('ellipse', { cx: c[0] - rad * .25, cy: c[1] - rad * .1, rx: rad * .78, ry: rad * .72, fill: col }, g);
    S('ellipse', { cx: c[0] + rad * .2, cy: c[1] - rad * .35, rx: rad * .58, ry: rad * .55, fill: shade(col, 1.18) }, g);
    return g;
  }
  function car(parent, cx, cy, alongX, col, extra) {
    const L = 15, W = 6.4, H = 4.2;
    const hx = alongX ? L / 2 : W / 2, hy = alongX ? W / 2 : L / 2;
    const g = S('g', extra || {}, parent);
    const foot = [[cx - hx, cy - hy, 0], [cx + hx, cy - hy, 0], [cx + hx, cy + hy, 0], [cx - hx, cy + hy, 0]];
    shadowFor(g, foot, 3, 3, .3);
    box(g, cx - hx, cy - hy, cx + hx, cy + hy, 0, H, col);
    const cl = alongX ? 3.6 : 2.6, cw = alongX ? 2.6 : 3.6;
    box(g, cx - cl, cy - cw, cx + cl, cy + cw, H, 2.6, '#cfe3ee');
    return g;
  }

  /* ---------------- build ---------------- */
  let svg, world, layers, api, view, base, itemParts = {}, selected = null, stampedIds = new Set();

  function build(target) {
    svg = target; svg.innerHTML = svg.querySelector('title') ? svg.querySelector('title').outerHTML + svg.querySelector('desc').outerHTML : '';
    const defs = S('defs', null, svg);
    defs.innerHTML = `
      <linearGradient id="lawn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ad67a"/><stop offset="1" stop-color="#6fb85c"/></linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fc2e6"/><stop offset="1" stop-color="#2f7fb8"/></linearGradient>
      <linearGradient id="water2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0d8"/><stop offset="1" stop-color="#3f9aa8"/></linearGradient>
      <linearGradient id="roofChurch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6634a"/><stop offset="1" stop-color="#b0452f"/></linearGradient>
      <linearGradient id="roofCcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f9aa8"/><stop offset="1" stop-color="#2d7480"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7d27a"/><stop offset=".5" stop-color="#e2694f"/><stop offset="1" stop-color="#3e5fa8"/></linearGradient>
      <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#e9e2d3"/><rect width="1.5" height="6" fill="#cfc5b0"/></pattern>
      <pattern id="gravel" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#d8ccb0"/><circle cx="1.5" cy="1.5" r=".8" fill="#b9ab8d"/><circle cx="4.5" cy="4" r=".7" fill="#c9bb9c"/></pattern>
      <filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="glowf" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>`;
    world = S('g', { id: 'world' }, svg);
    layers = {};
    ['terrain', 'ground', 'objects', 'tags', 'fx', 'dim', 'lift'].forEach(k => layers[k] = S('g', { id: 'L-' + k }, world));
    itemParts = { church: [], ccd: [], courts: [], parking: [], pond: [] };

    drawTerrain(); drawRoad(); drawLawn(); drawDrive(); drawParking(); drawGravel(); drawCourts(); drawPonds(); drawWalks();
    const objs = [];
    objs.push({ depth: depthOf(CHURCH), node: drawChurch() });
    objs.push({ depth: depthOf(CCD), node: drawCcd() });
    drawCourtsObjects(objs); drawParkedCars(objs); drawGate(objs); drawPoles(objs); drawDumpster(objs); drawTrees(objs); drawPondObjects(objs);
    objs.sort((a, b) => a.depth - b.depth).forEach(o => layers.objects.append(o.node));
    drawRoadCars(); drawTags();

    // Fit view to the property itself (plus the road edge), not the background terrain
    const corners = [SITE.p1, SITE.p2, SITE.p3, SITE.p4, off(r(0), -60), off(r(1), -60)].map(q => P(q[0], q[1], 0));
    const x0 = Math.min(...corners.map(q => q[0])), x1 = Math.max(...corners.map(q => q[0])), y0 = Math.min(...corners.map(q => q[1])) - 70, y1 = Math.max(...corners.map(q => q[1]));
    base = { x: x0 - 30, y: y0 - 20, w: (x1 - x0) + 60, h: (y1 - y0) + 70 };
    view = Object.assign({}, base);
    applyView();
    drawFx();
    const dimRect = S('rect', { x: base.x - 4000, y: base.y - 4000, width: base.w + 8000, height: base.h + 8000, fill: 'rgba(8,16,40,.62)', class: 'dim' }, layers.dim);
    layers.dim.style.display = 'none';
    dimRect.addEventListener('pointerup', () => { if (!dragging.moved && api.onDeselectRequest) api.onDeselectRequest(); });
    wireInteraction();
    requestAnimationFrame(initialZoom);
  }
  const depthOf = b => ((b.y0 + b.y1) / 2) - ((b.x0 + b.x1) / 2);

  /* ---------------- ground ---------------- */
  function drawTerrain() {
    const g = layers.terrain;
    // diorama slab: an island of land with visible thickness
    const island = ellipsePts(270, 200, 560, 420, 56);
    const slab = S('g', { transform: 'translate(0,18)' }, g); poly(slab, island, { fill: '#3d5f3a' });
    const slab2 = S('g', { transform: 'translate(0,9)' }, g); poly(slab2, island, { fill: '#52783f' });
    poly(g, island, { fill: '#5f9a4a' });
    // far side of the road: fields, clipped to the island
    const clip = S('clipPath', { id: 'islandClip' }, svg.querySelector('defs')); poly(clip, island, {});
    const fg = S('g', { 'clip-path': 'url(#islandClip)' }, g);
    poly(fg, [off(r(-1.2), -58), off(r(2.4), -58), off(r(2.4), -400), off(r(-1.2), -400)], { fill: '#b7c96b' });
    poly(fg, [off(r(-1.2), -120), off(r(2.4), -120), off(r(2.4), -170), off(r(-1.2), -170)], { fill: '#a1bf62', opacity: .8 });
    poly(fg, [off(r(-1.2), -230), off(r(2.4), -230), off(r(2.4), -300), off(r(-1.2), -300)], { fill: '#9dbb5f', opacity: .7 });
    // cloud shadows
    [[200, 120, 120, 40, ''], [500, 300, 150, 46, 'c2']].forEach(([x, y, rx, ry, c]) => { const [sx, sy] = P(x, y, 0); S('ellipse', { cx: sx, cy: sy, rx, ry, fill: '#0b1530', opacity: .12, class: 'cloud-shadow ' + c }, g); });
  }
  function drawRoad() {
    const g = S('g', { 'clip-path': 'url(#islandClip)' }, layers.ground);
    const t0 = -1.0, t1 = 2.0;
    poly(g, [off(r(t0), -6), off(r(t1), -6), off(r(t1), -60), off(r(t0), -60)], { fill: '#8a8f7a' });               // shoulders
    poly(g, [off(r(t0), -11), off(r(t1), -11), off(r(t1), -55), off(r(t0), -55)], { fill: '#3d4149' });             // asphalt
    line(g, off(r(t0), -33), off(r(t1), -33), { stroke: '#e8c349', 'stroke-width': 1.8, 'stroke-dasharray': '10 8' });
    line(g, off(r(t0), -13), off(r(t1), -13), { stroke: '#e6e6e6', 'stroke-width': 1.2, opacity: .8 });
    line(g, off(r(t0), -53), off(r(t1), -53), { stroke: '#e6e6e6', 'stroke-width': 1.2, opacity: .8 });
    // road name
    const a = P(...off(r(0.62), -46)), b = P(...off(r(0.9), -46));
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    S('text', { x: a[0], y: a[1], transform: `rotate(${ang.toFixed(1)} ${a[0]} ${a[1]})`, fill: '#e9e9e9', 'font-size': 11, 'font-weight': 800, 'letter-spacing': 2, opacity: .9 }, g).textContent = 'COUNTY ROAD 175';
  }
  function drawLawn() {
    const g = layers.ground;
    const lawn = [SITE.p1, SITE.p2, SITE.p3, SITE.p4];
    poly(g, lawn, { fill: 'url(#lawn)' });
    // mown stripes clipped to the lawn
    const clip = S('clipPath', { id: 'lawnClip' }, svg.querySelector('defs')); poly(clip, lawn, {});
    const sg = S('g', { 'clip-path': 'url(#lawnClip)', opacity: .18 }, g);
    for (let x = -200; x < 620; x += 36) poly(sg, [[x, -50], [x + 18, -50], [x + 18, 450], [x, 450]], { fill: '#ffffff' });
    // boundary
    const bp = S('polygon', { points: pts(lawn), fill: 'none', stroke: '#ffffff', 'stroke-width': 1.4, 'stroke-dasharray': '6 5', opacity: .55 }, g);
  }
  function drawDrive() {
    const g = S('g', { 'data-item': 'parking', class: 'item' }, layers.ground); itemParts.parking.push(g);
    // loop drive as evenodd ring
    const outer = roundedRect(LOOP.x0, LOOP.y0, LOOP.x1, LOOP.y1, LOOP.r);
    const inner = roundedRect(LOOP.x0 + LOOP.w, LOOP.y0 + LOOP.w, LOOP.x1 - LOOP.w, LOOP.y1 - LOOP.w, LOOP.r - LOOP.w);
    S('path', { d: pathFromLoops([outer, inner]), fill: '#4b4f57', 'fill-rule': 'evenodd' }, g);
    // entrance drive: from road to the loop's north side
    const gA = off(r(GATE_T), -11), gB = off(r(GATE_T), 40);
    const drive = [gA, gB, [330, 40], [330, 78]];
    const dl = S('polyline', { points: pts(drive), fill: 'none', stroke: '#4b4f57', 'stroke-width': 16, 'stroke-linejoin': 'round', 'stroke-linecap': 'butt' }, g);
    S('polyline', { points: pts([gA, gB, [330, 40], [330, 70]]), fill: 'none', stroke: '#e8c349', 'stroke-width': 1, 'stroke-dasharray': '6 6', opacity: .7 }, g);
    // direction arrows on the loop (one-way)
    [[LOOP.x0 + 12, 170, 'S'], [307, LOOP.y1 - 12, 'E'], [LOOP.x1 - 12, 170, 'N'], [307, LOOP.y0 + 12, 'W']].forEach(([x, y, dir]) => {
      const dx = dir === 'E' ? 6 : dir === 'W' ? -6 : 0, dy = dir === 'S' ? 6 : dir === 'N' ? -6 : 0;
      poly(g, [[x + dx, y + dy], [x - dx * .6 + dy * .6, y - dy * .6 + dx * .6], [x - dx * .6 - dy * .6, y - dy * .6 - dx * .6]], { fill: '#ffffff', opacity: .85 });
    });
  }
  function drawParking() {
    const g = S('g', { 'data-item': 'parking', class: 'item' }, layers.ground); itemParts.parking.push(g);
    BAYS.forEach(b => {
      poly(g, [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]], { fill: '#4b4f57' });
      const stall = 9;
      if (b.dir === 'y') { // stalls run along y, lines at x steps
        const count = Math.floor((b.x1 - b.x0) / stall);
        for (let i = 0; i <= count; i++) { const x = b.x0 + i * stall; line(g, [x, b.y0, 0], [x, b.y1, 0], { stroke: '#e9e9e9', 'stroke-width': 1, opacity: .85 }); }
        b.ada.forEach(i => poly(g, [[b.x0 + i * stall + 1, b.y0 + 1], [b.x0 + (i + 1) * stall - 1, b.y0 + 1], [b.x0 + (i + 1) * stall - 1, b.y1 - 1], [b.x0 + i * stall + 1, b.y1 - 1]], { fill: '#2f6fd6', opacity: .85 }));
        b.count = count;
      } else {
        const count = Math.floor((b.y1 - b.y0) / stall);
        for (let i = 0; i <= count; i++) { const y = b.y0 + i * stall; line(g, [b.x0, y, 0], [b.x1, y, 0], { stroke: '#e9e9e9', 'stroke-width': 1, opacity: .85 }); }
        b.ada.forEach(i => { if (i < count) poly(g, [[b.x0 + 1, b.y0 + i * stall + 1], [b.x1 - 1, b.y0 + i * stall + 1], [b.x1 - 1, b.y0 + (i + 1) * stall - 1], [b.x0 + 1, b.y0 + (i + 1) * stall - 1]], { fill: '#2f6fd6', opacity: .85 }); });
        b.count = count;
      }
    });
  }
  function drawGravel() {
    const g = layers.ground;
    S('polyline', { points: pts([[175, 238], [18, 238], [18, 356], [200, 356], [200, 292]]), fill: 'none', stroke: 'url(#gravel)', 'stroke-width': 15, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
    S('polyline', { points: pts([[175, 238], [18, 238], [18, 356], [200, 356], [200, 292]]), fill: 'none', stroke: '#b9ab8d', 'stroke-width': 1, opacity: .6, 'stroke-dasharray': '3 4', 'stroke-linejoin': 'round' }, g);
  }
  function drawCourts() {
    const g = S('g', { 'data-item': 'courts', class: 'item' }, layers.ground); itemParts.courts.push(g);
    poly(g, [[COURTS[0].x0 - 6, COURTS[0].y0 - 6], [COURTS[1].x1 + 6, COURTS[0].y0 - 6], [COURTS[1].x1 + 6, COURTS[0].y1 + 6], [COURTS[0].x0 - 6, COURTS[0].y1 + 6]], { fill: '#3f8a5c' });
    COURTS.forEach(c => {
      poly(g, [[c.x0, c.y0], [c.x1, c.y0], [c.x1, c.y1], [c.x0, c.y1]], { fill: '#e8843f' });
      poly(g, [[c.x0, c.y0], [c.x1, c.y0], [c.x1, c.y1], [c.x0, c.y1]], { fill: 'none', stroke: '#fff', 'stroke-width': 1.3 });
      const mx = (c.x0 + c.x1) / 2, my = (c.y0 + c.y1) / 2;
      line(g, [mx, c.y0, 0], [mx, c.y1, 0], { stroke: '#fff', 'stroke-width': 1.2 });
      poly(g, ellipsePts(mx, my, 6, 6, 20), { fill: 'none', stroke: '#fff', 'stroke-width': 1.2 });
      [[c.x0, 1], [c.x1, -1]].forEach(([ex, sgn]) => {
        poly(g, [[ex, my - 6], [ex + sgn * 19, my - 6], [ex + sgn * 19, my + 6], [ex, my + 6]], { fill: '#c9632f', stroke: '#fff', 'stroke-width': 1.2 });
        const arc = []; for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + Math.PI * i / 14; arc.push([ex + sgn * Math.cos(a) * 23.75 + sgn * 1.5, my + Math.sin(a) * 23.75 * .6]); }
        S('polyline', { points: pts(arc), fill: 'none', stroke: '#fff', 'stroke-width': 1.2 }, g);
      });
    });
  }
  function drawPonds() {
    const g = S('g', { 'data-item': 'pond', class: 'item' }, layers.ground); itemParts.pond.push(g);
    const lens = (ta, tb, inset, hw, fillId, fillBank) => {
      const N = 18, near = [], farr = [];
      for (let i = 0; i <= N; i++) { const u = i / N, t = ta + (tb - ta) * u, w = hw * Math.sqrt(Math.sin(Math.PI * u) + 0.02); near.push(off(r(t), inset - w)); farr.push(off(r(t), inset + w)); }
      const shape = near.concat(farr.reverse());
      const bank = near.map((p, i) => off(p, -5)).concat(farr.map(p => off(p, 5)));
      poly(g, bank, { fill: fillBank || '#8fb35a' });
      poly(g, shape, { fill: '#b98a4a', opacity: .9 });
      const inner = near.map(p => off(p, 2.5)).concat(farr.map(p => off(p, -2.5)));
      poly(g, inner, { fill: `url(#${fillId})` });
      return inner;
    };
    g.__pondA = lens(0.13, 0.56, 33, 19, 'water', '#86b25a');
    g.__pondB = lens(0.70, 0.98, 30, 13, 'water2', '#a4b866');
    // spillway marker between pond A and the road
    poly(g, [off(r(0.5), 12), off(r(0.55), 12), off(r(0.55), 17), off(r(0.5), 17)], { fill: '#d9cdb4' });
  }
  function drawWalks() {
    const g = layers.ground;
    // church entry plaza (east end) and north walk
    const gp = S('g', { 'data-item': 'church', class: 'item' }, g); itemParts.church.push(gp);
    poly(gp, [[CHURCH.x1, 143], [LOOP.x1 - LOOP.w, 143], [LOOP.x1 - LOOP.w, 187], [CHURCH.x1, 187]], { fill: 'url(#hatch)' });
    poly(gp, [[292, LOOP.y0 + LOOP.w], [308, LOOP.y0 + LOOP.w], [308, CHURCH.y0], [292, CHURCH.y0]], { fill: '#e9e2d3' });
    // ccd walk to the west bay
    const gc = S('g', { 'data-item': 'ccd', class: 'item' }, g); itemParts.ccd.push(gc);
    poly(gc, [[CCD.x1, 262], [BAYS[3].x0 + 2, 244], [BAYS[3].x0 + 2, 250], [CCD.x1, 272]], { fill: '#e9e2d3' });
    poly(gc, [[CCD.x0 - 4, CCD.y1], [CCD.x1 + 4, CCD.y1], [CCD.x1 + 4, CCD.y1 + 8], [CCD.x0 - 4, CCD.y1 + 8]], { fill: '#e9e2d3' });
  }

  /* ---------------- buildings ---------------- */
  function gothicWindow(g, x, y1, zb, w, hgt, alongX, fill) {
    // pointed-arch window on a wall plane. alongX: wall runs along x (the +y face); else on the -x face (runs along y)
    const half = w / 2, pk = zb + hgt, sh = zb + hgt * .68;
    const p = alongX
      ? [[x - half, y1, zb], [x + half, y1, zb], [x + half, y1, sh], [x, y1, pk], [x - half, y1, sh]]
      : [[x, y1 - half, zb], [x, y1 + half, zb], [x, y1 + half, sh], [x, y1, pk], [x, y1 - half, sh]];
    poly(g, p, { fill: fill || 'url(#glass)', stroke: '#8a6a4a', 'stroke-width': .8 });
  }
  function drawChurch() {
    const B = CHURCH, g = S('g', { 'data-item': 'church', class: 'item building' }, null); itemParts.church.push(g);
    const foot = [[B.x0, B.y0, 0], [B.x1, B.y0, 0], [B.x1, B.y1, 0], [B.x0, B.y1, 0]];
    const glow = S('g', { class: 'glow', filter: 'url(#glowf)' }, g); poly(glow, foot.map(p => [p[0] - 8, p[1] - 8]).concat().map((p, i) => [foot[i][0] + (i === 0 || i === 3 ? -10 : 10), foot[i][1] + (i < 2 ? -10 : 10)]), { fill: '#ffd166', opacity: .55 });
    shadowFor(g, foot, 10, 8, .32);
    const wall = '#f2e8d5', mid = (B.y0 + B.y1) / 2;
    // walls
    poly(g, [[B.x0, B.y0, 0], [B.x0, B.y1, 0], [B.x0, B.y1, B.h], [B.x0, B.y0, B.h]], { fill: shade(wall, .8) });
    poly(g, [[B.x0, B.y1, 0], [B.x1, B.y1, 0], [B.x1, B.y1, B.h], [B.x0, B.y1, B.h]], { fill: shade(wall, .95) });
    // stone base
    poly(g, [[B.x0, B.y0, 0], [B.x0, B.y1, 0], [B.x0, B.y1, 4], [B.x0, B.y0, 4]], { fill: '#b9a683' });
    poly(g, [[B.x0, B.y1, 0], [B.x1, B.y1, 0], [B.x1, B.y1, 4], [B.x0, B.y1, 4]], { fill: '#c9b892' });
    // west gable
    poly(g, [[B.x0, B.y0, B.h], [B.x0, B.y1, B.h], [B.x0, mid, B.h + B.rh]], { fill: shade(wall, .8) });
    gothicWindow(g, B.x0, mid, B.h + 2, 8, 11, false);
    gothicWindow(g, B.x0, B.y0 + 18, 6, 6, 12, false); gothicWindow(g, B.x0, B.y1 - 18, 6, 6, 12, false);
    // south wall windows and side door
    for (let i = 0; i < 6; i++) { const x = B.x0 + 14 + i * 20; if (i === 3) continue; gothicWindow(g, x, B.y1, 6, 6, 12, true); }
    poly(g, [[B.x0 + 70, B.y1, 0], [B.x0 + 78, B.y1, 0], [B.x0 + 78, B.y1, 8.5], [B.x0 + 74, B.y1, 11], [B.x0 + 70, B.y1, 8.5]], { fill: '#6b3f2a' });
    // roof
    poly(g, [[B.x0, B.y0, B.h], [B.x1, B.y0, B.h], [B.x1, mid, B.h + B.rh], [B.x0, mid, B.h + B.rh]], { fill: '#8f3a2a' });
    poly(g, [[B.x0, mid, B.h + B.rh], [B.x1, mid, B.h + B.rh], [B.x1, B.y1, B.h], [B.x0, B.y1, B.h]], { fill: 'url(#roofChurch)' });
    for (let k = 1; k < 5; k++) { const yy = mid + (B.y1 - mid) * k / 5, zz = B.h + B.rh * (1 - k / 5); line(g, [B.x0, yy, zz], [B.x1, yy, zz], { stroke: '#8f3a2a', 'stroke-width': .6, opacity: .5 }); }
    line(g, [B.x0, mid, B.h + B.rh], [B.x1, mid, B.h + B.rh], { stroke: '#f0d78a', 'stroke-width': 1.6, 'stroke-linecap': 'round' });
    // front gable stone face (mostly hidden) and cross
    poly(g, [[B.x1, B.y0, B.h], [B.x1, B.y1, B.h], [B.x1, mid, B.h + B.rh]], { fill: '#c9b892' });
    const cz = B.h + B.rh;
    line(g, [B.x1 - .5, mid, cz], [B.x1 - .5, mid, cz + 16], { stroke: '#f0d78a', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    line(g, [B.x1 - .5, mid - 5, cz + 11], [B.x1 - .5, mid + 5, cz + 11], { stroke: '#f0d78a', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    // small cross at rear
    line(g, [B.x0 + .5, mid, cz], [B.x0 + .5, mid, cz + 8], { stroke: '#f0d78a', 'stroke-width': 1.8, 'stroke-linecap': 'round' });
    line(g, [B.x0 + .5, mid - 3, cz + 5.5], [B.x0 + .5, mid + 3, cz + 5.5], { stroke: '#f0d78a', 'stroke-width': 1.8, 'stroke-linecap': 'round' });
    // flagpole with flag at the plaza
    const fp = [CHURCH.x1 + 30, 195];
    line(g, [fp[0], fp[1], 0], [fp[0], fp[1], 26], { stroke: '#d8d8d8', 'stroke-width': 1.2 });
    const fa = P(fp[0], fp[1], 26); S('polygon', { class: 'flag', points: `${fa[0]},${fa[1]} ${fa[0] + 14},${fa[1] + 3} ${fa[0]},${fa[1] + 8}`, fill: '#f0d78a' }, g);
    addStar(g, 'church', [B.x1, B.y0, B.h + B.rh + 22]);
    return g;
  }
  function drawCcd() {
    const B = CCD, g = S('g', { 'data-item': 'ccd', class: 'item building' }, null); itemParts.ccd.push(g);
    const foot = [[B.x0, B.y0, 0], [B.x1, B.y0, 0], [B.x1, B.y1, 0], [B.x0, B.y1, 0]];
    const glow = S('g', { class: 'glow', filter: 'url(#glowf)' }, g); poly(glow, [[B.x0 - 10, B.y0 - 10], [B.x1 + 10, B.y0 - 10], [B.x1 + 10, B.y1 + 10], [B.x0 - 10, B.y1 + 10]], { fill: '#7ad0e6', opacity: .55 });
    shadowFor(g, foot, 9, 7, .3);
    const wall = '#c9c2b6', mid = (B.y0 + B.y1) / 2;
    poly(g, [[B.x0, B.y0, 0], [B.x0, B.y1, 0], [B.x0, B.y1, B.h], [B.x0, B.y0, B.h]], { fill: shade(wall, .8) });
    poly(g, [[B.x0, B.y1, 0], [B.x1, B.y1, 0], [B.x1, B.y1, B.h], [B.x0, B.y1, B.h]], { fill: shade(wall, .96) });
    // panel joints
    for (let i = 1; i < 8; i++) { const x = B.x0 + i * (B.x1 - B.x0) / 8; line(g, [x, B.y1, 0], [x, B.y1, B.h], { stroke: '#a39c90', 'stroke-width': .5 }); }
    for (let i = 1; i < 5; i++) { const y = B.y0 + i * (B.y1 - B.y0) / 5; line(g, [B.x0, y, 0], [B.x0, y, B.h], { stroke: '#8f887c', 'stroke-width': .5 }); }
    // windows (rectangular, south face)
    for (let i = 0; i < 8; i++) { if (i === 3 || i === 4) continue; const x = B.x0 + 10 + i * 15; poly(g, [[x, B.y1, 5], [x + 8, B.y1, 5], [x + 8, B.y1, 12], [x, B.y1, 12]], { fill: '#9fd3e8', stroke: '#5b6f78', 'stroke-width': .7 }); }
    for (let i = 0; i < 3; i++) { const y = B.y0 + 12 + i * 26; poly(g, [[B.x0, y, 5], [B.x0, y + 10, 5], [B.x0, y + 10, 12], [B.x0, y, 12]], { fill: '#8fc3d8', stroke: '#5b6f78', 'stroke-width': .7 }); }
    // gables
    poly(g, [[B.x0, B.y0, B.h], [B.x0, B.y1, B.h], [B.x0, mid, B.h + B.rh]], { fill: shade(wall, .8) });
    poly(g, [[B.x0, B.y0, B.h], [B.x1, B.y0, B.h], [B.x1, mid, B.h + B.rh], [B.x0, mid, B.h + B.rh]], { fill: '#25606a' });
    poly(g, [[B.x0, mid, B.h + B.rh], [B.x1, mid, B.h + B.rh], [B.x1, B.y1, B.h], [B.x0, B.y1, B.h]], { fill: 'url(#roofCcd)' });
    line(g, [B.x0, mid, B.h + B.rh], [B.x1, mid, B.h + B.rh], { stroke: '#e9f4f6', 'stroke-width': 1.4, 'stroke-linecap': 'round' });
    // stone entry portico on the south face
    const px0 = B.x0 + 52, px1 = B.x0 + 74, py1 = B.y1 + 10;
    poly(g, [[px0, B.y1, 0], [px0, py1, 0], [px0, py1, 12], [px0, B.y1, 12]], { fill: '#b9a683' });
    poly(g, [[px0, py1, 0], [px1, py1, 0], [px1, py1, 12], [px0, py1, 12]], { fill: '#cbb995' });
    poly(g, [[px0 + 4, py1, 0], [px1 - 4, py1, 0], [px1 - 4, py1, 8], [px0 + 4, py1, 8]], { fill: '#3b3f4a' });
    poly(g, [[px0 - 2, B.y1, 12], [px1 + 2, B.y1, 12], [px1 + 2, py1 + 2, 12], [px0 - 2, py1 + 2, 12]], { fill: '#2d7480' });
    poly(g, [[px0 - 2, py1 + 2, 12], [px1 + 2, py1 + 2, 12], [(px0 + px1) / 2, py1 + 2, 18]], { fill: '#cbb995' });
    poly(g, [[px0 - 2, B.y1, 12], [px1 + 2, B.y1, 12], [(px0 + px1) / 2, B.y1, 18], [(px0 + px1) / 2, py1 + 2, 18], [px1 + 2, py1 + 2, 12]], { fill: '#3f9aa8', opacity: .95 });
    addStar(g, 'ccd', [B.x1, B.y0, B.h + B.rh + 20]);
    return g;
  }
  function addStar(g, id, at) {
    const [sx, sy] = P(at[0], at[1], at[2]);
    const s = S('g', { class: 'stamp-star', 'data-star': id }, g);
    S('polygon', { points: '0,-13 4,-4 13,-3 6,3 8,12 0,7 -8,12 -6,3 -13,-3 -4,-4', fill: '#ffd166', stroke: '#c9a24a', 'stroke-width': 1.5, transform: `translate(${sx.toFixed(1)},${sy.toFixed(1)})` }, s);
    // note: translate lives on the polygon; the CSS animation targets the polygon too, so we wrap once more
    const poly0 = s.firstChild; const wrap = S('g', { transform: `translate(${sx.toFixed(1)},${sy.toFixed(1)})` }, s); poly0.removeAttribute('transform'); wrap.append(poly0);
  }

  /* ---------------- objects ---------------- */
  function drawCourtsObjects(objs) {
    COURTS.forEach((c, ci) => {
      const my = (c.y0 + c.y1) / 2;
      [[c.x0 + 1.5, 1], [c.x1 - 1.5, -1]].forEach(([ex, sgn]) => {
        const g = S('g', { 'data-item': 'courts', class: 'item' }, null); itemParts.courts.push(g);
        line(g, [ex, my, 0], [ex, my, 10], { stroke: '#555b66', 'stroke-width': 1.6 });
        poly(g, [[ex + sgn * 1.2, my - 3, 8], [ex + sgn * 1.2, my + 3, 8], [ex + sgn * 1.2, my + 3, 12], [ex + sgn * 1.2, my - 3, 12]], { fill: '#f4f4f4', stroke: '#777', 'stroke-width': .6 });
        poly(g, ellipsePts(ex + sgn * 2.6, my, 1.2, 1.2, 10, 10), { fill: 'none', stroke: '#ff7a1a', 'stroke-width': 1.2 });
        objs.push({ depth: my - ex, node: g });
      });
      if (ci === 0) {
        const g = S('g', { 'data-item': 'courts', class: 'item' }, null); itemParts.courts.push(g);
        const bp = P(c.x0 + 22, my + 6, 0);
        S('ellipse', { class: 'ball-shadow', cx: bp[0], cy: bp[1], rx: 3, ry: 1.4, fill: '#0b1530', opacity: .35 }, g);
        S('circle', { class: 'ball', cx: bp[0], cy: bp[1] - 5, r: 2.6, fill: '#ff7a1a', stroke: '#8a3d0e', 'stroke-width': .6 }, g);
        objs.push({ depth: (my + 6) - (c.x0 + 22), node: g });
      }
    });
  }
  function drawParkedCars(objs) {
    const cols = ['#e63946', '#f4a261', '#2a9d8f', '#8338ec', '#ffd166', '#118ab2', '#ffffff', '#6c757d', '#ff70a6', '#06d6a0', '#c1121f', '#3a86ff'];
    const spots = [[0, 3], [0, 6], [0, 10], [0, 15], [0, 19], [1, 2], [1, 6], [1, 11], [2, 4], [2, 9], [2, 14], [2, 20], [3, 3], [3, 8], [3, 12]];
    spots.forEach(([bi, si], k) => {
      const b = BAYS[bi]; if (si >= b.count) return;
      let cx, cy, alongX;
      if (b.dir === 'y') { cx = b.x0 + si * 9 + 4.5; cy = (b.y0 + b.y1) / 2; alongX = false; } else { cx = (b.x0 + b.x1) / 2; cy = b.y0 + si * 9 + 4.5; alongX = true; }
      const g = car(null, cx, cy, alongX, cols[k % cols.length], { 'data-item': 'parking', class: 'item' });
      itemParts.parking.push(g); objs.push({ depth: cy - cx, node: g });
    });
  }
  function drawGate(objs) {
    const gp = off(r(GATE_T), 3);
    [-13, 13].forEach(k => {
      const c = along(gp, k), g = S('g', { 'data-item': 'parking', class: 'item' }, null); itemParts.parking.push(g);
      box(g, c[0] - 2, c[1] - 2, c[0] + 2, c[1] + 2, 0, 7, '#c9b892'); const t = P(c[0], c[1], 7); S('circle', { cx: t[0], cy: t[1] - 1, r: 1.6, fill: '#f0d78a' }, g);
      objs.push({ depth: c[1] - c[0], node: g });
    });
    // open gate leaf and a monument sign
    const g2 = S('g', { 'data-item': 'parking', class: 'item' }, null); itemParts.parking.push(g2);
    const a = along(gp, 14), b = along(gp, 26);
    for (let z = 1; z <= 6; z += 1.2) line(g2, [a[0], a[1], z], [b[0], b[1], z], { stroke: '#2b2a28', 'stroke-width': .7 });
    line(g2, [a[0], a[1], 0], [a[0], a[1], 6.5], { stroke: '#2b2a28', 'stroke-width': 1 });
    objs.push({ depth: b[1] - b[0], node: g2 });
    const sgn = off(r(GATE_T + 0.07), 14), g3 = S('g', {}, null);
    box(g3, sgn[0] - 6, sgn[1] - 1.5, sgn[0] + 6, sgn[1] + 1.5, 0, 5, '#c9b892');
    const cp = P(sgn[0] - 4, sgn[1] + 1.6, 3.2); S('text', { x: cp[0], y: cp[1], 'font-size': 3.2, 'font-weight': 800, fill: '#2f5d50' }, g3).textContent = '✝ St. Alphonsa';
    objs.push({ depth: sgn[1] - sgn[0], node: g3 });
  }
  function drawPoles(objs) {
    [[212, 64], [400, 64], [212, 276], [400, 276], [436, 100], [436, 230]].forEach(([x, y]) => {
      const g = S('g', {}, null);
      line(g, [x, y, 0], [x, y, 22], { stroke: '#8a8f99', 'stroke-width': 1 });
      const t = P(x, y, 22); S('ellipse', { cx: t[0], cy: t[1], rx: 3, ry: 1.2, fill: '#fff3c4' }, g);
      S('ellipse', { cx: t[0], cy: t[1], rx: 7, ry: 3, fill: '#fff3c4', opacity: .18 }, g);
      objs.push({ depth: y - x, node: g });
    });
  }
  function drawDumpster(objs) {
    const g = S('g', {}, null);
    poly(g, [[324, 298], [340, 298], [340, 310], [324, 310]], { fill: '#8a8f7a' });
    box(g, 327, 300, 337, 306, 0, 5, '#2f7f5a');
    objs.push({ depth: 303 - 332, node: g });
  }
  function drawTrees(objs) {
    const list = [
      [-14, 30, 26, 12, '#3f8f3f'], [-12, 95, 22, 10, '#4c9c45'], [-16, 160, 28, 13, '#2f7a44'], [-13, 225, 24, 11, '#57a34a'], [-15, 300, 27, 12, '#3f8f3f'], [-12, 365, 22, 10, '#4c9c45'],
      [60, 372, 24, 11, '#57a34a'], [130, 374, 26, 12, '#2f7a44'], [250, 372, 22, 10, '#4c9c45'], [300, 375, 27, 12, '#3f8f3f'], [380, 372, 24, 11, '#57a34a'], [450, 368, 22, 10, '#3f8f3f'],
      [60, -14, 26, 12, '#2f7a44'], [140, -12, 22, 10, '#57a34a'], [230, -16, 26, 12, '#3f8f3f'],
      [222, 112, 14, 6, '#6fbf5a'], [222, 228, 14, 6, '#6fbf5a'], [393, 112, 14, 6, '#6fbf5a'], [393, 228, 14, 6, '#6fbf5a'],
      [100, 240, 20, 9, '#4c9c45'], [10, 205, 20, 9, '#3f8f3f'], [178, 195, 16, 7, '#57a34a'], [178, 300, 20, 9, '#2f7a44'],
      [300, 30, 18, 8, '#57a34a'], [150, 40, 22, 10, '#3f8f3f'], [60, 120, 24, 11, '#4c9c45'], [120, 120, 20, 9, '#2f7a44'],
      [470, 290, 20, 9, '#57a34a'], [490, 330, 18, 8, '#3f8f3f'], [510, 20, 20, 9, '#4c9c45']
    ];
    // avenue across the road
    for (let t = -0.9; t <= 1.9; t += 0.16) { const p = off(r(t), -78); list.push([p[0], p[1], 26, 12, ['#3f8f3f', '#2f7a44', '#57a34a'][Math.abs(Math.round(t * 10)) % 3]]); }
    list.forEach(([x, y, h, rad, col]) => objs.push({ depth: y - x, node: tree(null, x, y, h, rad, col) }));
  }
  function drawPondObjects(objs) {
    const g = S('g', { 'data-item': 'pond', class: 'item' }, null); itemParts.pond.push(g);
    [[0.22, 33], [0.36, 30], [0.47, 36], [0.82, 30]].forEach(([t, k], i) => {
      const c = P(...off(r(t), k), 0);
      S('ellipse', { class: 'ripple', cx: c[0], cy: c[1], rx: 9, ry: 4, fill: 'none', stroke: '#fff', 'stroke-width': 1, style: `animation-delay:${-i * 0.8}s` }, g);
    });
    // reeds along the far bank
    [0.16, 0.2, 0.5, 0.54, 0.72, 0.95].forEach(t => { const p = off(r(t), 52); for (let k = 0; k < 3; k++) line(g, [p[0] + k * 1.5, p[1] - k, 0], [p[0] + k * 1.5 + .6, p[1] - k, 6 + (k % 2) * 2], { stroke: '#3f8a3f', 'stroke-width': .9, 'stroke-linecap': 'round' }); });
    // a duck
    const dk = P(...off(r(0.3), 33), 0); S('ellipse', { cx: dk[0], cy: dk[1], rx: 2.4, ry: 1.3, fill: '#fff' }, g); S('circle', { cx: dk[0] + 2, cy: dk[1] - 1.4, r: 1.1, fill: '#fff' }, g);
    const c = off(r(0.34), 33); objs.push({ depth: c[1] - c[0] + 40, node: g });
  }
  function drawRoadCars() {
    const g = layers.objects;
    const lane = (k, from, to, dur, col, delay) => {
      const a = P(...off(r(from), k), 0), b = P(...off(r(to), k), 0);
      const cg = S('g', {}, g);
      const L = 15, W = 6.4; const cx = 0, cy = 0;
      // car body oriented along the road: build in local coords around origin then translate via animateMotion
      const corners = [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]].map(([u, v]) => [u * d[0] - v * d[1] * -1, u * d[1] + v * d[0]]);
      const rot = ([u, v]) => [u * d[0] - v * n[0] * -1, u * d[1] - v * n[1] * -1];
      const q = (u, v, z) => { const lx = u * d[0] + v * n[0], ly = u * d[1] + v * n[1]; return [lx, ly, z]; };
      const bodyTop = [q(-7.5, -3.2, 4), q(7.5, -3.2, 4), q(7.5, 3.2, 4), q(-7.5, 3.2, 4)];
      const sideA = [q(-7.5, 3.2, 0), q(7.5, 3.2, 0), q(7.5, 3.2, 4), q(-7.5, 3.2, 4)];
      const sideB = [q(-7.5, -3.2, 0), q(-7.5, 3.2, 0), q(-7.5, 3.2, 4), q(-7.5, -3.2, 4)];
      poly(cg, sideB, { fill: shade(col, .75) }); poly(cg, sideA, { fill: shade(col, .9) }); poly(cg, bodyTop, { fill: col });
      poly(cg, [q(-3.5, -2.6, 4), q(3.5, -2.6, 4), q(3.5, 2.6, 4), q(-3.5, 2.6, 4)].map(p => [p[0], p[1], 6.4]), { fill: '#cfe3ee' });
      poly(cg, [q(-3.5, 2.6, 4), q(3.5, 2.6, 4), q(3.5, 2.6, 6.4), q(-3.5, 2.6, 6.4)], { fill: '#9fbfd0' });
      const am = S('animateMotion', { dur: dur + 's', repeatCount: 'indefinite', begin: (delay || 0) + 's', path: `M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}` }, cg);
    };
    lane(-24, -0.9, 1.9, 20, '#e63946', 0); lane(-24, -0.9, 1.9, 20, '#ffd166', -11);
    lane(-42, 1.9, -0.9, 24, '#3a86ff', -5); lane(-42, 1.9, -0.9, 24, '#ffffff', -17);
  }

  /* ---------------- tags & fx ---------------- */
  const TAG_AT = {
    church: () => P(250, 165, CHURCH.h + CHURCH.rh + 34), ccd: () => P(135, 299, CCD.h + CCD.rh + 28), courts: () => P(40, 205, 34),
    parking: () => P(330, 276, 22), pond: () => { const c = off(r(0.5), 33); return P(c[0], c[1], 30); }
  };
  function drawTags() {
    window.DATA.items.forEach(it => {
      const [sx, sy] = TAG_AT[it.id]();
      const w = it.name.length * 7.4 + 34;
      const g = S('g', { class: 'tag item', 'data-item': it.id, tabindex: 0, role: 'button', 'aria-label': it.name + '. ' + it.kind }, layers.tags);
      S('line', { x1: sx, y1: sy + 12, x2: sx, y2: sy + 26, stroke: '#fff', 'stroke-width': 1.5, opacity: .8 }, g);
      S('circle', { cx: sx, cy: sy + 27, r: 2.5, fill: '#fff' }, g);
      S('rect', { x: sx - w / 2, y: sy - 12, width: w, height: 26, rx: 13 }, g);
      S('text', { x: sx - w / 2 + 10, y: sy + 6, 'font-size': 14 }, g).textContent = it.icon;
      S('text', { x: sx - w / 2 + 30, y: sy + 6 }, g).textContent = it.name;
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api.onTap && api.onTap(it.id); } });
    });
  }
  function drawFx() {
    const g = layers.fx;
    [['', base.x + 40, base.y + 30], ['b2', base.x + 120, base.y + 10]].forEach(([c, x, y]) => {
      const b = S('g', { class: 'bird ' + c }, g);
      S('path', { d: `M${x},${y} q4,-4 8,0 q4,-4 8,0`, fill: 'none', stroke: '#e9eef5', 'stroke-width': 1.4, 'stroke-linecap': 'round' }, b);
    });
  }

  /* ---------------- view / interaction ---------------- */
  function applyView() { svg.setAttribute('viewBox', `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`); }
  function stageRect() { return svg.getBoundingClientRect(); }
  function svgPoint(clientX, clientY) { const rct = stageRect(); const sc = Math.max(view.w / rct.width, view.h / rct.height); const ox = (rct.width - view.w / sc) / 2, oy = (rct.height - view.h / sc) / 2; return [view.x + (clientX - rct.left - ox) * sc, view.y + (clientY - rct.top - oy) * sc]; }
  function zoomAt(factor, cx, cy) {
    const minW = base.w / 6, maxW = base.w * 1.6;
    const nw = Math.max(minW, Math.min(maxW, view.w / factor)); const f = nw / view.w;
    view.x = cx - (cx - view.x) * f; view.y = cy - (cy - view.y) * f; view.w = nw; view.h = view.h * f; applyView();
  }
  function initialZoom() {
    const rct = stageRect(); if (!rct.width) return;
    const stageAspect = rct.width / rct.height, mapAspect = base.w / base.h;
    if (stageAspect < mapAspect * 0.85) { // narrow screen: fit the interactive part (labels + buildings), not the whole site
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      const grow = b => { if (!b.width && !b.height) return; x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); };
      grow(layers.tags.getBBox()); Object.values(itemParts).forEach(parts => parts.forEach(pt => grow(pt.getBBox())));
      x0 -= 14; y0 -= 14; x1 += 14; y1 += 14;
      let w = x1 - x0, h = y1 - y0; if (w / h < stageAspect) w = h * stageAspect; else h = w / stageAspect;
      view.w = w; view.h = h; view.x = (x0 + x1) / 2 - w / 2; view.y = (y0 + y1) / 2 - h / 2; applyView();
    }
  }
  let anim = null;
  function animateTo(target, ms) {
    if (anim) cancelAnimationFrame(anim);
    const from = Object.assign({}, view), t0 = performance.now();
    const step = t => { const u = Math.min(1, (t - t0) / (ms || 500)), e = 1 - Math.pow(1 - u, 3); ['x', 'y', 'w', 'h'].forEach(k => view[k] = from[k] + (target[k] - from[k]) * e); applyView(); if (u < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  // Center a bbox in a sub-rectangle of the stage (fractions), keeping aspect.
  function focusOn(bbox, region, padFactor) {
    const rct = stageRect(); const stageAspect = rct.width / rct.height;
    const rw = region.w * rct.width, rh = region.h * rct.height;
    let w = Math.max(bbox.width * (padFactor || 1.9), 160); let h = w / (rw / rh); if (h < bbox.height * 1.6) { h = bbox.height * 1.6; w = h * (rw / rh); }
    // scale so region shows w x h; whole view is then larger by stage/region ratio
    const vw = w / region.w, vh = vw / stageAspect;
    const cx = bbox.x + bbox.width / 2, cy = bbox.y + bbox.height / 2;
    const rcx = region.x + region.w / 2, rcy = region.y + region.h / 2;
    animateTo({ w: vw, h: vh, x: cx - rcx * vw, y: cy - rcy * vh }, 550);
  }
  const dragging = { active: false, moved: false };
  function wireInteraction() {
    const ptrs = new Map(); let last = null, pinch = null;
    svg.addEventListener('pointerdown', e => { svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); dragging.active = true; dragging.moved = false; last = [e.clientX, e.clientY]; dragging.target = e.target.closest('[data-item]'); if (ptrs.size === 2) { const a = [...ptrs.values()]; pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) }; } });
    svg.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) { hover(e); return; }
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2 && pinch) {
        const a = [...ptrs.values()]; const dd = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); const mid = svgPoint((a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2);
        zoomAt(dd / pinch.d, mid[0], mid[1]); pinch.d = dd; dragging.moved = true; return;
      }
      if (ptrs.size === 1 && last) {
        const dx = e.clientX - last[0], dy = e.clientY - last[1];
        if (Math.abs(e.clientX - [...ptrs.values()][0][0]) + Math.abs(dy) > 0 && (Math.abs(dx) > 0 || Math.abs(dy) > 0)) {
          const rct = stageRect(); const sc = Math.max(view.w / rct.width, view.h / rct.height);
          if (!dragging.moved && Math.hypot(e.clientX - dragging.startX || 0, 0) >= 0) { /* noop */ }
          view.x -= dx * sc; view.y -= dy * sc; applyView(); last = [e.clientX, e.clientY];
          dragging.dist = (dragging.dist || 0) + Math.abs(dx) + Math.abs(dy); if (dragging.dist > 8) dragging.moved = true;
        }
      }
    });
    const end = e => {
      ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (ptrs.size === 0) {
        const wasMoved = dragging.moved; const tgt = dragging.target; dragging.active = false; dragging.dist = 0;
        if (!wasMoved && tgt && tgt.dataset.item && api.onTap) api.onTap(tgt.dataset.item);
        setTimeout(() => { dragging.moved = false; }, 0); last = null;
      }
    };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', e => { e.preventDefault(); const p = svgPoint(e.clientX, e.clientY); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, p[0], p[1]); }, { passive: false });
    svg.addEventListener('dblclick', e => { const p = svgPoint(e.clientX, e.clientY); zoomAt(1.6, p[0], p[1]); });
    let hovered = null;
    function hover(e) { const t = e.target.closest && e.target.closest('[data-item]'); const id = t ? t.dataset.item : null; if (id === hovered) return; if (hovered) setClass(hovered, 'hover', false); hovered = id; if (id) setClass(id, 'hover', true); svg.style.cursor = id ? 'pointer' : 'grab'; }
  }
  function setClass(id, cls, on) { (itemParts[id] || []).forEach(p => p.classList.toggle(cls, on)); }

  /* ---------------- selection (lift) ---------------- */
  let placeholders = [], prevView = null;
  function select(id, region) {
    if (!selected) prevView = Object.assign({}, view);
    deselect(true);
    selected = id; layers.dim.style.display = ''; svg.closest('.stage').classList.add('dimmed');
    placeholders = [];
    const parts = itemParts[id].concat(Array.from(layers.tags.querySelectorAll(`[data-item="${id}"]`)));
    // bbox before moving
    let bb = null; parts.forEach(p => { const b = p.getBBox(); if (!b.width && !b.height) return; bb = bb ? { x: Math.min(bb.x, b.x), y: Math.min(bb.y, b.y), x2: Math.max(bb.x2, b.x + b.width), y2: Math.max(bb.y2, b.y + b.height) } : { x: b.x, y: b.y, x2: b.x + b.width, y2: b.y + b.height }; });
    parts.forEach(p => { const ph = document.createComment('ph'); p.parentNode.insertBefore(ph, p); placeholders.push([p, ph]); layers.lift.append(p); p.classList.add('lift'); });
    if (bb) focusOn({ x: bb.x, y: bb.y, width: bb.x2 - bb.x, height: bb.y2 - bb.y }, region || { x: 0, y: 0, w: 1, h: 1 });
  }
  function deselect(silent) {
    if (!selected) return;
    placeholders.forEach(([p, ph]) => { p.classList.remove('lift'); ph.parentNode.insertBefore(p, ph); ph.remove(); }); placeholders = [];
    layers.dim.style.display = 'none'; svg.closest('.stage').classList.remove('dimmed'); selected = null;
    if (!silent && prevView) { animateTo(prevView, 450); prevView = null; }
  }
  function pulse(id, cls) { const parts = itemParts[id] || []; parts.forEach(p => { p.classList.remove(cls); void p.getBBox(); p.classList.add(cls); setTimeout(() => p.classList.remove(cls), 900); }); }
  function setStamped(id, on) { svg.querySelectorAll(`[data-star="${id}"]`).forEach(s => s.classList.toggle('on', on)); }
  function sparkle(id) {
    const parts = itemParts[id]; if (!parts || !parts.length) return; const b = parts[0].getBBox(); const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    for (let i = 0; i < 14; i++) { const c = S('circle', { cx: cx + Math.cos(i / 14 * 6.28) * b.width * .35, cy: cy + Math.sin(i / 14 * 6.28) * b.height * .35, r: 3 + Math.random() * 4, fill: i % 2 ? '#ffd166' : '#fff' }, layers.fx); c.animate([{ opacity: 1, transform: 'scale(.4)' }, { opacity: 0, transform: 'scale(2.2)' }], { duration: 900, fill: 'forwards' }); setTimeout(() => c.remove(), 950); }
  }
  function resetView() { deselect(); animateTo(base, 500); requestAnimationFrame(() => setTimeout(initialZoom, 520)); }

  api = { build, select, deselect, pulse, setStamped, sparkle, zoom: f => { zoomAt(f, view.x + view.w / 2, view.y + view.h / 2); }, resetView, onTap: null, onDeselectRequest: null, get selected() { return selected; }, P };
  return api;
})();
