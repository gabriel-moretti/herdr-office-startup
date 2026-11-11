// SPDX-License-Identifier: Apache-2.0
// Pure scene geometry in base pixels (before `scale`). No host imports, so it is
// testable under Node. Rects are {x, y, w, h}; points are {x, y}.

export const STATION = 96;
export const CORRIDOR = 32;
export const CELL = 48;
export const FEET = { x: 24, y: 40 };

const MARGIN = 16;
const WALL = 32;
const LOUNGE = 48;
const PITCH = STATION + CORRIDOR;

const rect = (x, y, w, h) => ({ x, y, w, h });
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * @param {{ width: number, stations: number, scale?: number, maxColumns?: number }} opts
 *   width: available panel width in logical pixels; scale: integer sprite scale.
 */
export function computeLayout({ width, stations, scale = 1, maxColumns = 2 }) {
  const w = Math.floor(width / scale);
  const columns = Math.max(1, Math.min(maxColumns, Math.floor((w - 2 * MARGIN + CORRIDOR) / PITCH)));
  const gridW = columns * STATION + (columns - 1) * CORRIDOR;
  const left = Math.max(MARGIN, Math.floor((w - gridW) / 2));
  const top = WALL + CORRIDOR;
  const rows = Math.ceil(stations / columns);
  const gridBottom = top + rows * PITCH;

  // A station's geometry depends only on its index, so adding agents never moves existing desks.
  const list = [];
  for (let i = 0; i < stations; i++) {
    const x = left + (i % columns) * PITCH;
    const y = top + Math.floor(i / columns) * PITCH;
    const feet = { x: x + 48, y: y + 78 };
    list.push({
      index: i,
      rect: rect(x, y, STATION, STATION),
      desk: rect(x + 16, y + 8, 64, 48),
      monitor: rect(x + 36, y + 10, 24, 16),
      chair: rect(x + 36, y + 60, 24, 24),
      feet,
      actor: rect(feet.x - FEET.x, feet.y - FEET.y, CELL, CELL),
    });
  }

  const corridors = [rect(0, WALL, w, CORRIDOR)];
  for (let r = 0; r < rows; r++) corridors.push(rect(0, top + r * PITCH + STATION, w, CORRIDOR));
  if (rows > 0) {
    const h = rows * PITCH;
    for (let c = 0; c < columns - 1; c++) corridors.push(rect(left + c * PITCH + STATION, top, CORRIDOR, h));
    if (left >= CORRIDOR) corridors.push(rect(0, top, left, h));
    const right = left + gridW;
    if (w - right >= CORRIDOR) corridors.push(rect(right, top, w - right, h));
  }

  // Decor is placed greedily and skipped when it would collide, so narrow panels stay valid.
  const decor = [];
  const place = (id, r) => {
    if (r.x < 0 || r.x + r.w > w || decor.some((d) => overlaps(d.rect, r))) return null;
    decor.push({ id, rect: r });
    return r;
  };
  const window = place("window", rect(left + 8, 0, 32, 32));
  const ly = gridBottom + 8;
  const sofa = place("sofa", rect(MARGIN, ly, 64, 32));
  const counter = place("coffee-counter", rect(w - MARGIN - 64, ly, 64, 32));
  if (counter) place("coffee-machine", rect(counter.x - 28, ly, 24, 32));
  if (sofa) place("plant", rect(sofa.x + 72, ly, 24, 32));

  const standY = gridBottom - CORRIDOR / 2;
  const destinations = {};
  if (window) destinations.window = { rect: window, stand: { x: window.x + 16, y: WALL + CORRIDOR / 2 } };
  if (counter) destinations.coffee = { rect: counter, stand: { x: counter.x + 32, y: standY } };
  if (sofa) destinations.sofa = { rect: sofa, stand: { x: sofa.x + 32, y: standY } };

  return {
    scale,
    width: w,
    height: gridBottom + LOUNGE + 8,
    columns,
    wall: rect(0, 0, w, WALL),
    stations: list,
    corridors,
    decor,
    destinations,
  };
}
