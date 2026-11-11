# Herdr Desktop — API notes and evidence

## Target and confidence

**Read [compatibility.md](compatibility.md) first: it records what was read on the real installation (Desktop 0.1.15, core 0.1.20, M5) and overrides this file where they differ.** What follows is the earlier public-documentation research, kept as background. Gabriel reported M5, Desktop **0.1.15**, core **0.1.20**. The research consulted public documentation on 11/11/2026 (America/Sao_Paulo/BRT). This **does not prove** every signature in the local installation. The contract files were found on the Mac at `~/.config/herdr-app/` and summarized, with hashes, in compatibility.md. Do not publish private configuration.

## Exact sources

- Desktop guide: https://herdr.dev/guide/
- Main contract: `herdrdev/herdr-app/defaults/AGENTS.md` — https://github.com/herdrdev/herdr-app/blob/master/defaults/AGENTS.md
- Native runtime: `herdrdev/herdr-app/Cargo.toml` — https://github.com/herdrdev/herdr-app/blob/master/Cargo.toml
- Pixel HQ: `mods/company-agents/main.js`, `figures.js`, `scene.js`, `duck.js`, `animate.js`, `editor.js`; https://github.com/bnhan2710/pixel-hq/tree/bc399c661247144f5e3e6f8effd665d12e36cf28
- Pokémon behavior: `mods/pokemon-agents/main.js` and `sprites.js`; https://github.com/SaifHarding/herdr-pokemon-agents-plus/tree/979887b041c366fc2b208216c51f6691235ea5e5
- Munza: `better-changes/mods/better-changes/main.js`, `mod.json`; `branch-pr/mods/branch-pr/main.js`; https://github.com/munza/herdr-mods/tree/2bd4870634b8b0b86984651c98c30cf5be170e60
- Cybertron: `ci-dash/mods/ci-dash/gh.js`, `file-icons/`, root `THIRD_PARTY_NOTICES.md`; https://github.com/cybertron288/herdr-mods/tree/34e7c33

Links to main/master can change. Known SHAs of references are pinned; the installed contract remains mandatory. `gpui-kit.d.ts` and `herdr.d.ts` are documented names of distributed/generated types; on this Mac they are in `~/.config/herdr-app/` (see compatibility.md).

## Model and files

Desktop: herdr-app draws the UI; herdr-core/hc maintains terminals/agents. hc is part of the Desktop and can be used by integrations; we are not supporting the original TUI. Closing the window is not equivalent to stopping all processes. No inferring lifecycle from lack of animation.

App home researched: `~/.config/herdr-app/`. `layouts/*.json`, `themes/*.json`, `mods/<id>/main.js`, `mod.json`; user settings/keys. Shipped layouts and mods are replaced whole on every app start; use own IDs. `data/` and localStorage are state; do not install them by release overwrite. Do not modify the signed bundle in /Applications.

## Layout / theme / mod

Layout = JSON tree of row/column/stack/block with content for mod/props or terminal. Copy the terminal composition of the local version under a new name; do not invent fields. Theme = JSON of colors (background/foreground/selection/cursor/ANSI etc. per the real contract). Layout also takes part in semantic colors and appearance; `theme()` delivers tokens. Theme has no pathfinding or clock.

Minimal mod when implementation begins: `main.js` mandatory, default-export of a View class, init(props,cx), render(cx); import View/div/image from gpui-kit and helpers from gpui-base. `mod.json` proposes place none and size 360. Accepted place: left/right/top/bottom/none. focusable is a documented manifest option, not mandatory for the PoC. `mod.schema.json` is a useful pattern of some upstreams, not a universal requirement of the host.

## APIs verified in the public documentation

| API | Use / restriction |
|---|---|
| agents() | live list/status/address/context; done becomes idle when seen in any client |
| spaces(), terminals(), machines(), focused() | space/tab/machine/terminal/focus; check identity, lifecycle and connection keys against the real types |
| props(), theme(), settings() | per-copy properties, native tokens and appearance |
| run(name,args) | Desktop actions; pane.focus with terminal address for navigation, test cross-space |
| cx.timer.every(ms, callback) | logical deadlines; own cx per callback; no setInterval/setTimeout |
| cx.spawn(async cx => ...) | async tasks; no top-level await; never keep cx |
| cx.notify() | invalidates render/window; avoid redraw loop |
| .absolute/.left/.top/.loop/.transition | composition and native movement; `.loop` covers left/top/opacity etc.; transition signature local |
| .on_size_change | callback size {width,height} logical pixels; use it for reflow, not hover state |
| image(path) | relative to app home; local images; hot reload of assets under mods |
| localStorage; shared/setShared | per copy vs shared state; setShared re-renders others, do not use per frame |
| nextCommand() | commands/shortcuts forwarded to the copy, optional, not needed in the first PoC |
| exec(cmd,args,{cwd,on,timeout}) | future read-only Git; local/remote execution depending on machine; subprocess has timeout |
| readTextFile/writeTextFile/watchFolder | host-specific APIs; World does not need to read the checkout; remote watch requires a distinct strategy |
| close(cx) | best effort cleanup, documented ceiling 250ms on shutdown; not called by hiding a tab |

Live data renders reactively. The 1s timer is for elapsed time/segments, not for fetching the state again. Hidden copies may keep timers running; native animation pauses when not shown per the guide, but real perf must be measured.

## States and Pond figures

Core receives OSC 7501 status from the program. The local type is `working | blocked | done | idle`; `unknown` exists only as a theme color and is a derivation of ours, not a host status. Without a reliable protocol/status do not presume work. waiting is a Pond derivation of blocked >60s; error/offline/stopped are not new confirmed real states.

Pond figures are not a global Herdr engine: Pixel HQ derives from Pond Agents. Config `pond-agents.json`, selection per space, user images `pond-figures/`, distributed images `mods/company-agents/figures/`. Slots working/blocked/waiting/done/idle; formats native drawing, image or text/interval. Movements bob/hop/wiggle/shake/pulse and variants. There is no mandatory universal dimension: 48×48 is our decision. Do not overwrite that configuration of another mod.

Pixel HQ `main.js` records changes via Date.now/localStorage, has short excursions near the desk and `.left/.top/.loop`. The old mapper unifies done/idle for its heuristic, but **will not be copied** to our idle counter. Pokémon Plus stores x/from/target/dir/moving and uses GIF/right-left in one lane; it proves movement inside the mod, not 2D routes across the whole window. Our navgraph, four directions and idle >5min are our own extension.

## Formats and pipeline

Animated GIF/WebP evidenced in the mods; animated SVG does not move in the examined path. Pixel HQ has SVG pre-render and a partial-WebP warning: export complete frames with correct alpha/disposal and test. `.frames()` is text animation, not a generic PNG atlas reader. Atlas is source/build; do not assume a runtime that crops a spritesheet. Distribute ready WebP/GIF clips and still PNGs. The end user does not run converters.

## Diagnostics on the Mac after implementing

```sh
herdr-app check ~/.config/herdr-app/mods/office-startup-world
herdr-app status
herdr-app shot /tmp/office-startup-poc.png
```

Check loads/renders once and can pass despite broken callbacks. Shot captures the app (includes terminals); do not publish without redacting. If the binary is not in the PATH, follow the real installation, do not guess the path. Switch layout via the selector, keep the previous one.

## Local questions

The open host questions now live in the "Still to be exercised on the host" list of [compatibility.md](compatibility.md), together with what was already answered by reading the contract. One item is not listed there: a generic groups API is not confirmed, so until one is proven `groupId` stays in our own config.

Record local results in compatibility.md before closing a phase. Do not turn hypothesis into fact because a method looks like CSS.
