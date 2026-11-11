# Asset status — starter, not production approved

| Group | Delivered | Status |
|---|---:|---|
| Nico body timeline slots |65|starter-placeholder, 16 variants; duplicates/derived frames declared in manifest |
| Animated exports |11 WebP +11 GIF|decodable previews; Herdr playback/alpha/restart still unverified |
| Character atlases / stills |16 each|48px cells, common pivot; not a runtime atlas API assumption |
| Preset tiles | 48 | 16 per preset, procedural placeholder |
| Props | 9 types × 3 palettes = 27 PNGs | subset of 22 types planned |
| Portraits |0/16|not generated |
| Lia / Maya / Tom | 0/195 body slots |not generated |
| Main concept PNGs |5|AI concepts, not production sprites |

The starter uses generated keyframes + Pillow synthesis. North coffee remains back-facing; west is mirrored east; walk/attention/done motion is deliberately primitive. All clips have `productionApproved=false` through the character manifest. See [ASSETS](../docs/ASSETS.md) for cleanup and actual inventory meaning. Files are usable to test layout/decoding/timing, not a claim of polished animation or validated Herdr rendering.
