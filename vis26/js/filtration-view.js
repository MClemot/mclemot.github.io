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
// The panel shows the full Vietoris-Rips complex, with the convention
// diam(sigma) <= 2r (so that r matches the radius of the disks): edge
// {i,j} activates at r = dist(i,j) / 2; triangle {i,j,k} activates at
// r = (max of its 3 edge lengths) / 2.
//
// options.showDisks (default false) additionally draws, on every panel,
// a disk of radius r centered at each point (radius given in the same
// data-space units as r, converted to canvas pixels internally).
// options.diskColor sets that disk's fill.
//
// options.showBetti (default false) writes the current Betti numbers
// "\betti{0} = .., \betti{1} = .." in the bottom-right corner of the
// panel, read off FiltrationData.diagrams.rips. options.bettiFontSize
// sets its size in SVG pixels (default 34).
//
// Usage for two panels sharing one slider:
//   const viewA = createFiltrationView(svgA, points, {});
//   const viewB = createFiltrationView(svgB, points, { showDisks: true });
//   wireFiltrationSlider(slider, label, [viewA, viewB]);

const SVG_NS = 'http://www.w3.org/2000/svg';

// Creates an SVG element with the given attributes and appends it to
// `parent`. Shared by the filtration and persistence views.
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

// The layers of a complex, back to front: disks, triangles, edges, vertices.
function createLayers(svg) {
  const layers = {};
  for (const name of ['disks', 'triangles', 'edges', 'vertices']) {
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
  const style = simplexStyle(options);
  const showDisks = !!options.showDisks;

  const W = parseFloat(svg.getAttribute('width'));
  const H = parseFloat(svg.getAttribute('height'));
  const n = points.length;

  const { points: svgPoints, scale } = FiltrationCore.fitPoints(points, W, H, 30);
  const dist = FiltrationCore.distanceMatrix(points);

  // Every edge/triangle, each tagged with the radius r at which it activates.
  const triangles = FiltrationCore.allTriples(n);
  const edges = FiltrationCore.allPairs(n);
  const triValue = triangles.map(([i, j, k]) => Math.max(dist[i][j], dist[i][k], dist[j][k]) / 2);
  const simplices = triangles.concat(edges);
  const values = triValue.concat(edges.map(([i, j]) => dist[i][j] / 2));

  const layers = createLayers(svg);
  const diskCircles = showDisks ? createDisks(layers.disks, svgPoints, style.diskColor) : null;
  // Vertices never change with r, so draw them once.
  svgPoints.forEach((_, i) => drawSimplex(layers, svgPoints, [i], style));

  // Betti numbers, bottom-right, on top of everything.
  const updateBetti = options.showBetti
    ? createBettiLabel(svg, W, H, options.bettiFontSize || 34, FiltrationData.diagrams.rips)
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
