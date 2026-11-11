// SPDX-License-Identifier: Apache-2.0
// scene.js imports the host modules, so this reads its palette table as text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "../..");

test("scene palettes match the environment manifest", () => {
  const src = readFileSync(join(root, "mods/office-startup-world/scene.js"), "utf8");
  const manifest = JSON.parse(readFileSync(join(root, "assets/environment/manifest.json"), "utf8"));
  for (const p of manifest.presets)
    for (const key of ["floor", "line", "wall"]) {
      const re = new RegExp(`["']?${p.id}["']?: \\{[^}]*${key}: "${p.palette[key]}"`);
      assert.match(src, re, `${p.id}.${key} should be ${p.palette[key]}`);
    }
});
