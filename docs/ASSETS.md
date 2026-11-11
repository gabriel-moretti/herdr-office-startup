# Assets — inventory, pipeline and status

## Full MVP budget (not to be confused with current delivery)

Per character: 6 coding + 4 blocked + 4 waiting + 6 done + 4 idle + 1 unknown + 6 coffee seated/north + 6 coffee standing/south + 4×6 walk + 4×1 stand-idle = **65 slots**. For Lia/Nico/Maya/Tom: **260 body frames/poses**, 44 animated clips (11 per character) and 20 static poses. 64 still exports can be derived from these frames without additional drawing.

Environment/portraits: 16 portraits (4 characters × 4 expressions); 48 tiles (16 × 3 presets, including recolors); 22 prop types: desk, chair, monitor, keyboard/mouse, meeting table, meeting chair, partition, door, coffee counter, espresso machine, stool, rack, printer, sofa, plant, mug, window, picture, lamp, rug and 2 alternative plants.

Planning total: **346 authored images/cells** = 260 + 16 + 48 + 22. This is not the number of release files: atlases/frames/stills/GIF/WebP/previews multiply files, prop recolors are additional exports. If 4 exclusive stand-up/sit-down frames per character are added, body rises to 276; that is not part of the current scope.

## Current delivery: starter PoC

- **Nico: 65 slots**, 16 variants (11 animated + 5 still), PNG per slot, atlas per variant, still, GIF/WebP for 11 clips.
- Slots are timeline positions, **not 65 unique drawings**. Four coding/coffee keyframes come from a generated source, expanded by ordering/repetition to 6; attention/completion/idle/gait use simple procedural editing. `uniqueFrameCount` declares duplicates per variant. No final animation has been approved.
- Four directions present: north/back, east/right, south/front, west/left. West is a mirror of east, provisional, safe only while clothing/headset has no asymmetry; requires manual review. There is camera tilt variation between the action source and the standing poses.
- **48 tiles 16×16** (16 per preset) and **9 prop types**, exported in 3 palettes (**27 files**). The 9 types are desk, chair, monitor, keyboard, coffee-counter, coffee-machine, plant, sofa, window. 13 prop types from the final budget are missing.
- No portraits; Lia/Maya/Tom not produced. Do not inflate the count with concepts or layouts.
- Five main PNG concept images copied into `art/concept`; rejected turnaround source is retained only as provenance, not a usable full turnaround.
- **Status icons:** 7 hand-written SVGs in `mods/office-startup-world/icons/status-<state>.svg` for working, blocked, waiting, done, idle, unknown and offline. 16×16 viewBox, single color (`currentColor`) so the host's `svg()` tints them with the theme's status colors; each state has its own shape so it reads without color. Original work, CC BY 4.0 like the rest of the art. Checked by `tests/world/status-icons.test.mjs`; legibility reviewed at 16 px on light and dark backgrounds, not yet inside Herdr.
- Inspection previews: [Nico](../assets/previews/nico-contact-sheet.png), [environments](../assets/previews/office-presets.png). Status inventory in [assets/STATUS](../assets/STATUS.md).

## Technical specifications

Cell 48×48 RGBA, binary alpha 0/255, pivot (24,40), target body ~24×32. Body/hand/mug must fit without clipping. Character limited to 24 opaque colors shared across clips by the generator. Per-frame source in `art/characters/nico/<clip>/<direction>/frame-00.png`; derived runtime in `assets/characters/nico/<direction>-<clip>.webp/.gif`, `-still.png`, `-atlas.png`. Tiles 16×16; tile atlas 128×32 per preset; prop dimensions in [WORLD-SPEC](WORLD-SPEC.md).

Character atlas: 8 columns, 48×48 cells, PNG RGBA; enough rows per clip. JSON in `assets/characters/nico/manifest.json` with schemaVersion, characterId, license, productionApproved=false, cell/anchor, sourceState, clip ID, direction, frameCount, uniqueFrameCount, durationsMs, loop/playback, atlas, still, webp/gif and `frames` with file/rect/duration. Atlas/clip/still paths are relative to the manifest folder; frame.file paths are relative to the repo root and serve only the build. A release build does not depend on `art/` or absolute box paths.

GIF is a palette/binary-alpha fallback; 125ms durations round to 120ms because of the format's 10ms granularity. The source timeline and WebP preserve 125ms; GIF is not bit/timing identical. Encoders may coalesce identical frames: compare total duration and decoded frames, do not require 65 distinct compressed frames. Sip is one-shot; the other animated clips loop. Validate WebP loop count, reset and transparency in real Herdr before choosing the default format. Nothing requires ImageMagick/Chrome at runtime.

## Current reproducible pipeline

1. Sources are images generated via GenerateImage from the original concepts. Prompts/selection/rejection in [PROVENANCE](../art/PROVENANCE.md).
2. `scripts/assets/build_starter.py` removes chroma pink, crops cells, normalizes with nearest-neighbor, quantizes a shared 24-color palette, applies procedural transformations and exports PNG/atlas/GIF/WebP. It also generates a procedural environment in three palettes. Uses only local sources and Pillow, no network/mod installation.
3. Re-run in a venv per the [script README](../scripts/assets/README.md); Pillow version pinned to reduce encoding variation. Keep the sources to repeat the crops; do not depend on another identical generation.
4. `validate_assets.py` validates dimensions/alpha/palette/paths/rects/counts/decode; `scripts/verify_starter.py` validates documentation/naming coherence. This does not prove temporal quality or runtime.
5. Open the contact sheet over light/dark backgrounds and the animated GIF/WebP. Test on the Mac: alpha, direction change, loop/disposal/restart and HiDPI.

## Manual cleanup required before release

- Unify camera/head tilt and body width across north/south/east/west and desk clips. East is more in profile than north; it is the correct orientation but must look like the same volume seen from above.
- Redraw the stride with hip/knee/arms; the starter only oscillates foot pixels, not a natural gait. Blocked/done need clearer hand silhouettes and chair/desk as layers.
- Remove the embedded keyboard from the coding source and use a separate prop. The coffee source shows only the back correctly, but arm/mug proportion and seated posture need to harmonize with coding.
- Produce a reach→lift→sip→lower sip trajectory without jumps, and remove anchor/light jitter. Standing south is a procedural mug edit.
- Evaluate JPEG/color key edges and clusters at 1× size. Do not upscale to hide problems. Check for halo over a dark background.
- Still/unknown must be a neutral pose, overlays are native UI. Do not paint a status check/question mark on the person/scene background.
- Replace prop placeholders with art with coherent material/light; verify seamless tiles and corridors at real 48px scale.

## How to add a character

Approve original silhouette → generate/draw north/east/south/west with constant clothing/hair → editable sources → 65 slots in the same variants/pivot/timing → palette ≤ 24 colors → manifest with its own characterId → PNG/atlas/clips/stills → 4 portraits 32×32 → provenance/license → validations → inspection at 1× and on the Mac → mark productionApproved only after human review. Do not copy Nico by simple recolor as if it were a new drawing nor use the likeness of a real person/brand.
