# Artwork provenance

Generated on 2026-11-11, America/Sao_Paulo (BRT), via the explicitly requested GenerateImage tool. Tool/provider legal terms have not been independently certified in this kit; owner must verify applicable terms before public release. CC BY 4.0 is offered only to extent rights exist. No real person's likeness or Pokémon reference was requested.

## Existing concepts

Five PNGs in `concept/` copied from the prior office-design session. Original input was a request for an original modern top-down office, four identities (Lia/Nico/Maya/Tom), coding/coffee/walk and three per-space variants. Earlier mixed-orientation generations were refined, and animation-sheet-v3 uses a separate coffee row. These are concepts only.

## New sources and treatment

1. `source/nico-turnaround-rejected.jpg`: generated four-cell requested N/E/S/W row, magenta background, black headset/coral hoodie/navy pants. Actual generation gave correct Nico north in cell 1, correct Nico south in cell 2, duplicate south in cell 3 and wrong gray-haired character in cell 4. **Whole turnaround rejected.** Only identity-correct first/second crops are used as north/south inputs. Wrong cells are retained as source evidence, not runtime exports.
2. `source/nico-north-reference.png`: crop of first cell, used to request a single east sprite and avoid ambiguity of a four-person reference.
3. `source/nico-east.jpg`: regenerated single right-facing profile, correct headset/coral/navy identity. Usable starter orientation, but overhead angle is weaker than action sources; needs manual harmonization. West is a declared Pillow mirror of this source, not independently generated art.
4. `source/nico-actions-north.jpg`: generated 2×4 grid with north-facing coding and north-facing coffee reach/lift/sip/lower. Back of head stays visible in every selected cell. Four source keyframes per action; no claim of six independently generated drawings.
5. `characters/` and `assets/`: Pillow chroma key/crop/nearest resize, shared 24-color quantization, frame ordering, scripted hand/cup/feet offsets, per-clip atlases and GIF/WebP exports. Environment tiles/props are original geometric Pillow placeholder drawings using specified palettes, not extracted from another game. The scripts and source inputs are included to reproduce.

## Prompt content record

Turnaround prompt requested: one original Nico, short black hair/headphones/coral hoodie/navy trousers, isolated magenta background, orthogonal overhead RPG camera, equal cell size, N(back)/E(right)/S(front)/W(left), no text/props/shadows, square pixel clusters. It failed direction/identity in two cells and was rejected as a complete sheet.

Action prompt requested: same Nico in every cell, two rows of four north-facing poses, first coding with tiny keyboard and alternating hands, second right hand reaches/raises/holds/lowers white mug; no face, side/front turn, desk/floor/text. It retained north orientation but includes a small keyboard/seat-edge artifact; release art must separate those props.

East prompt requested: one isolated original Nico right-facing profile, same clothing/headset, overhead RPG camera, whole body, uniform magenta, no chair/desk/other character. Only correct east source used. Runtime placeholders also contain procedural derivatives; they are explicitly not fully AI-generated frame-by-frame animation.

## Release checklist

Review service terms, source rights, visual similarity, alpha/halo, temporal continuity, directional silhouette, independent west cleanup and props separation. Record manual editor/author/date and exact modifications on future additions. Never assert exclusivity/copyright where absent. No public screenshot should expose terminal content.
