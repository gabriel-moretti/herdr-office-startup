// SPDX-License-Identifier: Apache-2.0
import { test } from "node:test";
import assert from "node:assert/strict";
import { stepCoffee, SIP_MS, MIN_WAIT_MS, MAX_WAIT_MS, GAP_MS } from "../../mods/office-startup-world/coffee.js";

const fixed = (v) => () => v; // injected rng in [0, 1)
const run = (steps, rng = fixed(0)) => {
  let s;
  const out = [];
  for (const [status, now] of steps) { s = stepCoffee(s, { status, now, rng }); out.push(s); }
  return out;
};
// The view ticks once a second; anything slower is an observation gap by design.
const ticks = (status, from, to) => {
  const steps = [];
  for (let now = from; now <= to; now += 1000) steps.push([status, now]);
  if (steps.at(-1)[1] !== to) steps.push([status, to]);
  return steps;
};
const at = (states, now) => states.find((s) => s.at === now);

test("timing matches the spec: 45–90 s between sips, a sip lasts 1.5 s", () => {
  assert.equal(MIN_WAIT_MS, 45000);
  assert.equal(MAX_WAIT_MS, 90000);
  assert.equal(SIP_MS, 1500);
});

test("the first sip comes after the drawn wait, counted from when idle is observed", () => {
  const s = run([...ticks("idle", 1000, 45000), ["idle", 45999], ["idle", 46000]]);
  assert.equal(s[0].nextSipAt, 46000);
  assert.equal(at(s, 45999).sipping, false);
  assert.equal(at(s, 46000).sipping, true);
});

test("the wait is drawn once per opportunity, not on every step", () => {
  let calls = 0;
  const rng = () => { calls++; return 0.5; };
  run([["idle", 0], ["idle", 1000], ["idle", 2000], ["idle", 3000]], rng);
  assert.equal(calls, 1);
});

test("a sip ends after 1.5 s and the next wait is drawn then", () => {
  const s = run([...ticks("idle", 0, 45000), ["idle", 46000], ["idle", 46499], ["idle", 46500]]);
  assert.equal(at(s, 45000).sipping, true);
  assert.equal(at(s, 46499).sipping, true);
  assert.equal(at(s, 46500).sipping, false);
  assert.equal(at(s, 46500).nextSipAt, 46500 + MIN_WAIT_MS);
});

test("the drawn wait spans 45–90 s", () => {
  assert.equal(run([["idle", 0]], fixed(0.5))[0].nextSipAt, 67500);
  assert.ok(run([["idle", 0]], fixed(0.999999))[0].nextSipAt <= MAX_WAIT_MS);
});

test("no coffee outside idle, and any status change cancels a sip at once", () => {
  for (const status of ["working", "blocked", "done", "unknown", undefined]) {
    const [s] = run([[status, 100000]]);
    assert.equal(s.sipping, false, String(status));
    assert.equal(s.nextSipAt, null, String(status));
  }
  const s = run([...ticks("idle", 0, 45000), ["blocked", 45500]]);
  assert.equal(at(s, 45000).sipping, true);
  assert.equal(s.at(-1).sipping, false);
});

test("returning to idle starts a fresh wait instead of reusing the old deadline", () => {
  const s = run([["idle", 0], ["working", 10000], ["idle", 20000]]);
  assert.equal(s[2].nextSipAt, 20000 + MIN_WAIT_MS);
});

test("an observation gap (sleep, hidden, reload) re-observes instead of sipping late", () => {
  const s = run([["idle", 0], ["idle", 1000], ["idle", 1000 + GAP_MS + 1]]);
  assert.equal(s[2].sipping, false);
  assert.equal(s[2].nextSipAt, 1000 + GAP_MS + 1 + MIN_WAIT_MS);
});

test("a clock that goes backwards re-observes too", () => {
  const s = run([["idle", 50000], ["idle", 40000]]);
  assert.equal(s[1].sipping, false);
  assert.equal(s[1].nextSipAt, 40000 + MIN_WAIT_MS);
});

test("steps are pure: the previous state is not mutated", () => {
  const a = stepCoffee(undefined, { status: "idle", now: 0, rng: fixed(0) });
  const copy = { ...a };
  stepCoffee(a, { status: "idle", now: 45000, rng: fixed(0) });
  assert.deepEqual(a, copy);
});
