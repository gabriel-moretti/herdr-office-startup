# Staged imports

Frames normalized by `scripts/assets/import_sheets.py` from designer sheets, kept here until a character's set is complete and reviewed. Nothing here is used by the build or the mod. When a character is complete, its folder moves to `art/characters/<id>/` and goes through `build_starter.py` and the validators like Nico.

## 2026-11-11 batch (`art/generated/raw/`)

Source, prompts and per-file review: `art/generated/raw/MANIFEST.md`. Only the sheets that passed review were imported; the rest are waiting for regeneration.

| Character | Imported | Missing / to regenerate |
|---|---|---|
| nico | stand-idle ×4, walk east/south/west, portraits | walk north (one cell faces west), all desk clips (front-facing cells, wrong counts), coffee (tables drawn in) |
| lia | stand-idle ×4, walk ×4 (west: 7 figures, cell 0.2 dropped), portraits | desk clips (front-facing cells, chairs), coffee (desk/chair drawn in) |
| tom | stand-idle ×4, walk east/south, coffee seated/standing, desk coding/blocked/done/idle, portraits (4 of 32) | walk north and west (both face east) |
| maya | portraits | everything else (an extra lilac-haired character in the turnaround and walks, west faces east) |

Known limits of this batch, all visible in the frames:

- **Camera.** Standing and walking frames are RPG three-quarter views; Tom's desk sheet is a true overhead back view. Consistent within a pose, mixed across poses.
- **Nico's headset** is drawn with teal ear cups everywhere, not black as WORLD-SPEC says.
- **Scale** is non-integer (6–11×) and downscaled nearest-neighbour from images that never had a pixel grid, so outlines are uneven at 1×. Needs a human cleanup pass before `productionApproved`.
- **Proportions.** New figures are slimmer than the starter Nico (about 15×32 standing, 20×20 seated, against 28×32). Do not mix starter and new frames in one character.

## How it was imported

```sh
I="python3 -I scripts/assets/import_sheets.py --char-root art/import/characters"
G=art/generated/raw/characters
for id in nico lia tom; do $I $G/$id/$id-turnaround.png --kind turnaround; done
for s in nico/nico-walk-east nico/nico-walk-south nico/nico-walk-west \
         lia/lia-walk-north lia/lia-walk-east lia/lia-walk-south tom/tom-walk-east tom/tom-walk-south; do
  $I $G/$s.png --kind walk --center clip
done
$I $G/lia/lia-walk-west.png --kind walk --center clip --pick 0.0,0.1,0.3,0.4,0.5,0.6
# Seated rows are shorter than standing ones: scale from the standing row only.
$I $G/tom/tom-coffee.png --kind coffee --center clip --scale-row 1
# Overhead seated view: body height 20 makes the head match Tom's standing frames (~10 px).
$I $G/tom/tom-desk-north.png --kind desk-north --center clip --body-height 20 \
  --pick 0.0,0.1,0.2,0.3,0.4,0.5,1.1,1.3,1.4,1.3,2.0,2.1,2.2,2.3,2.4,2.5,3.0,3.5,3.0,3.5
for id in nico lia maya; do $I $G/$id/$id-portraits.png --kind portraits; done
$I $G/tom/tom-portraits.png --kind portraits --pick 0.0,0.2,1.3,3.0
```

Choices made by eye, easy to revisit: Tom `blocked` = arm down, up, down, up (cells 1.1, 1.3, 1.4, 1.3); `idle` alternates the two relaxed cells 3.0 and 3.5; portraits neutral 0.0, focused 0.2, alert 1.3, happy 3.0.
