# GitHub PRs, Issues and CI consultations — 06-github-readonly

## Prompt for Claude Code

Work locally on Gabriel's M5 in **herdr-office-startup**, after milestone 05 is accepted. Read [CLAUDE.md](../CLAUDE.md) and the [shared rules](README.md), then the specs below.

**Goal:** extend the local panel with GitHub.com reads through the existing local `gh` authentication. No credential collection, no remote writes.

### Read
- [GIT-PANEL-SPEC.md](../docs/GIT-PANEL-SPEC.md)
- [PANELS-SPEC.md](../docs/PANELS-SPEC.md)
- [LICENSING.md](../docs/LICENSING.md)

### Account model (decided here, replaces "explicitly selected account")

`gh` has no per-command account flag. The only ways to pick an account are `gh auth switch`, which mutates global state shared with every other tool on the machine, and passing a token, which means extracting one. Both are forbidden. Therefore:

- The panel uses whichever account is active and **shows it** (login from a GET such as `gh api user`), next to host and owner/repo.
- It never switches accounts, never reads `hosts.yml`, never sets `GH_TOKEN`.
- When the active account cannot read the repo (403/404) or differs from what the remote suggests, the panel says so in plain text and tells the user to switch accounts themselves in a terminal.
- The active account can change underneath the panel; it is part of the cache key and of the generation token.

This Mac has a work account and a personal account logged in. Whatever the active one can see will be rendered, including private repositories, so use a public personal repo for tests and never capture screenshots of other data.

### Intended files / boundaries

`mods/office-startup-git/github-reads.js`, `github-models.js`, `views/prs.js`, `views/issues.js`, `views/ci.js`; `tests/github/*.test.mjs`. Proposed paths.

### Steps

- [ ] **1.** Check the installed `gh` version, its JSON fields and current docs. Build sanitized fixtures for PR / Issue / run pages, comments and reviews, missing fields, closed items and SHA mismatch. Fixtures contain no real private text.

- [ ] **2.** Reads through `gh pr|issue|run list/view --json …` or `gh api --method GET <validated endpoint>`. The method is always explicit, since `-f` flips the default to POST. POST / PATCH / PUT / DELETE and GraphQL are rejected by the adapter, with a test.

- [ ] **3.** Context is host / owner / repo / account / SHA / query / page. Deduplicate and cache per context with generation guards, bounded paging and backoff. Query only what is visible; the host does not pause timers for hidden copies, so the panel must stop its own refresh when not needed.

- [ ] **4.** Bounds: page and row caps; job logs fetched only on demand and capped (they can be very large); rate-limit state read with a GET and shown.

- [ ] **5.** Render PRs with checks and reviews; Issues with filters, details and comments; CI runs / jobs / steps / logs for the selected SHA. Stale, offline, truncated and rate-limited states are textual.

- [ ] **6.** Upstream reuse: only licensed ci-dash and branch-pr query/model code, with inventory. Omit mutation forms, handlers and helper binaries. No Linear adapter, auto-login or artifact download.

- [ ] **7.** Tests: method/argv spy; stale response after focus change and after account change; pagination caps; auth failure, 404, 403, timeout, malformed payload. On the Mac: `gh` resolves from the app's launch environment, the displayed account matches `gh api user`, and nothing is printed that contains credentials.

### Acceptance

- Only GET / view / list semantics leave the machine; comments, reviews, merge, issue edits and CI dispatch/rerun/cancel are unreachable.
- No code path runs `gh auth switch`, reads gh's config files or sets a token variable.
- Fixtures pass; reads of a public personal repo verified under the real app launch with the active account shown correctly.
- No secrets, private comments or unredacted screenshots committed; no query triggers a Git fetch or checkout.

Branch `phase/06-github-readonly`, PR title "GitHub PRs, Issues and CI consultations". Handoff per the [shared rules](README.md).
