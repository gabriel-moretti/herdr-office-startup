// SPDX-License-Identifier: Apache-2.0
// Status icons: one per source state and visual derivation, drawn as single-color
// masks so the host's svg() can tint them with theme colors.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ICONS = join(import.meta.dirname, "../../mods/office-startup-world/icons");
const STATES = ["working", "blocked", "waiting", "done", "idle", "unknown", "offline"];

const read = (state) => readFileSync(join(ICONS, `status-${state}.svg`), "utf8");

test("every status has an icon", () => {
  for (const state of STATES) assert.ok(existsSync(join(ICONS, `status-${state}.svg`)), `missing status-${state}.svg`);
});

test("icons are 16×16 single-color masks with no external content", () => {
  for (const state of STATES) {
    const svg = read(state);
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 16 16"/, `${state}: root/viewBox`);
    assert.match(svg, /<\/svg>\s*$/, `${state}: closing tag`);
    assert.match(svg, /<title>[^<]+<\/title>/, `${state}: title for accessibility tooling`);
    assert.doesNotMatch(svg, /<script|<image|<foreignObject|href=|url\(|@import|<style/i, `${state}: external or active content`);
    const colors = [...svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(colors.length > 0, `${state}: draws nothing`);
    for (const c of colors) assert.ok(c === "currentColor" || c === "none", `${state}: color ${c} breaks theme tinting`);
  }
});

test("icons are distinct shapes, not recolors of one another", () => {
  const bodies = STATES.map((s) => read(s).replace(/<title>[^<]*<\/title>/, ""));
  assert.equal(new Set(bodies).size, STATES.length);
});
