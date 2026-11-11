# Starter delivery verification

Prepared on the Linux box, 2026-11-11 (America/Sao_Paulo/BRT).

## Actually checked

- Required documentation, nine milestone prompts, current project name, full license texts and 142 relative Markdown links (count at delivery; the verifier counts more now): PASS.
- Delivery-only guard: no product JavaScript/TypeScript, mod.json, installable layout/theme JSON or .git history: PASS. Default coherence mode remains usable after Claude Code begins coding; use --starter-only only for the original starter.
- Nico: 65 RGBA source frame slots, 16 clip/still variants, 24 opaque colors maximum, 48x48 cells, alpha 0/255, anchor (24,40), atlas rectangles match source pixel-for-pixel: PASS.
- 11 WebP + 11 GIF animations decode with valid durations, including GIF 10 ms rounding and coalesced duplicate frames: PASS. WebP/GIF host behavior not tested.
- 48 tiles and 27 prop exports (9 types x 3 presets), PNG validity: PASS.
- Generator rebuilt all artwork twice in the same pinned environment without byte changes: PASS.
- Contact sheet, preset overview and light/dark alpha/direction board inspected. Character orientation is kept north for seated coffee; placeholders still need manual camera/gait/gesture/prop cleanup. No production art approval.

## Commands actually run

```sh
python3 scripts/assets/build_starter.py
python3 scripts/assets/validate_assets.py
python3 scripts/verify_starter.py --starter-only
```

No Herdr app check, Mac performance run, Git initialization, commit, push, PR, install or release was run. Box is Linux; Gabriel's M5 / Desktop 0.1.15 / core 0.1.20 is reported, not locally verified here.

## License source checksums (SHA256)

- LICENSE: `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`
- art/LICENSE: `9ba9550ad48438d0836ddab3da480b3b69ffa0aac7b7878b5a0039e7ab429411`
- assets/LICENSE: `9ba9550ad48438d0836ddab3da480b3b69ffa0aac7b7878b5a0039e7ab429411`
