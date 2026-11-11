# Local Git panel, strict read-only — 05-git-panel-readonly

## Prompt for Claude Code

Work locally on Gabriel's M5 in **herdr-office-startup**, after milestone 04 part A is accepted. Read [CLAUDE.md](../CLAUDE.md) and the [shared rules](README.md), then the specs below.

**Goal:** one consultive native panel over local Git. No GitHub queries in this phase and no mutation code imported.

### Read
- [compatibility.md](../docs/compatibility.md)
- [GIT-PANEL-SPEC.md](../docs/GIT-PANEL-SPEC.md)
- [PANELS-SPEC.md](../docs/PANELS-SPEC.md)
- [LICENSING.md](../docs/LICENSING.md)

### Intended files / boundaries

`mods/office-startup-git/main.js`, `mod.json`, `context.js`, `git-reads.js`, `parsers.js`, `views/tree.js`, `views/changes.js`, `views/history.js`; `tests/git/*.test.mjs`; licensed icon inventory. Proposed paths. The shipped `changes`, `files` and `worktree` mods in the app home are useful to read for how the host's `exec`, `watchFolder` and editor views are used; reading them is not a license to copy them — check their license like any other upstream.

### Steps

- [ ] **1.** Failing fixtures first: clean, dirty, unborn and detached repos; staged + unstaged on the same file; untracked; rename; binary; conflict; submodule; worktrees; paths with Unicode, spaces, newline and leading dash; empty and non-UTF-8 output.

- [ ] **2.** Command adapter: argument arrays only, explicit allowlist of read verbs, `--` before paths. Every invocation carries the hardening flags, asserted by test:
  - `--no-optional-locks` (global) so `status` does not write the index;
  - `-c core.fsmonitor=false`, because a configured fsmonitor program is executed by `git status`;
  - `--no-ext-diff --no-textconv` on `diff` / `show` / `log -p`;
  - `--no-show-signature` on `log` / `show`, so `log.showSignature` cannot launch gpg;
  - no aliases, hooks, pagers, or repository scripts.

- [ ] **3.** Bounds. `exec` has a timeout (default 30 s) but no documented output cap, so limits must be in the arguments, not applied after the fact: `-n` / `--max-count` on logs, pathspec and `--stat`-first for diffs, lazy per-directory tree reads. Set an explicit short timeout per command. Defaults 1000 files / 1500 diff lines with a visible truncation label. Confirm on the Mac what happens with a very large output before trusting any of this.

- [ ] **4.** Context: machine / root / worktree / branch / HEAD with a generation token; results from an older generation are discarded. Local Mac only; no SSH-machine promise.

- [ ] **5.** Upstream reuse (Better Changes read-only models/rendering, Material icons) only after the exact path, full SHA and license are in the inventory and notices. No code from unlicensed git-panel. No stage/commit handlers imported, even unused.

- [ ] **6.** Render Tree / Changes / Branches & History with pinned vs current context. No checkout, fetch, create, delete or commit reachable by click, keyboard or menu. Remote-tracking refs are labeled "not fetched, may be stale".

- [ ] **7.** Tests: command spy (every argv in the allowlist with the hardening flags); snapshot of HEAD, index hash, refs, config and working tree before/after a full navigation in a disposable repo; stale async response discarded; slow or failing subprocess does not block rendering. On the Mac: `git` resolves from the app's launch environment, large-repo responsiveness, click/scroll/diff.

### Acceptance

- Every emitted argv uses an allowed read verb with the hardening flags; no write handler exists; queries leave the disposable checkout, index, refs and config unchanged.
- Portable parser/context/spy tests pass; Mac `check`, click, scroll and diff tests pass; commands are bounded.
- Licenses and exact inventory updated in the same PR; World remains network- and exec-free.

Branch `phase/05-git-panel-readonly`, PR title "Local Git panel, strict read-only". Handoff per the [shared rules](README.md).
