# Tests

Run with `npm test` (Node built-in runner, `tests/**/*.test.mjs`, no dependencies).

Current suites (milestone 01):

- `world/assets-sync.test.mjs` — the runtime subset synced into `mods/office-startup-world/assets/` matches the art pipeline output byte for byte, has no atlases or previews, and `--check` detects drift.
- `world/stage.test.mjs` — staging into a fake app home touches only `mods/office-startup-*` and `layouts/office-startup-*.json`, refuses symlinks and paths outside the home, and `--dry-run` writes nothing.
- `world/manifest.test.mjs` — `mod.json` and asset paths of the World mod; no absolute, home or repo-root `assets/` paths in mod code.
- `world/layout.test.mjs` — pure scene geometry: columns per width and scale, stable station positions, no overlapping props, corridors ≥ 32 px, actor pivot on the chair, wander destinations.
- `world/select.test.mjs` — which agent the PoC shows (address prop, focused agent, first agent of the focused space).
- `world/paths.test.mjs`, `world/scene-data.test.mjs` — every asset path the scene can request exists; scene palettes match the environment manifest.
- `world/status-icons.test.mjs` — one single-color 16×16 SVG per status, no external content.
- `assets/webp-frames.test.mjs` — every character WebP frame is full canvas with no blending (the host drops partial frames). Skipped when `webpmux` is not installed.
- `assets/import-sheets.test.mjs` — the designer sheet importer on synthetic magenta sheets (grid detection, scale, feet row, overwrite protection). Skipped without Python/Pillow.

Create tests with the relevant phase, prove initial failure, then implement. Planned portable suites: state-machine/route/seed tests; Git parsers + argv allowlist; GitHub fixture paging/rate-limit/stale response; package/install/rollback. Host smoke and performance are manual on Gabriel's M5. Exact cases: [PoC plan](../docs/POC-PLAN.md), [Git spec](../docs/GIT-PANEL-SPEC.md). Asset validation is in `scripts/assets/validate_assets.py` and is not a claim that application behavior is tested.
