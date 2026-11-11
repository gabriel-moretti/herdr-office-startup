# Local host compatibility note

What was actually read on Gabriel's Mac, as opposed to public documentation. This file governs over [HERDR-API-NOTES](HERDR-API-NOTES.md) wherever they differ. Recheck it whenever the app or core version changes: the type files are rewritten on every app start.

## Environment (2026-11-11, America/Sao_Paulo)

| Item | Value | How it was read |
|---|---|---|
| Herdr Desktop | 0.1.15 | `herdr-app --version` |
| herdr-core | 0.1.20 | `hc --version` |
| macOS | 27.2.1 (26B131) | `sw_vers` |
| Chip | Apple M5 | `sysctl machdep.cpu.brand_string` |
| Displays | built-in Liquid Retina 2560×1664 (2×); external 1920×1080 at 1× | `system_profiler SPDisplaysDataType` |
| App home | `~/.config/herdr-app/` | contains `AGENTS.md`, `herdr.d.ts`, `gpui-kit.d.ts` |
| App process | `/Applications/Herdr.app/Contents/MacOS/Herdr`; core runs as separate `herdr-core` processes | `ps` |

Contract file hashes (SHA-256, first 16 hex): `AGENTS.md` f18b157edf7f0484, `herdr.d.ts` 373dd8c463672d20, `gpui-kit.d.ts` d4110f250fa8f85f. A different hash means: reread before trusting anything below.

Having both a 1× and a 2× display attached is useful: pixel scaling can be checked on each without changing settings.

## Verified by reading the local contract

"Verified" here means the installed `AGENTS.md` or type files say so. It does not mean the behavior was exercised; that is the next section.

### Status and data

- `Status = "working" | "blocked" | "done" | "idle"`. There is no `unknown`, `waiting`, `error`, `offline` or `stopped` status.
- `agents(): AgentInfo[]` lists only terminals whose program reports a status, in space, tab, pane order. `AgentInfo` has `address`, `pane`, `space`, `space_name`, `tab`, `tab_index`, `tab_name`, `status` (never null), `app`, `program`, `title`, `seq`, `pinned`, `focused`. There is no `connected` or machine field on it.
- `"done"` becomes `"idle"` once someone looks at it on any Herdr client.
- `PaneInfo.status` is `Status | null`: null when the program reports nothing.
- `terminals(): any[]` mirrors `hc ls --json` (address, argv, name, state, …) with `status` as a plain word. Untyped: its exact fields must be observed.
- `machines(): { name: string | null; layout: "loading" | "ready" | "unavailable" }[]`. `name` is null for this computer; offline cores are `unavailable`; `loading` ends after the first read even if it fails.
- `focused()` returns `{ space, tab, pane, terminal, shown, agent, cwd } | null`. With a layout terminal block focused, `pane` and `shown` are null.
- `theme()` names `working`, `blocked`, `done`, `idle` and `unknown` colors, among others. `unknown` exists as a color only.
- `run("pane.focus", { terminal: address })` prefers the first visible layout terminal block showing that terminal, then a model pane.

Consequences for this project: `unknown` is our derivation (a mapped terminal that reports no status), and offline comes from `machines()`, not from the agent.

### Motion

- `.transition(property, policy)` where `policy` is a number or `{ duration, delay?, easing? }` in milliseconds. "Animates later target changes entirely in native GPUI code."
- `.spring(property, { response?, damping?, epsilon? })` also exists.
- `.loop(property, { from, to, period?, easing? })`: there and back every `period` ms (default 1000, minimum 100), about 30 fps, only while drawn.
- `.frames(strings, ms)` is text only. `.spin(ms)` is for `svg`.
- `MotionProperty = "opacity" | "width" | "height" | "left" | "top"`; easing `linear | ease-in | ease-out | ease-in-out`.
- No method for reading an element's current interpolated value appears in the types.
- Native motion runs without the script and stops when not shown. The contract's own rule: animate natively, never with a timer; every redraw of a mod redraws the whole window.

### Images

- `image(path)`: full-color image, "SVG, PNG, JPEG and other GPUI image formats". Path resolves against the app home, not the calling file: `image("mods/<name>/logo.svg")`.
- The local contract does not mention animated GIF or WebP for `image()`, nor any scaling or nearest-neighbor option. Both are open questions below.

### Lifecycle

- Saving any file under the app home reloads every copy in place; the old build's tasks and timers stop. Top-level code has already run by the time `status` reports.
- A copy exists for every place the layout puts it, shown or not. Timers and tasks keep running while hidden.
- `close(cx)` is optional, best effort, and is not called for a hidden copy or an inactive tab.
- The first time the app sees a mod folder it docks one copy per `mod.json` into the shown layout; `"place": "none"` docks nowhere. After that, layouts decide.
- No `setTimeout` / `setInterval`, no top-level `await`. `cx.timer.every(ms, cx => …)` (interval measured from the end of the previous call, so a slow handler delays rather than stacks), one-shot `cx.timer.after(ms, cx => …)`, and `cx.spawn(async cx => …)`. `after` fits the idle/coffee deadlines of plan 03 better than polling.
- `.id("root").on_size_change((size, cx) => …)` reports size.

### Files, layouts, safety

- Shipped layouts and mods are replaced whole on every start. Clone with `herdr-app do layout.clone '{"name":"main","as":"<new>"}'` or `mod.clone`; an existing target name is refused. **`layout.clone` switches the active layout to the clone.**
- An invalid file keeps the last good version and writes `<name>.error`. `ctrl-alt-shift-escape` always returns to `main`.
- `mod.json`: `{ "place": "right" | "left" | "top" | "bottom" | "none", "size": 320 }`, optional `"focusable": true`.
- `herdr-app check <mod folder>` loads once and checks the initial description and eager native elements. It does not lay out the mod or run deferred rows, nested renders or later async states.
- `herdr-app status` reports layout, focus, overlays, zoom and `errors`. `herdr-app shot [file.png]` captures the app window at physical pixel size, including terminals.

### Processes and files (relevant to the Git mod only)

- `exec(cmd, args, { cwd, on, timeout })` runs in the user's real environment; `on` selects a machine, omitted means local. Timeout defaults to 30 000 ms, capped at 600 000. It rejects on timeout or if the program cannot start. No output size limit is documented.
- `readTextFile(path, { on })`, `writeTextFile(path, text, expected)` (local only), `watchFolder(dir)` (local only; macOS watches recursively, including ignored directories).
- `shared(key)` / `setShared(key, value)` are visible to every mod.

### Other

- A native FPS HUD exists: module `gpui-fps`, `show_fps_monitor()`, with a configurable frame budget.
- Sharing convention: a shared item is a folder laid out like the app home — a layout has `layouts/<name>.json` and the `mods/<name>/` it needs; a mod has only `mods/<name>/` and maybe a `keys.json` — with one `RECIPE.md` and one `preview.png` at its root. Installing copies the layout file to `layouts/` and each mod folder to `mods/`, leaves the recipe and preview out, and renames on any name clash instead of overwriting. Repo topic `herdr-layout` or `herdr-mod`. A `RECIPE.md` is a brief from which another agent rebuilds the item.

## Observed on the host (milestone 01 spike, 2026-11-11, in progress)

- **No frames while the window is not on screen.** With the Herdr window covered or on another macOS Space, 40 `herdr-app shot` captures over 13 s were byte-identical and showed content several minutes old, although an overlay was open and a 1 s timer was calling `notify()`. `shot` returns the last frame actually drawn. Consequences: native animation only runs when visible (as documented), visual measurements need the window in front, and a timer-driven state change made while hidden is first drawn when the window returns.
- **Partial WebP frames.** 7 of the 11 starter Nico WebPs (all walks, `blocked`, `waiting`, `south-coffee-sip-standing`) were encoded with sub-rectangle, blended frames after the first (`webpmux -info`). An installed third-party mod documents that Herdr drops those partial regions and writes whole frames instead. The pipeline is being changed to emit full-canvas frames; the on-screen confirmation is still pending.
- **Smoothing control.** Nothing in `gpui-kit.d.ts` sets image sampling. Installed mods that look crisp pre-scale art to an integer multiple offline and size the element to exactly that.
- **Mid-flight interruption, as done by an installed mod.** It recomputes the current position in JS from the segment's start time and duration, then sets a new target with a short transition, on an element with a stable `.id`. Our plan 03 follows the same approach.
- **Animated GIF and WebP play** inside `image()` (Gabriel watched them animate in the spike overlay, including the old partial-frame and the new whole-frame walk WebP side by side). `herdr-app shot` does **not** capture the frame changes of animated images: across 45 captures in 15 s, while the window was drawing (a timer label changed every second and transitions moved), every GIF/WebP showed the same frame. Do not use shots to judge image animation.
- **`image()` scales with smoothing.** A 21-colour sprite shown at 48/96/144 px rendered with 413/1393/2763 distinct colours. The app's own `zoom` setting (0.9 on this Mac) also applies, so 48 logical px became about 43 physical px on the 1× display: no integer scale is reachable from the mod. Crisp pixel art therefore needs art pre-scaled offline; how much is still to be decided.
- **`.transition("left", …)` retargets from the current position.** With `{ duration: 4000, easing: "linear" }`, changing the target mid-flight reversed the element from where it was, without a jump, and ran a fresh 4000 ms from there. An element with `.id(...)` and one without behaved identically in a stable tree.
- **Timer cadence while visible:** `cx.timer.every(1000)` ran with a maximum gap of 1007 ms over the capture.
- `mod.open {name}` toggles a mod as an overlay sized by its `mod.json` `overlay` field, without switching layouts. Useful for tests that must not disturb the user's layout.
- `herdr-app check` passes for the static World scene staged at `mods/office-startup-world`; the active layout and `status.errors` were unaffected by staging.

## Still to be exercised on the host

These need a running mod. The milestone 01 spike answered 1 (animation plays; see above), 2 (smoothed, plus app zoom) and 3 (retargets from the current position). Still open from the spike: 4 (timers while hidden, minimized, across sleep) and 5 (symlinked mod folder).

1. Does `image()` animate GIF and animated WebP? Alpha, loop, per-frame duration, disposal, and what happens when the path changes (restart, cache).
2. How is an image scaled: is a 48×48 sprite crisp at integer scales on the 1× and the 2× display, or filtered?
3. Does `.transition("left" | "top", …)` need an element `id`? What happens when the target changes mid-flight: does it continue from the current point, restart, or jump?
4. Do `cx.timer` callbacks keep their cadence while the copy is hidden, the window minimized, and across sleep/wake?
5. Does the app follow a symlinked mod folder (useful for development staging)?
6. Exact fields of `terminals()` entries: can "no status reported" be told apart from "process exited"?
7. Cross-space and cross-tab behavior of `pane.focus {terminal}`.
8. What `exec` does with very large output.
9. Preferences across multiple copies and windows without collisions.
10. Measured cost with one real actor and with 10/30 fixture actors.

## Local setup worth knowing

The active layout when this was read was the third-party `pixel-hq`; shipped layouts are `main`, `terminals` and `win98`. Other third-party mods are installed, including ones derived from the upstreams this project references. None of them may be overwritten, and none is a license to copy code.
