# PoC scene and host contract — 01-poc-scene

## Prompt for Claude Code

Work locally on Gabriel's M5 in **herdr-office-startup**, after milestone 00 is accepted. Read [CLAUDE.md](../CLAUDE.md) and the [shared rules](README.md), then the specs below.

**Goal:** first retire the technical unknowns with a throwaway spike, then build the smallest native office scene with Nico still and a real terminal focus target, plus the tooling every later phase reuses (test command, asset sync, staging, CI, perf baseline). No animation logic, Git, network, subprocess or user-config rewrite.

### Read
- [compatibility.md](../docs/compatibility.md)
- [HERDR-API-NOTES.md](../docs/HERDR-API-NOTES.md)
- [WORLD-SPEC.md](../docs/WORLD-SPEC.md)
- [POC-PLAN.md](../docs/POC-PLAN.md)

### Intended files / boundaries

`mods/office-startup-world/main.js`, `mod.json`, `scene.js`, `assets/`; `layouts/office-startup-poc.json`; `tests/world/manifest.test.mjs`; `package.json` with the real test script; `scripts/build/sync_assets.*` and `scripts/build/stage.*`; `.github/workflows/ci.yml`; `docs/performance.md`. Proposed paths, not existing files. The repo folder is the installable folder (ADR-019): source name and installed ID are the same.

### Part 0 — spike (throwaway, about half a day)

Three unknowns can invalidate the World design or the art pipeline, and the current plan would otherwise only meet them in milestones 02 and 03. Answer them before writing the scene.

- [ ] **0.1** Ask Gabriel for the durable staging approval described in the shared rules. Record the current layout name from `herdr-app status`.

- [ ] **0.2** Create a scratch mod `office-startup-spike` directly in the app home (not in the repo), `place: "none"`, shown through `openOverlay` or a cloned scratch layout `office-startup-spike` (note: `layout.clone` switches the active layout to the clone). Copy a few existing Nico exports into it.

- [ ] **0.3** Answer, on both the 1× external display and the 2× built-in one, and write each result into the "Still to be exercised" list of `docs/compatibility.md`:
  1. Does `image()` play animated GIF and animated WebP? Alpha, loop, per-frame timing, disposal; does changing the path restart the clip?
  2. Is a 48×48 sprite crisp at 1×, 2× and 3× element size, or filtered? Is there any way to get nearest-neighbor?
  3. Does `.transition("left" / "top", …)` need an `id`? When the target changes mid-flight, does it continue from the current point, restart or jump?
  4. Does a `cx.timer.every(1000, …)` keep its cadence while the copy is hidden, the window minimized, and across sleep/wake? Log tick gaps.
  5. Does the app follow a symlinked mod folder?

- [ ] **0.4** Switch back with `herdr-app do layout.switch '{"name":"<recorded layout>"}'`, remove the scratch mod and layout, and confirm `herdr-app status` shows the recorded layout and no errors.

- [ ] **0.5** Report to Gabriel before continuing. If animated images do not play, or sprites cannot be shown crisp, stop: the asset formats or sizes in [ASSETS](../docs/ASSETS.md) and [WORLD-SPEC](../docs/WORLD-SPEC.md) need a decision before any scene code. If transitions cannot be redirected mid-flight, milestone 03 uses snap-to-desk and reducer-computed positions; note it now.

Nothing from the spike is committed except the findings in `docs/compatibility.md`.

### Part 1 — scene and tooling

- [ ] **1.** Write a failing manifest/path test: `place: "none"`, `size: 360`, folder name equals installed ID, every asset the code references exists under `mods/office-startup-world/assets/` and is addressed relative to the app home. Establish `package.json` and the `node --test` script; no fake passing scripts.

- [ ] **2.** Asset sync: root `assets/` stays the output of the art pipeline; `sync_assets` copies only the runtime subset (clips, stills, manifests — no atlases or previews) into `mods/office-startup-world/assets/`. Add a test that the mod's copy is identical to the pipeline output, so the two cannot drift.

- [ ] **3.** Minimal CI: one workflow running `node --test`, `python3 scripts/verify_starter.py` and the asset validator on push and PR. No secrets, no macOS-only claims.

- [ ] **4.** Create the minimal View, `mod.json`, and a static layered scene. Terminal selection: an optional `address` prop for local testing; without it, use `focused()?.agent`, then the first agent of the current space. **The committed layout carries no terminal address** — addresses like `t8` are session-specific.

- [ ] **5.** Layout: base it on the shipped `main`, not on whatever is active (today the third-party `pixel-hq`). `herdr-app do layout.clone '{"name":"main","as":"office-startup-poc"}'` (refuses an existing name), add the World block, then copy the resulting JSON into the repo. The clone becomes the active layout; switch back to the recorded one when done testing. Do not invent node fields.

- [ ] **6.** Staging: copy (or symlink, if the spike showed it works) the repo folders to the app home. The script refuses any path outside the project-owned prefixes and prints what it wrote. No runtime reference to the checkout or to absolute paths.

- [ ] **7.** Stage, run `check` and `status`, switch to the new layout, resize narrow and wide, inspect alpha on both displays, click desk and actor and confirm both focus the same real terminal.

- [ ] **8.** Perf baseline with `scripts/perf/sample_cpu.py` (see [scripts/perf/README](../scripts/perf/README.md)), CSVs under ignored `local/perf/` and a summary in `docs/performance.md`: same window size, power state and quiet terminals; three runs each of (a) layout `main` without World and (b) the static scene. Note whether `show_fps_monitor()` gives usable frame numbers. Later gates compare against these runs.

- [ ] **9.** Keep screenshots in `local/` until redacted. Switch back to the previous layout and show that settings, keys and other layouts and mods are byte-identical to before.

### Acceptance

- Spike questions answered in `docs/compatibility.md`, with a go/no-go from Gabriel.
- Manifest/path and asset-sync tests fail then pass; validators and CI pass.
- `herdr-app check` exits 0, `status.errors` is empty, interactive focus and resize verified on the Mac.
- Baseline measurements recorded with method and raw samples.
- No app-home change outside project-owned paths; no scope beyond the static scene.

Branch `phase/01-poc-scene`, PR title "PoC scene and host contract". Handoff per the [shared rules](README.md).
