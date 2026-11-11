# Milestone 00 — verify host note and bootstrap repository

## Prompt for Claude Code on the Mac

You are working locally with Gabriel in **herdr-office-startup**. Read [CLAUDE.md](../CLAUDE.md), the [shared rules](README.md) and [DECISIONS](../docs/DECISIONS.md). Publish this documentation/asset starter as the safe baseline for https://github.com/gabriel-moretti/herdr-office-startup . **Do not implement product code in this milestone.**

Already done on 2026-11-11, before this milestone: the host contract was read and recorded in [compatibility.md](../docs/compatibility.md); the docs were reconciled with it and unified in English; the repository structure was decided (ADR-019). What remains is to confirm nothing moved, commit and push.

State on 2026-11-11: no local `.git`; the remote exists, is public and empty; `gh` has two accounts logged in with `gabriel-moretti` active. All three can change, so recheck.

### Tasks

- [ ] **1. Read-only diagnostics.** Nothing here changes state. Never print tokens.

```sh
pwd
git --version
gh --version
gh auth status
gh api user --jq .login          # must print gabriel-moretti
git config user.name; git config user.email
gh repo view gabriel-moretti/herdr-office-startup --json nameWithOwner,url,isEmpty,defaultBranchRef,visibility
git ls-remote https://github.com/gabriel-moretti/herdr-office-startup.git
herdr-app --version
hc --version
shasum -a 256 ~/.config/herdr-app/AGENTS.md ~/.config/herdr-app/herdr.d.ts ~/.config/herdr-app/gpui-kit.d.ts
```

If the active login is not `gabriel-moretti`, stop and ask; do not run `gh auth switch` on Gabriel's behalf, it changes global state used by his work repos. Show the commit name and email to Gabriel and confirm it is the identity he wants on a public repo before any sign-off.

- [ ] **2. Confirm the compatibility note still holds.** Compare versions and the three hashes with `docs/compatibility.md`. If anything differs, reread the changed file, update the note and the affected docs, and say what changed. If nothing differs, do not rewrite it.

- [ ] **3. Validate the starter.**

```sh
python3 scripts/verify_starter.py --starter-only
python3 scripts/assets/validate_assets.py     # needs Pillow, see scripts/assets/README.md
```

- [ ] **4. Update the status table** in the [plans README](README.md) (00 → in review, with the date) so it goes in with the first commit.

- [ ] **5. First commit.** Only if the remote is still empty and there is no local `.git`. If the remote has gained history, stop: check it out properly with Gabriel's agreement and add this starter on `phase/00-bootstrap` through a PR; never force push or merge unrelated histories. Inspect each command's context instead of pasting the block blindly:

```sh
git init -b main
git remote add origin https://github.com/gabriel-moretti/herdr-office-startup.git
git status --short
git add README.md CLAUDE.md CONTRIBUTING.md LICENSE NOTICE THIRD_PARTY_NOTICES.md LICENSES art assets docs plans scripts tests mods layouts themes .github .gitignore .editorconfig SECURITY.md CODE_OF_CONDUCT.md
git diff --cached --stat
git diff --cached --check
git commit -s -m "docs: bootstrap herdr-office-startup starter kit"
```

Before committing, look through the staged list for secrets, unwanted screenshots and anything private in `docs/reference/product-page-source.txt` (it is a historical snapshot and still in Portuguese by design). DCO sign-off only if Gabriel agrees and can certify provenance. No `--no-verify`.

- [ ] **6. Ask Gabriel before the push.** For the empty remote: `git push -u origin main`. This is the only direct push to `main` in the project. Do not create the next milestone's branch here; milestone 01 does that. Pushing makes the repo content public; it is not an announcement — per ADR-020 nothing is promoted until it works locally.

### Acceptance

- Coherence and asset validators pass; no product `main.js` / `mod.json` / layout JSON exists.
- `docs/compatibility.md` matches the installed versions and hashes, or was updated with the differences.
- Remote `origin` is the exact intended URL, pushed by `gabriel-moretti`; no history lost; no secrets.
- This milestone does not open any new layout in Herdr; do not claim rendering passed.
- Summarize next intended files/tests and stop for review.

Sources: https://cli.github.com/manual/gh_repo_view , https://cli.github.com/manual/gh_pr_create . `gh pr create --dry-run` may still push; it is not a safe read-only check.
