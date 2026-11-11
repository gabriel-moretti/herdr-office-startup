# Claude Code brief — herdr-office-startup

## Your assignment and current state

Build this project **locally on Gabriel Moretti's Mac**, using the briefs and milestone prompts. Target repository: https://github.com/gabriel-moretti/herdr-office-startup. The owner will use `gh` for his personal account. Do not create a repository under another account/provider. This kit has no Git history, implementation, mod manifest or installer yet. Python scripts provided here manipulate/check artwork only; they are not application code.

Read in order: [compatibility note](docs/compatibility.md), [PRODUCT](docs/PRODUCT.md), [DECISIONS](docs/DECISIONS.md), [ARCHITECTURE](docs/ARCHITECTURE.md), [HERDR API](docs/HERDR-API-NOTES.md), [POC PLAN](docs/POC-PLAN.md), the current [milestone prompt](plans/README.md). The product-page snapshot in `docs/reference/product-page-source.txt` is historical evidence, **not the controlling spec**: its earlier questions/roadmap recommendations are superseded by these Markdown documents.

## Fixed decisions

- Name: **herdr-office-startup**, public OSS personal GitHub monorepo.
- Reported host: **M5 / macOS / Herdr Desktop 0.1.15 / herdr-core 0.1.20**. Verify installed contracts locally. Desktop only: no original TUI plugin system or session migration.
- Mod folders are the installable folders: `mods/office-startup-world/`, `mods/office-startup-git/`, each with its runtime assets inside (ADR-019). Folder name = installed ID; layouts `office-startup-poc` and later `office-startup`. Never overwrite shipped mods/layouts.
- Office: original modern orthogonal top-down pixel art. Four identities Lia, Nico, Maya, Tom; start with Nico only. Three per-space preset palettes; no unbounded random decoration.
- Git MVP: **read only at every layer**. No stage/commit/checkout/fetch/pull/push/worktree creation, remote comments, reviews, merge, issue edits or CI actions. Developer `git`/`gh` workflow is separate from product functionality.
- GitHub Issues, not Linear. GitHub.com first; other providers explicitly out of scope.
- Code Apache-2.0; own art CC BY 4.0 to extent rights exist. Preserve upstream MIT/Apache/ISC and applicable NOTICE. No Pokémon art/audio/trademarks; no copying code from dhoaibao/git-panel or Brutal Metrics without permission. See [LICENSING](docs/LICENSING.md).

## Non-negotiable engineering constraints

1. No implementation before you inspect the local host's `AGENTS.md`, `herdr.d.ts` and `gpui-kit.d.ts` and record a compatibility note. Public `main/master` evidence is not proof of signatures in 0.1.15.
2. Runtime is native GPUI with JavaScript VM, not HTML/React/Electron. Do not invent DOM, Canvas, browser CSS, Node modules, `setInterval` or general OS process APIs in a mod.
3. `cx.notify()` invalidates the window: never busy-redraw to animate pixels. Use native `.transition`, `.loop`, WebP/GIF playback. A 1-second timer decides deadlines/waypoints only and notifies only when visual state changes. Hidden copies may keep timers running; do not assume `close()` on hide.
4. Observe `agents()` reactively; host status is `working/blocked/done/idle` only (local `herdr.d.ts`, Desktop 0.1.15). `unknown` is our derivation for a mapped terminal that reports no status; `waiting`, `coffee`, `walk`, `idle-long` are visual derivations. `offline` is connectivity, `error` is a separately proven failure; `stopped` has not been verified as AgentStatus.
5. Idle threshold is strictly `elapsed > 300000ms` continuously **observed idle**; unknown initial history, sleep/wake, hidden observation gaps and reconnect reset it. No inference from silence/keyboard inactivity. A short test clock is fixture-only; perform the real 5-minute Mac test.
6. Immediate status/attention overlay. `blocked` cancels and returns visually to desk in the same render. `working` cancels activity and returns within 1.5s then codes. Any state change cancels stale path/cup. Agent process gone never wanders. No subprocess/network in World.
7. Stable identity machine+terminal address; space seed machine+space ID. Prefer explicit mapping over name. Decorations cannot block navgraph. Movement stays inside the World mod, never across terminal panes.
8. Separate pure reducer/route tests from host adapter. Inject clock and deterministic seed. Async reads in Git need generation/context tokens so old results cannot overwrite new space data. No shell string interpolation from remote text.
9. Accessibility: status labels/icons beyond color, no default audio, static reduced-motion mode, click both desk and actor to focus the same terminal.
10. No secrets/private session content in repo, fixtures, logs or screenshots. Do not run checkout scripts/hooks just to display data.

## Verified public host contracts (check exact local signatures)

Source: `herdrdev/herdr-app/defaults/AGENTS.md`:
https://github.com/herdrdev/herdr-app/blob/master/defaults/AGENTS.md

- `main.js` default-exports `class ... extends View`; `init(props,cx)` and `render(cx)`.
- `View`, `div`, `image` from `gpui-kit`; composition helpers from `gpui-base`.
- `mod.json`: `place` in left/right/top/bottom/none, `size`; propose `{ "place": "none", "size": 360 }` when implementation begins.
- Layout node types row/column/stack/block; block `content: {mod, props}`. Inspect the installed default layout to retain actual central terminal composition instead of guessing it.
- `agents`, `spaces`, `terminals`, `machines`, `focused`, `props`, `theme`, `run` from `herdr`. Host changes trigger render. `run("pane.focus", {terminal: address})` is the documented navigation intent; validate cross-tab behavior locally.
- `cx.timer.every(ms, cx => ...)`, `cx.spawn(async cx => ...)`, `cx.notify()`. Callback receives its own cx; never retain cx. No setTimeout/setInterval.
- `div().absolute().left(x).top(y)`, `.loop` on left/top and `.transition(...)`, `.on_size_change((size,cx)=>...)`. `.transition(property, { duration, delay?, easing? })` per the installed types; mid-flight interruption is checked by the milestone 01 spike.
- `image("mods/office-startup-world/assets/...")`: paths are relative to app home, not source checkout. Animated GIF/WebP evidenced in referenced mods; full-frame alpha/loop behavior must pass local tests.
- `localStorage` per mod copy; `shared`/`setShared` are app-visible state and can rerender other mods. Prefer local pure state for animation. No `setShared` per frame.
- `herdr-app check ~/.config/herdr-app/mods/office-startup-world` checks loading/initial render only. `herdr-app status`; `herdr-app shot /tmp/office-startup-poc.png` (contains terminal data; redact before publishing).

Other exact reference paths:
- Pixel HQ `mods/company-agents/main.js` (track/since, short desk excursions), `figures.js` (Pond slots), `animate.js` (format caveats), `NOTICE.md`: https://github.com/bnhan2710/pixel-hq
- Pokémon behavior reference only: `mods/pokemon-agents/main.js` and `sprites.js` in https://github.com/SaifHarding/herdr-pokemon-agents-plus/tree/979887b041c366fc2b208216c51f6691235ea5e5 . Do not import its assets/downloaders/audio.
- Munza `better-changes/mods/better-changes/main.js`, `branch-pr/mods/branch-pr/main.js`, root `NOTICE`/`LICENSE`: https://github.com/munza/herdr-mods
- Cybertron `ci-dash/mods/ci-dash/gh.js`, `file-icons/`, `THIRD_PARTY_NOTICES.md`: https://github.com/cybertron288/herdr-mods

## Work phase by phase

Start with `plans/00-bootstrap-repo.md`; then 01 scene, 02 states, 03 idle/coffee/wander, 04 presets/world, 05 local Git, 06 GitHub, 07 packaging, 08 v1 polish. Each prompt defines scope, exact intended paths, tests and exit evidence. Do not skip the actual macOS smoke/perf gate. Pause and report when acceptance fails. Plans are implementation prompts, not prewritten application solutions: investigate the actual host before choosing code/signatures.

## Coding conventions and verification

Small ESM files and pure functions; runtime no Node assumptions. Use JSDoc/types generated from actual host contract. Name clip IDs `coding`, `coffee-sip-seated`, `coffee-sip-standing`, `idle`, `blocked`, `waiting`, `done`, `unknown`, `walk`, `stand-idle`; direction north/east/south/west. `coding` maps sourceState working. Acting-state names (`seated-idle`, `stand`, `walk-out`, `visit`, `walk-back`, …) are defined in [ARCHITECTURE](docs/ARCHITECTURE.md). Tests can run Node's built-in runner outside the host. Add `package.json` only when the first code phase establishes the real test/tooling commands. No fake passing test scripts in this starter.

Write failing behavioral tests, observe failure, implement minimally, rerun and report commands/results. Test 300000/300001ms boundary, interruption during every route segment, lifecycle, seeded reproducibility, reflow, missing assets, rate limits and stale async data. Validate JSON, alpha/dimensions, manifests and exports with asset tools. Host check + interactive Mac run + measured budget are required for completion, not a screenshot alone. See `docs/POC-PLAN.md` for proposed CPU/memory gates.

## Git / gh workflow

Repository bootstrap/push and publishing are **owner-controlled external actions**, not implicitly allowed by reading this file. Confirm the specific publication step with Gabriel when executing. Use [bootstrap plan](plans/00-bootstrap-repo.md), inspect remote/history, never force push/reset existing history. One branch per milestone (`phase/01-poc-scene`, etc.), DCO-signed focused commits, push branch and `gh pr create --repo gabriel-moretti/herdr-office-startup --base main --head <branch>`. PR body records tests actually run, Mac versions, limitations and images only after redaction. Never auto-merge. No `--no-verify`, no secret persistence, no bypassing protected branches. If main already exists, preserve it and PR the starter instead of reinitializing over it.

## First response expected from Claude Code

State observed local versions/contracts and repo status, summarize the current milestone, list intended files/tests and risks. Ask for only missing consequential decisions; do not reopen the established Desktop/GitHub/read-only choices. Do not claim runtime compatibility until it has been measured on this Mac.
