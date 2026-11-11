# Technical PoC — M5 / Desktop 0.1.15 / core 0.1.20

## Goal and limits

Prove a single character Nico, minimal local scene, real agent selection, acting-state switch, coffee/idle/wander, focus, fallback and native cost. No Git, metrics, audio, network, exec or downloader. The starter has no application code; execution starts at the [milestones](../plans/README.md). The host contract was read on the Mac on 2026-11-11 and recorded in [compatibility.md](compatibility.md); runtime behavior has not been exercised yet. Current Python tests only prove file/asset/coherence.

## Safe preparation on the Mac

- Confirm About/status of Desktop/core, M5, macOS, resolution/scale and the agent that emits status; compare with reported versions. Record versions, BRT date and contract/hash, never publish private config.
- Contract files, app home (`~/.config/herdr-app/`) and control binaries were located on 2026-11-11 ([compatibility.md](compatibility.md)); recheck versions and hashes before each phase. The milestone 01 spike resolves animation, interruption and lifecycle questions. Do not alter the signed bundle in /Applications.
- Save the current layout name and a backup of the configuration files that will be touched. The PoC does not need to touch settings/keys/defaults. Do not copy anything while the final files have not yet been reviewed.
- Use a disposable repo/terminal with no private content in the test/screenshots. One real agent is enough; stress 10/30 uses fixtures, not 30 billable sessions.

## Deliverables per task

1. **Static scene:** `mods/office-startup-world/main.js`, `mod.json`, `scene.js`, `layouts/office-startup-poc.json` after validating the contract. Manifest place none/size 360; layout retains the local terminal composition. Floor, wall, one station and coffee/window/sofa destinations. Sync the runtime subset of root `assets/` into the mod folder with an explicit, tested step. Test still PNG with alpha at 1×/2×.
2. **Adapter and animations:** `agent-source.js`, `animations.js`. Real snapshot, selected by props address or current space/focus. Working/coding, blocked, done, idle, derived unknown; independent offline overlay. Map manifest paths without using the atlas as a runtime API. GIF vs WebP compared with the same sources/pivot.
3. **Testable reducer:** `state-machine.js` receives injected time/config/event and returns acting state/destination/deadlines. `routes.js` keeps the orthogonal graph, bounds and anchors. Write tests before wiring the host. No RNG in render, no position by high-frequency polling.
4. **Coffee and wander:** 1 s logical timer; deadlines 45–90 s coffee, sip 1.5 s; strict idle > 300000 ms; speed 24 px/s, visit 8–20 s, cooldown 30–60 s, max 2 wanderers. Derived `waiting` (blocked > 60 s). Native `.transition` per segment; WebP/GIF cycle. If it cannot be interrupted natively, prefer a conservative snap, not busy-redraw.
5. **Interaction and lifecycle:** click desk/actor→same terminal. Resize/reflow, space switch, zoom/hidden, minimization, reconnect, sleep/wake and hot reload. `close` is not a signal of invisibility. Gap > 5 s restarts idle observation conservatively, as described in the architecture.
6. **Perf, rollback and report:** scenarios below, diagnostics without sensitive data, report with facts and limitations. Only after the gates start an art batch or Git.

## Minimum matrix of pure tests to create

| Case | Input / expected result |
|---|---|
| exact threshold | idle observed t0; tick 300000→seated; 300001→eligible; test does not use >= |
| unknown history | open with apparent old idle→counts from now |
| done→idle | starts a new 5 min window; does not reuse the Pixel HQ heuristic |
| restart/reconnect/gap | counter/coffee/route zeroed; re-observe without inventing history |
| clock going backwards | conservative reset/limit, no negative elapsed or immediate trigger |
| coffee | idle only; next deadline drawn once; one-shot 1500 ms, deadline and cooldown drawn once, never re-drawn on render |
| cancellation | in each segment/visit/coffee: blocked→desk/badge now; done→desk; working→return <= 1.5 s |
| unknown/offline/dead | no walking/typing; distinct warning/lifecycle; no fake respawn |
| reducedMotion | all sourceStates with still, no coffee/route; focus/alerts preserved |
| reflow | actor and destination within bounds; no line crosses blockers |
| seeds | same UTF-8+version+salt→same preset; override/group/fallback; rename does not change persisted seed |
| assets | missing/corrupt path→still/neutral and warning, no crash/notify cycle |

Application commands will be defined when code/tests are created; proposal Node built-in: `node --test tests/world/*.test.mjs`. Do not announce a command as passing today. Existing actual checks: `python3 scripts/assets/validate_assets.py` and `python3 scripts/verify_starter.py`.

## Real host script (do not speed up the clock)

After implementing and reviewing the copy under new IDs:

```sh
herdr-app check ~/.config/herdr-app/mods/office-startup-world
herdr-app status
herdr-app shot /tmp/office-startup-poc.png
```

- Open the new layout through the selector. Compare agent/address/status with the normal UI.
- Produce a real working task, a real input request/blocked and a done completion; observe done→idle on focus. If waiting/unknown/offline are not reproducible at the moment, mark coverage fixture-only, not “real confirmed”.
- Keep the agent truly idle for more than 5 min; wander starts between > 300 and 302 s under normal sampling. Do not use terminal silence as proof. Record the event's arrival time at the mod separately from provider latency.
- During route and sip, provoke blocked: badge/actor at the desk in the same render, target <= 250 ms after snapshot received. Working cancels and returns in <= 1.5 s (snap allowed), with no hidden status waiting.
- Inspect coffee north with no direction turn, GIF/WebP alpha/loop/restart, feet anchor and render over light/dark backgrounds.
- Narrow/wide resize, Retina/device scale, space/layout change, hidden/minimized window, sleep/wake and hot reload. Verify no actor crosses furniture/edge, counter does not run “blind”.
- Fallback with one file missing in a test copy, do not destroy the source; restore and test hot reload. Check must continue without a fatal error with the planned fallback.

## Measurement — proposed budget, not yet measured

Same Mac/power/display/quiet terminal and same window dimension. 60 s of warm-up and 5 min per scenario, 3 repetitions. Baseline normal layout without World; compare World still/coding/wander/hidden. Do not mix real agent work with render load.

- CPU with `scripts/perf/sample_cpu.py` ([usage](../scripts/perf/README.md)) every 10 s; Activity Monitor's smoothed %CPU is not used. Instruments or `show_fps_monitor()` only for frame times. Record samples, mean per run, median/range across 3 runs and absolute values. On macOS 100% equals 1 core; the budget is percentage points of difference, not relative percentage.
- One actor: mean ΔCPU <= 3 pp over baseline; hidden/minimized ΔCPU <= 1 pp. If it fails, reduce asset/cache/notifications and repeat, do not ignore.
- Render fixtures 10/30: initial mean targets ΔCPU <= 8/15 pp, max 2 wanderers. Do not present fixtures as 30 real agents.
- Post-cache memory: 10 min alternating states/routes; net growth <= 10 MiB and no monotonic trend across the 3 runs. Report baseline/RSS/methodology; this is not formal proof of the absence of a leak.
- With Xcode/Instruments available, aim for p95 frame <= 33 ms and no stall >= 100 ms attributable to the mod in the 1 actor case. Without an instrument, do not claim FPS. Record decoder/version/format and number/size of the assets.

## Rollback

Save the previous layout before installing. Switch back through the selector; remove only new paths recorded in the installation inventory (`mods/office-startup-world`, own layout/theme) after confirming that nothing of the user's will be removed. Preferences preserved by default. Restore the backup if any file was changed with consent. No global config reset, no deleting other mods, no editing the signed app. Since this kit does not implement an installer, no destructive command is provided to run blindly.

## Output / evidence

Future report `docs/poc-report.md`: versions/contracts and differences, commands/results, which states were real vs fixtures, redacted screenshots, limits of the placeholder art, perf raw/summary, bugs, decisions on formats/interruption, proven rollback. Gate: QA/security/maintainer accept; otherwise record the failure and stop scope before the next milestone. Do not publish or install on Gabriel's behalf without authorization for the specific action.
