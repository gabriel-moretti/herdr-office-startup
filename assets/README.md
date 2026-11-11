# Derived starter artwork

[Status](STATUS.md), [spec/pipeline](../docs/ASSETS.md), [license](LICENSE), [provenance](../art/PROVENANCE.md).

- characters/nico: self-contained runtime-relative clip/still/atlas paths in manifest.json.
- environment: three preset packs with 16 tiles and 9 prop types each.
- previews: contact sheet + scene/preset overview for inspection, not production backgrounds.
- validation-report.json: actual filesystem/decoder checks; not Herdr rendering evidence.

Final build must copy runtime artifacts inside the installed office-startup-world mod; no /workspace path is a runtime path. Do not install this repository's assets directory as a mod by itself.
