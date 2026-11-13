document.addEventListener('DOMContentLoaded', function () {
  const points = FiltrationData.points;

  // --- Slides: Rips filtration with a slider, then driven by its persistence
  // diagram. Both slides share the same r so the auto-animate transition is
  // seamless.
  (function () {
    const ripsSvg = document.getElementById('rips-svg');
    const ripsSlider = document.getElementById('rips-slider');
    const ripsLabel = document.getElementById('rips-r-value');
    const svg = document.getElementById('rips-pd-complex-svg');
    const pdSvg = document.getElementById('rips-pd-svg');
    const label = document.getElementById('rips-pd-r-value');
    if (!ripsSvg || !ripsSlider || !svg || !pdSvg) return;

    const ripsView = createFiltrationView(ripsSvg, points, {
      triangleFill: '#df692448',
      showDisks: false,
      showBetti: true
    });
    const updateRips = wireFiltrationSlider(ripsSlider, ripsLabel, [ripsView]);

    const view = createFiltrationView(svg, points, {
      triangleFill: '#df692448',
      showDisks: false
    });
    const pd = createPersistenceDiagramView(pdSvg, FiltrationData.diagrams.rips, {
      range: [0, 0.3],
      dimColors: { 0: 'var(--vis-dk2)', 1: 'var(--vis-pink)' }
    });
    // Moving the diagram cursor moves the slider; moving the slider moves the cursor.
    const cursor = wirePersistenceCursor(pd, [view], {
      label,
      onChange: function (r) {
        ripsSlider.value = r;
        updateRips();
      }
    });
    ripsSlider.addEventListener('input', function () {
      cursor.update(parseFloat(ripsSlider.value));
    });
  })();
});
