// SPDX-License-Identifier: Apache-2.0
import { test } from "node:test";
import assert from "node:assert/strict";
import { isReducedMotion, actingOf } from "../../mods/office-startup-world/motion.js";

const pose = { feet: { x: 10, y: 20 }, direction: "east", clip: "walk", durationMs: 800 };

test("reducedMotion is off unless the layout sets it to true", () => {
  assert.equal(isReducedMotion(undefined), false);
  assert.equal(isReducedMotion({}), false);
  assert.equal(isReducedMotion({ reducedMotion: "true" }), false);
  assert.equal(isReducedMotion({ reducedMotion: false }), false);
  assert.equal(isReducedMotion({ reducedMotion: true }), true);
});

test("reduced motion: no walk, no sip, stills, for every status", () => {
  for (const status of ["working", "blocked", "done", "idle", undefined])
    assert.deepEqual(actingOf({ status, reduced: true, pose, sipping: true }), { pose: null, sipping: false, still: true });
});

test("a non-idle status cancels pose and sip in the same render", () => {
  for (const status of ["working", "blocked", "done", undefined])
    assert.deepEqual(actingOf({ status, reduced: false, pose, sipping: true }), { pose: null, sipping: false, still: false });
});

test("idle keeps its walk, and a walking actor does not sip", () => {
  assert.deepEqual(actingOf({ status: "idle", reduced: false, pose, sipping: true }), { pose, sipping: false, still: false });
  assert.deepEqual(actingOf({ status: "idle", reduced: false, pose: null, sipping: true }), { pose: null, sipping: true, still: false });
});
