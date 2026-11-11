// SPDX-License-Identifier: Apache-2.0
// Orthogonal routes from a desk to a wander destination through the layout's corridors.
// No pathfinding: get up into the corridor below the desk row, use the nearest vertical
// corridor to change rows, and walk along the destination's corridor. Pure.
import { STATION, CORRIDOR } from "./layout.js";

const centreX = (r) => r.x + r.w / 2;

/** @returns {{x: number, y: number}[] | null} waypoints from the seat to the stand point */
export function planRoute(layout, stationIndex, destinationId) {
  const st = layout.stations[stationIndex];
  const dest = layout.destinations[destinationId];
  if (!st || !dest) return null;
  const rowY = st.rect.y + STATION + CORRIDOR / 2;
  const { x: sx, y: sy } = dest.stand;

  const pts = [st.feet, { x: st.feet.x, y: rowY }];
  if (sy !== rowY) {
    // Vertical corridors are the tall ones (between columns, or the side margins).
    const vertical = layout.corridors.filter((c) => c.h > c.w);
    if (!vertical.length) return null;
    const v = vertical.reduce((best, c) => (Math.abs(centreX(c) - st.feet.x) < Math.abs(centreX(best) - st.feet.x) ? c : best));
    const vx = Math.floor(centreX(v));
    pts.push({ x: vx, y: rowY }, { x: vx, y: sy });
  }
  pts.push({ x: sx, y: sy });

  // Drop zero-length legs and merge straight runs so every segment is one axis, one direction.
  const out = [pts[0]];
  for (const p of pts.slice(1)) {
    const last = out.at(-1);
    if (p.x === last.x && p.y === last.y) continue;
    const prev = out.at(-2);
    if (prev && ((prev.x === last.x && last.x === p.x) || (prev.y === last.y && last.y === p.y))) out[out.length - 1] = p;
    else out.push(p);
  }
  return out;
}

export const routeLength = (r) =>
  r.slice(1).reduce((n, p, i) => n + Math.abs(p.x - r[i].x) + Math.abs(p.y - r[i].y), 0);

export const directionOf = (a, b) =>
  b.x > a.x ? "east" : b.x < a.x ? "west" : b.y > a.y ? "south" : "north";
