// Pure helpers for bifiltrations, on top of the geometry of
// filtration-core.js (which must be loaded first).

window.BifiltrationCore = (function () {
  const { euclid, minEnclosingRadiusTriangle } = FiltrationCore;

  // ---- Sublevel Cech / Delaunay bifiltration --------------------------------
  // A simplex sigma = {i, j, ...} is "born" at bidegree (f, r) where:
  //   f = max(values[v]) over v in sigma        (sublevel-set condition)
  //   r = radius of the SMALLEST ball enclosing all vertices of sigma
  // It is present at any (s, r') with f <= s AND r <= r' (componentwise):
  // all its vertices are in the sublevel set and their balls of radius r'
  // share a point.

  function computeCechEdgeBirths(values, points, edges) {
    return edges.map(([i, j]) => ({
      f: Math.max(values[i], values[j]),
      r: euclid(points[i], points[j]) / 2
    }));
  }

  function computeCechTriangleBirths(values, points, triangles) {
    return triangles.map(([i, j, k]) => ({
      f: Math.max(values[i], values[j], values[k]),
      r: minEnclosingRadiusTriangle(points[i], points[j], points[k])
    }));
  }

  // A (possibly multicritical) simplex is present at bidegree (s, r) iff
  // (s, r) is componentwise >= at least one of its listed birth bigrades.
  // `grades` is an array of [r, s] pairs (radius first, function value
  // second).
  function isActiveAtBigrades(grades, s, r) {
    for (const [gr, gs] of grades) {
      if (gr <= r && gs <= s) return true;
    }
    return false;
  }

  // ---- Colormaps -------------------------------------------------------
  // A colormap is an (N, 3) array of [r, g, b] triples, components in
  // 0-255, evenly spaced over [0, 1]. Colors for values in between stops
  // are linearly interpolated.

  function sampleColormap(colormap, t) {
    t = Math.min(1, Math.max(0, t));
    const n = colormap.length;
    if (n === 1) return colormap[0];
    const pos = t * (n - 1);
    const i0 = Math.floor(pos);
    const i1 = Math.min(n - 1, i0 + 1);
    const frac = pos - i0;
    const c0 = colormap[i0], c1 = colormap[i1];
    return [0, 1, 2].map((c) => c0[c] + (c1[c] - c0[c]) * frac);
  }

  // Maps `value` (within [vmin, vmax]) to a CSS rgb() string via `colormap`.
  function colorForValue(value, vmin, vmax, colormap) {
    const t = vmax > vmin ? (value - vmin) / (vmax - vmin) : 0;
    const [r, g, b] = sampleColormap(colormap, t);
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  return {
    computeCechEdgeBirths,
    computeCechTriangleBirths,
    isActiveAtBigrades,
    colorForValue
  };
})();
