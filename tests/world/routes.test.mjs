// SPDX-License-Identifier: Apache-2.0
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLayout } from "../../mods/office-startup-world/layout.js";
import { planRoute, routeLength, directionOf } from "../../mods/office-startup-world/routes.js";

const inside = (r, p) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;

function walkPoints(route) {
  const pts = [];
  for (let i = 0; i + 1 < route.length; i++) {
    const [a, b] = [route[i], route[i + 1]];
    const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    for (let k = 0; k <= n; k++) pts.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  }
  return pts;
}

const layouts = [
  ["360 px, two columns", computeLayout({ width: 360, stations: 5 })],
  ["360 px at 2x, one column", computeLayout({ width: 360, stations: 4, scale: 2 })],
];

for (const [name, layout] of layouts) {
  test(`${name}: every route is orthogonal, starts at the seat and ends at the stand point`, () => {
    for (const st of layout.stations)
      for (const dest of Object.keys(layout.destinations)) {
        const r = planRoute(layout, st.index, dest);
        assert.ok(r, `no route ${st.index} -> ${dest}`);
        assert.deepEqual(r[0], st.feet);
        assert.deepEqual(r.at(-1), layout.destinations[dest].stand);
        for (let i = 0; i + 1 < r.length; i++) {
          const [a, b] = [r[i], r[i + 1]];
          assert.ok(a.x === b.x || a.y === b.y, `diagonal segment ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
          assert.ok(a.x !== b.x || a.y !== b.y, "zero-length segment");
        }
      }
  });

  test(`${name}: routes never cross furniture except leaving the actor's own station`, () => {
    const props = [...layout.stations.flatMap((s) => [s.desk, s.chair].map((r) => ({ r, owner: s.index }))),
      ...layout.decor.map((d) => ({ r: d.rect, owner: null }))];
    for (const st of layout.stations)
      for (const dest of Object.keys(layout.destinations))
        for (const p of walkPoints(planRoute(layout, st.index, dest))) {
          if (inside(st.rect, p)) continue; // getting up and out of the own desk area
          for (const { r } of props) assert.ok(!inside(r, p), `${st.index}->${dest} crosses ${JSON.stringify(r)} at ${JSON.stringify(p)}`);
        }
  });

  test(`${name}: once out of the station, every point is in a corridor`, () => {
    for (const st of layout.stations)
      for (const dest of Object.keys(layout.destinations))
        for (const p of walkPoints(planRoute(layout, st.index, dest))) {
          if (inside(st.rect, p)) continue;
          assert.ok(layout.corridors.some((c) => inside(c, p)), `${st.index}->${dest} leaves the corridors at ${JSON.stringify(p)}`);
        }
  });
}

test("route length and direction helpers", () => {
  assert.equal(routeLength([{ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 5, y: 10 }]), 15);
  assert.equal(directionOf({ x: 0, y: 0 }, { x: 0, y: 5 }), "south");
  assert.equal(directionOf({ x: 0, y: 5 }, { x: 0, y: 0 }), "north");
  assert.equal(directionOf({ x: 0, y: 0 }, { x: 5, y: 0 }), "east");
  assert.equal(directionOf({ x: 5, y: 0 }, { x: 0, y: 0 }), "west");
});

test("an unknown destination has no route", () => {
  assert.equal(planRoute(computeLayout({ width: 360, stations: 1 }), 0, "moon"), null);
});
