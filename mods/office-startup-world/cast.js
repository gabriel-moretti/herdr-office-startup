// SPDX-License-Identifier: Apache-2.0
// Which character sits at a desk and which image shows a host status. Pure.
import { ASSET_ROOT } from "./paths.js";

// Seated (north) clips each character ships today. Tom comes from the 2026-11-11 designer
// batch; Nico is still the starter art until the designer's desk sheet is redone.
export const CAST = {
  // wander: has walk and stand-idle in all four directions plus the standing coffee sip.
  tom: { clips: ["coding", "blocked", "done", "idle", "coffee-sip-seated"], wander: false },
  // Nico walks and stands with the designer's frames (nico-v2); the starter set covers the
  // desk clips and the standing sip until the batch's Nico desk and coffee sheets are redone.
  nico: { clips: ["coding", "blocked", "waiting", "done", "idle", "unknown", "coffee-sip-seated"], wander: true,
    standing: { walk: "nico-v2", "stand-idle": "nico-v2" } },
};
export const SEATED_CAST = ["tom", "nico"];

const CLIPS = { working: "coding", blocked: "blocked", done: "done", idle: "idle" };

/** Host status -> seated clip name; anything unexpected reads as unknown. */
export const clipFor = (status) => CLIPS[status] ?? "unknown";

/** Desks alternate through the cast so neighbours look different. */
export const characterForSlot = (slot) => SEATED_CAST[slot % SEATED_CAST.length];

/**
 * The image for a character playing a clip: the animated WebP when the character ships it,
 * otherwise its idle still, so a missing clip never renders a broken path. `still` (reduced
 * motion) asks for the clip's still instead of its animation.
 * @returns {{ path: string, animated: boolean }}
 */
export function actorImage(character, clip, { still = false } = {}) {
  const base = `${ASSET_ROOT}characters/${character}/north-`;
  if (CAST[character]?.clips.includes(clip)) {
    // Single-frame clips (unknown) only exist as stills.
    return clip === "unknown" || still ? { path: `${base}${clip}-still.png`, animated: false } : { path: `${base}${clip}.webp`, animated: true };
  }
  return { path: `${base}idle-still.png`, animated: false };
}

export const canWander = (character) => CAST[character]?.wander === true;

/** Image for a standing pose from wander.poseOf: walk loops, stand-idle still, standing sip. */
export function standingImage(character, { direction, clip }) {
  const source = CAST[character]?.standing?.[clip] ?? character;
  const base = `${ASSET_ROOT}characters/${source}/${direction}-${clip}`;
  return clip === "stand-idle" ? `${base}-still.png` : `${base}.webp`;
}
