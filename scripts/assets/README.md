# Asset tooling only

These scripts generate/validate artwork. They do **not** implement a Herdr mod or install anything. `build_starter.py` has no network/subprocess/credentials and uses only the included generated JPGs plus original procedural geometric props.

From repository root, with a compatible Python (use Python 3.11+; verify Pillow wheel support on your Mac):

```sh
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r scripts/assets/requirements.txt
python3 scripts/assets/build_starter.py
python3 scripts/assets/validate_assets.py
python3 scripts/verify_starter.py
```

Pillow 13.0.0 was used in the box. libwebp/GIF encoder versions can affect binary output; source selections/timeline/counts are reproducible, do not assume byte-identical encoder output across platforms. If Python/Pillow compatibility differs, record the environment and compare decoded PNG pixels, dimensions/timing rather than silently changing output. Pixel iteration uses Pillow 13 APIs; use the pinned environment rather than assuming compatibility with older Pillow.

`build_starter.py`: chroma-key, crop, nearest resize, shared 24-color quantization, procedural hand/cup/feet variation, PNG per timeline slot, 8-column per-clip atlas, still and GIF/WebP preview; 3-preset tile/prop packs and overview PNGs. The full rejected turnaround is **not** accepted as four directions: only first/second source cells are used, east is separately regenerated, west is explicitly mirrored.

`validate_assets.py`: paths/rects/pivot/dimensions/alpha/color budget/source-slot count, declared duplicates, animation decodability/duration, tiles/props. Emits assets/validation-report.json with runtimeTested=false. GIF frame duration rounds to 10 ms; same source slots may merge in encoding. Does not prove how Herdr loops/caches/restarts clips.

Open assets/previews/nico-contact-sheet.png and office-presets.png at 1×/2×; play animated files and inspect over light/dark backgrounds. See [ASSETS](../../docs/ASSETS.md) for manual cleanup requirements and [provenance](../../art/PROVENANCE.md).

For delivery-only verification use `python3 scripts/verify_starter.py --starter-only` (asserts no application files or .git). Default mode keeps checking documentation/licenses after Claude Code starts implementing and initializes Git.
