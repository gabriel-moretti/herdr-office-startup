# Per-space presets, stable identity and World MVP — 04-presets

## Prompt for Claude Code

Work locally on Gabriel's M5 in **herdr-office-startup**, after both parts of milestone 03 are accepted. Read [CLAUDE.md](../CLAUDE.md) and the [shared rules](README.md), then the specs below.

**Goal:** deterministic decoration and stable space/agent slots, then (separately) the rest of the cast.

Two tracks with separate PRs and separate approvals. **Part A** is code and ships the World alpha with pilot art. **Part B** is art production; it owns the "full visual MVP" claim, needs human review of drawings, and does not block milestones 05–06. Milestone 07 may release with pilot art only if it is labeled as such.

### Read
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [WORLD-SPEC.md](../docs/WORLD-SPEC.md)
- [ASSETS.md](../docs/ASSETS.md)

### Intended files / boundaries

Part A: `mods/office-startup-world/presets.js`, `preferences.js`, `scene.js`, `routes.js`; `tests/world/presets.test.mjs`, `identity.test.mjs`. Part B: `art/`, `assets/`, `art/PROVENANCE.md`, character manifests, `scripts/assets/`. Proposed paths.

### Part A — code

- [ ] **A1.** Tests first: FNV-1a 32-bit over UTF-8 with known vectors (including emoji), repeatability, unsigned overflow, `generatorVersion` and salt; preset arrays in a stable, versioned order.

- [ ] **A2.** Precedence: explicit space override > configured group > automatic hash. Key is machine + space ID. Groups are our own config until a host API is proven. Renaming a space must not reseed a persisted choice.

- [ ] **A3.** Three presets on the same anchors and navgraph; plant density 2–6; selectable salt. Invalid config falls back to safe defaults without overwriting the stored preferences. Presets never change character skin/clothes or semantic status colors.

- [ ] **A4.** Preferences: pick one canonical store (per-copy `localStorage` or a file under `data/`), with a schema version and a migration test. `reducedMotion` moves here from the milestone 02 prop; the prop remains only as an override, with the precedence documented. Test two copies/windows writing without clobbering each other.

- [ ] **A5.** Stable desk assignment by machine + terminal: reordering and status changes do not shuffle desks. `compact-2col` and `office-8` templates; reflow keeps routes inside bounds.

- [ ] **A6.** Character assignment: deterministic from the actor key over the characters that have approved art. While only Nico exists, every agent is Nico with a text identifier; adding a character later must not reassign agents that already have a persisted character.

- [ ] **A7.** Mac tests: multiple copies/windows, persistence across restart, reconnect, rename, reflow, 1/10/30 fixtures against the milestone 03 budgets, staging and rollback without touching other config.

Part A acceptance: seed, override, identity and invalid-config tests pass; Mac reflow/focus/reducedMotion smoke passes; no network or exec added; decorations never block the navgraph; perf gate still met. PR `phase/04a-presets`.

### Part B — art batch

- [ ] **B1.** Nico cleanup first, per the list in [ASSETS](../docs/ASSETS.md) (camera tilt, gait, separate keyboard/chair props, sip trajectory, west no longer a mirror if asymmetry is introduced). Gabriel approves the cleaned pilot at 1× and in the Mac scene before anything else is drawn.

- [ ] **B2.** Lia, Maya and Tom: 65 slots each on the same variants, pivot and timing; ≤ 24 opaque colors; own manifest; provenance and license recorded. A recolored Nico is not a new character.

- [ ] **B3.** 16 portraits (4 per character) and the 13 missing prop types, in three palettes.

- [ ] **B4.** Validators extended to the new characters; `productionApproved` flips only after human review, per character.

Part B acceptance: 260 body slots, 16 portraits, 48 tiles and 22 prop types reviewed, with unique-frame counts declared and no duplicate-file inflation. Until then, every release note and README says "pilot art". PR `phase/04b-art` (may be several, one per character).

Handoff per the [shared rules](README.md).
