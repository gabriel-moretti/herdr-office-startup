# v1 polish and optional metrics research — 08-v1-polish

## Prompt for Claude Code

Work locally on Gabriel's M5 in **herdr-office-startup**, after the public MVP (milestone 07) is accepted. Read [CLAUDE.md](../CLAUDE.md) and the [shared rules](README.md), then the specs below.

**Goal:** improve accessibility, art and measured usability. This is not permission to add Git writes or extra providers.

### Read
- [PRODUCT.md](../docs/PRODUCT.md)
- [PANELS-SPEC.md](../docs/PANELS-SPEC.md)
- [ASSETS.md](../docs/ASSETS.md)
- [DECISIONS.md](../docs/DECISIONS.md)
- [IDEAS.md](../docs/IDEAS.md)

### Intended files / boundaries

Scope-specific existing World/Git files and tests; `docs/metrics-design.md` only if requested; original character art and provenance. Proposed paths.

### Steps

- [ ] **1.** Review actual MVP feedback and measured bugs; propose a bounded v1 delta (candidates are collected in IDEAS, including the active sub-agents panel) and get it approved before coding. No automatic feature expansion.

- [ ] **2.** Art polish beyond what milestone 04 part B approved: directional silhouettes, gait, coffee sequencing, frame anchors, alpha and loops. Placeholders are replaced only after human approval.

- [ ] **3.** Light theme, accessibility, readability and performance improvements, each with regression coverage. Static mode stays; no background busy redraw.

- [ ] **4.** If Gabriel requests metrics: first a design for an original read-only collector, covering supported session formats, privacy, source timestamps and the estimated-cost caveat. No copied Brutal Metrics implementation and no `/clear`.

- [ ] **5.** Any Git write, new OS, new provider or room-navigation template needs a new ADR and approved scope; it does not ride along with polish.

- [ ] **6.** Repeat the relevant pure, host, perf and package gates; PR review with redacted screenshots and provenance.

### Acceptance

- The approved bounded v1 behavior is implemented with regression tests; the read-only frontier is unchanged.
- Art approval and any metrics accuracy claim are backed by evidence; no invented support or usage data.
- Release remains explicitly owner-approved.

Branch `phase/08-v1-polish`, PR title "v1 polish and optional metrics research". Handoff per the [shared rules](README.md).
