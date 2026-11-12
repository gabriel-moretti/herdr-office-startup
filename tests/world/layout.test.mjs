// SPDX-License-Identifier: Apache-2.0
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLayout, STATION, CORRIDOR, CELL, FEET } from "../../mods/office-startup-world/layout.js";

const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (r, w, h) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h;
const contains = (r, p) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
// Floor-standing props; a monitor sits on its desk and is checked separately.
const props = (l) => [...l.stations.flatMap((s) => [s.desk, s.chair]), ...l.decor.map((d) => d.rect)];

test("a 360 px sidebar fits two stations per row", () => {
  const l = computeLayout({ width: 360, stations: 4 });
  assert.equal(l.columns, 2);
  assert.equal(l.stations.length, 4);
  assert.ok(l.width <= 360);
});

test("narrow panels fall back to one column instead of shrinking sprites", () => {
  assert.equal(computeLayout({ width: 200, stations: 3 }).columns, 1);
});

test("scale divides the available width before choosing columns", () => {
  const l = computeLayout({ width: 360, stations: 2, scale: 2 });
  assert.equal(l.scale, 2);
  assert.equal(l.columns, 1);
});

test("a station keeps its position when more stations are added", () => {
  const one = computeLayout({ width: 360, stations: 1 }).stations[0];
  const five = computeLayout({ width: 360, stations: 5 }).stations[0];
  assert.deepEqual(one, five);
});

test("props never overlap each other and stay inside the scene", () => {
  for (const width of [200, 360, 420]) {
    const l = computeLayout({ width, stations: 5 });
    const all = props(l);
    for (const r of all) assert.ok(inside(r, l.width, l.height), `outside: ${JSON.stringify(r)} at width ${width}`);
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++)
        assert.ok(!overlap(all[i], all[j]), `overlap at width ${width}: ${JSON.stringify(all[i])} ${JSON.stringify(all[j])}`);
  }
});

test("each monitor sits on its own desk", () => {
  for (const s of computeLayout({ width: 360, stations: 3 }).stations) {
    const m = s.monitor, d = s.desk;
    assert.ok(m.x >= d.x && m.y >= d.y && m.x + m.w <= d.x + d.w && m.y + m.h <= d.y + d.h);
  }
});

test("corridors are at least 32 px wide and free of props", () => {
  const l = computeLayout({ width: 360, stations: 4 });
  assert.ok(l.corridors.length > 0);
  for (const c of l.corridors) {
    assert.ok(Math.min(c.w, c.h) >= CORRIDOR, `corridor too narrow: ${JSON.stringify(c)}`);
    for (const p of props(l)) assert.ok(!overlap(c, p), `corridor ${JSON.stringify(c)} crosses ${JSON.stringify(p)}`);
  }
});

test("the seated actor's feet anchor sits on its chair and its cell follows the shared pivot", () => {
  const l = computeLayout({ width: 360, stations: 2 });
  for (const s of l.stations) {
    assert.ok(contains(s.rect, s.feet));
    assert.ok(contains(s.chair, s.feet), "feet should land on the chair");
    assert.deepEqual(s.actor, { x: s.feet.x - FEET.x, y: s.feet.y - FEET.y, w: CELL, h: CELL });
    assert.ok(overlap(s.actor, s.desk), "seated body should reach the desk edge");
  }
});

test("coffee, window and sofa destinations exist with stand points in a corridor", () => {
  const l = computeLayout({ width: 360, stations: 3 });
  for (const id of ["coffee", "window", "sofa"]) {
    const d = l.destinations[id];
    assert.ok(d, `missing destination ${id}`);
    assert.ok(l.corridors.some((c) => contains(c, d.stand)), `${id} stand point not in a corridor`);
    for (const p of props(l)) assert.ok(!contains(p, d.stand), `${id} stand point inside a prop`);
  }
});

test("zero stations still lays out an empty office", () => {
  const l = computeLayout({ width: 360, stations: 0 });
  assert.equal(l.stations.length, 0);
  assert.ok(l.height > 0);
  assert.equal(STATION, 96);
});
