# Claude Code milestone prompts

Execute locally on Gabriel's Mac, one prompt at a time. These are planning briefs, not application implementation. [CLAUDE.md](../CLAUDE.md) is loaded automatically and governs; this file holds the rules shared by every milestone so the individual prompts only carry what is specific to them.

1. [00 bootstrap/repo](00-bootstrap-repo.md)
2. [01 PoC scene](01-poc-scene.md)
3. [02 real states](02-states.md)
4. [03 idle/coffee/wander](03-idle-coffee-wander.md)
5. [04 presets/world](04-presets.md)
6. [05 local Git readonly](05-git-panel-readonly.md)
7. [06 GitHub readonly](06-github-readonly.md)
8. [07 package/release](07-package-release.md)
9. [08 v1 polish](08-v1-polish.md)

## Milestone status

Update this table in the PR that closes each milestone. A milestone is "accepted" only when Gabriel says so after seeing the evidence; the next prompt starts from that row, not from memory.

| Milestone | Status | PR | Accepted (date, BRT) | Evidence |
|---|---|---|---|---|
| 00 bootstrap | in review (2026-11-11), branch `phase/00-bootstrap`, no PR yet | | | validators pass; compatibility hashes match; secrets scan clean |
| 01 PoC scene — part 0 spike | done (2026-11-11), awaiting review | | | docs/compatibility.md "Observed on the host" |
| 01 PoC scene — part 1 scene and tooling | in progress: scene, tests, staging, focus and resize verified on the Mac; perf baseline pending | | | npm test 67/67; herdr-app check pass |
| 02 states | not started | | | |
| 03 idle/coffee/wander — part A logic | not started | | | |
| 03 idle/coffee/wander — part B Mac gate | not started | | | |
| 04 presets — part A code | not started | | | |
| 04 presets — part B art batch | not started | | | |
| 05 local Git | not started | | | |
| 06 GitHub | not started | | | |
| 07 package/release | not started | | | |
| 08 v1 polish | not started | | | |

## Host facts checked on this Mac (2026-11-11, Desktop 0.1.15, core 0.1.20)

Summary only; the full note, with file hashes and the list of questions still to be exercised, is [docs/compatibility.md](../docs/compatibility.md). The type files are rewritten on every app start, so recheck after any upgrade.

- `Status = "working" | "blocked" | "done" | "idle"`. **There is no `unknown` status.** `agents()` lists only terminals whose program reports a status, and `AgentInfo.status` is never null. `unknown` is therefore our derivation: a terminal we are mapped to that is not (or no longer) in `agents()`. `theme().unknown` exists as a color only.
- Offline is `machines()[i].layout === "unavailable"` (`"loading" | "ready" | "unavailable"`). There is no per-agent `connected` field.
- Motion: `.transition(property, { duration, delay?, easing? })` and `.loop(property, { from, to, period?, easing? })` on `opacity | width | height | left | top`; easing `linear | ease-in | ease-out | ease-in-out`. No API for reading an interpolated position was found in the types; confirm in milestone 01. Native motion stops when not shown.
- Timers and tasks keep running in hidden copies. Saving any file under the app home reloads every copy at once; the old build's timers stop and state restarts.
- The first time the app sees a mod folder it docks one copy per `mod.json`; `"place": "none"` docks nowhere.
- Shipped layouts and mods are replaced whole on every start. Clone with `herdr-app do layout.clone '{"name":"main","as":"<new>"}'`; an existing name is refused. `ctrl-alt-shift-escape` always returns to `main`.
- `herdr-app check <mod folder>` loads once and checks the initial description; it does not lay out or run deferred/async states.
- `exec(cmd, args, { cwd, on, timeout })` runs in the user's real environment, default timeout 30 s, cap 10 min. No output size limit is documented.
- A native FPS HUD exists (`gpui-fps`, `show_fps_monitor()`).
- Sharing convention: a shared layout is a folder laid out like the app home (`layouts/<name>.json` plus the `mods/<name>/` it needs) with one `RECIPE.md` and one `preview.png` at its root, and the repo topic `herdr-layout` / `herdr-mod`. Installing copies the layout and mod folders and leaves recipe and preview out. The repo root follows it (ADR-019).
- `layout.clone` switches the active layout to the clone; switch back explicitly with `herdr-app do layout.switch '{"name":"<previous>"}'`.
- Sub-agents are terminals started with `hc run`; the core records the starter as `parent` in `terminals()`.

## Rules shared by every milestone

**Start of each prompt.** Report installed Desktop/core versions and actual repo status (`git status`, current branch, the status table above). Do not reopen the accepted Desktop-only / GitHub-only / read-only decisions. If the installed version differs from `docs/compatibility.md`, recheck the contracts first.

**Architecture.** Native GPUI/JS ESM; pure models separated from host adapter and rendering. The local type files govern signatures; nothing behaves like CSS or the DOM just because the name looks familiar.

**Language.** All repository documentation, code comments and commit messages are in English (ADR-020). Conversation with Gabriel can be in Portuguese.

**Scope.** Later ideas go to [docs/IDEAS.md](../docs/IDEAS.md), not into the milestone in progress.

**Constraints.** Own code Apache-2.0, own art CC BY 4.0 to the extent rights exist; preserve upstream notices; no Pokémon or unlicensed code. No per-frame `notify` timers. Git product read-only at every layer. No private data or tokens in repo, fixtures, logs or screenshots.

**Tests.** Failing test → minimal implementation → passing test. Record commands and observed output, never imagined passes. Portable tests: `node --test` (exact script defined in milestone 01). Asset checks: `python3 scripts/assets/validate_assets.py` (needs Pillow; use the venv described in [scripts/assets/README](../scripts/assets/README.md)). Coherence: `python3 scripts/verify_starter.py`. After host code changes: `herdr-app check ~/.config/herdr-app/mods/<installed id>` and `herdr-app status` with empty `errors`, plus the interactive checks the milestone lists. A passing `check` does not prove callbacks.

**Staging into the app home.** Gabriel approves this once, in milestone 01, for project-owned paths only: `mods/office-startup-*`, `layouts/office-startup-*`, `themes/office-startup-*`. Later milestones may restage those paths without asking again. Anything else in the app home (settings, keys, other mods and layouts, `pond-agents.json`) is never written. Staging is live: files reload on save, so stage only reviewed files and check `herdr-app status` right after.

**Evidence files.** `docs/compatibility.md` holds versions and verified contracts (written 2026-11-11, extended by the milestone 01 spike, updated on host upgrade). `docs/poc-report.md` holds real-vs-fixture state evidence and format decisions (02, 03). `docs/performance.md` holds summarized measurements (baseline in 01, gate in 03), taken with `scripts/perf/sample_cpu.py`; raw CSVs stay in ignored `local/perf/`. Screenshots stay in ignored `local/` until redacted.

**Git and handoff.** Branch `phase/<milestone id>` from accepted `main`, after inspecting the worktree. Focused commits with DCO sign-off when accurate. Review the diff for secrets. Confirm `gh api user --jq .login` prints `gabriel-moretti` before any push. Ask for the specific push/PR step, then:

```sh
git push -u origin phase/<milestone id>
gh pr create --repo gabriel-moretti/herdr-office-startup --base main --head phase/<milestone id> --title "<title>" --body-file local/pr-body.md
```

`local/pr-body.md` is ignored and contains scope, test commands and results, Mac versions, risks and remaining manual checks. No auto-merge, force push or skipped hooks. Final report: changed files, tests actually run, manual evidence, failures and limitations, licensing changes, next gate. Stop if acceptance fails; do not advance automatically.
