# Integration, distribution and release gate — 07-package-release

## Prompt for Claude Code

Work locally on Gabriel's M5 in **herdr-office-startup**, after milestones 05 and 06 are accepted. Read [CLAUDE.md](../CLAUDE.md) and the [shared rules](README.md), then the specs below.

**Goal:** package the tested World + Git for Desktop on macOS with reproducibility, attribution and safe rollback. Publication is a separate owner-approved action.

### Read
- [ROADMAP.md](../docs/ROADMAP.md)
- [LICENSING.md](../docs/LICENSING.md)
- [POC-PLAN.md](../docs/POC-PLAN.md)
- ADR-019/020 in [DECISIONS](../docs/DECISIONS.md), and the host's "share one" section in `~/.config/herdr-app/AGENTS.md`

### Distribution shape

Per ADR-019 the repository root is already the shareable folder (`layouts/`, `mods/`); this phase adds one `RECIPE.md` and one `preview.png` at the root, not inside the mod folders (they would be installed with the mod). The ZIP contains exactly the files on the package allowlist. Per ADR-020 nothing is promoted (topics, gallery, release) until it works locally and Gabriel approves. A `RECIPE.md` is written the way the host defines it: a brief from which another agent could rebuild the mod, in the host's section order, describing real files and behavior.

Installation should follow the host's own flow — copy the folders, `herdr-app check` each mod, `layout.switch` — rather than a custom installer. Write a script only for what that flow does not give: a dry-run inventory, refusal to overwrite existing paths, and removal of exactly what was installed.

### Intended files / boundaries

`scripts/build/` packaging and validation; `layouts/office-startup.json`; `themes/office-startup-dark.json`; `RECIPE.md` and `preview.png` at the repository root; `docs/INSTALL.md`; CI additions, issue/PR templates; NOTICE / LICENSES inventory. Proposed paths.

### Steps

- [ ] **1.** Package tests first: folder name = installed ID and path resolution; mod assets identical to the pipeline output; every clip the manifests reference is included; no absolute or checkout paths; no secrets or private config; license files and checksums present; **no shipped layout sets the `fixture` prop and `office-startup-dev.json` is not in the package**.

- [ ] **2.** Assemble `dist/herdr-office-startup/{mods,layouts,themes}` from an explicit file allowlist checked by the package test: no transformation, but no dev layout, PoC layout, placeholder READMEs or tests. Both mods self-contained. No Python/Node/Go/ImageMagick/Chrome at runtime, no remote asset downloads.

- [ ] **3.** The final layout: clone-based like the PoC, World and Git blocks added, terminals untouched. The dark theme is new work in this phase: validate it against the real theme contract and check status tokens stay legible.

- [ ] **4.** Install/rollback: dry-run inventory; refuse on any name collision; never touch settings, keys or other mods; uninstall removes only inventoried paths and preserves preferences. Test collision, interrupted copy and uninstall. No updater, no curl-pipe-shell.

- [ ] **5.** Root `RECIPE.md`, a redacted root `preview.png`, a capability/dependency statement (`git`, optional `gh`) and the tested M5 / macOS / Desktop / core versions. No Intel or Linux claim. State plainly whether the art is pilot or approved (milestone 04 part B).

- [ ] **6.** Extend the CI from milestone 01 with package tests, manifest/license verification and a deterministic-archive check. Produce a versioned ZIP + `SHA256SUMS` locally, unpublished.

- [ ] **7.** Clean-install smoke on the Mac from the built artifact, the perf and read-only checks again, then rollback. Show Gabriel the exact tag, release contents and repo topics planned, and wait for specific approval before pushing a tag, creating a release or adding topics.

### Acceptance

- The artifact contains the right JS/JSON/assets/licenses, installs under new IDs without overwriting anything, and rollback is demonstrated.
- All tests actually run are listed with results; known issues are explicit; host `check` and the interactive Mac gate pass on the installed artifact.
- The ZIP is ready locally; no release, tag, topic or gallery action has been taken without approval.

Branch `phase/07-package-release`, PR title "Integration, distribution and release gate". Handoff per the [shared rules](README.md).
