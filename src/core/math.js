export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const lerp = (a, b, t) => a + (b - a) * t;

export const lerpPoint = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a, n) => ({ x: a.x * n, y: a.y * n });

export const length = (a) => Math.hypot(a.x, a.y);
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const normalize = (a) => {
  const size = length(a) || 1;
  return { x: a.x / size, y: a.y / size };
};

export const dot = (a, b) => a.x * b.x + a.y * b.y;

export function distanceToSegment(point, start, end) {
  const segment = sub(end, start);
  const denom = dot(segment, segment);
  if (!denom) return distance(point, start);
  const t = clamp(dot(sub(point, start), segment) / denom, 0, 1);
  return distance(point, add(start, scale(segment, t)));
}

export function segmentsIntersect(a, b, c, d) {
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  return ((abC > 0 && abD < 0) || (abC < 0 && abD > 0)) && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0));
}

export function randomBetween(min, max) { return min + Math.random() * (max - min); }
export function randomItem(items) { return items[Math.floor(Math.random() * items.length)]; }

export function formatScore(value) { return Math.round(value).toString().padStart(6, "0"); }
