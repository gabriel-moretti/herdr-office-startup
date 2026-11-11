# Roadmap with gates

These are not dates nor a promise of implementation in this delivery. Reported versions M5/Desktop 0.1.15/core 0.1.20; compatibility tied to the local contract and real test.

## PoC

- M00 safe repo bootstrap and local survey: [plan 00](../plans/00-bootstrap-repo.md).
- M01 static scene/isolated layout/PNG/focus: [plan 01](../plans/01-poc-scene.md).
- M02 real statuses and GIF/WebP: [plan 02](../plans/02-states.md).
- M03 coffee/idle > 5 min/routes/interruption/perf: [plan 03](../plans/03-idle-coffee-wander.md).

**Acceptance:** real check + callbacks/interaction, correct identity snapshot, real 5 min test and cancellations, static mode, performance limits and rollback per [POC-PLAN](POC-PLAN.md). A CPU/attention failure blocks expansion, it does not become a hidden “known limitation”.

## World MVP alpha

- M04 deterministic presets/overrides/reflow/persistence/max 2 wanderers: [plan 04](../plans/04-presets.md).
- Expand the cast only after the pilot is approved: Lia/Maya/Tom and 4 portraits per character; 65 slots each, 48 tiles/22 props in the budget. Art production requires human cleanup time, do not count duplicates as new drawings.
- Stable slots per terminal, zero reorganization when status changes, settings/reducedMotion and asset fallback.

**Acceptance:** reproducible seeds, rename/focus without losing identity, 1/10/30 fixtures, HiDPI clipping/occlusion and full inventory reviewed. “Complete visual MVP” requires the final batch, not just the Nico starter.

## Local Git MVP and GitHub

- M05 local consultative: tree/icons/status/diff/branches/log/already existing worktrees, [plan 05](../plans/05-git-panel-readonly.md).
- M06 PRs/Issues/CI queries only with gh, paging/cache/backoff/context guard, [plan 06](../plans/06-github-readonly.md).

**Acceptance:** varied fixtures and allowlisted argv/methods; no HEAD/index/refs/config/checkout/GitHub mutation; no write handlers; no hooks/externaldiff/textconv; clear truncation/stale/offline; GUI env on the Mac can reach git/gh without extracted tokens. GitHub Issues settled, no Linear.

## Public MVP

- M07 integration of build/licenses/ZIP/checksums/RECIPE/preview and install/rollback, [plan 07](../plans/07-package-release.md).
- Portable CI and security tests, real command documentation, compatibility/macOS/chip, redacted screenshots.

**Acceptance:** clean build of the package JS/JSON/assets only, a user without art tools can use it, smoke test on the Mac, complete third-party notices, no Pokémon asset/unlicensed code; QA/security reviews and explicit approval for tag/release. Do not publish automatically.

## v1

[plan 08](../plans/08-v1-polish.md): smooth animations/art, light theme, better a11y, optional original read-only metrics when the source is reliable. Reduce rework/cost and monitor regressions with tests. No mutating Git operations presumed; a new operation requires ADR/scope and another gate.

## Later

More original packs, new providers/metrics/OSes only with demand and testing. Lab/library with another navgraph, not random color without design. Do not turn it into a full IDE; keep the terminal central, the world collapsible and a single consultative Git.

The running list of later features and ideas, including the active sub-agents side panel, is in [IDEAS](IDEAS.md).
