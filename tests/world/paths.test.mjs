// SPDX-License-Identifier: Apache-2.0
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ASSET_ROOT, PRESETS, PROPS, propPath, stillPath } from "../../mods/office-startup-world/paths.js";
import { computeLayout } from "../../mods/office-startup-world/layout.js";

const root = join(import.meta.dirname, "../..");

test("paths are relative to the app home and point inside the mod", () => {
  assert.equal(ASSET_ROOT, "mods/office-startup-world/assets/");
  assert.ok(!propPath("nordic-day", "desk").startsWith("/"));
});

test("every prop of every preset exists", () => {
  for (const preset of PRESETS)
    for (const id of PROPS) assert.ok(existsSync(join(root, propPath(preset, id))), propPath(preset, id));
});

test("every decor id the layout can place is a known prop", () => {
  for (const width of [200, 360, 420])
    for (const d of computeLayout({ width, stations: 3 }).decor) assert.ok(PROPS.includes(d.id), d.id);
});

test("the seated still used by the static scene exists", () => {
  assert.ok(existsSync(join(root, stillPath("nico", "north", "coding"))));
});
