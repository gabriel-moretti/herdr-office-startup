// SPDX-License-Identifier: Apache-2.0
import { test } from "node:test";
import assert from "node:assert/strict";
import { assignSlots } from "../../mods/office-startup-world/slots.js";

test("new agents take the lowest free desks in arrival order", () => {
  const s = assignSlots(new Map(), ["t1", "t2", "t3"]);
  assert.deepEqual([...s], [["t1", 0], ["t2", 1], ["t3", 2]]);
});

test("reordering or status changes never move an agent", () => {
  const a = assignSlots(new Map(), ["t1", "t2", "t3"]);
  const b = assignSlots(a, ["t3", "t1", "t2"]);
  assert.equal(b.get("t1"), 0);
  assert.equal(b.get("t2"), 1);
  assert.equal(b.get("t3"), 2);
});

test("a departed agent frees its desk for the next newcomer; others stay", () => {
  const a = assignSlots(new Map(), ["t1", "t2", "t3"]);
  const b = assignSlots(a, ["t1", "t3"]);
  assert.deepEqual([...b], [["t1", 0], ["t3", 2]]);
  const c = assignSlots(b, ["t1", "t3", "t4"]);
  assert.equal(c.get("t4"), 1);
});

test("the input map is not mutated", () => {
  const a = assignSlots(new Map(), ["t1"]);
  assignSlots(a, ["t2"]);
  assert.deepEqual([...a], [["t1", 0]]);
});

test("a cap limits how many agents get a desk", () => {
  const s = assignSlots(new Map(), ["a", "b", "c", "d"], 2);
  assert.deepEqual([...s.keys()], ["a", "b"]);
});
