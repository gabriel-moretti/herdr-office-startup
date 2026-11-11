// SPDX-License-Identifier: Apache-2.0
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CAST, SEATED_CAST, characterForSlot, clipFor, actorImage } from "../../mods/office-startup-world/cast.js";

const root = join(import.meta.dirname, "../..");

test("host statuses map to the seated clip names", () => {
  assert.equal(clipFor("working"), "coding");
  assert.equal(clipFor("blocked"), "blocked");
  assert.equal(clipFor("done"), "done");
  assert.equal(clipFor("idle"), "idle");
  assert.equal(clipFor(undefined), "unknown");
  assert.equal(clipFor("something-new"), "unknown");
});

test("neighbouring desks get different characters while the cast allows", () => {
  assert.ok(SEATED_CAST.length >= 2);
  assert.notEqual(characterForSlot(0), characterForSlot(1));
  assert.equal(characterForSlot(SEATED_CAST.length), characterForSlot(0));
});

test("the designer's Tom is the first seated character", () => {
  assert.equal(characterForSlot(0), "tom");
});

test("a missing clip falls back to that character's idle still, never to a broken path", () => {
  const img = actorImage("tom", "unknown");
  assert.equal(img.animated, false);
  assert.match(img.path, /tom\/north-idle-still\.png$/);
});

test("every seated character has an existing image for every status", () => {
  for (const id of SEATED_CAST)
    for (const status of ["working", "blocked", "done", "idle", undefined]) {
      const img = actorImage(id, clipFor(status));
      assert.ok(existsSync(join(root, img.path)), `${id}/${status}: ${img.path}`);
    }
});

test("cast entries declare only clips they ship", () => {
  for (const [id, c] of Object.entries(CAST)) assert.ok(c.clips.length > 0, id);
});

test("every seated character ships the seated coffee sip as an animated clip", () => {
  for (const id of SEATED_CAST) {
    const img = actorImage(id, "coffee-sip-seated");
    assert.equal(img.animated, true, id);
    assert.ok(existsSync(join(root, img.path)), img.path);
  }
});
