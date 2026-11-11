# Architecture

## Boundaries

JS ESM + JSON + art monorepo. `mods/office-startup-world` and `mods/office-startup-git` are the installable folders themselves (folder name = installed ID, ADR-019); runtime assets are synced into the mod from the art pipeline output in root `assets/`. No mod imports the folder of another installed mod. Shared code is vendored into each mod folder in the source tree; there is no bundling build. The runtime is GPUI with a JavaScript VM; Node/Python only in development. World does not use exec/fetch/network; Git only allowlisted queries.

## Proposed units (to be implemented)

| File in mods/office-startup-world | Responsibility / conceptual interface |
|---|---|
| main.js | View lifecycle and host→state→scene wiring; no duplicated business logic |
| agent-source.js | snapshot of herdr data: machineKey, spaceId, terminalAddress, status, machineLayout (`loading`/`ready`/`unavailable` from `machines()`), terminalLive, focused |
| state-machine.js | pure reducer `(previous, event, nowMs, config) -> {state,effects}`; injected clock/RNG |
| routes.js | orthogonal waypoints, bounds, anchors, destination reservation; path over a small graph |
| animations.js | resolves clip/direction/still from the manifest, without decoding or swapping PNGs by JS timer |
| scene.js | GPUI layers and hit targets of the scene; receives resolved state |
| presets.js | hashing/versioning, configuration and deterministic slots |

The interfaces above are our design, not Herdr APIs. The real connectivity field needs to be adapted to the local types; do not invent `agent.connected` if the host does not have that field.

## Data flow

Reactive `agents/spaces/terminals/machines/focused` → adapter normalizes snapshot → reducer compares identity/state and updates deadlines → animation resolver chooses path → render composes native elements. A 1s logical timer processes deadlines; `notify()` only when acting state/segment changes. The left/top interpolation is native `.transition`, cycles are WebP/GIF. Do not animate images with `cx.notify` every 90ms. A `setShared` per frame also violates the budget.

`localStorage`: appearance, preset and slot of the mod; never credentials. Shared state only for context that other modules really need. gh tokens/account stay outside the product. Persist configuration outside directories replaced in releases, e.g. `data/office-startup-world/preferences.json` using permitted file APIs if necessary; choose one canonical source, do not duplicate localStorage and file without migration.

## Identity and selection

Actor key = machine stable identity + terminal address; space key = machine + space ID. Do not use list index/pane ID/folder name as identity. A space contains stations per live agents. Agent is not pane: click resolves the current address and navigates to the terminal, accepting that pane/tab change. Desk and actor share the logical hit target. A lost connection preserves the last slot as unavailable, not a fake completed agent. A process confirmed terminated frees occupancy.

## Two state machines

**Source:** the host reports working / blocked / done / idle only ([compatibility note](compatibility.md)). `unknown` is our derivation for a mapped terminal that reports no status. Offline is a condition of the connection (`machines().layout === "unavailable"`), not an agent status. `waiting` = blocked for more than 60s, visual only. There is no confirmed `stopped` state.

**Acting state:** seated-idle, coding, blocked, waiting, done, unknown, coffee-sip-seated, stand, walk-out, visit, coffee-sip-standing, walk-back, stand-idle. Acting state keeps sourceState. The graphical representation never writes status to the core or sends input to the agent.

### Clock and coffee

- Start `observedIdleSince=now` on the first idle observation and on a real transition to idle. `done→idle` starts a new counter, unlike the historical Pixel HQ heuristic that unifies done/idle.
- Without prior knowledge: do not reuse a disk timestamp to assert inactivity during restart/disconnect/sleep/hidden gap. Conservative reset after a gap >5s, backward clock or resume; a local test must confirm gap detection without pixel polling.
- Strict limit: 300000ms is not enough, 300001ms makes it eligible. A 1s tick means an expected start between >300 and 302s after the start, under test conditions without suspension.
- Draw the coffee deadline between 45000–90000ms once per opportunity; not in render. Sip of 1500ms, 6 frames ×250ms; no infinite repetition. Idle only by default (`workingCoffeeEnabled=false`).
- Do not start coffee simultaneously with standing up/walking. The coffee visit can use the standing south variant; when finished it returns to stand-idle. Cooldowns kept in the reducer.

### Wander

`seated-idle → stand → walk-out → visit → walk-back → seated-idle`.

Proposed speed 24px/s logical; single axis per segment, north/east/south/west. MVP minimum: small graph of free corridors, destinations coffee/window/sofa. No A*, diagonals or physics. Two simultaneous visits at most per room (`maxWanderers=2`); reserve destination. Pause 8–20s at the visit, 30–60s seated before a new wander if still idle. Desk never changes owner. Standing up/sitting down is a pose/chair-layer swap; there are no dedicated frames in the budget of 65.

### Interruption — priority higher than any acting state

| Event | Result |
|---|---|
| blocked | cancel coffee/route and place at the desk in the same render; real alert immediate, target within 250ms after data reaches the mod |
| done | cancel itinerary, place at the desk and celebrate while the host keeps done |
| working | cancel itinerary/coffee; working status immediate; visual return <=1.5s, snap to the desk if the route is long; coding only when seated |
| unknown/offline | stop animation/movement, still + warning; do not assert idle; reset counter |
| terminal confirmed dead | free occupancy; do not return as done/idle |
| resize/reflow | invalidate path and recalculate anchors/bounds; desk fallback if destination unfeasible |
| reducedMotion | still of the state, no animated coffee/wander; keep alerts and focus |
| sleep/restart/reconnect/gap | re-observe status; do not continue old wander/pre-count |

The native transition must be interrupted using the interpolated position or a conservative snap; `.transition(property, { duration, delay?, easing? })` is known ([compatibility.md](compatibility.md)); whether it needs an `id` and what happens when the target changes mid-flight are answered by the milestone 01 spike. Never wait for arrival to reveal blocked.

## Render and occlusion

Floor → walls/partitions → base furniture → actors ordered by Y anchor → front parts of furniture/desk/monitor → selection and native labels. The scene PNG contains no people. Common feet (24,40) in a 48 cell; body/chair/monitor separate. When paused while walking, stand-idle in the current direction, no sliding in coding pose. Reflow does not allow passing through furniture. The scene is a single rectangle of the mod; no global overlay over terminals.

Real GIF/WebP animation layers, frame disposal, interruption/restart and integer scale need GPUI validation. Pixel art does not justify distorting the logical size for HiDPI; document available device scale and nearest-neighbor.

## Presets / groups

Proposed versioned config: `schemaVersion`, `generatorVersion`, `defaults`, `groups`, `spaces`, `seedSalt`, `preset`, `layoutTemplate`, `decorSet`, `plantDensity`, `idleWanderEnabled`, `idleWanderAfterMs`, `coffeeIntervalMs`, `maxWanderers`, `reducedMotion`.

Precedence: space override > configured groupId > automatic selection. Generic group API not confirmed: groups are our own mapping of spaceKeys until there is a real adapter. FNV-1a 32-bit seed over UTF-8 of `generatorVersion|machineKey|spaceId|salt`; unsigned operations with defined 32 overflow; preset arrays ordered/versioned. Name is only a persisted initial fallback: renaming a space does not change the office. Tests with UTF-8/emoji and the same input repeated are mandatory.

Preset changes floor, wall, wood, plants 2–6, decorSet/rug/static light. It does not change characters/skin, status tokens, doors or navgraph. Templates `office-8` expanded (768×432) and `compact-2col` sidebar. “Vary decoration” changes the saved salt without rearranging desks. Laboratory/library floor plans come later, with their own graph.

## Separate Git

Canonical context: machine+repoRoot+worktree+branch+HEAD+host+owner/repo+gh account. Async queries have a generation token and cache per context/SHA. Nothing in World triggers a Git operation. Git only reads; product config/cache can write outside the checkout. See [GIT-PANEL-SPEC](GIT-PANEL-SPEC.md).
