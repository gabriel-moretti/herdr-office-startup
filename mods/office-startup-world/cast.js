// SPDX-License-Identifier: Apache-2.0
// Which character sits at a desk and which image shows a host status. Pure.
import { ASSET_ROOT } from "./paths.js";

// Seated (north) clips each character ships today. Tom comes from the 2026-11-11 designer
// batch; Nico is still the starter art until the designer's desk sheet is redone.
export const CAST = {
  tom: { clips: ["coding", "blocked", "done", "idle"] },
  nico: { clips: ["coding", "blocked", "waiting", "done", "idle", "unknown"] },
};
export const SEATED_CAST = ["tom", "nico"];

const CLIPS = { working: "coding", blocked: "blocked", done: "done", idle: "idle" };

/** Host status -> seated clip name; anything unexpected reads as unknown. */
export const clipFor = (status) => CLIPS[status] ?? "unknown";

/** Desks alternate through the cast so neighbours look different. */
export const characterForSlot = (slot) => SEATED_CAST[slot % SEATED_CAST.length];

/**
 * The image for a character playing a clip: the animated WebP when the character ships it,
 * otherwise its idle still, so a missing clip never renders a broken path.
 * @returns {{ path: string, animated: boolean }}
 */
export function actorImage(character, clip) {
  const base = `${ASSET_ROOT}characters/${character}/north-`;
  if (CAST[character]?.clips.includes(clip)) {
    // Single-frame clips (unknown) only exist as stills.
    return clip === "unknown" ? { path: `${base}unknown-still.png`, animated: false } : { path: `${base}${clip}.webp`, animated: true };
  }
  return { path: `${base}idle-still.png`, animated: false };
}
