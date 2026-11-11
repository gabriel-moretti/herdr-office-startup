# Real status adapter and clips — 02-states

## Prompt for Claude Code

Work locally on Gabriel's M5 in **herdr-office-startup**, after milestone 01 is accepted. Read [CLAUDE.md](../CLAUDE.md) and the [shared rules](README.md), then the specs below.

**Goal:** connect Nico to one real agent and play the correct native clip for each state. No clock-driven behavior yet: coffee, wandering and `waiting` (blocked > 60 s) all need the logic timer and belong to milestone 03.

### Read
- [compatibility.md](../docs/compatibility.md)
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [HERDR-API-NOTES.md](../docs/HERDR-API-NOTES.md)
- [ASSETS.md](../docs/ASSETS.md)

### Source model (from the local types)

The host reports four statuses: `working`, `blocked`, `done`, `idle`. Everything else is derived by our adapter and must be labeled as such in code and tests:

| Our sourceState | Derived from |
|---|---|
| working / blocked / done / idle | `AgentInfo.status` |
| unknown | the terminal we are mapped to is not in `agents()` but still exists in `terminals()` (program reports no status), or there is nothing to map yet |
| gone | the mapped terminal is no longer in `terminals()`; releases the desk, never wanders |
| offline (overlay, not a state) | the terminal's machine has `layout === "unavailable"`; `"loading"` shows unknown, not offline |

Confirm each derivation against real host behavior before relying on it; if `terminals()` cannot distinguish "no status" from "exited", say so in `docs/compatibility.md` and keep the conservative reading (unknown).

### Intended files / boundaries

`mods/office-startup-world/agent-source.js`, `animations.js`, `fixtures.js`, `scene.js`, `main.js`; `layouts/office-startup-dev.json` (never shipped); `tests/world/agent-source.test.mjs`, `animations.test.mjs`; `docs/poc-report.md`. Proposed paths.

### Steps

- [ ] **1.** Write failing adapter tests from plain-object fixtures shaped like the real `AgentInfo` / `terminals()` / `machines()` values: the four statuses, mapped terminal absent from `agents()`, terminal gone, machine `loading` and `unavailable`, agent list reordered. Do not invent a `connected` field.

- [ ] **2.** Implement the normalized snapshot keyed by machine + address, rendered reactively with no status polling. Clip mapping, sourceState → clip: `working → coding`, `blocked → blocked`, `done → done`, `idle → idle`, `unknown → unknown` still. Offline is a separate overlay over the still.

- [ ] **3.** Fixture mode, needed from here through milestone 07: a `fixture` prop that replaces the host adapter with scripted snapshots (and, from milestone 03, allows a short clock). It is set only in `layouts/office-startup-dev.json`. The scene shows a visible "fixture" label whenever it is on. Add a test that no layout other than the dev one sets the prop; milestone 07 extends that test to the package.

- [ ] **4.** `reducedMotion` enters here as a prop (default false): every state renders its still, labels and overlays unchanged. Milestone 04 moves it to persisted preferences; do not add a second source of truth now.

- [ ] **5.** Resolve WebP/GIF/still paths from the character manifest; no per-frame timer, no runtime atlas cutting. Compressed frame count is not source frame count.

- [ ] **6.** On the Mac, test decoder alpha, disposal, restart on clip change and loop duration for both formats. GIF 125 ms → 120 ms rounding is known; record what is observed instead of altering source timing. Decide the default format and write the reasoning in `docs/poc-report.md`.

- [ ] **7.** Exercise real `working`, a real input request (`blocked`) and completion (`done`), then `done → idle` on focus. Compare each with the host's own UI. Mark states seen only through fixtures as fixture-only.

- [ ] **8.** Click actor and desk while the state changes; remove one asset in the staged copy and confirm the still/neutral fallback renders without a notify loop; check label contrast on light and dark themes.

### Acceptance

- Adapter and animation tests pass; asset validator passes; `check` and `status` clean after callbacks have run.
- Real states match the host UI; nothing is inferred from a quiet terminal; status labels are never hidden by animation.
- `docs/poc-report.md` separates Mac-observed from fixture-only evidence and records the format decision.
- Fixture mode is unreachable from any layout except the dev one.

Branch `phase/02-states`, PR title "Real status adapter and clips". Handoff per the [shared rules](README.md).
