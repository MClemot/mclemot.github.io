// Interactive persistence diagram panel + cursor wiring.
//
// createPersistenceDiagramView(svg, diagram, options) builds ONE diagram
// panel and returns { svg, range, draw(r), radiusAt(clientY) }.
//   diagram : [[dim, birth, death], ...] (death may be Infinity), e.g.
//             FiltrationData.diagrams.rips. Values must use the same scale
//             as the filtration views they're paired with (see the
//             'diam <= 2r' convention in filtration-view.js).
//
// Each pair is drawn both as the usual dot (birth, death) and as a
// vertical bar from (birth, birth) to (birth, death). draw(r) reveals
// only the part of the diagram BELOW the horizontal line death = r:
//   - a bar is drawn from (birth, birth) up to (birth, min(death, r)),
//     so it only shows once birth <= r and grows with r;
//   - a dot only shows once death <= r (so essential classes never get one).
// Axes, ticks, the diagonal and the shaded region below it are always
// shown.
//
// options:
//   range       [min, max] of both axes             default [0, 0.3]
//   dims        dimensions to display              default: all present
//   dimColors   { dim: color }  (any CSS color, var(--...) works)
//               default { 0: var(--c-blue), 1: var(--c-green) }
//   ticks       number of tick intervals           default 3
//   pointRadius, barWidth, fontSize, lineColor
//   belowDiagonalFill  color of the region below the diagonal
//               default 'rgb(224, 224, 224)'
//   legend      [{ color, label }, ...] legend entries, label being an HTML
//               string that may contain $...$ TeX (typeset by Reveal's KaTeX
//               plugin with the deck's macros); default one `$\\homol{d}$`
//               entry per dimension
//   legendWidth space (px) from the legend dots to the plot's right edge
//               default 2.5 * fontSize; increase it for long labels
//   layers      [{ diagram, dims, dimColors, pointRadius, barWidth }, ...]
//               draw several diagrams on the same axes, in this order
//               (each layer, bars then dots, entirely in front of the
//               previous ones).
//               Each field defaults to the top-level one. When given, the
//               `diagram` argument is only used for the default `dims`.
//
// wirePersistenceCursor(diagramView, views, options) makes the mouse y
// over the diagram control r, for the diagram itself and for any number
// of filtration views (anything with draw(r)). r is only updated while the
// mouse is over the diagram AND the left button is held; otherwise
// everything stays at the last r. Returns { update(r) }.
//   options.label    element whose text shows the current r
//   options.onChange(r)
//
// Usage:
//   const view = createFiltrationView(svgA, FiltrationData.points, { showDisks: true });
//   const pd = createPersistenceDiagramView(svgB, FiltrationData.diagrams.rips, { range: [0, 0.3] });
//   wirePersistenceCursor(pd, [view], { label: document.getElementById('...') });

function createPersistenceDiagramView(svg, diagram, options) {
  options = options || {};
  const range = options.range || [0, 0.3];
  const dimColors = Object.assign({ 0: 'var(--c-blue)', 1: 'var(--c-green)' }, options.dimColors);
  const dims = options.dims || Array.from(new Set(diagram.map((p) => p[0]))).sort((a, b) => a - b);
  const ticks = options.ticks !== undefined ? options.ticks : 3;
  const pointRadius = options.pointRadius !== undefined ? options.pointRadius : 4;
  const barWidth = options.barWidth !== undefined ? options.barWidth : 2;
  const fontSize = options.fontSize !== undefined ? options.fontSize : 22;
  const lineColor = options.lineColor || '#000000';
  const legendWidth = options.legendWidth !== undefined ? options.legendWidth : 2.5 * fontSize;
  const belowDiagonalFill = options.belowDiagonalFill || 'rgb(224, 224, 224)';

  const W = parseFloat(svg.getAttribute('width'));
  const H = parseFloat(svg.getAttribute('height'));

  // Square plot area, leaving room for tick labels (left/bottom).
  const padLeft = 3.5 * fontSize;
  const padBottom = 3 * fontSize;
  const padTop = fontSize;
  const padRight = fontSize;
  const side = Math.min(W - padLeft - padRight, H - padTop - padBottom);
  const x0 = padLeft;
  const y0 = padTop + side; // pixel y of value range[0]

  function px(v) {
    return x0 + ((v - range[0]) / (range[1] - range[0])) * side;
  }
  function py(v) {
    return y0 - ((v - range[0]) / (range[1] - range[0])) * side;
  }

  // Colors go through style so that CSS variables work.
  function el(parent, tag, attrs, style) {
    const e = svgEl(parent, tag, attrs);
    for (const k in style || {}) e.style.setProperty(k, style[k]);
    return e;
  }
  function text(parent, content, attrs) {
    el(parent, 'text', attrs, { 'font-size': fontSize + 'px', fill: lineColor }).textContent = content;
  }

  // ---- Static frame: axes, ticks, diagonal, legend ---------------------
  const frame = el(svg, 'g', {});

  el(frame, 'polygon', {
    points: `${px(range[0])},${py(range[0])} ${px(range[1])},${py(range[0])} ${px(range[1])},${py(range[1])}`
  }, { fill: belowDiagonalFill, stroke: 'none' });
  el(frame, 'line', { x1: x0, y1: y0, x2: x0 + side, y2: y0, 'stroke-width': 1.5 }, { stroke: lineColor });
  el(frame, 'line', { x1: x0, y1: y0, x2: x0, y2: py(range[1]), 'stroke-width': 1.5 }, { stroke: lineColor });
  el(frame, 'line', { x1: px(range[0]), y1: py(range[0]), x2: px(range[1]), y2: py(range[1]), 'stroke-width': 1 }, { stroke: lineColor });

  for (let k = 0; k <= ticks; k++) {
    const v = range[0] + (k / ticks) * (range[1] - range[0]);
    const txt = String(+v.toFixed(3));
    el(frame, 'line', { x1: px(v), y1: y0, x2: px(v), y2: y0 + 6 }, { stroke: lineColor });
    el(frame, 'line', { x1: x0 - 6, y1: py(v), x2: x0, y2: py(v) }, { stroke: lineColor });
    text(frame, txt, { x: px(v), y: y0 + 1.2 * fontSize, 'text-anchor': 'middle' });
    text(frame, txt, { x: x0 - 10, y: py(v), 'text-anchor': 'end', 'dominant-baseline': 'middle' });
  }
  text(frame, 'birth', { x: x0 + side / 2, y: y0 + 2.4 * fontSize, 'text-anchor': 'middle' });
  text(frame, 'death', {
    x: x0 - 2.8 * fontSize, y: y0 - side / 2, 'text-anchor': 'middle',
    transform: `rotate(-90 ${x0 - 2.8 * fontSize} ${y0 - side / 2})`
  });

  // Bottom-right corner: always empty, since every pair lies above the diagonal.
  const entries = options.legend || dims.map((d) => ({ color: dimColors[d], label: `$\\homol{${d}}$` }));
  entries.forEach(({ color, label }, idx) => {
    const ly = y0 - (entries.length - idx) * 1.3 * fontSize;
    const lx = x0 + side - legendWidth;
    el(frame, 'circle', { cx: lx, cy: ly, r: pointRadius }, { fill: color });
    // HTML inside a foreignObject (not SVG <text>) so KaTeX's auto-render,
    // which runs after this panel is built, can typeset the label.
    const fo = el(frame, 'foreignObject', { x: lx + fontSize * 0.7, y: ly - fontSize, width: legendWidth + 1.5 * fontSize, height: 2 * fontSize });
    const div = document.createElement('div');
    div.style.cssText = `display:flex;align-items:center;height:100%;margin:0;white-space:nowrap;font-size:${fontSize}px;color:${lineColor};`;
    div.innerHTML = label;
    fo.appendChild(div);
  });

  // ---- Pairs: per layer, bars (back) then dots (front); then the r line -
  const layers = options.layers || [{}];
  const items = [];
  for (const layer of layers) {
    const lDiagram = layer.diagram || diagram;
    const lDims = layer.dims || dims;
    const lColors = Object.assign({}, dimColors, layer.dimColors);
    const lRadius = layer.pointRadius !== undefined ? layer.pointRadius : pointRadius;
    const lWidth = layer.barWidth !== undefined ? layer.barWidth : barWidth;
    const barGroup = el(svg, 'g', {});
    const dotGroup = el(svg, 'g', {});
    for (const [d, b, e] of lDiagram) {
      if (!lDims.includes(d) || !(e > b)) continue;
      const bar = el(barGroup, 'line', { x1: px(b), y1: py(b), x2: px(b), y2: py(b), 'stroke-width': lWidth, 'stroke-linecap': 'round' }, { stroke: lColors[d] });
      // Essential classes (death = Infinity) never get a visible dot.
      const dot = el(dotGroup, 'circle', { cx: px(b), cy: Number.isFinite(e) ? py(e) : 0, r: lRadius }, { fill: lColors[d] });
      items.push({ b, e, bar, dot });
    }
  }

  const rLine = el(svg, 'line', { x1: x0, x2: x0 + side, 'stroke-width': 1.5 }, { stroke: lineColor });

  function draw(r) {
    for (const { b, e, bar, dot } of items) {
      bar.setAttribute('display', b <= r ? '' : 'none');
      // r never exceeds range[1], so essential bars stop at the top of the plot.
      bar.setAttribute('y2', py(Math.min(e, r)));
      dot.setAttribute('display', e <= r ? '' : 'none');
    }
    const y = py(r);
    rLine.setAttribute('y1', y);
    rLine.setAttribute('y2', y);
  }

  // Screen y -> r, through the diagram's own death axis (so the r line
  // sits exactly under the cursor), clamped to the range.
  function radiusAt(clientY) {
    const rect = svg.getBoundingClientRect();
    const y = rect.height > 0 ? ((clientY - rect.top) / rect.height) * H : y0;
    const v = range[0] + ((y0 - y) / side) * (range[1] - range[0]);
    return Math.min(range[1], Math.max(range[0], v));
  }

  return { svg, range, draw, radiusAt };
}

function wirePersistenceCursor(diagramView, views, options) {
  options = options || {};
  const svg = diagramView.svg;
  const label = options.label;
  const userOnChange = options.onChange;

  function update(r) {
    diagramView.draw(r);
    views.forEach((v) => v.draw(r));
    if (label) label.textContent = r.toFixed(3);
    if (userOnChange) userOnChange(r);
  }

  // Left button only: e.buttons bit 1 (move), e.button === 0 (press).
  function onMouseMove(e) {
    if (e.buttons & 1) update(diagramView.radiusAt(e.clientY));
  }
  function onMouseDown(e) {
    if (e.button === 0) {
      update(diagramView.radiusAt(e.clientY));
      e.preventDefault(); // no text selection / drag while scrubbing
    }
  }
  function onTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      update(diagramView.radiusAt(e.touches[0].clientY));
      e.preventDefault();
    }
  }

  svg.addEventListener('mousemove', onMouseMove);
  svg.addEventListener('mousedown', onMouseDown);
  svg.addEventListener('touchmove', onTouchMove, { passive: false });
  update(diagramView.range[0]);

  return { update };
}
