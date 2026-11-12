// SPDX-License-Identifier: Apache-2.0
// What an actor may act out this render. Pure.

/** The layout's `reducedMotion` prop; off unless it is exactly true. Milestone 04 moves it to preferences. */
export const isReducedMotion = (p) => p?.reducedMotion === true;

/**
 * Reduced motion shows the status still with no walk or sip; labels, alerts and focus are unchanged.
 * Otherwise a non-idle status wins over any acting state in this same render, and a walker never sips.
 * @param {{ status?: string, reduced: boolean, pose: object | null, sipping: boolean }} o
 */
export function actingOf({ status, reduced, pose, sipping }) {
  if (reduced || status !== "idle") return { pose: null, sipping: false, still: reduced };
  return { pose, sipping: !pose && sipping, still: false };
}
