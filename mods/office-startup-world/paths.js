// SPDX-License-Identifier: Apache-2.0
// Asset paths, relative to the Herdr app home (how image() resolves them).
// Every path the scene can ask for is built here so one test can check they exist.

export const ASSET_ROOT = "mods/office-startup-world/assets/";
export const PRESETS = ["nordic-day", "botanical", "blue-hour"];
export const PROPS = ["desk", "chair", "monitor", "keyboard", "coffee-counter", "coffee-machine", "plant", "sofa", "window"];

export const propPath = (preset, id) => `${ASSET_ROOT}environment/${preset}/props/${id}.png`;

/** Single-image still for a character clip, e.g. still("nico", "north", "coding"). */
export const stillPath = (character, direction, clip) =>
  `${ASSET_ROOT}characters/${character}/${direction}-${clip}-still.png`;
