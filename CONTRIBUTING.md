# Contributing

Read [CLAUDE.md](CLAUDE.md), [product scope](docs/PRODUCT.md) and the relevant [plan](plans/README.md). This is currently a specification/art starter, not a working plugin.

- Small PRs: one behavior or milestone, with tests and documented acceptance evidence. Branch from updated main; do not force push published work without agreement.
- DCO: use `git commit -s` only if you can certify the Developer Certificate of Origin at https://developercertificate.org/ . Contributions use the applicable outgoing license: Apache-2.0 code, CC BY 4.0 own art. No CLA initially.
- Pure state/parser tests run outside Herdr; native rendering/focus/performance require a Mac with recorded versions. Never mark a skipped Mac test as passing.
- Retain upstream headers, include license text and applicable NOTICE, annotate modified Apache files, record upstream commit/path. Do not copy unlicensed code.
- Art submissions include source/editable files, per-frame PNG/atlas/manifest, previews and provenance (AI generation + manual modifications declared). No Pokémon or reference-IP assets.
- Add tests for timer boundaries, interruptions, offline/lifecycle and readonly command allowlists. Product Git writes remain out of scope even if a fork already implements them.
- Do not include credentials, local app config, private logs or unredacted terminal screenshots. Public bug reports contain reproducible sanitized fixtures.
- Before release: licensing, QA and security review; maintainer approves publication. See [licensing](docs/LICENSING.md) and [release plan](plans/07-package-release.md).

## Tooling now

Only asset tooling exists: `python3 -m pip install -r scripts/assets/requirements.txt` in your own virtual environment; `python3 scripts/assets/build_starter.py`; `python3 scripts/assets/validate_assets.py`; `python3 scripts/verify_starter.py`. No app tests have been implemented. Development Node/toolchain and CI are created and documented during code milestones, not fabricated here.
