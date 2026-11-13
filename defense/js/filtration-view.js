// Reusable filtration panel + slider wiring.
//
// createFiltrationView(svg, points, options) builds ONE panel (an SVG's
// worth of vertices/edges/triangles, optionally disks) and returns
// { draw(r) }. It knows nothing about sliders or other panels.
//
// wireFiltrationSlider(slider, label, views) hooks any number of such
// views up to a single <input type="range">, so one slide can drive one
// panel or several in lockstep.
//
// options.mode selects which complex is displayed:
//   'rips'           - full Vietoris-Rips complex, with the convention
//                       diam(sigma) <= 2r (so that its scale matches the
//                       Cech / Delaunay filtrations): edge {i,j} activates
//                       at r = dist(i,j) / 2; triangle {i,j,k} activates at
//                       r = (max of its 3 edge lengths) / 2.
//   'delaunay-rips'  - the Rips complex above, RESTRICTED to edges/
//                       triangles that are also faces of the Delaunay
//                       triangulation. Same activation values as 'rips'.
//   'delaunay-cech'  - the Delaunay-Cech filtration: only Delaunay edges/
//                       triangles, activating at the radius of their
//                       smallest ENCLOSING ball (edge -> half its length;
//                       triangle -> circumradius if acute, else half its
//                       longest side).
//   'offset'         - the offset filtration (union of balls of radius r):
//                       no edges/triangles, disks always shown.
//
// options.showDisks (default false) additionally draws, on every panel,
// a disk of radius r centered at each point (radius given in the same
// data-space units as r, converted to canvas pixels internally).
// options.diskColor sets that disk's fill.
//
// options.showBetti (default false) writes the current Betti numbers
// "\betti{0} = .., \betti{1} = .." in the bottom-right corner of the
// panel, read off FiltrationData.diagrams[mode].
//
// Usage for a Rips + Delaunay-Rips slide sharing one slider:
//   const ripsView  = createFiltrationView(svgA, points, { mode: 'rips' });
//   const dripsView = createFiltrationView(svgB, points, { mode: 'delaunay-rips' });
//   wireFiltrationSlider(slider, label, [ripsView, dripsView]);

const SVG_NS = 'http://www.w3.org/2000/svg';

// Creates an SVG element with the given attributes and appends it to
// `parent`. Shared by every view (filtration, persistence, bifiltration).
function svgEl(parent, tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
}

// Drawing style shared by every view, overridden by its options.
function simplexStyle(options, defaults) {
  return Object.assign({
    triangleFill: 'rgba(30, 110, 200, 0.35)',
    edgeColor: '#000000',
    edgeWidth: 1,
    vertexColor: '#000000',
    vertexRadius: 4,
    diskColor: 'rgb(202, 202, 202)'
  }, defaults, options);
}

// The layers of a complex, back to front: disks, (background points),
// triangles, edges, vertices. `extra` names layers inserted between the
// disks and the triangles.
function createLayers(svg, extra) {
  const layers = {};
  for (const name of ['disks', ...(extra || []), 'triangles', 'edges', 'vertices']) {
    layers[name] = svgEl(svg, 'g', {});
  }
  return layers;
}

// One disk (radius 0 until drawn) per point, in `group`.
function createDisks(group, svgPoints, color) {
  return svgPoints.map(([x, y]) => svgEl(group, 'circle', { cx: x, cy: y, r: 0, fill: color, stroke: 'none' }));
}

// Draws a vertex, edge or triangle (`simplex`: indices into `svgPoints`)
// into the matching layer. Higher simplices have nothing sensible to draw
// in a 2D picture and are skipped.
function drawSimplex(layers, svgPoints, simplex, style) {
  const p = simplex.map((v) => svgPoints[v]);
  if (simplex.length === 1) {
    svgEl(layers.vertices, 'circle', { cx: p[0][0], cy: p[0][1], r: style.vertexRadius, fill: style.vertexColor });
  } else if (simplex.length === 2) {
    svgEl(layers.edges, 'line', {
      x1: p[0][0], y1: p[0][1], x2: p[1][0], y2: p[1][1],
      stroke: style.edgeColor, 'stroke-width': style.edgeWidth
    });
  } else if (simplex.length === 3) {
    svgEl(layers.triangles, 'polygon', { points: p.map((q) => q.join(',')).join(' '), fill: style.triangleFill, stroke: 'none' });
  } else {
    console.warn(`drawSimplex: skipping simplex of dimension ${simplex.length - 1}`);
  }
}

// Betti-number overlay: "\betti{0} = .., \betti{1} = .." in the
// bottom-right corner of the SVG, typeset with KaTeX (the deck's macros),
// read off `diagram` ([dim, birth, death] triples): beta_k(r) is the number
// of dim-k pairs with birth <= r < death. Returns update(r).
function createBettiLabel(svg, W, H, fontSize, diagram) {
  // HTML inside a foreignObject so KaTeX can render into it.
  const w = 12 * fontSize;
  const h = 2 * fontSize;
  const fo = svgEl(svg, 'foreignObject', { x: W - w - 8, y: H - h - 8, width: w, height: h });
  const bettiLabel = document.createElement('div');
  bettiLabel.style.cssText = `display:flex;justify-content:flex-end;align-items:flex-end;height:100%;margin:0;white-space:nowrap;font-size:${fontSize}px;`;
  fo.appendChild(bettiLabel);

  function betti(k, r) {
    let count = 0;
    for (const [d, b, e] of diagram) if (d === k && b <= r && r < e) count++;
    return count;
  }

  // KaTeX is loaded asynchronously by Reveal's math plugin, possibly after
  // the first draw: if it isn't there yet, retry shortly.
  let lastR = 0;
  let katexRetry = null;
  function renderBetti(r) {
    lastR = r;
    if (!window.katex) {
      if (!katexRetry) katexRetry = setTimeout(() => { katexRetry = null; renderBetti(lastR); }, 100);
      return;
    }
    const macros = Object.assign({}, Reveal.getConfig().katex.macros);
    katex.render(`\\betti{0} = ${betti(0, r)},\\quad \\betti{1} = ${betti(1, r)}`, bettiLabel, { macros, throwOnError: false });
  }

  return renderBetti;
}

function createFiltrationView(svg, points, options) {
  options = options || {};
  const mode = options.mode || 'rips'; // 'rips' | 'delaunay-rips' | 'delaunay-cech' | 'offset'
  const style = simplexStyle(options);
  const showDisks = mode === 'offset' || !!options.showDisks;

  const W = parseFloat(svg.getAttribute('width'));
  const H = parseFloat(svg.getAttribute('height'));
  const n = points.length;

  const { points: svgPoints, scale } = FiltrationCore.fitPoints(points, W, H, 30);
  const dist = FiltrationCore.distanceMatrix(points);

  // Candidate edges/triangles for this mode, each tagged with the radius r
  // at which it activates. From here on, draw(r) is the same
  // "activationValue <= r" check regardless of mode.
  let triangles = [];
  let triValue = [];
  let edges = [];
  if (mode === 'delaunay-cech') {
    triangles = FiltrationCore.delaunayTriangulate(points);
    edges = FiltrationCore.uniqueEdges(triangles);
    triValue = triangles.map(([i, j, k]) =>
      FiltrationCore.minEnclosingRadiusTriangle(points[i], points[j], points[k])
    );
  } else if (mode === 'rips' || mode === 'delaunay-rips') {
    // Same clique-style activation rule (diam <= 2r); they only differ in
    // which edges/triangles are candidates.
    if (mode === 'delaunay-rips') {
      triangles = FiltrationCore.delaunayTriangulate(points);
      edges = FiltrationCore.uniqueEdges(triangles);
    } else {
      triangles = FiltrationCore.allTriples(n);
      edges = FiltrationCore.allPairs(n);
    }
    triValue = triangles.map(([i, j, k]) => Math.max(dist[i][j], dist[i][k], dist[j][k]) / 2);
  } else if (mode !== 'offset') {
    throw new Error(`createFiltrationView: unsupported mode "${mode}"`);
  }
  const simplices = triangles.concat(edges);
  const values = triValue.concat(edges.map(([i, j]) => dist[i][j] / 2));

  const layers = createLayers(svg);
  const diskCircles = showDisks ? createDisks(layers.disks, svgPoints, style.diskColor) : null;
  // Vertices never change with r, so draw them once.
  svgPoints.forEach((_, i) => drawSimplex(layers, svgPoints, [i], style));

  // Betti numbers, bottom-right, on top of everything.
  const updateBetti = options.showBetti
    ? createBettiLabel(svg, W, H, 24, FiltrationData.diagrams[mode])
    : null;

  function draw(r) {
    if (updateBetti) updateBetti(r);
    if (diskCircles) for (const c of diskCircles) c.setAttribute('r', r * scale);
    layers.triangles.textContent = '';
    layers.edges.textContent = '';
    simplices.forEach((simplex, idx) => {
      if (values[idx] <= r) drawSimplex(layers, svgPoints, simplex, style);
    });
  }

  return { draw };
}

// ---- Custom filtrations -------------------------------------------------
//
// createCustomFiltrationView(svg, landmarks, simplices, filtration, options)
// is for when the complex isn't computed from the point cloud at all — you
// hand it directly:
//   landmarks  : [[x, y], ...]            the vertex positions
//   simplices  : [[v0], [v0, v1], [v0, v1, v2], ...]
//                each entry is a list of indices into `landmarks`.
//   filtration : one float per entry of `simplices` — the r at which that
//                simplex enters. A simplex is shown once filtration[i] <= r.
// Vertices are drawn only once active, like every other simplex. Same
// shape as e.g. FloodFiltrationData, so a call can read
//   createCustomFiltrationView(svg, D.landmarks, D.simplices, D.filtration, ...)
//
// options.fullPointSet (optional) additionally draws a full point set X
// as static background context — dots that never depend on r, fitted in
// the same frame as the landmarks. Style with options.fullPointColor /
// options.fullPointRadius.
//
// options.showDisks (default false) draws a disk of radius r centered at
// each point of fullPointSet, or at each landmark if fullPointSet is
// omitted. Style with options.diskColor.

function createCustomFiltrationView(svg, landmarks, simplices, filtration, options) {
  options = options || {};
  if (simplices.length !== filtration.length) {
    throw new Error('createCustomFiltrationView: simplices and filtration must have the same length');
  }
  const style = simplexStyle(options);
  const fullPointSet = options.fullPointSet || null;
  const fullPointColor = options.fullPointColor || 'rgba(0, 0, 0, 0.25)';
  const fullPointRadius = options.fullPointRadius !== undefined ? options.fullPointRadius : 2.5;

  const W = parseFloat(svg.getAttribute('width'));
  const H = parseFloat(svg.getAttribute('height'));

  // Fit landmarks and the full point set into the SAME coordinate frame
  // (fit their union together, then slice back apart) so the two line up.
  const combined = fullPointSet ? fullPointSet.concat(landmarks) : landmarks;
  const { points: fitted, scale } = FiltrationCore.fitPoints(combined, W, H, 30);
  const nFull = fullPointSet ? fullPointSet.length : 0;
  const fullSvgPoints = fitted.slice(0, nFull);
  const landmarkSvgPoints = fitted.slice(nFull);

  const layers = createLayers(svg, ['background']);
  const diskCircles = options.showDisks
    ? createDisks(layers.disks, fullPointSet ? fullSvgPoints : landmarkSvgPoints, style.diskColor)
    : null;
  for (const [x, y] of fullSvgPoints) {
    svgEl(layers.background, 'circle', { cx: x, cy: y, r: fullPointRadius, fill: fullPointColor, stroke: 'none' });
  }

  function draw(r) {
    if (diskCircles) for (const c of diskCircles) c.setAttribute('r', r * scale);
    layers.triangles.textContent = '';
    layers.edges.textContent = '';
    layers.vertices.textContent = '';
    simplices.forEach((simplex, idx) => {
      if (filtration[idx] <= r) drawSimplex(layers, landmarkSvgPoints, simplex, style);
    });
  }

  return { draw };
}

// Hooks one slider (and optional label) to any number of views, so moving
// the slider redraws every view at the same radius. Returns the update
// function (e.g. to redraw after setting slider.value programmatically).
function wireFiltrationSlider(slider, label, views) {
  function update() {
    const r = parseFloat(slider.value);
    if (label) label.textContent = r.toFixed(3);
    views.forEach((v) => v.draw(r));
  }
  slider.addEventListener('input', update);
  update();
  return update;
}
