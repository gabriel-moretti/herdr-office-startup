# Unified Git panel — MVP read only

## UX and scope

One panel, one canonical context, tabs Tree / Changes / Branches & History / PRs / Issues / CI. Details/diffs may open in a central viewer, not cram all data in a narrow sidebar. Terminal remains primary. Explicit pin/current-context mode; changing focus never silently redirects a pending response. Show machine, root/worktree, branch, HEAD, gh host/account and stale/error state.

| Tab | Reads | Explicitly excluded |
|---|---|---|
| Tree | lazy directories, icon by basename/extension, status marks, readonly preview | editing, rename/delete, executing files |
| Changes | staged/unstaged/untracked, conflict markers, bounded inline/split diff, renames/binaries | stage/unstage, commit/amend, discard/reset/clean |
| Branch/history | local/remotes already known, upstream/ahead/behind, log graph/page, tags, existing worktrees | fetch/pull/push/checkout, branch/worktree create/delete |
| PRs | list/detail/files/checks/reviews/threads | comments/reviews/merge/checkout |
| Issues | GitHub Issues list/filter/page/detail/comments, links available in source | create/edit/assign/comment/close, git-config link writes |
| CI | workflows/runs/jobs/steps/logs for selected SHA | dispatch/rerun/cancel or automatic artifact download |

Local cache/config may be written outside checkout. “Read only” also forbids hidden mutation handlers from forks and shell commands that update refs. Remote tracking refs can be stale because we do not fetch: label that fact.

## Data access design

`exec(cmd,args,{cwd,on,timeout})` from Herdr; Git runs where checkout is, not necessarily where window is. First target local Mac only; do not promise SSH remote support until tested. gh runs in the user's authenticated local environment with whatever account is active; the panel shows that account and never switches it (`gh` has no per-command account flag and `gh auth switch` changes global state). Never extract tokens from gh config, set `GH_TOKEN`, or rotate through accounts on failure. See [plan 06](../plans/06-github-readonly.md).

Allowlist of intended Git reads (actual argv tested): `git --no-optional-locks -C ROOT rev-parse ...`, `status --porcelain=v2 -z`, `diff --no-ext-diff --no-textconv ...`, `log ...`, `for-each-ref ...`, `branch --show-current`, `worktree list --porcelain`, `show --no-ext-diff --no-textconv ...`. `--no-optional-locks` is a Git global option, not a status flag; disabling external diff/textconv prevents executing configured helpers for previews. Use path separator `--` and literal argument arrays. Validate repo root and object IDs; paths beginning with '-' are data. Do not invoke shell, aliases, hooks, pagers or repository scripts. Every invocation also carries `-c core.fsmonitor=false` (a configured fsmonitor program runs on `git status`), `--no-show-signature` on `log`/`show` (so `log.showSignature` cannot launch gpg) and an explicit short `exec` timeout. `exec` has no documented output cap, so bounds go in the arguments (`--max-count`, pathspecs, `--stat` first, per-directory tree reads), not after the output arrives. See [plan 05](../plans/05-git-panel-readonly.md).

GitHub: gh `pr list/view`, `issue list/view`, `run list/view` where they expose structured data, or `gh api --method GET <validated endpoint>` with pagination. A gh api `-f` argument can change default method, so specify GET and test it. Avoid GraphQL POST in this strict initial allowlist; use REST GET. API fields/CLI JSON support must be checked against installed gh version and current docs during implementation, not guessed. Do not use network queries in World.

Cache keys: machine+root+worktree+HEAD+host+owner/repo+account+tab/query/page. Debounce local watch (if available) and bounded fallback polling. Refresh only selected/visible UI with backoff; the host does not pause hidden copies, so the panel stops its own refresh when not visible. Store generation token on context/query; discard out-of-order results. Follow pagination with max pages/rows, cap diff/log sizes; default proposal 1000 files / 1500 diff lines, show truncation text. Rate limit and 403/404 auth/not-found errors get actionable non-secret messages. No automatic login/install from mod.

## Upstream adoption matrix

| Upstream | Adopt / exclude | License |
|---|---|---|
| munza better-changes | models, diff parsing/rendering concepts/tests; exclude writes/commit UI | Apache-2.0 + NOTICE, modified-file notices |
| munza branch-pr | PR readonly model/UI/context; prefer plain gh adapter initially to avoid Go helper | Apache-2.0 + Herdr-derived icon notices |
| cybertron ci-dash | gh query/model parsing only; strip mutation forms/dispatch/cancel/rerun | MIT root; CI base Douglas Cunha MIT; yaml ISC only if copied |
| cybertron file-icons | resolver/icons as licensed, integrated Tree | MIT icons Material Extensions; Herdr Files base Apache |
| munza branch-issue | do not port Linear adapter | excluded, implement GitHub Issues reader |
| dhoaibao git-panel | behavior benchmark only; independent implementation | permission not established, no copied code |
| Brutal Metrics | no code imports | permission not established; optional separate metrics design |

Every import needs path/fullSHA/license attribution record in [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md). Prefer adopting well-scoped licensed modules/tests, not installing six complete panels with duplicate polling.

## Test/acceptance matrix

- Fixtures: clean/dirty/unborn HEAD, staged+unstaged same file, untracked, conflicted, rename, binary, empty/non-UTF8 output handling, paths Unicode/spaces/newline/dash, detached HEAD, worktree, submodule, large repo.
- Use a command spy: every emitted Git verb in allowlist; every HTTP request GET; no handler for mutations. Assert external diff/textconv disabled.
- Snapshot HEAD/index hash/refs/config + working tree before/after a full UI navigation in a disposable repo; no product writes to those. Cache stays outside checkout.
- GitHub fixtures cover pagination, unavailable fields, closed PR/Issue, rate-limit, auth failure, timeout, malformed data and stale-response race after space change. Fixtures never contain real private comments/tokens.
- Slow/failed subprocess cannot block the render thread; timeout recovery, truncation and stale labels tested.
- On Mac gh env/account can be resolved from app launch context, not just interactive shell. Never dump credentials to diagnose.
- UI read-only means it cannot mutate even by keyboard/context menu. Opening external page does not auto-submit anything.

[Plan 05](../plans/05-git-panel-readonly.md) builds local view first; [Plan 06](../plans/06-github-readonly.md) adds remote reads. No writable Git phase is pre-approved for v1.
