# Idle clock, coffee, wandering and performance — 03-idle-coffee-wander

## Prompt for Claude Code

Work locally on Gabriel's M5 in **herdr-office-startup**, after milestone 02 is accepted. Read [CLAUDE.md](../CLAUDE.md) and the [shared rules](README.md), then the specs below.

**Goal:** purely cosmetic idle behavior from a pure reducer plus native movement, preserving the real source state and attention priority.

This milestone is two PRs with a stop between them. **Part A** is logic and movement, provable mostly with portable tests. **Part B** is the real-Mac gate: the unaccelerated 5-minute test, lifecycle cases and the performance protocol (about 2.5 hours of quiet-machine measurement). Do not start B until A is reviewed.

### Read
- [compatibility.md](../docs/compatibility.md)
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [POC-PLAN.md](../docs/POC-PLAN.md)
- [WORLD-SPEC.md](../docs/WORLD-SPEC.md)

### Definitions this phase must implement exactly

- **Observation continuity.** The idle counter measures continuously observed idle. Observation is continuous while the 1 s logic timer keeps ticking; it breaks when two consecutive ticks are more than 5 s apart, when the clock goes backwards, on reload/restart, and on reconnect. The host keeps timers running in hidden copies, so **a hidden copy whose timer still ticks keeps counting**; hiding is not a reset by itself. If the Mac test shows ticks being throttled or suspended while hidden, minimized or asleep, the >5 s gap rule resets the counter with no special case.
- **`waiting`** is a visual derivation: `blocked` observed continuously for more than 60 000 ms, same continuity rule. It is owned by this phase because it needs the clock.
- **Interruption without position read-back.** Unless the milestone 01 spike found a way to read an interpolated position, the reducer computes where the actor is from segment start time, speed and elapsed time, and interruption either snaps to the desk or starts a new transition from that computed point. Never busy-redraw to track position.

### Intended files / boundaries

`mods/office-startup-world/state-machine.js`, `routes.js`, `main.js`, `scene.js`, `fixtures.js`; `tests/world/state-machine.test.mjs`, `routes.test.mjs`; `docs/poc-report.md`, `docs/performance.md`. Proposed paths.

### Part A — logic and movement

- [ ] **A1.** Tests first, idle clock: 300000 ms not eligible, 300001 ms eligible; idle seen at startup counts from now; `done → idle` starts a new counter; clock regression; tick gap > 5 s, reconnect and restart reset; hidden-with-ticks keeps counting.

- [ ] **A2.** Tests first, `waiting`: 60000 ms still `blocked`, 60001 ms `waiting`; leaving `blocked` clears it; a gap resets it.

- [ ] **A3.** Tests first, coffee: deadline drawn once per opportunity in 45–90 s from the injected RNG, never in render; one-shot 1500 ms; none in working/blocked/done/unknown/offline; never concurrent with standing or a route.

- [ ] **A4.** Tests first, interruption at every route segment, at the visit and during a sip: `blocked` and `done` → desk in the same render; `working` → status immediate, back at the desk within 1.5 s, coding only once seated; unknown/offline stop and show the still; a gone terminal releases the desk and never walks or respawns.

- [ ] **A5.** Tests first, routes: orthogonal segments only, 24 px/s, visit 8–20 s, cooldown 30–60 s, at most 2 wanderers (exercised through fixtures, since only one real actor exists), destination reservation, bounds and blockers respected after reflow, fallback to desk when a destination is unreachable.

- [ ] **A6.** Implement: `cx.timer.every(1000, …)` for deadlines only, `notify` only when the rendered output changes; one native `.transition` per segment with the verified signature; stand/sit is a pose cut. Extend fixture mode with a short clock, usable only when the `fixture` prop is on.

- [ ] **A7.** `reducedMotion`: stills only, no coffee or routes, alerts and focus intact. Identity and reserved desk persist while away; clicking actor or desk focuses the same terminal mid-route.

Part A acceptance: all portable tests pass; `check`/`status` clean; a fixture-clock walkthrough on the Mac shows each transition and interruption. PR `phase/03a-idle-logic`, then stop for review.

### Part B — real Mac gate

- [ ] **B1.** Real idle test with the production clock: keep a real agent idle for more than 5 minutes; the walk must start between 300 and 302 s. Then provoke real `blocked` and `working` during a route and during a sip.

- [ ] **B2.** Lifecycle: hidden column / other stack child, minimized window, space switch, sleep/wake, save-triggered reload. For each, record whether ticks continued and what the counter did, against the definitions above.

- [ ] **B3.** Performance protocol from [POC-PLAN](../docs/POC-PLAN.md), sampled with `scripts/perf/sample_cpu.py` ([usage](../scripts/perf/README.md)) and compared with a baseline retaken in the same session as well as the milestone 01 one: 60 s warm-up + 5 min × 3 for coding, walking and hidden with one real actor, then 10 and 30 fixture actors rendered separately. Memory: 10 min alternating states, three runs. Use `show_fps_monitor()` or Instruments for frame times; without either, make no FPS claim.

Part B acceptance:

- Idle starts within 300–302 s; `blocked` alert within 250 ms of the snapshot reaching the mod; `working` back at desk within 1.5 s.
- ΔCPU ≤ 3 pp with one actor, ≤ 1 pp hidden, ≤ 8 / 15 pp for 10 / 30 fixtures; memory growth ≤ 10 MiB per 10 min after warm cache with no monotonic trend. On failure, stop and optimize; a missed budget is not a "known limitation".
- `docs/poc-report.md` and `docs/performance.md` state actual vs simulated evidence, decoder issues, noise and rollback.

PR `phase/03b-mac-gate`, title "Idle, coffee, wandering: Mac gate and performance". Handoff per the [shared rules](README.md).
