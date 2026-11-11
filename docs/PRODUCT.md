# Product — herdr-office-startup

## Vision

A contemporary top-down office where Herdr Desktop agents have a visual presence and where a consultative Git center reduces context switching. The scene helps locate who is working, who needs attention and who has finished, without replacing the terminal or inventing real activity. The experience is native GPUI, not a web page.

**Initial audience:** Gabriel on the Mac M5. Reported versions: Desktop 0.1.15 / core 0.1.20. Public/open source project on personal GitHub: https://github.com/gabriel-moretti/herdr-office-startup . Implementation will be done by Gabriel with local Claude Code and gh; this starter has not published anything.

## Committed scope

1. World: own layout/theme, modular office, one stable place per agent, focus through the character or desk, real states with text/icon, compact mode and reduced motion.
2. Coding for working; coffee only in idle by default; internal wander after more than five minutes continuously observed in idle. Interruptions never delay the blocked alert.
3. Three presets per space (Nordic Day, Botanical, Blue Hour), deterministic seed, explicit overrides and decoration that does not block corridors.
4. Integrated Git **read only**: tree/icons, changes/diff, branches/history/existing worktrees, PRs, GitHub Issues, checks and CI/logs.
5. Reproducible release with local assets, license/provenance, installation without overwriting configuration and simple rollback.

## Out of the MVP

- Original TUI, migration/bridge between servers, Electron/React or a fork of the Herdr application.
- Any Git/GitHub mutation (including fetch/checkout) or sending commands to agents through the Git panel.
- Linear/Jira/Trello, GitLab/GitHub Enterprise, file editor or conflict resolver.
- Procedural editor for arbitrary floor plans, complex physics/collisions, characters walking over real panes, automatic meetings between agents.
- Real billing metrics, multi-provider collectors, mandatory audio, telemetry/auto-updater, new OSes.

## Honest semantics

Coding is a metaphor for working: there is no confirmation of keystrokes or code editing. Sip/wander are cosmetic acting states and do not pause the process. waiting/idle-long/walk are not new core states. Red CI does not become an agent error. The absence of data gets unknown/offline according to the source, never presumed idle. `done` can become `idle` when seen in any client: respect the host.

## Minimum journey

Open own layout → recognize space and agent → click and focus terminal → work while keeping the scene collapsible → identify attention even if the character is far away → consult diff/PR/Issue in the same context → return to the previous layout without losing preferences. The MVP does not require any write button to complete the journey.

## Product criteria

- Identity/desk do not change when status or list order changes.
- Sidebar does not shrink a huge floor plan until it becomes illegible; reflow of two desks per row or scroll.
- Real state always visible, sound off and reducedMotion functional.
- Render does not depend on downloading art or running programs.
- Consultative Git with machine/repo/branch/SHA context and explicit stale information.
- Performance and installation approved on the Mac before expanding art production.

## Current vs. future delivery

Current: documentation, prompts, concepts, starter art and asset scripts. Future: functional modules, installable JSONs, application tests, CI and releases. The complete visual budget is 4×65=260 body frames/poses, 16 portraits, 48 tiles and 22 props; the kit includes only the Nico pilot and a subset of the environment. Details in [ASSETS](ASSETS.md). [Roadmap](ROADMAP.md) defines gates, not promised dates.
