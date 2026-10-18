/* =====================================================================
   ISO MAP  |  Generates the isometric campus from a site model (feet),
   handles pan/zoom, hover, selection lift, intro motion, and stamp stars.
   Site coordinates: x runs along the church's long axis (front faces +x,
   toward County Road 175), y across. Projection:
     sx = (x + y) * SX,  sy = (y - x) * SY - z      (north is up-left)
   ===================================================================== */
window.IsoMap = (function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const SX = 0.866, SY = 0.6;
  const P = (x, y, z) => [(x + y) * SX, (y - x) * SY - (z || 0)];
  const pts = arr => arr.map(p => P(p[0], p[1], p[2]).map(v => v.toFixed(1)).join(',')).join(' ');
  const S = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.round(Math.min(255, r * f)); g = Math.round(Math.min(255, g * f)); b = Math.round(Math.min(255, b * f)); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); };

  /* ---------------- Site model (feet) ----------------
     Digitised from the civil site plan (scale 1 in = 30 ft). Plan pixels are converted to feet
     and rotated so the church's long axis is +x; +y runs toward the south-east boundary. */
  const PLAN = { origin: [57, 350], scale: 1.766, cos: Math.cos(-16.8 * Math.PI / 180), sin: Math.sin(-16.8 * Math.PI / 180), ox: 20, oy: 30 };
  const M = (px, py) => { const dx = px - PLAN.origin[0], dy = py - PLAN.origin[1], c = PLAN.cos, s = PLAN.sin; return [(dx * c + dy * s) / PLAN.scale + PLAN.ox, (-dx * s + dy * c) / PLAN.scale + PLAN.oy]; };
  const SITE = { W: M(57, 350), N: M(650, 125), E: M(1311, 743), S: M(320, 1073) };     // 4.916 acres: 359 ft NW edge, 508 ft frontage, 590 ft SE edge, 451 ft SW edge
  const RD = [SITE.E[0] - SITE.N[0], SITE.E[1] - SITE.N[1]]; const RL = Math.hypot(RD[0], RD[1]);
  const d = [RD[0] / RL, RD[1] / RL];                       // along County Road 175, north corner to east corner
  const n = [-d[1], d[0]];                                  // into the site
  const r = t => [SITE.N[0] + RD[0] * t, SITE.N[1] + RD[1] * t];
  const off = (p, k) => [p[0] + n[0] * k, p[1] + n[1] * k];
  const along = (p, k) => [p[0] + d[0] * k, p[1] + d[1] * k];
  const tk = (t, k) => off(r(t), k);
  const add2 = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const kOf = p => (p[0] - SITE.N[0]) * n[0] + (p[1] - SITE.N[1]) * n[1];
  const tOf = p => ((p[0] - SITE.N[0]) * d[0] + (p[1] - SITE.N[1]) * d[1]) / RL;

  const cc = add2(M(624, 579), [-12, 6]);
  const CHURCH = { x0: cc[0] - 62.5, y0: cc[1] - 41, x1: cc[0] + 62.5, y1: cc[1] + 41, h: 22, rh: 18 };          // 125 x 82, front faces the road
  const cd = add2(M(387, 852), [-8, 0]);
  const CCD = { x0: cd[0] - 41, y0: cd[1] - 62.5, x1: cd[0] + 41, y1: cd[1] + 62.5, h: 16, rh: 12 };             // 82 x 125, at right angles to the church
  const c1 = add2(M(257, 684), [-8, 0]), c2 = add2(M(367, 638), [-8, 0]), cyc = (c1[1] + c2[1]) / 2;
  const COURTS = [{ x0: c1[0] - 30, y0: cyc - 15, x1: c1[0] + 30, y1: cyc + 15 }, { x0: c2[0] - 30, y0: cyc - 15, x1: c2[0] + 30, y1: cyc + 15 }];
  // Existing residence (the rectory): long axis parallel to County Road 175, reached by the existing drive and its turnaround
  const RECTORY = { c: tk(0, 178), u: d, hl: 24, hw: 15, h: 11, rh: 7 };
  RECTORY.x0 = RECTORY.c[0] - 30; RECTORY.x1 = RECTORY.c[0] + 30; RECTORY.y0 = RECTORY.c[1] - 30; RECTORY.y1 = RECTORY.c[1] + 30;
  const EX_DRIVE = [tk(.03, 12), tk(.03, 70), tk(-.02, 150)];
  const HAMMER = [tk(-.08, 150), tk(.04, 150)];                                                             // fire truck turnaround by the house
  // Loop drive as drawn: straight on the CCD side, then one continuous sweep round the front of the church back to the south leg
  const LOOP = { x0: 200, y0: 168, y1: 424, xc: 300, yc: 296, rx: 130, ry: 128, w: 24 };
  const HW = LOOP.w / 2;
  const STALL = 9, DEPTH = 18;
  const CY = (CHURCH.y0 + CHURCH.y1) / 2;
  const arcX = (rx, ry) => LOOP.xc + rx * Math.sqrt(Math.max(0, 1 - ((CY - LOOP.yc) / ry) ** 2));   // x of an ellipse round the loop centre where it crosses the church axis
  LOOP.x1 = arcX(LOOP.rx, LOOP.ry); LOOP.axIn = arcX(LOOP.rx - HW, LOOP.ry - HW); LOOP.axOut = arcX(LOOP.rx + HW, LOOP.ry + HW);
  const unit = v => { const L = Math.hypot(v[0], v[1]); return [v[0] / L, v[1] / L]; };
  const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const LOOP_CL = (() => {
    const vs = [{ p: [LOOP.x0, LOOP.y0], r: 40 }];
    ellipseArc(LOOP.xc, LOOP.yc, LOOP.rx, LOOP.ry, -Math.PI / 2, Math.PI / 2, 48).forEach(q => vs.push({ p: q, r: 0 }));
    vs.push({ p: [LOOP.x0, LOOP.y1], r: 40 });
    return fillet(vs, 8);
  })();
  const EA = { o: [468, 275], u: unit([0.2, 0.98]), len: 148 };                        // east aisle from the loop down to the south-east field
  const EAp = [-EA.u[1], EA.u[0]];                                                        // its normal (points west)
  // Parking rows as drawn: o = start of the row on the aisle edge, u = direction along the row, side = which way the stalls extend (+1 = left of u, -1 = right of u)
  const ROWS = [
    { o: [209, LOOP.y0 + HW], u: [1, 0], side: 1, n: 10, ada: [0, 1, 2, 3] },          // top row facing the church (4 ADA + regular; continues round the curve)
    { o: [235, LOOP.y1 - HW], u: [1, 0], side: -1, n: 7, ada: [] },                    // 7 inside the south leg
    { o: [225, LOOP.y1 + HW], u: [1, 0], side: 1, n: 8, ada: [] },                     // 8 outside the south leg
    { o: [LOOP.x0 - HW, 331], u: [0, 1], side: 1, n: 7, ada: [0, 1, 2, 3, 4, 5, 6] },  // 7 ADA by the CCD
    { o: tk(.17, 63), u: d, side: -1, n: 11, ada: [] },                                // along the pond (16 in the plan)
    { o: add(add(EA.o, EA.u, 40), EAp, 12), u: EA.u, side: 1, n: 10, ada: [] },        // 10 between the loop and the east aisle
    { o: add(EA.o, EAp, -12), u: EA.u, side: -1, n: 13, ada: [] },                     // 16 along the east aisle, by the basin
    { o: [420, LOOP.y1 + HW - 2], u: [1, 0], side: 1, n: 8, ada: [] }                  // 9 at the south-east boundary
  ];
  ROWS.forEach(rw => { rw.u = unit(rw.u); rw.v = rw.side > 0 ? [-rw.u[1], rw.u[0]] : [rw.u[1], -rw.u[0]]; });
  const ARC_STALLS = [{ a: [-90, -12], out: false }, { a: [12, 48], out: false }, { a: [60, 85], out: false }, { a: [40, 80], out: true }];   // radial stalls round the curve, degrees from the top; gap at the entry plaza
  const ENTRY_DRIVE = [tk(.03, -11), tk(.05, 22), tk(.09, 48), tk(.16, 64), tk(.26, 72), tk(.36, 76), tk(.42, 82)];       // one bowed lane from the gate along the pond into the loop's curve
  const EAST_AISLE = [[LOOP.x1 - 4, 266], EA.o, add(EA.o, EA.u, EA.len)];                                                   // aisle to the south-east field
  const CCD_LOOP = [[LOOP.x0 - HW + 2, CCD.y0 - 16], [CCD.x0 - 16, CCD.y0 - 16], [CCD.x0 - 16, CCD.y1 + 16], [CCD.x1 + 16, CCD.y1 + 16], [LOOP.x0 + 18, LOOP.y1 + 6]];   // paved loop round the CCD, back into the church loop
  const POND = [tk(.085, 8), tk(.56, 8), tk(.56, 12), tk(.52, 30), tk(.47, 34), tk(.35, 42), tk(.2, 44), tk(.11, 44), tk(.09, 30)];
  const BASIN = [tk(.575, 8), tk(.93, 8), tk(.94, 26), tk(.86, 86)];                                                        // filtration basin for water quality
  const PED = { t: 0.512, w: 9 };                                                                                           // walkers' entrance at the centre of the frontage, on the church axis
  const SEPTIC = [[CHURCH.x0 + 10, CHURCH.y1 + 8], [CHURCH.x1 - 10, CHURCH.y1 + 8], [CHURCH.x1 - 10, CHURCH.y1 + 60], [CHURCH.x0 + 10, CHURCH.y1 + 60]];
  const FUTURE = [[40, 52], [150, 52], [150, 130], [40, 130]];                                                                // reserved for future construction (to confirm)
  const WELL = M(245, 523), TANK = M(367, 477);

  /* ---------------- helpers ---------------- */
  // rad: one radius, or [NE, SE, SW, NW] radii (corner order matches the output)
  function roundedRect(x0, y0, x1, y1, rad, seg) {
    seg = seg || 6; const out = [];
    const R = Array.isArray(rad) ? rad : [rad, rad, rad, rad];
    const corners = [[x1 - R[0], y0 + R[0], -Math.PI / 2, 0, R[0]], [x1 - R[1], y1 - R[1], 0, Math.PI / 2, R[1]], [x0 + R[2], y1 - R[2], Math.PI / 2, Math.PI, R[2]], [x0 + R[3], y0 + R[3], Math.PI, Math.PI * 1.5, R[3]]];
    corners.forEach(([cx, cy, a0, a1, rr]) => { for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * i / seg; out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } });
    return out;
  }
  function ellipseArc(cx, cy, rx, ry, a0, a1, seg) { const out = []; for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * i / seg; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return out; }
  // Round the corners of a closed polyline: verts = [{p, r}], r = 0 keeps the vertex sharp
  function fillet(verts, seg) {
    const out = [], n = verts.length;
    for (let i = 0; i < n; i++) {
      const A = verts[(i - 1 + n) % n].p, B = verts[i].p, C = verts[(i + 1) % n].p, r = verts[i].r;
      if (!r) { out.push(B); continue; }
      const d1 = unit([B[0] - A[0], B[1] - A[1]]), d2 = unit([C[0] - B[0], C[1] - B[1]]);
      const theta = Math.acos(Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1])));
      if (theta < 0.02) { out.push(B); continue; }
      const t = r * Math.tan(theta / 2), p1 = [B[0] - d1[0] * t, B[1] - d1[1] * t], p2 = [B[0] + d2[0] * t, B[1] + d2[1] * t];
      const cross = d1[0] * d2[1] - d1[1] * d2[0], nrm = cross > 0 ? [-d1[1], d1[0]] : [d1[1], -d1[0]];
      const c = [p1[0] + nrm[0] * r, p1[1] + nrm[1] * r];
      const a0 = Math.atan2(p1[1] - c[1], p1[0] - c[0]), a1 = Math.atan2(p2[1] - c[1], p2[0] - c[0]);
      let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      for (let k = 0; k <= seg; k++) { const a = a0 + da * k / seg; out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
    }
    return out;
  }
  // Offset a closed polygon (clockwise on screen) inward by k (negative = outward)
  function offsetPoly(poly, k) {
    const n = poly.length, out = [];
    for (let i = 0; i < n; i++) {
      const A = poly[(i - 1 + n) % n], B = poly[i], C = poly[(i + 1) % n];
      const d1 = unit([B[0] - A[0], B[1] - A[1]]), d2 = unit([C[0] - B[0], C[1] - B[1]]);
      const n1 = [-d1[1], d1[0]], n2 = [-d2[1], d2[0]];
      let m = [n1[0] + n2[0], n1[1] + n2[1]]; const L = Math.hypot(m[0], m[1]) || 1; m = [m[0] / L, m[1] / L];
      const sc = k / Math.max(0.5, m[0] * n1[0] + m[1] * n1[1]);
      out.push([B[0] + m[0] * sc, B[1] + m[1] * sc]);
    }
    return out;
  }
  // A box in any orientation: u = its long axis; draws the faces that look toward the camera, then the top
  function rotBox(g, cx, cy, u, hl, hw, z0, h, col) {
    const v = [-u[1], u[0]], q = (a, b, z) => [cx + u[0] * a + v[0] * b, cy + u[1] * a + v[1] * b, z];
    [[q(-hl, -hw, z0), q(hl, -hw, z0), [-v[0], -v[1]]], [q(hl, -hw, z0), q(hl, hw, z0), u], [q(hl, hw, z0), q(-hl, hw, z0), v], [q(-hl, hw, z0), q(-hl, -hw, z0), [-u[0], -u[1]]]].forEach(([a, b, nrm]) => {
      const f = -nrm[0] + nrm[1]; if (f <= 0.05) return; poly(g, [a, b, [b[0], b[1], z0 + h], [a[0], a[1], z0 + h]], { fill: shade(col, .72 + .2 * f) });
    });
    poly(g, [q(-hl, -hw, z0 + h), q(hl, -hw, z0 + h), q(hl, hw, z0 + h), q(-hl, hw, z0 + h)], { fill: shade(col, 1.08) });
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
  function person(parent, col) {
    const g = S('g', { class: 'person' }, parent);
    S('ellipse', { cx: 0, cy: 1, rx: 2.2, ry: 1, fill: '#0b1530', opacity: .25 }, g);
    S('rect', { x: -1.3, y: -6.5, width: 2.6, height: 6.5, rx: 1.2, fill: col }, g);
    S('circle', { cx: 0, cy: -8.2, r: 1.7, fill: '#f2c9a0' }, g);
    return g;
  }

  /* ---------------- build ---------------- */
  let svg, world, layers, api, view, base, itemParts = {}, selected = null;

  function build(target) {
    svg = target; svg.innerHTML = svg.querySelector('title') ? svg.querySelector('title').outerHTML + svg.querySelector('desc').outerHTML : '';
    const defs = S('defs', null, svg);
    defs.innerHTML = `
      <linearGradient id="lawn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ad67a"/><stop offset="1" stop-color="#6fb85c"/></linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fc2e6"/><stop offset="1" stop-color="#2f7fb8"/></linearGradient>
      <linearGradient id="water2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd4de"/><stop offset="1" stop-color="#4aa3b8"/></linearGradient>
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
    itemParts = { church: [], ccd: [], courts: [], parking: [], pond: [], rectory: [] };

    drawTerrain(); drawRoad(); drawLawn(); drawWater(); drawExistingDrive(); drawDrives(); drawParking(); drawCourts(); drawZones(); drawWalks();
    const objs = [];
    objs.push({ depth: depthOf(CHURCH), node: drawChurch() });
    objs.push({ depth: depthOf(CCD), node: drawCcd() });
    objs.push({ depth: depthOf(RECTORY), node: drawRectory() });
    drawCourtsObjects(objs); drawParkedCars(objs); drawGate(objs); drawPoles(objs); drawDumpster(objs); drawUtilities(objs); drawTrees(objs); drawPondObjects(objs); drawPedestrian(objs); drawLamps(objs);
    objs.sort((a, b) => a.depth - b.depth).forEach((o, i) => { o.node.classList.add('intro'); o.node.style.animationDelay = (0.15 + i * 0.01).toFixed(3) + 's'; layers.objects.append(o.node); });
    drawRoadCars(); drawLoopCar(); drawPeople(); drawTags();

    const corners = [SITE.W, SITE.N, SITE.E, SITE.S, off(r(0), -60), off(r(1), -60)].map(q => P(q[0], q[1], 0));
    const x0 = Math.min(...corners.map(q => q[0])), x1 = Math.max(...corners.map(q => q[0])), y0 = Math.min(...corners.map(q => q[1])) - 70, y1 = Math.max(...corners.map(q => q[1]));
    base = { x: x0 - 30, y: y0 - 20, w: (x1 - x0) + 60, h: (y1 - y0) + 70 };
    view = Object.assign({}, base);
    applyView();
    drawFx();
    const dimRect = S('rect', { x: base.x - 4000, y: base.y - 4000, width: base.w + 8000, height: base.h + 8000, fill: 'rgba(8,16,40,.62)', class: 'dim' }, layers.dim);
    layers.dim.style.display = 'none';
    dimRect.addEventListener('pointerup', () => { if (!dragging.moved && api.onDeselectRequest) api.onDeselectRequest(); });
    wireInteraction();
    requestAnimationFrame(() => { initialZoom(); intro(); });
  }
  const depthOf = b => ((b.y0 + b.y1) / 2) - ((b.x0 + b.x1) / 2);
  // A drive of constant width along a polyline: segment quads plus round joints.
  function band(parent, points, halfW, col, attrs) {
    const g = S('g', attrs || {}, parent);
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; const px = -dy / L * halfW, py = dx / L * halfW;
      poly(g, [[a[0] + px, a[1] + py], [b[0] + px, b[1] + py], [b[0] - px, b[1] - py], [a[0] - px, a[1] - py]], { fill: col });
      if (i > 0) poly(g, ellipsePts(a[0], a[1], halfW, halfW, 16), { fill: col });
    }
    return g;
  }
  function loopRing(inset) { return offsetPoly(LOOP_CL, inset); }

  /* ---------------- ground ---------------- */
  function drawTerrain() {
    const g = layers.terrain;
    const island = ellipsePts(330, 240, 660, 470, 56);
    const slab = S('g', { transform: 'translate(0,18)' }, g); poly(slab, island, { fill: '#3d5f3a' });
    const slab2 = S('g', { transform: 'translate(0,9)' }, g); poly(slab2, island, { fill: '#52783f' });
    poly(g, island, { fill: '#5f9a4a' });
    const clip = S('clipPath', { id: 'islandClip' }, svg.querySelector('defs')); poly(clip, island, {});
    const fg = S('g', { 'clip-path': 'url(#islandClip)' }, g);
    poly(fg, [off(r(-1.2), -58), off(r(2.4), -58), off(r(2.4), -400), off(r(-1.2), -400)], { fill: '#b7c96b' });
    poly(fg, [off(r(-1.2), -120), off(r(2.4), -120), off(r(2.4), -170), off(r(-1.2), -170)], { fill: '#a1bf62', opacity: .8 });
    poly(fg, [off(r(-1.2), -230), off(r(2.4), -230), off(r(2.4), -300), off(r(-1.2), -300)], { fill: '#9dbb5f', opacity: .7 });
    [[200, 150, 120, 40, ''], [520, 330, 150, 46, 'c2']].forEach(([x, y, rx, ry, c]) => { const [sx, sy] = P(x, y, 0); S('ellipse', { cx: sx, cy: sy, rx, ry, fill: '#0b1530', opacity: .12, class: 'cloud-shadow ' + c }, g); });
  }
  function drawRoad() {
    const g = S('g', { 'clip-path': 'url(#islandClip)' }, layers.ground);
    const t0 = -1.0, t1 = 2.0;
    poly(g, [off(r(t0), -6), off(r(t1), -6), off(r(t1), -60), off(r(t0), -60)], { fill: '#8a8f7a' });
    poly(g, [off(r(t0), -11), off(r(t1), -11), off(r(t1), -55), off(r(t0), -55)], { fill: '#3d4149' });
    line(g, off(r(t0), -33), off(r(t1), -33), { stroke: '#e8c349', 'stroke-width': 1.8, 'stroke-dasharray': '10 8' });
    line(g, off(r(t0), -13), off(r(t1), -13), { stroke: '#e6e6e6', 'stroke-width': 1.2, opacity: .8 });
    line(g, off(r(t0), -53), off(r(t1), -53), { stroke: '#e6e6e6', 'stroke-width': 1.2, opacity: .8 });
    const a = P(...off(r(0.66), -46)), b = P(...off(r(0.95), -46));
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    S('text', { x: a[0], y: a[1], transform: `rotate(${ang.toFixed(1)} ${a[0]} ${a[1]})`, fill: '#e9e9e9', 'font-size': 11, 'font-weight': 800, 'letter-spacing': 2, opacity: .9 }, g).textContent = 'COUNTY ROAD 175';
  }
  function drawLawn() {
    const g = layers.ground;
    const lawn = [SITE.W, SITE.N, SITE.E, SITE.S];
    poly(g, lawn, { fill: 'url(#lawn)' });
    const clip = S('clipPath', { id: 'lawnClip' }, svg.querySelector('defs')); poly(clip, lawn, {});
    const sg = S('g', { 'clip-path': 'url(#lawnClip)', opacity: .18 }, g);
    for (let x = -200; x < 700; x += 36) poly(sg, [[x, -50], [x + 18, -50], [x + 18, 500], [x, 500]], { fill: '#ffffff' });
    S('polygon', { points: pts(lawn), fill: 'none', stroke: '#ffffff', 'stroke-width': 1.4, 'stroke-dasharray': '6 5', opacity: .55 }, g);
  }
  function drawWater() {
    const g = S('g', { 'data-item': 'pond', class: 'item' }, layers.ground); itemParts.pond.push(g);
    const grow = (shape, k) => { const cx = shape.reduce((s, p) => s + p[0], 0) / shape.length, cy = shape.reduce((s, p) => s + p[1], 0) / shape.length; return shape.map(p => { const dx = p[0] - cx, dy = p[1] - cy, L = Math.hypot(dx, dy) || 1; return [p[0] + dx / L * k, p[1] + dy / L * k]; }); };
    [[POND, 'water'], [BASIN, 'water2']].forEach(([shape, fill]) => {
      poly(g, grow(shape, 5), { fill: '#86b25a' });                 // grassy bank
      poly(g, grow(shape, 1.5), { fill: '#b98a4a', opacity: .85 });  // mud rim
      poly(g, grow(shape, -1), { fill: `url(#${fill})` });
    });
    [[.15, 26], [.3, 24], [.44, 20], [.7, 40], [.85, 55]].forEach(([t, k], i) => { const q = P(...tk(t, k), 0); S('ellipse', { cx: q[0], cy: q[1], rx: 8, ry: 1.6, fill: '#ffffff', opacity: .28 }, g); });
    // splitter box and trench drain at the pinch between pond and basin
    poly(g, [tk(.55, 2), tk(.57, 2), tk(.57, 10), tk(.55, 10)], { fill: '#c9c4b8' });
  }
  function drawExistingDrive() {
    const g = layers.ground;
    band(g, EX_DRIVE, 6, '#a3a39a');
    band(g, HAMMER, 6, '#a3a39a');
    const B = RECTORY, v = [-B.u[1], B.u[0]];
    band(g, [add(add(B.c, B.u, 6), v, -B.hw - 1), add(add(B.c, B.u, 6), v, -B.hw - 14)], 4, '#b5b5ad');   // path from the turnaround to the door
  }
  function drawDrives() {
    const g = S('g', { 'data-item': 'parking', class: 'item' }, layers.ground); itemParts.parking.push(g);
    S('path', { d: pathFromLoops([loopRing(-HW), loopRing(HW)]), fill: '#4b4f57', 'fill-rule': 'evenodd' }, g);
    band(g, ENTRY_DRIVE, HW, '#4b4f57');
    band(g, EAST_AISLE, HW, '#4b4f57');
    band(g, CCD_LOOP, 10, '#4b4f57');
    // flared apron at the gate, and the pond culvert headwalls
    poly(g, [tk(.0, -11), tk(.06, -11), tk(.055, -4), tk(.005, -4)], { fill: '#4b4f57' });
    // centre lines and one-way arrows
    [[LOOP.x0, 300, 'S'], [255, LOOP.y1, 'E'], [LOOP.xc + LOOP.rx, LOOP.yc, 'N'], [255, LOOP.y0, 'W']].forEach(([x, y, dir]) => {
      const dx = dir === 'E' ? 6 : dir === 'W' ? -6 : 0, dy = dir === 'S' ? 6 : dir === 'N' ? -6 : 0;
      poly(g, [[x + dx, y + dy], [x - dx * .6 + dy * .6, y - dy * .6 + dx * .6], [x - dx * .6 - dy * .6, y - dy * .6 - dx * .6]], { fill: '#ffffff', opacity: .85 });
    });
  }
  let arcSpots = [];
  function drawParking() {
    const g = S('g', { 'data-item': 'parking', class: 'item' }, layers.ground); itemParts.parking.push(g);
    ROWS.forEach(rw => {
      const at = (si, dp) => add(add(rw.o, rw.u, si), rw.v, dp);
      const L = rw.n * STALL;
      poly(g, [at(0, 0), at(L, 0), at(L, DEPTH), at(0, DEPTH)], { fill: '#4b4f57' });
      for (let i = 0; i <= rw.n; i++) line(g, [...at(i * STALL, 0), 0], [...at(i * STALL, DEPTH), 0], { stroke: '#e9e9e9', 'stroke-width': 1, opacity: .85 });
      rw.ada.forEach(i => poly(g, [at(i * STALL + 1, 1), at((i + 1) * STALL - 1, 1), at((i + 1) * STALL - 1, DEPTH - 1), at(i * STALL + 1, DEPTH - 1)], { fill: '#2f6fd6', opacity: .85 }));
    });
    // radial stalls on the inside of the curve, nose-in toward the church
    const E = (R, a) => [LOOP.xc + Math.cos(a) * R[0], LOOP.yc + Math.sin(a) * R[1]];
    arcSpots = [];
    ARC_STALLS.forEach(({ a: [d0, d1], out }) => {
      const sg = out ? 1 : -1, Ro = [LOOP.rx + sg * HW, LOOP.ry + sg * HW], Ri = [Ro[0] + sg * DEPTH, Ro[1] + sg * DEPTH], Rm = [Ro[0] + sg * DEPTH / 2, Ro[1] + sg * DEPTH / 2];
      const a0 = d0 * Math.PI / 180, a1 = d1 * Math.PI / 180;
      poly(g, ellipseArc(LOOP.xc, LOOP.yc, Ro[0], Ro[1], a0, a1, 24).concat(ellipseArc(LOOP.xc, LOOP.yc, Ri[0], Ri[1], a1, a0, 24)), { fill: '#4b4f57' });
      const bounds = [a0]; let acc = 0, prev = E(Ro, a0);
      for (let a = a0; a <= a1 + 1e-6; a += (a1 - a0) / 400) { const q = E(Ro, a); acc += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; if (acc >= STALL) { bounds.push(a); acc = 0; } }
      bounds.forEach(a => line(g, [...E(Ro, a), 0], [...E(Ri, a), 0], { stroke: '#e9e9e9', 'stroke-width': 1, opacity: .85 }));
      for (let i = 0; i + 1 < bounds.length; i++) { const a = (bounds[i] + bounds[i + 1]) / 2; arcSpots.push({ c: E(Rm, a), u: unit([Math.cos(a) / Ro[0], Math.sin(a) / Ro[1]]) }); }
    });
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
  function drawZones() {
    const g = layers.ground;
    poly(g, FUTURE, { fill: '#a9d98a', opacity: .55 });
    S('polygon', { points: pts(FUTURE), fill: 'none', stroke: '#ffffff', 'stroke-width': 1.2, 'stroke-dasharray': '5 4', opacity: .7 }, g);
    const c = P((FUTURE[0][0] + FUTURE[1][0]) / 2, (FUTURE[0][1] + FUTURE[2][1]) / 2, 0); S('text', { x: c[0], y: c[1] + 3, 'text-anchor': 'middle', 'font-size': 8, 'font-weight': 800, fill: '#2f5d50', opacity: .8, 'letter-spacing': 1 }, g).textContent = 'FUTURE';
    poly(g, SEPTIC, { fill: '#b5de95', opacity: .55 });
    S('polygon', { points: pts(SEPTIC), fill: 'none', stroke: '#ffffff', 'stroke-width': .9, 'stroke-dasharray': '3 4', opacity: .5 }, g);
  }
  function drawWalks() {
    const g = layers.ground;
    const gp = S('g', { 'data-item': 'church', class: 'item' }, g); itemParts.church.push(gp);
    const cy = (CHURCH.y0 + CHURCH.y1) / 2;
    // sidewalk ring between the nose-in stalls and the church: along the north wall and round the curve
    const Ri = [LOOP.rx - HW - DEPTH, LOOP.ry - HW - DEPTH], aS = 50 * Math.PI / 180;
    poly(gp, [[209, LOOP.y0 + HW + DEPTH], [LOOP.xc, LOOP.y0 + HW + DEPTH], [LOOP.xc, CHURCH.y0 - 2], [209, CHURCH.y0 - 2]], { fill: '#e9e2d3' });
    poly(gp, ellipseArc(LOOP.xc, LOOP.yc, Ri[0], Ri[1], -Math.PI / 2, aS, 30).concat(ellipseArc(LOOP.xc, LOOP.yc, Ri[0] - 6, Ri[1] - 6, aS, -Math.PI / 2, 30)), { fill: '#e9e2d3' });
    poly(gp, [[CHURCH.x1, cy - 14], [LOOP.axIn, cy - 14], [LOOP.axIn, cy + 14], [CHURCH.x1, cy + 14]], { fill: 'url(#hatch)' });     // entry plaza on the axis
    // walkers' promenade: from the foot of the bridge to the crosswalk over the loop and the plaza
    const E = tk(PED.t, 42);
    poly(g, [[LOOP.axOut - 2, cy - 6], [E[0], cy - 6], [E[0], cy + 6], [LOOP.axOut - 2, cy + 6]], { fill: '#e9e2d3' });
    for (let x = LOOP.axOut + 4; x < E[0] - 4; x += 8) poly(g, [[x, cy - 0.8], [x + 4, cy - 0.8], [x + 4, cy + 0.8], [x, cy + 0.8]], { fill: '#cfc5b0', opacity: .8 });
    for (let x = LOOP.axIn + 2; x < LOOP.axOut - 2; x += 5) poly(g, [[x, cy - 6], [x + 2.5, cy - 6], [x + 2.5, cy + 6], [x, cy + 6]], { fill: '#f4f4f4', opacity: .9 });
    const gc = S('g', { 'data-item': 'ccd', class: 'item' }, g); itemParts.ccd.push(gc);
    poly(gc, [[CCD.x1, CCD.y0 + 44], [LOOP.x0 - HW - 18, CCD.y0 + 44], [LOOP.x0 - HW - 18, CCD.y0 + 56], [CCD.x1, CCD.y0 + 56]], { fill: '#e9e2d3' });   // walk to the ADA stalls
    poly(gc, [[CCD.x1, CCD.y0 - 3], [CCD.x1 + 12, CCD.y0 - 3], [CCD.x1 + 12, CCD.y1 + 3], [CCD.x1, CCD.y1 + 3]], { fill: '#e9e2d3' });
  }

  /* ---------------- buildings ---------------- */
  function gothicWindow(g, x, y1, zb, w, hgt, alongX, fill) {
    const half = w / 2, pk = zb + hgt, sh = zb + hgt * .68;
    const p = alongX
      ? [[x - half, y1, zb], [x + half, y1, zb], [x + half, y1, sh], [x, y1, pk], [x - half, y1, sh]]
      : [[x, y1 - half, zb], [x, y1 + half, zb], [x, y1 + half, sh], [x, y1, pk], [x, y1 - half, sh]];
    poly(g, p, { fill: fill || 'url(#glass)', stroke: '#8a6a4a', 'stroke-width': .8 });
  }
  function drawChurch() {
    const B = CHURCH, g = S('g', { 'data-item': 'church', class: 'item building' }, null); itemParts.church.push(g);
    const foot = [[B.x0, B.y0, 0], [B.x1, B.y0, 0], [B.x1, B.y1, 0], [B.x0, B.y1, 0]];
    const glow = S('g', { class: 'glow', filter: 'url(#glowf)' }, g); poly(glow, [[B.x0 - 10, B.y0 - 10], [B.x1 + 10, B.y0 - 10], [B.x1 + 10, B.y1 + 10], [B.x0 - 10, B.y1 + 10]], { fill: '#ffd166', opacity: .55 });
    shadowFor(g, foot, 10, 8, .32);
    const wall = '#f2e8d5', mid = (B.y0 + B.y1) / 2;
    poly(g, [[B.x0, B.y0, 0], [B.x0, B.y1, 0], [B.x0, B.y1, B.h], [B.x0, B.y0, B.h]], { fill: shade(wall, .8) });
    poly(g, [[B.x0, B.y1, 0], [B.x1, B.y1, 0], [B.x1, B.y1, B.h], [B.x0, B.y1, B.h]], { fill: shade(wall, .95) });
    poly(g, [[B.x0, B.y0, 0], [B.x0, B.y1, 0], [B.x0, B.y1, 4], [B.x0, B.y0, 4]], { fill: '#b9a683' });
    poly(g, [[B.x0, B.y1, 0], [B.x1, B.y1, 0], [B.x1, B.y1, 4], [B.x0, B.y1, 4]], { fill: '#c9b892' });
    poly(g, [[B.x0, B.y0, B.h], [B.x0, B.y1, B.h], [B.x0, mid, B.h + B.rh]], { fill: shade(wall, .8) });
    gothicWindow(g, B.x0, mid, B.h + 2, 8, 11, false);
    gothicWindow(g, B.x0, B.y0 + 18, 6, 6, 12, false); gothicWindow(g, B.x0, B.y1 - 18, 6, 6, 12, false);
    for (let i = 0; i < 6; i++) { const x = B.x0 + 14 + i * 20; if (i === 3) continue; gothicWindow(g, x, B.y1, 6, 6, 12, true); }
    poly(g, [[B.x0 + 70, B.y1, 0], [B.x0 + 78, B.y1, 0], [B.x0 + 78, B.y1, 8.5], [B.x0 + 74, B.y1, 11], [B.x0 + 70, B.y1, 8.5]], { fill: '#6b3f2a' });
    poly(g, [[B.x0, B.y0, B.h], [B.x1, B.y0, B.h], [B.x1, mid, B.h + B.rh], [B.x0, mid, B.h + B.rh]], { fill: '#8f3a2a' });
    poly(g, [[B.x0, mid, B.h + B.rh], [B.x1, mid, B.h + B.rh], [B.x1, B.y1, B.h], [B.x0, B.y1, B.h]], { fill: 'url(#roofChurch)' });
    for (let k = 1; k < 5; k++) { const yy = mid + (B.y1 - mid) * k / 5, zz = B.h + B.rh * (1 - k / 5); line(g, [B.x0, yy, zz], [B.x1, yy, zz], { stroke: '#8f3a2a', 'stroke-width': .6, opacity: .5 }); }
    line(g, [B.x0, mid, B.h + B.rh], [B.x1, mid, B.h + B.rh], { stroke: '#f0d78a', 'stroke-width': 1.6, 'stroke-linecap': 'round' });
    poly(g, [[B.x1, B.y0, B.h], [B.x1, B.y1, B.h], [B.x1, mid, B.h + B.rh]], { fill: '#c9b892' });
    const cz = B.h + B.rh;
    line(g, [B.x1 - .5, mid, cz], [B.x1 - .5, mid, cz + 16], { stroke: '#f0d78a', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    line(g, [B.x1 - .5, mid - 5, cz + 11], [B.x1 - .5, mid + 5, cz + 11], { stroke: '#f0d78a', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    line(g, [B.x0 + .5, mid, cz], [B.x0 + .5, mid, cz + 8], { stroke: '#f0d78a', 'stroke-width': 1.8, 'stroke-linecap': 'round' });
    line(g, [B.x0 + .5, mid - 3, cz + 5.5], [B.x0 + .5, mid + 3, cz + 5.5], { stroke: '#f0d78a', 'stroke-width': 1.8, 'stroke-linecap': 'round' });
    // flagpole beside the entry plaza
    const fp = [B.x1 + 22, 212];
    line(g, [fp[0], fp[1], 0], [fp[0], fp[1], 26], { stroke: '#d8d8d8', 'stroke-width': 1.2 });
    const fa = P(fp[0], fp[1], 26); S('polygon', { class: 'flag', points: `${fa[0]},${fa[1]} ${fa[0] + 14},${fa[1] + 3} ${fa[0]},${fa[1] + 8}`, fill: '#f0d78a' }, g);
    addStar(g, 'church', [B.x1, B.y0, B.h + B.rh + 22]);
    return g;
  }
  // CCD: long axis along y, ridge along y. Visible faces: west (-x, long) and south (+y, short end).
  function drawCcd() {
    const B = CCD, g = S('g', { 'data-item': 'ccd', class: 'item building' }, null); itemParts.ccd.push(g);
    const foot = [[B.x0, B.y0, 0], [B.x1, B.y0, 0], [B.x1, B.y1, 0], [B.x0, B.y1, 0]];
    const glow = S('g', { class: 'glow', filter: 'url(#glowf)' }, g); poly(glow, [[B.x0 - 10, B.y0 - 10], [B.x1 + 10, B.y0 - 10], [B.x1 + 10, B.y1 + 10], [B.x0 - 10, B.y1 + 10]], { fill: '#7ad0e6', opacity: .55 });
    shadowFor(g, foot, 9, 7, .3);
    const wall = '#c9c2b6', mx = (B.x0 + B.x1) / 2;
    poly(g, [[B.x0, B.y0, 0], [B.x0, B.y1, 0], [B.x0, B.y1, B.h], [B.x0, B.y0, B.h]], { fill: shade(wall, .8) });
    poly(g, [[B.x0, B.y1, 0], [B.x1, B.y1, 0], [B.x1, B.y1, B.h], [B.x0, B.y1, B.h]], { fill: shade(wall, .96) });
    for (let i = 1; i < 8; i++) { const y = B.y0 + i * (B.y1 - B.y0) / 8; line(g, [B.x0, y, 0], [B.x0, y, B.h], { stroke: '#8f887c', 'stroke-width': .5 }); }
    for (let i = 1; i < 5; i++) { const x = B.x0 + i * (B.x1 - B.x0) / 5; line(g, [x, B.y1, 0], [x, B.y1, B.h], { stroke: '#a39c90', 'stroke-width': .5 }); }
    for (let i = 0; i < 8; i++) { const y = B.y0 + 10 + i * 15; poly(g, [[B.x0, y, 5], [B.x0, y + 8, 5], [B.x0, y + 8, 12], [B.x0, y, 12]], { fill: '#8fc3d8', stroke: '#5b6f78', 'stroke-width': .7 }); }
    for (let i = 0; i < 3; i++) { const x = B.x0 + 12 + i * 26; poly(g, [[x, B.y1, 5], [x + 10, B.y1, 5], [x + 10, B.y1, 12], [x, B.y1, 12]], { fill: '#9fd3e8', stroke: '#5b6f78', 'stroke-width': .7 }); }
    // south gable end and the two roof planes (ridge along y at mx)
    poly(g, [[B.x0, B.y1, B.h], [B.x1, B.y1, B.h], [mx, B.y1, B.h + B.rh]], { fill: shade(wall, .96) });
    poly(g, [[mx, B.y0, B.h + B.rh], [B.x1, B.y0, B.h], [B.x1, B.y1, B.h], [mx, B.y1, B.h + B.rh]], { fill: '#25606a' });          // east plane (far sliver)
    poly(g, [[B.x0, B.y0, B.h], [mx, B.y0, B.h + B.rh], [mx, B.y1, B.h + B.rh], [B.x0, B.y1, B.h]], { fill: 'url(#roofCcd)' });     // west plane (visible)
    line(g, [mx, B.y0, B.h + B.rh], [mx, B.y1, B.h + B.rh], { stroke: '#e9f4f6', 'stroke-width': 1.4, 'stroke-linecap': 'round' });
    // entrance canopy on the east (parking) side, protruding so its top and south face show
    const cy0 = 278, cy1 = 302, cx1 = B.x1 + 12;
    poly(g, [[B.x1, cy1, 0], [cx1, cy1, 0], [cx1, cy1, 11], [B.x1, cy1, 11]], { fill: '#cbb995' });
    poly(g, [[B.x1, cy0, 11], [cx1 + 2, cy0, 11], [cx1 + 2, cy1 + 2, 11], [B.x1, cy1 + 2, 11]], { fill: '#2d7480' });
    poly(g, [[cx1 + 2, cy0, 11], [cx1 + 2, cy1 + 2, 11], [cx1 + 2, (cy0 + cy1) / 2, 16]], { fill: '#cbb995' });
    poly(g, [[B.x1, cy0, 11], [B.x1, (cy0 + cy1) / 2, 16], [cx1 + 2, (cy0 + cy1) / 2, 16], [cx1 + 2, cy1 + 2, 11], [B.x1, cy1 + 2, 11]], { fill: '#3f9aa8', opacity: .95 });
    addStar(g, 'ccd', [B.x1, B.y0, B.h + B.rh + 20]);
    return g;
  }
  function addStar(g, id, at) {
    const [sx, sy] = P(at[0], at[1], at[2]);
    const s = S('g', { class: 'stamp-star', 'data-star': id }, g);
    const wrap = S('g', { transform: `translate(${sx.toFixed(1)},${sy.toFixed(1)})` }, s);
    S('polygon', { points: '0,-13 4,-4 13,-3 6,3 8,12 0,7 -8,12 -6,3 -13,-3 -4,-4', fill: '#ffd166', stroke: '#c9a24a', 'stroke-width': 1.5 }, wrap);
  }

  /* ---------------- objects ---------------- */
  function drawRectory() {
    const B = RECTORY, g = S('g', { 'data-item': 'rectory', class: 'item building' }, null); itemParts.rectory.push(g);
    const u = B.u, v = [-u[1], u[0]], hl = B.hl, hw = B.hw, h = B.h, rh = B.rh;
    const q = (a, b, z) => [B.c[0] + u[0] * a + v[0] * b, B.c[1] + u[1] * a + v[1] * b, z || 0];
    const foot = [q(-hl, -hw), q(hl, -hw), q(hl, hw), q(-hl, hw)];
    const glow = S('g', { class: 'glow', filter: 'url(#glowf)' }, g); poly(glow, [q(-hl - 8, -hw - 8), q(hl + 8, -hw - 8), q(hl + 8, hw + 8), q(-hl - 8, hw + 8)], { fill: '#ffd166', opacity: .5 });
    shadowFor(g, foot, 6, 5, .3);
    const wall = '#e8dcc6';
    [[q(-hl, -hw), q(hl, -hw), [-v[0], -v[1]]], [q(hl, -hw), q(hl, hw), u], [q(hl, hw), q(-hl, hw), v], [q(-hl, hw), q(-hl, -hw), [-u[0], -u[1]]]].forEach(([a, b, nrm]) => {
      const f = -nrm[0] + nrm[1]; if (f <= 0.05) return; poly(g, [a, b, [b[0], b[1], h], [a[0], a[1], h]], { fill: shade(wall, .76 + .18 * f) });
    });
    // windows and door on the wall that faces the campus, one window on the end wall
    [[-hl + 5, 7], [-hl + 18, 7], [hl - 9, 6]].forEach(([a, w]) => poly(g, [q(a, hw, 3.5), q(a + w, hw, 3.5), q(a + w, hw, 8.5), q(a, hw, 8.5)], { fill: '#9fd3e8', stroke: '#5b6f78', 'stroke-width': .7 }));
    poly(g, [q(hl, -6, 3.5), q(hl, 1, 3.5), q(hl, 1, 8.5), q(hl, -6, 8.5)], { fill: '#8fc3d8', stroke: '#5b6f78', 'stroke-width': .7 });
    const da = 2; poly(g, [q(da, hw, 0), q(da + 5, hw, 0), q(da + 5, hw, 8), q(da, hw, 8)], { fill: '#6b3f2a' });
    // gable roof along the long axis: far slope first, then the end gable, then the near slope
    poly(g, [q(-hl, -hw, h), q(hl, -hw, h), q(hl, 0, h + rh), q(-hl, 0, h + rh)], { fill: '#6e5a4a' });
    poly(g, [q(hl, -hw, h), q(hl, hw, h), q(hl, 0, h + rh)], { fill: shade(wall, .82) });
    poly(g, [q(-hl, 0, h + rh), q(hl, 0, h + rh), q(hl, hw, h), q(-hl, hw, h)], { fill: '#8a715c' });
    line(g, q(-hl, 0, h + rh), q(hl, 0, h + rh), { stroke: '#a28a72', 'stroke-width': 1.2, 'stroke-linecap': 'round' });
    const ch = q(-hl * .45, 0, 0); rotBox(g, ch[0], ch[1], u, 2.2, 2.2, h + 2, 6, '#b06b4a');   // chimney
    // porch over the door
    poly(g, [q(da - 4, hw, .6), q(da + 9, hw, .6), q(da + 9, hw + 6, .6), q(da - 4, hw + 6, .6)], { fill: '#d9cdb5' });
    poly(g, [q(da - 4, hw, 7), q(da + 9, hw, 7), q(da + 9, hw + 6, 7), q(da - 4, hw + 6, 7)], { fill: '#8a715c' });
    [q(da - 3, hw + 5), q(da + 8, hw + 5)].forEach(p0 => line(g, [p0[0], p0[1], 0], [p0[0], p0[1], 7], { stroke: '#cbb995', 'stroke-width': 1.2 }));
    addStar(g, 'rectory', q(hl, -hw, h + rh + 16));
    return g;
  }
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
      const g = S('g', { 'data-item': 'courts', class: 'item' }, null); itemParts.courts.push(g);
      const bp = P(c.x0 + (ci ? 40 : 22), my + (ci ? -5 : 6), 0);
      S('ellipse', { class: 'ball-shadow', cx: bp[0], cy: bp[1], rx: 3, ry: 1.4, fill: '#0b1530', opacity: .35, style: ci ? 'animation-delay:-.5s' : '' }, g);
      S('circle', { class: 'ball', cx: bp[0], cy: bp[1] - 5, r: 2.6, fill: '#ff7a1a', stroke: '#8a3d0e', 'stroke-width': .6, style: ci ? 'animation-delay:-.5s' : '' }, g);
      objs.push({ depth: (my + 6) - (c.x0 + 22), node: g });
    });
  }
  // A car in any orientation: u = its long axis. Only the faces that look toward the camera are drawn.
  function carAt(cx, cy, u, col, attrs) {
    const v = [-u[1], u[0]], g = S('g', attrs || {}, null);
    const q = (a, b, z) => [cx + u[0] * a + v[0] * b, cy + u[1] * a + v[1] * b, z];
    const hl = 7.5, hw = 3.2, H = 4.2;
    poly(g, [q(-hl, -hw, 0), q(hl, -hw, 0), q(hl, hw, 0), q(-hl, hw, 0)].map(p => [p[0] + 2.5, p[1] + 2.5, 0]), { fill: '#0b1530', opacity: .25 });
    const faces = [[q(-hl, -hw, 0), q(hl, -hw, 0), [-v[0], -v[1]]], [q(hl, -hw, 0), q(hl, hw, 0), [u[0], u[1]]], [q(hl, hw, 0), q(-hl, hw, 0), [v[0], v[1]]], [q(-hl, hw, 0), q(-hl, -hw, 0), [-u[0], -u[1]]]];
    faces.forEach(([a, b, nrm]) => { const f = -nrm[0] + nrm[1]; if (f <= 0.05) return; poly(g, [a, b, [b[0], b[1], H], [a[0], a[1], H]], { fill: shade(col, .72 + .2 * f) }); });
    poly(g, [q(-hl, -hw, H), q(hl, -hw, H), q(hl, hw, H), q(-hl, hw, H)], { fill: col });
    poly(g, [q(-3.6, -2.6, H + 2.6), q(3.6, -2.6, H + 2.6), q(3.6, 2.6, H + 2.6), q(-3.6, 2.6, H + 2.6)], { fill: '#cfe3ee' });
    poly(g, [q(-3.6, -2.6, H), q(3.6, -2.6, H), q(3.6, -2.6, H + 2.6), q(-3.6, -2.6, H + 2.6)], { fill: '#9fbccb' });
    return g;
  }
  function drawParkedCars(objs) {
    const cols = ['#e63946', '#f4a261', '#2a9d8f', '#8338ec', '#ffd166', '#118ab2', '#ffffff', '#6c757d', '#ff70a6', '#06d6a0', '#c1121f', '#3a86ff'];
    const spots = [[0, 5], [0, 8], [1, 1], [1, 4], [2, 2], [2, 6], [3, 2], [4, 2], [4, 6], [4, 9], [5, 3], [5, 8], [6, 2], [6, 7], [6, 11], [7, 2], [7, 5]];
    spots.forEach(([ri, si], k) => {
      const rw = ROWS[ri]; if (si >= rw.n) return;
      const c = add(add(rw.o, rw.u, (si + .5) * STALL), rw.v, DEPTH / 2);
      const g = carAt(c[0], c[1], rw.v, cols[k % cols.length], { 'data-item': 'parking', class: 'item' });
      itemParts.parking.push(g); objs.push({ depth: c[1] - c[0], node: g });
    });
    [1, 4, 8, 12, 16, 19, 22, 25, 29, 32, 35, 38].forEach((i, k) => {
      const sp = arcSpots[i]; if (!sp) return;
      const g = carAt(sp.c[0], sp.c[1], sp.u, cols[(k + 5) % cols.length], { 'data-item': 'parking', class: 'item' });
      itemParts.parking.push(g); objs.push({ depth: sp.c[1] - sp.c[0], node: g });
    });
  }
  function drawGate(objs) {
    [0.0, 0.06].forEach(t => {
      const c = tk(t, 4), g = S('g', { 'data-item': 'parking', class: 'item' }, null); itemParts.parking.push(g);
      box(g, c[0] - 2.2, c[1] - 2.2, c[0] + 2.2, c[1] + 2.2, 0, 7, '#c9b892'); const tp = P(c[0], c[1], 7); S('circle', { cx: tp[0], cy: tp[1] - 1, r: 1.6, fill: '#f0d78a' }, g);
      objs.push({ depth: c[1] - c[0], node: g });
    });
    const g2 = S('g', { 'data-item': 'parking', class: 'item' }, null); itemParts.parking.push(g2);
    const a = tk(.065, 3), b = tk(.11, 3);
    for (let z = 1; z <= 6; z += 1.2) line(g2, [a[0], a[1], z], [b[0], b[1], z], { stroke: '#2b2a28', 'stroke-width': .7 });
    line(g2, [b[0], b[1], 0], [b[0], b[1], 6.5], { stroke: '#2b2a28', 'stroke-width': 1 });
    objs.push({ depth: a[1] - a[0], node: g2 });
    const sgn = tk(0.072, 16), g3 = S('g', { 'data-item': 'church', class: 'item' }, null); itemParts.church.push(g3);
    box(g3, sgn[0] - 7, sgn[1] - 1.5, sgn[0] + 7, sgn[1] + 1.5, 0, 5.5, '#c9b892');
    const cp = P(sgn[0] - 5, sgn[1] + 1.6, 3.4); S('text', { x: cp[0], y: cp[1], 'font-size': 3.4, 'font-weight': 800, fill: '#2f5d50' }, g3).textContent = '✝ St. Alphonsa';
    objs.push({ depth: sgn[1] - sgn[0], node: g3 });
  }
  function drawPoles(objs) {
    [[LOOP.x0 + 70, LOOP.y0 - 20], [LOOP.x0 + 70, LOOP.y1 + 34], [LOOP.xc + 90, LOOP.y1 + 10], [LOOP.xc + 70, LOOP.yc - 118], [add(add(EA.o, EA.u, 100), EAp, -34)[0], add(add(EA.o, EA.u, 100), EAp, -34)[1]], [tk(.3, 52)[0], tk(.3, 52)[1]], [CCD.x0 - 28, CCD.y1 + 30]].forEach(([x, y]) => {
      const g = S('g', {}, null);
      line(g, [x, y, 0], [x, y, 22], { stroke: '#8a8f99', 'stroke-width': 1 });
      const t = P(x, y, 22); S('ellipse', { cx: t[0], cy: t[1], rx: 3, ry: 1.2, fill: '#fff3c4' }, g);
      S('ellipse', { cx: t[0], cy: t[1], rx: 7, ry: 3, fill: '#fff3c4', opacity: .18 }, g);
      objs.push({ depth: y - x, node: g });
    });
  }
  function drawDumpster(objs) {
    const g = S('g', {}, null); const x = LOOP.x0 - 5, y = LOOP.y1 + HW + 8;
    poly(g, [[x, y], [x + 16, y], [x + 16, y + 12], [x, y + 12]], { fill: '#8a8f7a' });
    box(g, x + 3, y + 2, x + 13, y + 8, 0, 5, '#2f7f5a');
    objs.push({ depth: (y + 6) - (x + 8), node: g });
  }
  function drawUtilities(objs) {
    // existing water well head and fire suppression tank in the north-west meadow
    const g = S('g', {}, null);
    box(g, WELL[0] - 2, WELL[1] - 2, WELL[0] + 2, WELL[1] + 2, 0, 3, '#8a8f99');
    objs.push({ depth: WELL[1] - WELL[0], node: g });
    const g2 = S('g', {}, null);
    poly(g2, ellipsePts(TANK[0], TANK[1], 9, 9, 24, 0), { fill: '#6f7a86' });
    for (let a = 0; a < 24; a++) { const a0 = a / 24 * Math.PI * 2, a1 = (a + 1) / 24 * Math.PI * 2; if (Math.cos(a0 + Math.PI / 4) > 0) continue; poly(g2, [[TANK[0] + Math.cos(a0) * 9, TANK[1] + Math.sin(a0) * 9, 0], [TANK[0] + Math.cos(a1) * 9, TANK[1] + Math.sin(a1) * 9, 0], [TANK[0] + Math.cos(a1) * 9, TANK[1] + Math.sin(a1) * 9, 7], [TANK[0] + Math.cos(a0) * 9, TANK[1] + Math.sin(a0) * 9, 7]], { fill: Math.sin(a0) > 0 ? '#8d98a6' : '#737e8b' }); }
    poly(g2, ellipsePts(TANK[0], TANK[1], 9, 9, 24, 7), { fill: '#a7b1bd' });
    objs.push({ depth: TANK[1] - TANK[0], node: g2 });
  }
  const inRect = (p, R, m) => p[0] > R.x0 - m && p[0] < R.x1 + m && p[1] > R.y0 - m && p[1] < R.y1 + m;
  const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  function treeOk(p) {
    if (inRect(p, CHURCH, 10) || inRect(p, CCD, 30) || inRect(p, RECTORY, 4)) return false;
    if (inRect(p, { x0: COURTS[0].x0, y0: COURTS[0].y0, x1: COURTS[1].x1, y1: COURTS[1].y1 }, 10)) return false;
    if (inRect(p, { x0: LOOP.x0 - HW - DEPTH, y0: LOOP.y0 - HW - DEPTH, x1: LOOP.xc + LOOP.rx + HW + DEPTH, y1: LOOP.y1 + HW + DEPTH }, 5)) return false;
    if (inRect(p, { x0: LOOP.x1 - 10, y0: 230, x1: 540, y1: LOOP.y1 + HW + DEPTH }, 5)) return false;     // east aisle and its rows
    const t = tOf(p), k = kOf(p);
    if (t > .0 && t < .6 && k > -12 && k < 96) return false;                                                // pond, pond row, entry drive, bridge walk
    if (inPoly(p, BASIN)) return false;
    if (t > -.12 && t < .07 && k > 6 && k < 200) return false;                                               // existing drive, turnaround and the house
    if (inRect(p, { x0: FUTURE[0][0] + 20, y0: FUTURE[0][1] + 18, x1: FUTURE[1][0] - 20, y1: FUTURE[2][1] - 18 }, 0)) return false;   // keep the label readable
    return true;
  }
  function drawTrees(objs) {
    const list = [];
    const nwY = x => SITE.W[1] + (SITE.N[1] - SITE.W[1]) * (x - SITE.W[0]) / (SITE.N[0] - SITE.W[0]);
    const seY = x => SITE.S[1] + (SITE.E[1] - SITE.S[1]) * (x - SITE.S[0]) / (SITE.E[0] - SITE.S[0]);
    const pal = ['#3f8f3f', '#2f7a44', '#57a34a', '#4c9c45'];
    for (let x = 50; x <= 360; x += 46) list.push([x, nwY(x) + 10, 24, 11, pal[Math.round(x / 46) % 4]]);
    for (let y = 70; y <= 440; y += 52) list.push([SITE.W[0] + 12 + (y - 30) * (SITE.S[0] - SITE.W[0]) / 435, y, 26, 12, pal[Math.round(y / 52) % 4]]);
    for (let x = 90; x <= 620; x += 58) list.push([x, seY(x) - 8, 24, 11, pal[Math.round(x / 58) % 4]]);
    for (let x = 70; x <= 640; x += 50) list.push([x + 20, seY(x) + 16, 22, 10, pal[(Math.round(x / 50) + 1) % 4]]);
    [[60, 185, 24, 11], [150, 190, 20, 9], [205, 125, 22, 10], [150, 100, 22, 10], [75, 118, 20, 9], [30, 60, 22, 10], [180, 150, 18, 8],
     [160, 290, 18, 8], [170, 440, 20, 9], [60, 440, 22, 10], [120, 445, 20, 9], [300, 118, 18, 8],
     [470, 400, 18, 8], [520, 300, 18, 8], [540, 350, 20, 9], [560, 400, 18, 8], [600, 440, 20, 9], [330, 470, 20, 9]].forEach((t, i) => list.push([t[0], t[1], t[2], t[3], pal[i % 4]]));
    for (let t = -0.9; t <= 1.9; t += 0.12) { const p = off(r(t), -78); list.push([p[0], p[1], 26, 12, pal[Math.abs(Math.round(t * 10)) % 4]]); }
    list.forEach(([x, y, h, rad, col]) => { if (kOf([x, y]) > -60 && !treeOk([x, y])) return; objs.push({ depth: y - x, node: tree(null, x, y, h, rad, col) }); });
  }
  function drawPondObjects(objs) {
    const g = S('g', { 'data-item': 'pond', class: 'item' }, null); itemParts.pond.push(g);
    [[.15, 24], [.27, 22], [.42, 20], [.66, 36], [.82, 52]].forEach(([t, k], i) => { const c0 = P(...tk(t, k), 0); S('ellipse', { class: 'ripple', cx: c0[0], cy: c0[1], rx: 7, ry: 3, fill: 'none', stroke: '#fff', 'stroke-width': 1, style: `animation-delay:${-i * 0.7}s` }, g); });
    [[.12, 40], [.22, 40], [.32, 40], [.42, 32], [.62, 58], [.75, 92], [.9, 104]].forEach(([t, k]) => { const p = tk(t, k); for (let j = 0; j < 3; j++) line(g, [p[0] + j * 1.5, p[1] - j, 0], [p[0] + j * 1.5 + .6, p[1] - j, 5 + (j % 2) * 2], { stroke: '#3f8a3f', 'stroke-width': .9, 'stroke-linecap': 'round' }); });
    const dk = P(...tk(.3, 26), 0); S('ellipse', { cx: dk[0], cy: dk[1], rx: 2.4, ry: 1.3, fill: '#fff' }, g); S('circle', { cx: dk[0] + 2, cy: dk[1] - 1.4, r: 1.1, fill: '#fff' }, g);
    const dk2 = P(...tk(.72, 40), 0); S('ellipse', { cx: dk2[0], cy: dk2[1], rx: 2.2, ry: 1.2, fill: '#f7dfa0' }, g); S('circle', { cx: dk2[0] - 2, cy: dk2[1] - 1.3, r: 1, fill: '#f7dfa0' }, g);
    const c = tk(.4, 26); objs.push({ depth: c[1] - c[0] + 40, node: g });
  }
  // Walkers' entrance at the centre of the frontage: wide steps up from the road, a landing, a big arched wooden bridge, steps down to the promenade.
  function drawPedestrian(objs) {
    const g = S('g', { 'data-item': 'pond', class: 'item' }, null); itemParts.pond.push(g);
    const base = r(PED.t), W2 = PED.w, SW = W2 + 3, LW = 13;
    const at = (k, sd, z) => { const q = along(off(base, k), sd); return [q[0], q[1], z]; };
    const tread = (k0, k1, z0, z1, hw, col) => poly(g, [at(k0, -hw, z0), at(k0, hw, z0), at(k1, hw, z1), at(k1, -hw, z1)], { fill: col });
    const side = (k0, k1, z0, z1, zb, hw, col) => poly(g, [at(k0, hw, zb), at(k1, hw, zb), at(k1, hw, z1), at(k0, hw, z0)], { fill: col });
    for (let i = 0; i < 5; i++) { const k0 = -9 + i * 2.2, z = (i + 1) * 0.7; side(k0, k0 + 2.2, z, z, 0, SW, '#a8a296'); tread(k0, k0 + 2.2, z, z, SW, '#dcd7cc'); }
    side(2, 8, 3.5, 3.5, 0, LW, '#a8a296'); tread(2, 8, 3.5, 3.5, LW, '#e6e1d7');
    [-LW, LW].forEach(sd => poly(g, [at(2, sd, 3.5), at(8, sd, 3.5), at(8, sd, 4.8), at(2, sd, 4.8)], { fill: '#c9b892' }));
    // arched wooden bridge, 28 ft, with a shadow on the water
    const N = 12, k0b = 8, k1b = 36, zs = []; for (let i = 0; i <= N; i++) zs.push(3.5 + Math.sin(i / N * Math.PI) * 5.5);
    const sh = S('g', { filter: 'url(#blur)', opacity: .28 }, g); poly(sh, [at(k0b, -W2, 0), at(k0b, W2, 0), at(k1b, W2, 0), at(k1b, -W2, 0)].map(p => [p[0] + 3, p[1] + 3, 0]), { fill: '#0b1530' });
    for (let i = 0; i < N; i++) { const k = k0b + i * (k1b - k0b) / N, k2 = k0b + (i + 1) * (k1b - k0b) / N; side(k, k2, zs[i] - 1.4, zs[i + 1] - 1.4, Math.min(zs[i], zs[i + 1]) - 2.6, W2, '#6b4a30'); }
    for (let i = 0; i < N; i++) { const k = k0b + i * (k1b - k0b) / N, k2 = k0b + (i + 1) * (k1b - k0b) / N; tread(k, k2, zs[i], zs[i + 1], W2, i % 2 ? '#9a6a44' : '#b07d50'); }
    [-W2, W2].forEach(sd => {
      const top = [], midr = [];
      for (let i = 0; i <= N; i++) { const k = k0b + i * (k1b - k0b) / N; line(g, at(k, sd, zs[i]), at(k, sd, zs[i] + 4.4), { stroke: '#4a3220', 'stroke-width': 1.4 }); top.push(at(k, sd, zs[i] + 4.4)); midr.push(at(k, sd, zs[i] + 2.2)); const fin = P(...at(k, sd, zs[i] + 4.4)); if (i % 3 === 0) S('circle', { cx: fin[0], cy: fin[1], r: 1.2, fill: '#f0d78a', stroke: '#4a3220', 'stroke-width': .4 }, g); }
      S('polyline', { points: pts(top), fill: 'none', stroke: '#5b3f2a', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      S('polyline', { points: pts(midr), fill: 'none', stroke: '#5b3f2a', 'stroke-width': 1.1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    });
    [[36, 38, 2.3], [38, 40, 1.1]].forEach(([k, k2, z]) => { side(k, k2, z, z, 0, SW, '#a8a296'); tread(k, k2, z, z, SW, '#dcd7cc'); });
    const mid = off(base, 22); objs.push({ depth: mid[1] - mid[0] + 8, node: g });
  }
  function lamp(x, y) {
    const g = S('g', { class: 'lamp' }); const [sx, sy] = P(x, y, 0);
    S('ellipse', { cx: sx, cy: sy, rx: 2, ry: 1, fill: '#0b1530', opacity: .25 }, g);
    line(g, [x, y, 0], [x, y, 7], { stroke: '#2b2a28', 'stroke-width': 1.1 });
    const t = P(x, y, 7);
    S('ellipse', { class: 'lamp-glow', cx: t[0], cy: t[1] - 1, rx: 6, ry: 3.2, fill: '#ffe08a', opacity: .22 }, g);
    S('polygon', { points: `${t[0]},${t[1] - 4} ${t[0] + 2.2},${t[1] - 1.5} ${t[0] + 1.6},${t[1] + 1.5} ${t[0] - 1.6},${t[1] + 1.5} ${t[0] - 2.2},${t[1] - 1.5}`, fill: '#ffd166', stroke: '#2b2a28', 'stroke-width': .6 }, g);
    S('circle', { cx: t[0], cy: t[1] - 4.6, r: .9, fill: '#2b2a28' }, g);
    return g;
  }
  function drawLamps(objs) {
    const base = r(PED.t), cy = (CHURCH.y0 + CHURCH.y1) / 2;
    const spots = [along(off(base, 3), -13.5), along(off(base, 3), 13.5), along(off(base, 7), -13.5), along(off(base, 7), 13.5), along(off(base, 39), -11), along(off(base, 39), 11), [LOOP.axOut + 12, cy - 9], [LOOP.axOut + 12, cy + 9], [LOOP.axOut + 30, cy - 9], [LOOP.axOut + 30, cy + 9], [CHURCH.x1 + 4, cy - 26], [CHURCH.x1 + 4, cy + 26]];
    spots.forEach(([x, y]) => objs.push({ depth: y - x + 2, node: lamp(x, y) }));
  }
  function drawRoadCars() {
    const g = layers.objects;
    const lane = (k, from, to, dur, col, delay) => {
      const a = P(...off(r(from), k), 0), b = P(...off(r(to), k), 0);
      const cg = S('g', {}, g);
      const q = (u, v, z) => [u * d[0] + v * n[0], u * d[1] + v * n[1], z];
      poly(cg, [q(-7.5, -3.2, 0), q(-7.5, 3.2, 0), q(-7.5, 3.2, 4), q(-7.5, -3.2, 4)], { fill: shade(col, .75) });
      poly(cg, [q(-7.5, 3.2, 0), q(7.5, 3.2, 0), q(7.5, 3.2, 4), q(-7.5, 3.2, 4)], { fill: shade(col, .9) });
      poly(cg, [q(-7.5, -3.2, 4), q(7.5, -3.2, 4), q(7.5, 3.2, 4), q(-7.5, 3.2, 4)], { fill: col });
      poly(cg, [q(-3.5, -2.6, 6.4), q(3.5, -2.6, 6.4), q(3.5, 2.6, 6.4), q(-3.5, 2.6, 6.4)], { fill: '#cfe3ee' });
      poly(cg, [q(-3.5, 2.6, 4), q(3.5, 2.6, 4), q(3.5, 2.6, 6.4), q(-3.5, 2.6, 6.4)], { fill: '#9fbfd0' });
      S('animateMotion', { dur: dur + 's', repeatCount: 'indefinite', begin: (delay || 0) + 's', path: `M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}` }, cg);
    };
    lane(-24, -0.9, 1.9, 22, '#e63946', 0); lane(-24, -0.9, 1.9, 22, '#ffd166', -12);
    lane(-42, 1.9, -0.9, 26, '#3a86ff', -5); lane(-42, 1.9, -0.9, 26, '#ffffff', -18);
  }
  function drawLoopCar() {
    const g = S('g', { class: 'loop-car' }, layers.objects);
    const ring = loopRing(0).map(p => P(p[0], p[1], 0));
    const drive = ENTRY_DRIVE.map(p => P(p[0], p[1], 0));
    const join = drive[drive.length - 1];
    const jIdx = ring.reduce((best, p, i) => Math.hypot(p[0] - join[0], p[1] - join[1]) < Math.hypot(ring[best][0] - join[0], ring[best][1] - join[1]) ? i : best, 0);
    const loop = ring.slice(jIdx).concat(ring.slice(0, jIdx)).reverse();
    const seg = pt => `L${pt[0].toFixed(1)},${pt[1].toFixed(1)}`;
    const pathD = `M${drive[0][0].toFixed(1)},${drive[0][1].toFixed(1)} ` + drive.slice(1).map(seg).join(' ') + ' ' + loop.map(seg).join(' ') + ' ' + seg(join) + ' ' + drive.slice(0, -1).reverse().map(seg).join(' ');
    S('rect', { x: -6, y: -3, width: 12, height: 6, rx: 1.5, fill: '#ff8f3f' }, g);
    S('rect', { x: -1.5, y: -2.2, width: 4, height: 4.4, rx: 1, fill: '#cfe3ee' }, g);
    S('animateMotion', { dur: '34s', repeatCount: 'indefinite', rotate: 'auto', path: pathD }, g);
  }
  function drawPeople() {
    const cy = (CHURCH.y0 + CHURCH.y1) / 2;
    const walk = (points, dur, col, delay) => {
      const g = person(layers.objects, col);
      const pth = points.map((p, i) => (i ? 'L' : 'M') + P(p[0], p[1], 0).map(v => v.toFixed(1)).join(','));
      S('animateMotion', { dur: dur + 's', repeatCount: 'indefinite', begin: (delay || 0) + 's', path: pth.join(' ') + ' ' + pth.slice(0, -1).reverse().map(s => s.replace('M', 'L')).join(' ') }, g);
    };
    walk([[LOOP.axIn - 2, cy + 12], [CHURCH.x1 + 4, cy + 12], [CHURCH.x1 + 4, cy - 12], [LOOP.axIn - 2, cy - 12]], 28, '#c2553d', 0);
    walk([[tk(PED.t, 42)[0] - 4, cy], [LOOP.axOut + 2, cy]], 18, '#8338ec', -4);
    walk([[LOOP.x0 - HW - 20, CCD.y0 + 50], [CCD.x1 + 2, CCD.y0 + 50]], 12, '#6e8b5c', -3);
    walk([[COURTS[1].x1 + 4, cyc], [COURTS[0].x0 - 4, cyc]], 30, '#ffd166', -9);
  }

  /* ---------------- tags & fx ---------------- */
  const TAG_AT = {
    church: () => P(CHURCH.x0 + 11, (CHURCH.y0 + CHURCH.y1) / 2 - 2, CHURCH.h + CHURCH.rh + 36),
    ccd: () => P((CCD.x0 + CCD.x1) / 2, CCD.y0 + 74, CCD.h + CCD.rh + 30),
    courts: () => P(COURTS[0].x0 + 6, cyc - 4, 34),
    parking: () => P(LOOP.x0 + 60, LOOP.y1 + 24, 24),
    pond: () => { const c = tk(.2, 26); return P(c[0], c[1], 30); },
    rectory: () => P(RECTORY.c[0], RECTORY.c[1], RECTORY.h + RECTORY.rh + 24)
  };
  function drawTags() {
    window.DATA.items.forEach((it, i) => {
      const [sx, sy] = TAG_AT[it.id]();
      const K = document.body.classList.contains('event') ? 1.4 : 1;
      const w = (it.name.length * 8.2 + 40) * K;
      const g = S('g', { class: 'tag item intro-tag', 'data-item': it.id, tabindex: 0, role: 'button', 'aria-label': it.name + '. ' + it.kind, style: `animation-delay:${(1.1 + i * 0.12).toFixed(2)}s` }, layers.tags);
      S('circle', { class: 'tap-ring', cx: sx, cy: sy + 27, r: 6 * K, fill: 'none', stroke: '#ffd166', 'stroke-width': 2 }, g);
      S('circle', { class: 'tap-ring r2', cx: sx, cy: sy + 27, r: 6 * K, fill: 'none', stroke: '#ffd166', 'stroke-width': 2 }, g);
      S('line', { x1: sx, y1: sy + 12, x2: sx, y2: sy + 26, stroke: '#fff', 'stroke-width': 1.5, opacity: .8 }, g);
      S('circle', { cx: sx, cy: sy + 27, r: 2.8 * K, fill: '#ffd166', stroke: '#fff', 'stroke-width': 1 }, g);
      S('rect', { x: sx - w / 2, y: sy + 12 - 26 * K, width: w, height: 26 * K, rx: 13 * K }, g);
      S('text', { x: sx - w / 2 + 10 * K, y: sy + 6 - (K - 1) * 4, 'font-size': 14 * K }, g).textContent = it.icon;
      S('text', { x: sx - w / 2 + 30 * K, y: sy + 5.5 - (K - 1) * 4 }, g).textContent = it.name;
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
  let homeView = null;
  function initialZoom() {
    const rct = stageRect(); if (!rct.width) return;
    const stageAspect = rct.width / rct.height, mapAspect = base.w / base.h;
    if (stageAspect < mapAspect * 0.85) { // narrow screen: fit the interactive part (labels + buildings), not the whole site
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      const grow = b => { if (!b.width && !b.height) return; x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); };
      grow(layers.tags.getBBox()); ['church', 'ccd', 'courts'].forEach(id => itemParts[id].forEach(pt => grow(pt.getBBox())));
      x0 -= 22; y0 -= 12; x1 += 34; y1 += 10;   // extra room on the right for the zoom buttons
      let w = x1 - x0, h = y1 - y0; if (w / h < stageAspect) w = h * stageAspect; else h = w / stageAspect;
      view.w = w; view.h = h; view.x = (x0 + x1) / 2 - w / 2; view.y = (y0 + y1) / 2 - h / 2; applyView();
    }
    homeView = Object.assign({}, view);
  }
  // Opening move: start pulled back and settle onto the home view while the buildings drop in.
  function intro() {
    if (!homeView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = Object.assign({}, homeView); const f = 1.35;
    view = { w: target.w * f, h: target.h * f, x: target.x - target.w * (f - 1) / 2, y: target.y - target.h * (f - 1) / 2 - 40 }; applyView();
    setTimeout(() => animateTo(target, 1600), 250);
  }
  let anim = null;
  function animateTo(target, ms) {
    if (anim) cancelAnimationFrame(anim);
    const from = Object.assign({}, view), t0 = performance.now();
    const step = t => { const u = Math.min(1, (t - t0) / (ms || 500)), e = 1 - Math.pow(1 - u, 3); ['x', 'y', 'w', 'h'].forEach(k => view[k] = from[k] + (target[k] - from[k]) * e); applyView(); if (u < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  function focusOn(bbox, region, padFactor) {
    const rct = stageRect(); const stageAspect = rct.width / rct.height;
    const rw = region.w * rct.width, rh = region.h * rct.height;
    let w = Math.max(bbox.width * (padFactor || 1.9), 160); let h = w / (rw / rh); if (h < bbox.height * 1.6) { h = bbox.height * 1.6; w = h * (rw / rh); }
    const vw = w / region.w, vh = vw / stageAspect;
    const cx = bbox.x + bbox.width / 2, cy = bbox.y + bbox.height / 2;
    const rcx = region.x + region.w / 2, rcy = region.y + region.h / 2;
    animateTo({ w: vw, h: vh, x: cx - rcx * vw, y: cy - rcy * vh }, 550);
  }
  const dragging = { active: false, moved: false };
  function wireInteraction() {
    const ptrs = new Map(); let last = null, pinch = null;
    svg.addEventListener('pointerdown', e => { svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); dragging.active = true; dragging.moved = false; last = [e.clientX, e.clientY]; dragging.target = e.target.closest('[data-item]'); if (ptrs.size === 2) { const a = [...ptrs.values()]; pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) }; } if (api.onInteract) api.onInteract(); });
    svg.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) { hover(e); return; }
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2 && pinch) {
        const a = [...ptrs.values()]; const dd = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); const mid = svgPoint((a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2);
        zoomAt(dd / pinch.d, mid[0], mid[1]); pinch.d = dd; dragging.moved = true; return;
      }
      if (ptrs.size === 1 && last) {
        const dx = e.clientX - last[0], dy = e.clientY - last[1];
        if (dx || dy) {
          const rct = stageRect(); const sc = Math.max(view.w / rct.width, view.h / rct.height);
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
    let bb = null; parts.forEach(p => { const b = p.getBBox(); if (!b.width && !b.height) return; bb = bb ? { x: Math.min(bb.x, b.x), y: Math.min(bb.y, b.y), x2: Math.max(bb.x2, b.x + b.width), y2: Math.max(bb.y2, b.y + b.height) } : { x: b.x, y: b.y, x2: b.x + b.width, y2: b.y + b.height }; });
    parts.forEach(p => { const ph = document.createComment('ph'); p.parentNode.insertBefore(ph, p); placeholders.push([p, ph]); layers.lift.append(p); p.classList.remove('intro', 'intro-tag'); p.classList.add('lift'); });
    if (bb) focusOn({ x: bb.x, y: bb.y, width: bb.x2 - bb.x, height: bb.y2 - bb.y }, region || { x: 0, y: 0, w: 1, h: 1 });
  }
  function deselect(silent) {
    if (!selected) return;
    placeholders.forEach(([p, ph]) => { p.classList.remove('lift'); ph.parentNode.insertBefore(p, ph); ph.remove(); }); placeholders = [];
    layers.dim.style.display = 'none'; svg.closest('.stage').classList.remove('dimmed'); selected = null;
    if (!silent && prevView) { animateTo(prevView, 450); prevView = null; }
  }
  function pulse(id, cls) { const parts = itemParts[id] || []; parts.forEach(p => { p.classList.remove(cls); void p.getBBox(); p.classList.add(cls); setTimeout(() => p.classList.remove(cls), 900); }); }
  function nudge(id) { const t = layers.tags.querySelector(`[data-item="${id}"]`); if (!t) return; t.classList.remove('nudge'); void t.getBBox(); t.classList.add('nudge'); setTimeout(() => t.classList.remove('nudge'), 1800); }
  function setStamped(id, on) { svg.querySelectorAll(`[data-star="${id}"]`).forEach(s => s.classList.toggle('on', on)); }
  function sparkle(id) {
    const parts = itemParts[id]; if (!parts || !parts.length) return; const b = parts[0].getBBox(); const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    for (let i = 0; i < 14; i++) { const c = S('circle', { cx: cx + Math.cos(i / 14 * 6.28) * b.width * .35, cy: cy + Math.sin(i / 14 * 6.28) * b.height * .35, r: 3 + Math.random() * 4, fill: i % 2 ? '#ffd166' : '#fff' }, layers.fx); c.animate([{ opacity: 1, transform: 'scale(.4)' }, { opacity: 0, transform: 'scale(2.2)' }], { duration: 900, fill: 'forwards' }); setTimeout(() => c.remove(), 950); }
  }
  function resetView() { deselect(); if (homeView) animateTo(homeView, 500); else animateTo(base, 500); }

  api = { build, select, deselect, pulse, nudge, setStamped, sparkle, zoom: f => { zoomAt(f, view.x + view.w / 2, view.y + view.h / 2); }, resetView, onTap: null, onDeselectRequest: null, onInteract: null, get selected() { return selected; }, P };
  return api;
})();
