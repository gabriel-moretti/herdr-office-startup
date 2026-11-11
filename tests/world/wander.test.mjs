// SPDX-License-Identifier: Apache-2.0
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLayout } from "../../mods/office-startup-world/layout.js";
import { planRoute, routeLength } from "../../mods/office-startup-world/routes.js";
import { stepWander, poseOf, nextEventAt, IDLE_MS, SPEED, MAX_WANDERERS } from "../../mods/office-startup-world/wander.js";

const layout = computeLayout({ width: 360, stations: 4 });
const rng0 = () => 0;
const actor = (address, slot, extra = {}) => ({ address, slot, status: "idle", canWander: true, sipping: false, ...extra });

// Ticks once a second like the view, from `from` to `to` inclusive; returns the last map.
function tickRange(map, actors, from, to, { rng = rng0, lay = layout } = {}) {
  let m = map;
  for (let now = from; now <= to; now += 1000) m = stepWander(m, { actors: actors(now), now, rng, layout: lay });
  return m;
}
const idleFor = (actors, ms) => tickRange(new Map(), () => actors, 0, ms);

test("spec constants", () => {
  assert.equal(IDLE_MS, 300000);
  assert.equal(SPEED, 24);
  assert.equal(MAX_WANDERERS, 2);
});

test("strict threshold: still seated at exactly 300000 ms of observed idle, leaves at 300001", () => {
  const a = [actor("t1", 0)];
  const m = idleFor(a, 300000);
  assert.equal(m.get("t1").phase, "seated");
  const m2 = stepWander(m, { actors: a, now: 300001, rng: rng0, layout });
  assert.equal(m2.get("t1").phase, "walk");
});

test("idle seen for the first time counts from now, not from any earlier history", () => {
  const m = stepWander(new Map(), { actors: [actor("t1", 0)], now: 10_000_000, rng: rng0, layout });
  assert.equal(m.get("t1").idleSince, 10_000_000);
});

test("characters without walk art, sipping agents and non-idle agents never leave", () => {
  const actors = [actor("a", 0, { canWander: false }), actor("b", 1, { sipping: true }), actor("c", 2, { status: "working" })];
  const m = idleFor(actors, 301000);
  for (const id of ["a", "b", "c"]) assert.equal(m.get(id).phase, "seated", id);
});

test("at most two wanderers, each to a different destination", () => {
  const actors = [actor("a", 0), actor("b", 1), actor("c", 2)];
  const m = idleFor(actors, 301000);
  const out = [...m.values()].filter((s) => s.phase !== "seated");
  assert.equal(out.length, 2);
  assert.notEqual(out[0].dest, out[1].dest);
});

test("walking follows the route at 24 px/s, then visits for 8–20 s", () => {
  const a = [actor("t1", 0)];
  let m = idleFor(a, 301000);
  const s = m.get("t1");
  assert.equal(s.phase, "walk");
  const route = planRoute(layout, 0, s.dest);
  assert.deepEqual(s.path, route);
  const arrive = s.segStart + Math.ceil((routeLength(route) / SPEED) * 1000);
  m = tickRange(m, () => a, 302000, arrive + 1000);
  const v = m.get("t1");
  assert.equal(v.phase, "visit");
  assert.ok(v.visitUntil - v.arrivedAt >= 8000 && v.visitUntil - v.arrivedAt <= 20000);
});

test("the pose while walking targets the next waypoint with a duration from the segment length", () => {
  const m = idleFor([actor("t1", 0)], 301000);
  const s = m.get("t1");
  const p = poseOf(s, 301000);
  const [a, b] = s.path;
  assert.deepEqual(p.feet, b);
  assert.equal(p.clip, "walk");
  assert.equal(p.durationMs, Math.round(((Math.abs(b.x - a.x) + Math.abs(b.y - a.y)) / SPEED) * 1000));
  assert.ok(["north", "east", "south", "west"].includes(p.direction));
  assert.equal(nextEventAt(s), s.segStart + p.durationMs);
});

test("a coffee visit starts with a 1.5 s standing sip facing south", () => {
  const a = [actor("t1", 0)];
  // rng 0 picks the first free destination in sorted order: coffee.
  let m = idleFor(a, 301000);
  assert.equal(m.get("t1").dest, "coffee");
  const s = m.get("t1");
  const arrive = s.segStart + Math.ceil((routeLength(s.path) / SPEED) * 1000);
  m = tickRange(m, () => a, 302000, arrive + 1000);
  const v = m.get("t1");
  assert.deepEqual(poseOf(v, v.arrivedAt + 100), { feet: v.path.at(-1), direction: "south", clip: "coffee-sip-standing", durationMs: 0 });
  assert.equal(poseOf(v, v.arrivedAt + 1600).clip, "stand-idle");
});

test("after the visit it walks back along the same route and sits for a 30–60 s cooldown", () => {
  const a = [actor("t1", 0)];
  let m = idleFor(a, 301000);
  m = tickRange(m, () => a, 302000, 420000);
  const s = m.get("t1");
  assert.equal(s.phase, "seated");
  assert.ok(s.cooldownUntil > 0);
  const m2 = tickRange(m, () => a, 421000, s.cooldownUntil - 1000);
  assert.equal(m2.get("t1").phase, "seated", "no new walk during cooldown");
});

for (const status of ["blocked", "working", "done", undefined]) {
  test(`${status ?? "no status"} interrupts a walk: back at the desk in the same step, as a snap`, () => {
    let m = idleFor([actor("t1", 0)], 301000);
    m = tickRange(m, () => [actor("t1", 0)], 302000, 303000);
    assert.equal(m.get("t1").phase, "walk");
    m = stepWander(m, { actors: [actor("t1", 0, { status })], now: 303500, rng: rng0, layout });
    const s = m.get("t1");
    assert.equal(s.phase, "seated");
    assert.equal(s.snap, true);
    assert.equal(poseOf(s, 303500), null);
  });
}

test("an observation gap re-observes idle from scratch", () => {
  let m = idleFor([actor("t1", 0)], 299000);
  m = stepWander(m, { actors: [actor("t1", 0)], now: 299000 + 6000, rng: rng0, layout });
  assert.equal(m.get("t1").idleSince, 305000);
  m = stepWander(m, { actors: [actor("t1", 0)], now: 305000 + 1000, rng: rng0, layout });
  assert.equal(m.get("t1").phase, "seated");
});

test("a reflow invalidates the route and sends the walker back to its desk", () => {
  let m = idleFor([actor("t1", 0)], 301000);
  const narrow = computeLayout({ width: 360, stations: 4, scale: 2 });
  m = stepWander(m, { actors: [actor("t1", 0)], now: 302000, rng: rng0, layout: narrow });
  assert.equal(m.get("t1").phase, "seated");
  assert.equal(m.get("t1").snap, true);
});

test("agents that left are dropped and the input map is not mutated", () => {
  const m = idleFor([actor("a", 0), actor("b", 1)], 3000);
  const copy = new Map([...m].map(([k, v]) => [k, { ...v }]));
  const m2 = stepWander(m, { actors: [actor("a", 0)], now: 4000, rng: rng0, layout });
  assert.deepEqual([...m2.keys()], ["a"]);
  assert.deepEqual([...m].map(([k, v]) => [k, { ...v }]), [...copy]);
});
