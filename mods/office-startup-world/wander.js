// SPDX-License-Identifier: Apache-2.0
// Idle wandering: after more than five minutes of continuously observed idle an agent gets
// up, walks a corridor route to a free destination, stays a while and walks back.
// A cosmetic acting state only; any status change or observation gap sends it straight back
// to its desk. Pure: the caller injects the clock, the random source and the layout.
import { planRoute, directionOf } from "./routes.js";

export const IDLE_MS = 300000; // strictly more than this
export const SPEED = 24; // base px per second
export const MAX_WANDERERS = 2;
export const GAP_MS = 5000;
const VISIT = [8000, 20000];
const COOLDOWN = [30000, 60000];
const STANDING_SIP_MS = 1500;

const between = ([lo, hi], rng) => lo + Math.floor(rng() * (hi - lo));
const segMs = (a, b) => Math.round(((Math.abs(b.x - a.x) + Math.abs(b.y - a.y)) / SPEED) * 1000);
const layoutKey = (l) => `${l.width}:${l.scale}:${l.columns}`;
const seated = (status, now, extra = {}) =>
  ({ status, phase: "seated", idleSince: status === "idle" ? now : null, cooldownUntil: 0, at: now, snap: false, ...extra });

/** Move along the path while segment ends are in the past; returns the arrival time or null. */
function advance(s, now) {
  while (s.seg < s.path.length - 1) {
    const end = s.segStart + segMs(s.path[s.seg], s.path[s.seg + 1]);
    if (now < end) return null;
    s.segStart = end;
    s.seg += 1;
  }
  return s.segStart;
}

/**
 * @param {Map<string, object>} previous
 * @param {{ actors: { address: string, slot: number, status?: string, canWander: boolean, sipping: boolean }[],
 *           now: number, rng: () => number, layout: object }} input
 * @returns {Map<string, object>}
 */
export function stepWander(previous, { actors, now, rng, layout }) {
  const key = layoutKey(layout);
  const next = new Map();
  for (const a of actors) {
    const prev = previous.get(a.address);
    const observed = prev && prev.status === "idle" && a.status === "idle" && now >= prev.at && now - prev.at <= GAP_MS;
    if (!observed) {
      next.set(a.address, seated(a.status, now, { snap: !!prev && prev.phase !== "seated" }));
      continue;
    }
    const s = { ...prev, at: now, snap: false };
    if (s.phase !== "seated" && s.layoutKey !== key) {
      // Back to the desk, and sit out a cooldown so it does not leave again in the same step.
      next.set(a.address, seated(a.status, now, { idleSince: s.idleSince, snap: true, cooldownUntil: now + between(COOLDOWN, rng) }));
      continue;
    }
    if (s.phase === "walk" || s.phase === "back") {
      const arrived = advance(s, now);
      if (arrived !== null && s.phase === "walk") {
        Object.assign(s, { phase: "visit", arrivedAt: arrived, visitUntil: arrived + between(VISIT, rng),
          sipUntil: s.dest === "coffee" ? arrived + STANDING_SIP_MS : null });
      } else if (arrived !== null) {
        Object.assign(s, { phase: "seated", path: null, dest: null, cooldownUntil: arrived + between(COOLDOWN, rng) });
      }
    }
    if (s.phase === "visit" && now >= s.visitUntil) {
      Object.assign(s, { phase: "back", path: [...s.path].reverse(), seg: 0, segStart: s.visitUntil });
      if (advance(s, now) !== null) Object.assign(s, { phase: "seated", path: null, dest: null, cooldownUntil: now + between(COOLDOWN, rng) });
    }
    next.set(a.address, s);
  }

  // Starting is decided after everyone moved, so the wanderer cap and reservations are current.
  const away = [...next.values()].filter((s) => s.phase !== "seated");
  const taken = new Set(away.map((s) => s.dest));
  let count = away.length;
  for (const a of actors) {
    const s = next.get(a.address);
    if (count >= MAX_WANDERERS) break;
    if (s.phase !== "seated" || a.status !== "idle" || !a.canWander || a.sipping) continue;
    if (s.idleSince === null || now - s.idleSince <= IDLE_MS || now < s.cooldownUntil) continue;
    const free = Object.keys(layout.destinations).sort().filter((d) => !taken.has(d));
    if (!free.length) break;
    const dest = free[Math.floor(rng() * free.length)];
    const path = planRoute(layout, a.slot, dest);
    if (!path || path.length < 2) continue;
    const target = layout.destinations[dest];
    const face = target.rect.y + target.rect.h / 2 > target.stand.y ? "south" : "north";
    Object.assign(s, { phase: "walk", dest, path, seg: 0, segStart: now, face, layoutKey: key });
    taken.add(dest);
    count += 1;
  }
  return next;
}

/**
 * What to draw: null while seated (the desk clip applies), otherwise the feet target, the
 * facing, the clip and how long the native transition to that target should take.
 */
export function poseOf(s, now) {
  if (!s || s.phase === "seated") return null;
  if (s.phase === "visit") {
    const sipping = s.sipUntil !== null && now < s.sipUntil;
    return { feet: s.path.at(-1), direction: sipping ? "south" : s.face, clip: sipping ? "coffee-sip-standing" : "stand-idle", durationMs: 0 };
  }
  const a = s.path[s.seg];
  const b = s.path[Math.min(s.seg + 1, s.path.length - 1)];
  return { feet: b, direction: directionOf(a, b), clip: "walk", durationMs: segMs(a, b) };
}

/** When this actor next needs a redraw (segment end, sip end, visit end), or null. */
export function nextEventAt(s, now = -Infinity) {
  if (!s || s.phase === "seated") return null;
  if (s.phase === "visit") return [s.sipUntil, s.visitUntil].filter((t) => t !== null && t > now).sort((x, y) => x - y)[0] ?? null;
  return s.segStart + segMs(s.path[s.seg], s.path[s.seg + 1]);
}

/** Changes that need a redraw: phase, segment or standing-sip state. */
export const visibleKey = (s, now) => (s ? `${s.phase}:${s.seg ?? ""}:${poseOf(s, now)?.clip ?? ""}` : "");
