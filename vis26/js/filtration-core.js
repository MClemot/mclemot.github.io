// Pure geometry helpers shared by the filtration views.
// No DOM access here — this file only computes numbers/index lists so it
// can be unit-tested or reused outside a slide deck if needed.

window.FiltrationCore = (function () {
  function euclid(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Full pairwise distance matrix, dist[i][j] === dist[j][i].
  function distanceMatrix(points) {
    const n = points.length;
    const dist = [];
    for (let i = 0; i < n; i++) dist.push(new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = euclid(points[i], points[j]);
        dist[i][j] = d;
        dist[j][i] = d;
      }
    }
    return dist;
  }

  // All i<j pairs, all i<j<k triples — the candidate edges/triangles for
  // the full Vietoris-Rips complex.
  function allPairs(n) {
    const pairs = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) pairs.push([i, j]);
    }
    return pairs;
  }

  function allTriples(n) {
    const triples = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) triples.push([i, j, k]);
      }
    }
    return triples;
  }

  // Fit data-space points into a W x H box with padding, flipping y so the
  // cloud reads bottom-to-top like a normal plot instead of screen-down.
  function fitPoints(points, W, H, pad) {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scale = Math.min((W - 2 * pad) / rangeX, (H - 2 * pad) / rangeY);

    const drawnW = rangeX * scale;
    const drawnH = rangeY * scale;
    const offX = (W - drawnW) / 2;
    const offY = (H - drawnH) / 2;

    const fitted = points.map(([x, y]) => [
      offX + (x - minX) * scale,
      H - (offY + (y - minY) * scale)
    ]);
    return { points: fitted, scale };
  }

  return {
    euclid,
    distanceMatrix,
    allPairs,
    allTriples,
    fitPoints
  };
})();
