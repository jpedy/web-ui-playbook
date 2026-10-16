/**
 * brand-logo-studio — path.mjs
 * Small path utilities for absolute SVG path data made of M L H V Q C S T Z (HarfBuzz emits M L Q C Z).
 * Transforms are applied to the numbers, so outputs carry no transform attributes.
 */
const r2 = (n) => Math.round(n * 100) / 100;
const fmt = (n) => { const v = r2(n); return Object.is(v, -0) ? '0' : String(v); };

/** Tokenize path data into [{cmd, nums[]}] (absolute commands only). */
export function parsePath(d) {
  const out = [];
  const re = /([A-Za-z])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g;
  let m, cur = null;
  while ((m = re.exec(d))) {
    if (m[1]) {
      if (/[a-y]/.test(m[1])) throw new Error(`relative path command "${m[1]}" not supported — use absolute commands`);
      if (/[Aa]/.test(m[1])) throw new Error('arc commands are not supported in transformable paths');
      cur = { cmd: m[1].toUpperCase(), nums: [] }; out.push(cur);
    } else if (cur) cur.nums.push(Number(m[2]));
  }
  return out;
}

/** Apply x' = sx*x + tx, y' = sy*y + ty (scale + translate) to absolute path data. */
export function transformPath(d, { sx = 1, sy = 1, tx = 0, ty = 0 } = {}) {
  return parsePath(d).map(({ cmd, nums }) => {
    if (cmd === 'Z') return 'Z';
    if (cmd === 'H') return 'H' + nums.map((x) => fmt(sx * x + tx)).join(' ');
    if (cmd === 'V') return 'V' + nums.map((y) => fmt(sy * y + ty)).join(' ');
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push(`${fmt(sx * nums[i] + tx)} ${fmt(sy * nums[i + 1] + ty)}`);
    return cmd + pts.join(' ');
  }).join('');
}

/** Bounding box of all points (control points included — slightly generous for curves). */
export function pathBBox(d) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, cx = 0, cy = 0;
  for (const { cmd, nums } of parsePath(d)) {
    const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); cx = x; cy = y; };
    if (cmd === 'H') nums.forEach((x) => add(x, cy));
    else if (cmd === 'V') nums.forEach((y) => add(cx, y));
    else for (let i = 0; i + 1 < nums.length; i += 2) add(nums[i], nums[i + 1]);
  }
  return x0 === Infinity ? null : { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
export function unionBBox(a, b) {
  if (!a) return b;
  if (!b) return a;
  const x0 = Math.min(a.x0, b.x0), y0 = Math.min(a.y0, b.y0), x1 = Math.max(a.x1, b.x1), y1 = Math.max(a.y1, b.y1);
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/** Split path data into subpaths (each starts with M). */
export const subpaths = (d) => (d.match(/M[^M]*/g) || []).map((s) => s.trim());

/** Flatten one subpath to a polygon (curves sampled). */
export function flatten(sub, steps = 8) {
  const pts = [];
  let x = 0, y = 0;
  for (const { cmd, nums } of parsePath(sub)) {
    if (cmd === 'M' || cmd === 'L' || cmd === 'T') for (let i = 0; i + 1 < nums.length; i += 2) { x = nums[i]; y = nums[i + 1]; pts.push([x, y]); }
    else if (cmd === 'Q') for (let i = 0; i + 3 < nums.length; i += 4) { const [qx, qy, ex, ey] = nums.slice(i, i + 4); for (let s = 1; s <= steps; s++) { const t = s / steps, u = 1 - t; pts.push([u * u * x + 2 * u * t * qx + t * t * ex, u * u * y + 2 * u * t * qy + t * t * ey]); } x = ex; y = ey; }
    else if (cmd === 'C') for (let i = 0; i + 5 < nums.length; i += 6) { const [ax, ay, bx, by, ex, ey] = nums.slice(i, i + 6); for (let s = 1; s <= steps; s++) { const t = s / steps, u = 1 - t; pts.push([u * u * u * x + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * ex, u * u * u * y + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * ey]); } x = ex; y = ey; }
    else if (cmd === 'H') nums.forEach((nx) => { x = nx; pts.push([x, y]); });
    else if (cmd === 'V') nums.forEach((ny) => { y = ny; pts.push([x, y]); });
  }
  return pts;
}
export function polygonArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return a / 2; }
export function pointInPolygon([px, py], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Find "dots" in a glyph outline: small subpaths that are not inside any other subpath
 * (counters of ه، ص، م are inside their letter; nuqta are detached). Returns indexes into subpaths(d).
 */
export function findDots(d, maxShare = 0.35) {
  const subs = subpaths(d);
  const polys = subs.map((s) => flatten(s));
  const areas = polys.map((p) => Math.abs(polygonArea(p)));
  const biggest = Math.max(...areas, 0);
  const centroid = (p) => p.reduce((a, [x, y]) => [a[0] + x / p.length, a[1] + y / p.length], [0, 0]);
  return subs.map((_, i) => i).filter((i) => {
    if (!biggest || areas[i] >= biggest || areas[i] > biggest * maxShare) return false;
    const c = centroid(polys[i]);
    return !polys.some((p, j) => j !== i && areas[j] > areas[i] && pointInPolygon(c, p));
  });
}
