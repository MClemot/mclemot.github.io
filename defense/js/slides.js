document.addEventListener('DOMContentLoaded', function () {
  const points = FiltrationData.points;

  // --- Slide: offset and Vietoris-Rips filtrations, synchronized sliders ---
  (function () {
    const offsetSvg = document.getElementById('offset-svg');
    const offsetSlider = document.getElementById('offset-slider');
    const offsetLabel = document.getElementById('offset-r-value');
    const ripsSvg = document.getElementById('rips-svg');
    const ripsSlider = document.getElementById('rips-slider');
    const ripsLabel = document.getElementById('rips-r-value');
    if (!offsetSvg || !offsetSlider || !ripsSvg || !ripsSlider) return;

    const offsetView = createFiltrationView(offsetSvg, points, {
      mode: 'offset',
      showBetti: true
    });
    const ripsView = createFiltrationView(ripsSvg, points, {
      mode: 'rips',
      triangleFill: '#cf244c48',
      showDisks: false,
      showBetti: true
    });
    const updateOffset = wireFiltrationSlider(offsetSlider, offsetLabel, [offsetView]);
    const updateRips = wireFiltrationSlider(ripsSlider, ripsLabel, [ripsView]);

    // Mirror each slider onto the other so both filtrations share the same r.
    offsetSlider.addEventListener('input', function () {
      ripsSlider.value = offsetSlider.value;
      updateRips();
    });
    ripsSlider.addEventListener('input', function () {
      offsetSlider.value = ripsSlider.value;
      updateOffset();
    });
  })();

  // --- Slide: Rips filtration driven by its persistence diagram -----------
  (function () {
    const svg = document.getElementById('rips-pd-complex-svg');
    const pdSvg = document.getElementById('rips-pd-svg');
    const label = document.getElementById('rips-pd-r-value');
    if (!svg || !pdSvg) return;

    const view = createFiltrationView(svg, points, {
      mode: 'rips',
      triangleFill: '#cf244c48',
      showDisks: false
    });
    const pd = createPersistenceDiagramView(pdSvg, FiltrationData.diagrams.rips, {
      range: [0, 0.3]
    });
    wirePersistenceCursor(pd, [view], { label });
  })();

  // --- Slide: Rips vs. Delaunay-Rips, driven by both persistence diagrams --
  (function () {
    const ripsSvg = document.getElementById('rips-svg-2');
    const dripsSvg = document.getElementById('drips-svg');
    const pdSvg = document.getElementById('drips-pd-svg');
    const label = document.getElementById('drips-r-value');
    if (!ripsSvg || !dripsSvg || !pdSvg) return;

    const ripsView = createFiltrationView(ripsSvg, points, {
      mode: 'rips',
      triangleFill: '#cf244c48',
      edgeWidth: 1,
      showDisks: false
    });
    const dripsView = createFiltrationView(dripsSvg, points, {
      mode: 'delaunay-rips',
      triangleFill: 'rgba(73, 61, 245, 0.8)',  // --c-blue, alpha 0.8
      edgeWidth: 1,
      showDisks: false
    });
    // Both diagrams on the same axes: H0 is identical for both, so only the
    // Delaunay-Rips one is drawn (black); Rips H1 (red, larger) sits entirely
    // behind the Delaunay-Rips layer (blue H1, smaller).
    const pd = createPersistenceDiagramView(pdSvg, FiltrationData.diagrams.rips, {
      range: [0, 0.3],
      legend: [
        { color: 'black', label: '$\\dgmrips{0} = \\dgmdr{0}$' },
        { color: 'var(--c-red)', label: '$\\dgmrips{1}$' },
        { color: 'var(--c-blue)', label: '$\\dgmdr{1}$' }
      ],
      legendWidth: 9 * 22,
      layers: [
        {
          diagram: FiltrationData.diagrams.rips,
          dims: [1],
          dimColors: { 1: 'var(--c-red)' },
          pointRadius: 7,
          barWidth: 5
        },
        {
          diagram: FiltrationData.diagrams['delaunay-rips'],
          dimColors: { 0: 'black', 1: 'var(--c-blue)' },
          pointRadius: 4,
          barWidth: 2
        }
      ]
    });
    wirePersistenceCursor(pd, [ripsView, dripsView], { label });
  })();

  // --- Slide: Rips vs. Delaunay-Cech vs. Delaunay-Rips, one diagram -------
  (function () {
    const ripsSvg = document.getElementById('cmp3-rips-svg');
    const dcechSvg = document.getElementById('cmp3-delcech-svg');
    const dripsSvg = document.getElementById('cmp3-drips-svg');
    const pdSvg = document.getElementById('cmp3-pd-svg');
    const label = document.getElementById('cmp3-r-value');
    if (!ripsSvg || !dcechSvg || !dripsSvg || !pdSvg) return;

    const ripsView = createFiltrationView(ripsSvg, points, {
      mode: 'rips',
      triangleFill: '#cf244c48',
      edgeWidth: 1,
      showDisks: false
    });
    const dcechView = createFiltrationView(dcechSvg, points, {
      mode: 'delaunay-cech',
      triangleFill: 'var(--c-green)',
      edgeWidth: 1,
      showDisks: false
    });
    const dripsView = createFiltrationView(dripsSvg, points, {
      mode: 'delaunay-rips',
      triangleFill: 'rgba(73, 61, 245, 0.8)',  // --c-blue, alpha 0.8
      edgeWidth: 1,
      showDisks: false
    });
    // H0 is the same for all three (MST edges at half their length), so
    // only one is drawn (black). H1 layers go from largest dot (Rips, back)
    // to smallest (Delaunay-Rips, front) so overlapping pairs stay visible.
    const pd = createPersistenceDiagramView(pdSvg, FiltrationData.diagrams.rips, {
      range: [0, 0.3],
      legend: [
        { color: 'black', label: '$\\dgmrips{0} = \\dgmdc{0} = \\dgmdr{0}$' },
        { color: 'var(--c-red)', label: '$\\dgmrips{1}$' },
        { color: 'var(--c-green)', label: '$\\dgmdc{1}$' },
        { color: 'var(--c-blue)', label: '$\\dgmdr{1}$' }
      ],
      legendWidth: 14 * 22,
      layers: [
        {
          diagram: FiltrationData.diagrams.rips,
          dims: [1],
          dimColors: { 1: 'var(--c-red)' },
          pointRadius: 9,
          barWidth: 7
        },
        {
          diagram: FiltrationData.diagrams['delaunay-cech'],
          dims: [1],
          dimColors: { 1: 'var(--c-green)' },
          pointRadius: 6.5,
          barWidth: 4.5
        },
        {
          diagram: FiltrationData.diagrams['delaunay-rips'],
          dimColors: { 0: 'black', 1: 'var(--c-blue)' },
          pointRadius: 4,
          barWidth: 2
        }
      ]
    });
    wirePersistenceCursor(pd, [ripsView, dcechView, dripsView], { label });
  })();

  // --- Slide: Delaunay-Cech vs. Flood, driven by both persistence diagrams --
  (function () {
    const dcechSvg = document.getElementById('delcech-svg');
    const floodSvg = document.getElementById('flood-svg');
    const pdSvg = document.getElementById('flood-pd-svg');
    const label = document.getElementById('flood-r-value');
    if (!dcechSvg || !floodSvg || !pdSvg) return;

    const D = FloodFiltrationData;
    const dcechView = createFiltrationView(dcechSvg, D.points, {
      mode: 'delaunay-cech',
      triangleFill: 'var(--c-green)',
      edgeWidth: 1,
      showDisks: true
    });
    // Flood complex on the landmarks, over the full point cloud X and its
    // union of balls (what the landmark simplices must be covered by).
    // Same options for the standalone Flood slide before this one, so the
    // two panels look identical and auto-animate between them seamlessly.
    const floodOptions = {
      fullPointSet: D.points,
      triangleFill: 'rgba(207, 36, 75, 0.5)',
      vertexColor: 'var(--c-red)',
      fullPointColor: 'black',
      edgeWidth: 1,
      showDisks: true
    };
    const floodView = createCustomFiltrationView(floodSvg, D.landmarks, D.simplices, D.filtration, floodOptions);
    const aloneSvg = document.getElementById('flood-alone-svg');
    const aloneSlider = document.getElementById('flood-slider');
    const aloneLabel = document.getElementById('flood-alone-r-value');
    const aloneView = aloneSvg
      ? createCustomFiltrationView(aloneSvg, D.landmarks, D.simplices, D.filtration, floodOptions)
      : null;
    // Only H1 is shown (H0 differs too: 80 points vs. 20 landmarks), with
    // Delaunay-Cech behind Flood.
    const pd = createPersistenceDiagramView(pdSvg, D.diagrams.delcech, {
      range: [0, 0.7],
      ticks: 7,
      dims: [1],
      legend: [
        { color: 'var(--c-green)', label: '$\\dgmdc{1}$' },
        { color: 'var(--c-red)', label: '$\\dgmflood{1}$' }
      ],
      legendWidth: 5 * 22,
      layers: [
        { diagram: D.diagrams.delcech, dimColors: { 1: 'var(--c-green)' } },
        { diagram: D.diagrams.flood, dimColors: { 1: 'var(--c-red)' } }
      ]
    });
    // One shared r for both slides: the standalone slide's slider and this
    // slide's diagram each drive everything (the other's panels included),
    // so the two slides are always in the same state and auto-animate
    // doesn't jump between them.
    const cursor = wirePersistenceCursor(pd, [dcechView, floodView], {
      label,
      onChange: function (r) {
        if (!aloneView) return;
        aloneView.draw(r);
        if (aloneSlider) aloneSlider.value = r;
        if (aloneLabel) aloneLabel.textContent = r.toFixed(3);
      }
    });
    if (aloneSlider) {
      aloneSlider.addEventListener('input', () => cursor.update(parseFloat(aloneSlider.value)));
    }
    // Arriving on this slide always starts at r = 0.7, whatever r was left
    // at on the standalone slide.
    function resetOnArrival(event) {
      if (event.currentSlide.contains(floodSvg)) cursor.update(0.7);
    }
    Reveal.on('slidechanged', resetOnArrival);
    // Also when the deck is (re)loaded directly on this slide.
    if (Reveal.isReady()) resetOnArrival({ currentSlide: Reveal.getCurrentSlide() });
    else Reveal.on('ready', resetOnArrival);
  })();

  // The deck's custom colormap (plotly [t, 'rgb(...)'] stops, evenly
  // spaced) as [r, g, b] triples, sliced like the plots in plots.js. Shared
  // by the density estimate and sublevel offset slides.
  const codensityColormap = CUSTOM_COLORSCALE.slice(64, 192).map(([, c]) => c.match(/\d+/g).map(Number));

  // Sublevel Delaunay bifiltration panel, shared by several slides.
  const delaunayBifOptions = {
    mode: 'delaunay',
    simplices: BifiltrationDelaunayData.simplices,
    edgeWidth: .5,
    vertexRadius: 3,
    triangleFill: 'rgba(73, 61, 245, 0.5)',
    showDisks: true,
    diskColor: 'rgb(200,200,200)',
    showOnlyActiveVertices: true
  };

  // A canvas showing a module approximation image spanning exactly
  // [0, 1]^2 (no margins), plus a black dot at the current (s, r). The axis
  // names are HTML labels around the canvas (.module-axes in custom.css).
  function createModuleCanvas(canvas, src) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    let current = null; // [s, r], null until a cursor has been used
    function draw(sr) {
      if (sr) current = sr;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (img.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (current) {
        const [s, r] = current;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(r * canvas.width, (1 - s) * canvas.height, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    img.addEventListener('load', () => draw());
    img.src = src;
    return { draw };
  }

  // --- Slide: Density estimate (point set, then colored by codensity) ------
  // Same fit (500x500, padding 30) and vertex radius as the sublevel offset
  // view on the next slide, so the two SVGs line up for auto-animate. The
  // coloring itself is pure CSS (custom.css), keyed on the slide's fragment.
  (function () {
    const svg = document.getElementById('density-svg');
    if (!svg) return;
    const values = BifiltrationData.values;
    const vMin = Math.min(...values);
    const vMax = Math.max(...values);
    const W = parseFloat(svg.getAttribute('width'));
    const H = parseFloat(svg.getAttribute('height'));
    FiltrationCore.fitPoints(BifiltrationData.points, W, H, 30).points.forEach(([x, y], idx) => {
      svgEl(svg, 'circle', { cx: x, cy: y, r: 3 })
        .style.setProperty('--c', BifiltrationCore.colorForValue(values[idx], vMin, vMax, codensityColormap));
    });
  })();

  // --- Slides: Sublevel offset, then sublevel Delaunay bifiltration, each -
  // --- driven by a (radius, codensity) canvas, sharing one (s, r) --------
  (function () {
    // Common vertex/disk style (that of delaunayBifOptions, colored by
    // codensity), so both slides show the same point set.
    const baseOptions = {
      vertexRadius: 3,
      diskColor: 'rgb(200,200,200)',
      showOnlyActiveVertices: true,
      colorByValue: true, // vertices colored by codensity
      colormap: codensityColormap
    };
    const panels = [
      { id: 'offset-bif', options: { mode: 'offset' } },
      { id: 'delaunay-bif', options: delaunayBifOptions }
    ].map(({ id, options }) => {
      const svg = document.getElementById(`${id}-svg`);
      const canvas = document.getElementById(`${id}-canvas`);
      if (!svg || !canvas) return null;
      return {
        canvas,
        ctx: canvas.getContext('2d'),
        label: document.getElementById(`${id}-label`),
        view: createBifiltrationView(svg, BifiltrationData.points, BifiltrationData.values,
          Object.assign({}, baseOptions, options))
      };
    }).filter(Boolean);
    if (panels.length === 0) return;

    // The views are parametrized by the ball radius r, shown on the
    // horizontal axis. All canvases have the same size.
    const sRange = [0, 1];
    const rRange = [0, 1];
    const plotArea = { left: 75, right: 25, top: 20, bottom: 70 };
    const W = panels[0].canvas.width;
    const H = panels[0].canvas.height;
    const x0 = plotArea.left;
    const y0 = H - plotArea.bottom;
    const side = { w: W - plotArea.left - plotArea.right, h: H - plotArea.top - plotArea.bottom };
    const px = (r) => x0 + (r - rRange[0]) / (rRange[1] - rRange[0]) * side.w;
    const py = (s) => y0 - (s - sRange[0]) / (sRange[1] - sRange[0]) * side.h;
    const font = getComputedStyle(document.querySelector('.reveal') || document.body).fontFamily;

    function drawControl(ctx, s, r) {
      ctx.clearRect(0, 0, W, H);

      // Current bigrade, with guide lines down to both axes.
      ctx.strokeStyle = '#000';
      ctx.lineWidth = .5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(px(r), py(sRange[0]));
      ctx.lineTo(px(r), py(s));
      ctx.lineTo(px(rRange[0]), py(s));
      ctx.stroke();
      ctx.setLineDash([]);

      // Axes, ticks, labels.
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, plotArea.top);
      ctx.lineTo(x0, y0);
      ctx.lineTo(W - plotArea.right, y0);
      ctx.stroke();
      ctx.font = `22px ${font}`;
      const ticks = 4;
      for (let k = 0; k <= ticks; k++) {
        const r = rRange[0] + k / ticks * (rRange[1] - rRange[0]);
        const s = sRange[0] + k / ticks * (sRange[1] - sRange[0]);
        ctx.beginPath();
        ctx.moveTo(px(r), y0);
        ctx.lineTo(px(r), y0 + 6);
        ctx.moveTo(x0 - 6, py(s));
        ctx.lineTo(x0, py(s));
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${+r.toFixed(2)}`, px(r), y0 + 10);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${+s.toFixed(2)}`, x0 - 10, py(s));
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('radius', x0 + side.w / 2, H - 4);
      ctx.save();
      ctx.translate(20, plotArea.top + side.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'middle';
      ctx.fillText('codensity', 0, 0);
      ctx.restore();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(px(r), py(s), 6, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Start with every point in and no disks (codensity max, radius 0):
    // exactly the colored point set of the density estimate slide, so the
    // auto-animate transition from it doesn't jump.
    let last = [sRange[1], rRange[0]]; // current (s, r)
    // Whichever canvas is used, every panel follows: both slides always
    // show the same (s, r).
    function update(s, r) {
      last = [s, r];
      for (const p of panels) {
        p.view.draw(s, r);
        drawControl(p.ctx, s, r);
        if (p.label) p.label.textContent = `radius = ${r.toFixed(3)}, codensity = ${s.toFixed(3)}`;
      }
    }

    for (const p of panels) {
      createBifiltrationCursorControl(p.canvas, { sRange, rRange, plotArea, onChange: update });
    }
    update(...last);
    // Canvas text uses whatever font is loaded at draw time: redraw once
    // the deck's web fonts are in.
    if (document.fonts) document.fonts.ready.then(() => panels.forEach((p) => drawControl(p.ctx, ...last)));
  })();

  // --- Slide: Sublevel Delaunay bifiltration and its module ------------

  (function () {
    const view = createBifiltrationView(document.getElementById('complex-svg'),
      BifiltrationData.points, BifiltrationData.values, delaunayBifOptions);
    const canvas = document.getElementById('module-canvas');
    const module = createModuleCanvas(canvas, 'images/SLF/mma_example.svg');
    const label = document.getElementById('sr-label');
    createBifiltrationCursorControl(canvas, {
      onChange: function (s, r) {
        label.textContent = `r = ${r.toFixed(3)}, s = ${s.toFixed(3)}`;
        view.draw(s, r);
        module.draw([s, r]);
      }
    });
  })();

  // --- Slides: Sublevel-Flood bifiltration, then Flood vs Delaunay ------
  // All three controllers share one (s, r): moving any of them updates
  // every complex and every dot, so the Flood panel that auto-animates to
  // the next slide carries its state along.

  (function () {
    const floodOptions = {
      showDisks: true,
      diskColor: 'rgb(200,200,200)',
      showOnlyActiveVertices: true,
      fullPointSet: BifiltrationData.points,
      fullPointValues: BifiltrationData.values,
      triangleFill: 'rgba(73, 61, 245, 0.2)'
    };
    const D = BifiltrationCustomData;
    const views = [
      createCustomBifiltrationView(document.getElementById('complex-svg-2'), D.landmarks, D.simplices, D.bigrades, floodOptions),
      createCustomBifiltrationView(document.getElementById('flood-cmp-svg'), D.landmarks, D.simplices, D.bigrades, floodOptions),
      createBifiltrationView(document.getElementById('delaunay-cmp-svg'),
        BifiltrationData.points, BifiltrationData.values, delaunayBifOptions)
    ];
    const label = document.getElementById('sr-label-2');
    const panels = [
      ['module-canvas-2', 'images/SLF/mma_flood_example.svg'],
      ['flood-cmp-canvas', 'images/SLF/mma_flood_example.svg'],
      ['delaunay-cmp-canvas', 'images/SLF/mma_example.svg']
    ].map(([id, src]) => {
      const canvas = document.getElementById(id);
      return { canvas, module: createModuleCanvas(canvas, src) };
    });

    function update(s, r) {
      label.textContent = `r = ${r.toFixed(3)}, s = ${s.toFixed(3)}`;
      views.forEach((v) => v.draw(s, r));
      panels.forEach((p) => p.module.draw([s, r]));
    }

    for (const p of panels) createBifiltrationCursorControl(p.canvas, { onChange: update });
  })();
});
