# Repository automation

`workflows/ci.yml` runs the portable tests (`npm test`), `verify_starter.py`, the asset validator and `sync_assets --check` on push and PR (read-only token, no secrets). Issue/PR templates and package checks arrive in milestone 07. CI must never use production tokens or execute untrusted fixture scripts; a hosted runner is not proof of interactive GPUI/Metal behavior.
