// SPDX-License-Identifier: Apache-2.0
// Seated coffee sips for idle agents: a cosmetic acting state, never a host status.
// Pure step function; the caller injects the clock and the random source.

export const MIN_WAIT_MS = 45000;
export const MAX_WAIT_MS = 90000;
export const SIP_MS = 1500;
// Logic ticks every second; a longer silence means we did not observe the agent (sleep,
// hidden throttling, reload), so start over rather than act on a stale deadline.
export const GAP_MS = 5000;

const draw = (now, rng) => now + MIN_WAIT_MS + Math.floor(rng() * (MAX_WAIT_MS - MIN_WAIT_MS));

/**
 * @param {{ status: string, nextSipAt: number|null, sipUntil: number|null, sipping: boolean, at: number } | undefined} prev
 * @param {{ status?: string, now: number, rng: () => number }} input
 */
export function stepCoffee(prev, { status, now, rng }) {
  if (status !== "idle") return { status, nextSipAt: null, sipUntil: null, sipping: false, at: now };

  const observed = prev && prev.status === "idle" && now >= prev.at && now - prev.at <= GAP_MS;
  if (!observed) return { status, nextSipAt: draw(now, rng), sipUntil: null, sipping: false, at: now };

  if (prev.sipUntil !== null) {
    if (now < prev.sipUntil) return { ...prev, at: now };
    return { status, nextSipAt: draw(now, rng), sipUntil: null, sipping: false, at: now };
  }
  if (now >= prev.nextSipAt) return { status, nextSipAt: null, sipUntil: now + SIP_MS, sipping: true, at: now };
  return { ...prev, at: now };
}
