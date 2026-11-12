// SPDX-License-Identifier: Apache-2.0
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CAST, SEATED_CAST, characterForSlot, clipFor, actorImage, canWander, standingImage } from "../../mods/office-startup-world/cast.js";

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

test("only characters with full walk and stand art can wander, and all their images exist", () => {
  assert.equal(canWander("nico"), true);
  assert.equal(canWander("tom"), false); // no north/west walk yet
  for (const direction of ["north", "east", "south", "west"]) {
    for (const clip of ["walk", "stand-idle"]) {
      const img = standingImage("nico", { direction, clip });
      assert.ok(existsSync(join(root, img)), img);
    }
  }
  assert.match(standingImage("nico", { direction: "south", clip: "coffee-sip-standing" }), /south-coffee-sip-standing\.webp$/);
  assert.ok(existsSync(join(root, standingImage("nico", { direction: "south", clip: "coffee-sip-standing" }))));
});

test("Nico walks and stands with the designer's art; the starter only covers what the batch lacks", () => {
  assert.match(standingImage("nico", { direction: "east", clip: "walk" }), /characters\/nico-v2\/east-walk\.webp$/);
  assert.match(standingImage("nico", { direction: "north", clip: "stand-idle" }), /characters\/nico-v2\/north-stand-idle-still\.png$/);
  // The batch's Nico coffee sheet has a table drawn in; the starter's standing sip stays.
  assert.match(standingImage("nico", { direction: "south", clip: "coffee-sip-standing" }), /characters\/nico\/south-coffee-sip-standing\.webp$/);
});

test("reduced motion: every seated character has an existing still for every status", () => {
  for (const id of SEATED_CAST)
    for (const status of ["working", "blocked", "done", "idle", undefined]) {
      const img = actorImage(id, clipFor(status), { still: true });
      assert.equal(img.animated, false, `${id}/${status}`);
      assert.match(img.path, /-still\.png$/, `${id}/${status}`);
      assert.ok(existsSync(join(root, img.path)), `${id}/${status}: ${img.path}`);
    }
});

test("reduced motion: a status still is that clip's own still, not the idle one", () => {
  assert.match(actorImage("tom", "coding", { still: true }).path, /tom\/north-coding-still\.png$/);
  assert.match(actorImage("nico", "blocked", { still: true }).path, /nico\/north-blocked-still\.png$/);
});
