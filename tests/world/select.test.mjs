// SPDX-License-Identifier: Apache-2.0
import { test } from "node:test";
import assert from "node:assert/strict";
import { selectAgent } from "../../mods/office-startup-world/select.js";

const agent = (address, space, extra = {}) => ({ address, space, status: "idle", tab_name: address, title: "", ...extra });
const agents = [agent("t1", "s1"), agent("t2", "s2"), agent("t3", "s2")];

test("an explicit address prop wins when that agent exists", () => {
  assert.equal(selectAgent({ address: "t3", focused: { agent: "t1", space: "s1" }, agents }).address, "t3");
});

test("an address prop for a missing agent shows nothing rather than guessing", () => {
  assert.equal(selectAgent({ address: "t9", focused: { agent: "t1", space: "s1" }, agents }), null);
});

test("without a prop, the focused agent is used", () => {
  assert.equal(selectAgent({ focused: { agent: "t2", space: "s2" }, agents }).address, "t2");
});

test("then the first agent of the focused space", () => {
  assert.equal(selectAgent({ focused: { agent: null, space: "s2" }, agents }).address, "t2");
});

test("no agent in the focused space shows nothing", () => {
  assert.equal(selectAgent({ focused: { agent: null, space: "s9" }, agents }), null);
  assert.equal(selectAgent({ focused: null, agents: [] }), null);
});
