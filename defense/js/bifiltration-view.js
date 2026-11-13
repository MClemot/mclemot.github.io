// Reusable bifiltration panels + cursor control. Drawing helpers (svgEl,
// createLayers, drawSimplex, ...) come from filtration-view.js.
//
// createBifiltrationView(svg, points, values, options) builds ONE panel
// (an SVG's worth of vertices/edges/triangles/disks) and returns
// { draw(s, r) }. `s` is the function-value (sublevel) threshold, `r` is
// the radius threshold.
//
// options.mode selects what's displayed:
//   'delaunay' - the sublevel Delaunay bifiltration: a simplex of
//             options.simplices (e.g. BifiltrationDelaunayData.simplices) is
//             shown once all its vertices have value <= s AND their
//             smallest enclosing ball has radius <= r.
//   'offset' - the sublevel OFFSET itself, not a simplicial complex: the
//             balls of radius r centered at the points of value <= s.
//
// Disks — drawn if options.showDisks is true, or always for 'offset' —
// are restricted to points with value <= s. options.diskColor sets their
// fill.
//
// options.showOnlyActiveVertices (default false) additionally hides the
// vertex dot itself for any point with value > s.
//
// options.colorByValue (default false) colors each vertex dot by its
// function value instead of options.vertexColor, sampling
// options.colormap (an (N, 3) array of [r, g, b] triples, see
// BifiltrationCore) over [min(values), max(values)].

const BIFILTRATION_STYLE = { edgeWidth: 1.5, diskColor: 'rgba(120, 120, 120, 0.15)' };

function createBifiltrationView(svg, points, values, options) {
  options = options || {};
  const mode = options.mode || 'delaunay'; // 'delaunay' | 'offset'
  if (mode !== 'delaunay' && mode !== 'offset') {
    throw new Error(`createBifiltrationView: unsupported mode "${mode}"`);
  }
  const style = simplexStyle(options, BIFILTRATION_STYLE);

  const W = parseFloat(svg.getAttribute('width'));
  const H = parseFloat(svg.getAttribute('height'));
  const { points: svgPoints, scale } = FiltrationCore.fitPoints(points, W, H, 30);

  // Candidate edges/triangles + their (f, r) birth bidegree (none at all
  // in 'offset' mode, which never draws a simplicial complex).
  let simplices = [];
  let births = [];
  if (mode === 'delaunay') {
    const edges = options.simplices.filter((sigma) => sigma.length === 2);
    const triangles = options.simplices.filter((sigma) => sigma.length === 3);
    simplices = triangles.concat(edges);
    births = BifiltrationCore.computeCechTriangleBirths(values, points, triangles)
      .concat(BifiltrationCore.computeCechEdgeBirths(values, points, edges));
  }

  const layers = createLayers(svg);
  const diskCircles = (mode === 'offset' || options.showDisks)
    ? createDisks(layers.disks, svgPoints, style.diskColor)
    : null;
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const vertexCircles = svgPoints.map(([x, y], idx) => svgEl(layers.vertices, 'circle', {
    cx: x, cy: y, r: style.vertexRadius,
    fill: options.colorByValue
      ? BifiltrationCore.colorForValue(values[idx], vMin, vMax, options.colormap)
      : style.vertexColor
  }));

  function draw(s, r) {
    if (diskCircles) {
      diskCircles.forEach((c, idx) => c.setAttribute('r', values[idx] <= s ? r * scale : 0));
    }
    if (options.showOnlyActiveVertices) {
      vertexCircles.forEach((c, idx) => c.setAttribute('display', values[idx] <= s ? '' : 'none'));
    }
    layers.triangles.textContent = '';
    layers.edges.textContent = '';
    simplices.forEach((simplex, idx) => {
      const b = births[idx];
      if (b.f <= s && b.r <= r) drawSimplex(layers, svgPoints, simplex, style);
    });
  }

  return { draw };
}

// ---- Custom (multicritical) bifiltrations ------------------------------
//
// createCustomBifiltrationView(svg, landmarks, simplices, bigrades, options)
// is for when the complex isn't computed from a distance/value function at
// all — you hand it directly:
//   landmarks : [[x, y], ...]            the landmark point set L
//   simplices : [[v0], [v0, v1], [v0, v1, v2], ...]
//               each entry is a list of indices into `landmarks`.
//   bigrades  : one array per entry of `simplices`, each a list of [r, s]
//               pairs (radius first, function value second) — that
//               simplex's birth bigrades. A simplex is shown at (s, r)
//               once (s, r) is componentwise >= ANY of its listed
//               bigrades (multicriticality).
//
// options.fullPointSet / options.fullPointValues (optional, together)
// additionally draw the full input point set X, with its function values,
// as background context, fitted in the same frame as the landmarks. Style
// with options.fullPointColor / options.fullPointRadius. With them:
//   options.showDisks draws a disk of radius r centered at each point of X
//   whose value is <= s (style with options.diskColor);
//   options.showOnlyActiveVertices hides the dots of X with value > s.
// Landmark vertices are governed entirely by their own bigrades.

function createCustomBifiltrationView(svg, landmarks, simplices, bigrades, options) {
  options = options || {};
  if (simplices.length !== bigrades.length) {
    throw new Error('createCustomBifiltrationView: simplices and bigrades must have the same length');
  }
  const style = simplexStyle(options, BIFILTRATION_STYLE);
  const fullPointSet = options.fullPointSet || [];
  const fullPointValues = options.fullPointValues;
  const fullPointColor = options.fullPointColor || 'rgba(0, 0, 0, 0.25)';
  const fullPointRadius = options.fullPointRadius !== undefined ? options.fullPointRadius : 2.5;

  const W = parseFloat(svg.getAttribute('width'));
  const H = parseFloat(svg.getAttribute('height'));

  // Fit landmarks and the full point set into the SAME coordinate frame
  // (fit their union together, then slice back apart) so the two line up.
  const { points: fitted, scale } = FiltrationCore.fitPoints(fullPointSet.concat(landmarks), W, H, 30);
  const fullSvgPoints = fitted.slice(0, fullPointSet.length);
  const landmarkSvgPoints = fitted.slice(fullPointSet.length);

  const layers = createLayers(svg, ['background']);
  const diskCircles = options.showDisks ? createDisks(layers.disks, fullSvgPoints, style.diskColor) : [];
  const fullPointCircles = fullSvgPoints.map(([x, y]) =>
    svgEl(layers.background, 'circle', { cx: x, cy: y, r: fullPointRadius, fill: fullPointColor, stroke: 'none' })
  );

  function draw(s, r) {
    diskCircles.forEach((c, idx) => c.setAttribute('r', fullPointValues[idx] <= s ? r * scale : 0));
    if (options.showOnlyActiveVertices) {
      fullPointCircles.forEach((c, idx) => c.setAttribute('display', fullPointValues[idx] <= s ? '' : 'none'));
    }
    layers.triangles.textContent = '';
    layers.edges.textContent = '';
    layers.vertices.textContent = '';
    simplices.forEach((simplex, idx) => {
      if (BifiltrationCore.isActiveAtBigrades(bigrades[idx], s, r)) {
        drawSimplex(layers, landmarkSvgPoints, simplex, style);
      }
    });
  }

  return { draw };
}

// ---- Cursor control ---------------------------------------------------

// Reads mouse/touch position over `canvas` and reports it as a (s, r)
// pair via options.onChange: horizontal = r, vertical = s, moving the
// cursor UP increasing s (origin bottom-left, like the module plots).
// Purely an input device — draws nothing. Like wirePersistenceCursor,
// (s, r) is only updated while the left button is held (or on touch).
//
// options:
//   sRange: [sMin, sMax]                 default [0, 1]
//   rRange: [rMin, rMax]                 default [0, 1]
//   plotArea: { left, right, top, bottom }  margins in canvas pixels
//            (default all 0) — only the rectangle inside them maps to the
//            ranges, e.g. when the canvas also draws axes around the plot.
//            The cursor is clamped to that rectangle.
//   onChange(s, r)
function createBifiltrationCursorControl(canvas, options) {
  const sRange = options.sRange || [0, 1];
  const rRange = options.rRange || [0, 1];
  const plotArea = Object.assign({ left: 0, right: 0, top: 0, bottom: 0 }, options.plotArea);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  function handle(clientX, clientY) {
    // Canvas pixels -> CSS pixels, in case the canvas is displayed scaled.
    const rect = canvas.getBoundingClientRect();
    const kx = rect.width / canvas.width;
    const ky = rect.height / canvas.height;
    const left = rect.left + plotArea.left * kx;
    const top = rect.top + plotArea.top * ky;
    const width = rect.width - (plotArea.left + plotArea.right) * kx;
    const height = rect.height - (plotArea.top + plotArea.bottom) * ky;
    const u = clamp01(width > 0 ? (clientX - left) / width : 0);
    const v = 1 - clamp01(height > 0 ? (clientY - top) / height : 0);
    options.onChange(sRange[0] + v * (sRange[1] - sRange[0]), rRange[0] + u * (rRange[1] - rRange[0]));
  }

  // Left button only: e.buttons bit 1 (move), e.button === 0 (press).
  canvas.addEventListener('mousemove', (e) => {
    if (e.buttons & 1) handle(e.clientX, e.clientY);
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      handle(e.clientX, e.clientY);
      e.preventDefault(); // no text selection / drag while scrubbing
    }
  });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 0) {
      handle(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }
  }, { passive: false });
}
