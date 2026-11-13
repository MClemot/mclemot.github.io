// Pure geometry helpers shared by every filtration and bifiltration view.
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
  // the *full* Vietoris-Rips complex (no Delaunay restriction).
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

  function edgeKey(a, b) {
    return a < b ? a + '_' + b : b + '_' + a;
  }

  function triEdges(tri) {
    return [
      [tri[0], tri[1]],
      [tri[1], tri[2]],
      [tri[2], tri[0]]
    ];
  }

  // Unique edges appearing in a list of triangles.
  function uniqueEdges(triangles) {
    const seen = new Set();
    const edges = [];
    for (const tri of triangles) {
      for (const [a, b] of triEdges(tri)) {
        const key = edgeKey(a, b);
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([a, b]);
        }
      }
    }
    return edges;
  }

  // ---- Bowyer-Watson Delaunay triangulation --------------------------------
  // Returns an array of triangles, each a [i, j, k] triple of indices into
  // the original `points` array. Assumes generic position (no 4 points
  // exactly cocircular); a small numerical tolerance handles near-ties.

  function circumcircle(a, b, c) {
    const ax = a[0], ay = a[1];
    const bx = b[0], by = b[1];
    const cx = c[0], cy = c[1];
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(d) < 1e-12) return null; // degenerate / collinear
    const ax2ay2 = ax * ax + ay * ay;
    const bx2by2 = bx * bx + by * by;
    const cx2cy2 = cx * cx + cy * cy;
    const ux = (ax2ay2 * (by - cy) + bx2by2 * (cy - ay) + cx2cy2 * (ay - by)) / d;
    const uy = (ax2ay2 * (cx - bx) + bx2by2 * (ax - cx) + cx2cy2 * (bx - ax)) / d;
    const r = Math.sqrt((ux - ax) * (ux - ax) + (uy - ay) * (uy - ay));
    return { x: ux, y: uy, r: r };
  }

  function inCircumcircle(tri, p, pts) {
    const cc = circumcircle(pts[tri[0]], pts[tri[1]], pts[tri[2]]);
    if (!cc) return false;
    const d = Math.sqrt((p[0] - cc.x) * (p[0] - cc.x) + (p[1] - cc.y) * (p[1] - cc.y));
    return d < cc.r - 1e-9; // strictly inside, with a small tolerance
  }

  function triangleArea(a, b, c) {
    return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
  }

  // Radius of the SMALLEST enclosing ball of a triangle (as opposed to the
  // circumradius): equals the circumradius for acute/right triangles, or
  // half of the longest side for obtuse triangles (the ball then sits on
  // that side as its diameter). This is the "Cech radius" of 3 points.
  function minEnclosingRadiusTriangle(a, b, c) {
    const ab = euclid(a, b), bc = euclid(b, c), ca = euclid(c, a);
    const sides = [ab, bc, ca];
    const maxSide = Math.max(ab, bc, ca);
    const sumOthersSq = sides.reduce((s, x) => s + x * x, 0) - maxSide * maxSide;
    if (maxSide * maxSide >= sumOthersSq - 1e-12) {
      return maxSide / 2; // right/obtuse: smallest circle has the longest side as diameter
    }
    const area = triangleArea(a, b, c);
    if (area < 1e-12) return maxSide / 2; // degenerate/collinear fallback
    return (ab * bc * ca) / (4 * area);
  }

  function delaunayTriangulate(points) {
    const n = points.length;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of points) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const dx = maxX - minX || 1;
    const dy = maxY - minY || 1;
    const deltaMax = Math.max(dx, dy);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const superA = [midX - 20 * deltaMax, midY - deltaMax];
    const superB = [midX, midY + 20 * deltaMax];
    const superC = [midX + 20 * deltaMax, midY - deltaMax];

    const allPts = points.concat([superA, superB, superC]);
    const superIdx = new Set([n, n + 1, n + 2]);

    let triangles = [[n, n + 1, n + 2]];

    for (let i = 0; i < n; i++) {
      const p = points[i];
      const badTriangles = triangles.filter((t) => inCircumcircle(t, p, allPts));

      const edgeCount = new Map();
      for (const tri of badTriangles) {
        for (const [a, b] of triEdges(tri)) {
          const key = edgeKey(a, b);
          if (edgeCount.has(key)) {
            edgeCount.get(key).count++;
          } else {
            edgeCount.set(key, { count: 1, a, b });
          }
        }
      }
      const boundary = [];
      for (const { count, a, b } of edgeCount.values()) {
        if (count === 1) boundary.push([a, b]);
      }

      triangles = triangles.filter((t) => !badTriangles.includes(t));
      for (const [a, b] of boundary) {
        triangles.push([a, b, i]);
      }
    }

    return triangles.filter((t) => !t.some((v) => superIdx.has(v)));
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
    uniqueEdges,
    delaunayTriangulate,
    fitPoints,
    minEnclosingRadiusTriangle
  };
})();
