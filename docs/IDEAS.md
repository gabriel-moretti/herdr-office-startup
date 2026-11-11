# Ideas and later features

A parking lot, not a commitment. Nothing here is in scope for milestones 00–07, and nothing here overrides [DECISIONS](DECISIONS.md) or the read-only frontier. To promote an idea: write an ADR with context, alternatives, security and data-source evidence, get Gabriel's approval, then give it a milestone prompt in [plans](../plans/README.md). Add new ideas at the end of the matching section with the date.

## Panels

### Active sub-agents side panel (2026-11-11)

A side panel that shows, for the focused agent or the whole space, which sub-agents are running right now: a small tree of parent → children with each child's status, age and what it is doing, and click-to-peek.

- **Why:** when an agent fans work out, the main terminal goes quiet and it is hard to tell whether three helpers are busy or everything is stuck.
- **Data source, verified in the local contract:** the host has a first-class notion of sub-agents. They are terminals an agent started with `hc run`; the core records the starter as `parent`, visible through `terminals()`. They belong to the parent's tab without a pane. `terminal.peek` opens one and `terminal.keep` gives it a pane. The shipped `agents` mod already lists them, so the reactive data and the click actions exist.
- **Known gap:** sub-agents that run inside the parent's own process (for example an agent's internal task workers) are not terminals and are invisible to the host. Showing those would require reading the agent program's session files or hook output, which is a per-program, privacy-sensitive collector — the same class of problem as the optional metrics panel in [PANELS-SPEC](PANELS-SPEC.md). First version: host-visible sub-agents only, and say so in the panel.
- **Shape:** read-only. A third mod (`office-startup-subagents`) or a tab inside an existing panel; no exec, no network, reactive on `terminals()` / `agents()`. Rows show status with text and icon, not color alone. Click = `terminal.peek`; no kill, no input, no reparenting.
- **Office tie-in:** sub-agents could appear in the World as temporary visitors standing by the parent's desk (interns, a huddle), without taking a permanent desk. Needs the stable-identity rules from milestone 04 and a cap so a large fan-out does not flood the room.
- **Open questions:** exact fields of a `terminals()` entry on this version (`parent` was not present on the entries seen on 2026-11-11, when no sub-agent was running); how nested sub-agents are reported; behavior across machines, where parent addresses may stay unmapped; what happens to the row when a sub-agent exits.

### Optional metrics panel

Already described in [PANELS-SPEC](PANELS-SPEC.md) and milestone 08: original read-only collector, estimates labeled as estimates, explicit opt-in. Listed here only so all later panels are in one place.

## World

- More rooms with their own navgraph (lab, library, meeting room that fills when several agents share a space). From [ROADMAP](ROADMAP.md) "Later".
- More original character packs beyond Lia, Nico, Maya and Tom.
- Dedicated stand-up / sit-down frames (4 per character) instead of the pose cut.
- Light theme and seasonal decoration sets, as presets rather than random variation.
- Optional sound cues, off by default.

## Git panel

- Any write operation (stage, commit, checkout, fetch) — explicitly not pre-approved; each needs its own ADR.
- Other providers (GitHub Enterprise, GitLab) and remote machines over SSH.

## Platform

- Other operating systems, only with a real test machine.
- Listing in the Herdr gallery (repo topics, `RECIPE.md`, `preview.png`) once the MVP works locally (ADR-020).
