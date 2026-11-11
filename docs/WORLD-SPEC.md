# World — modern top-down office

## Art direction

Orthogonal 2D pixel art seen from above, with a top/back view at the seats. Axes aligned to the screen; no isometry/3D mock-up, blur or gradients. 1 px outline, clean clusters, fixed upper-left lighting. Original office characters, not brand mascots or real people.

Reference palette: charcoal `#202936`, blue-gray `#455565`, floor `#9AA8B4`, ivory `#E8E4DA`, wood `#C99F73`; teal `#347C85`, coral `#D9856F`, mustard `#D6B76A`, sage `#87A28B`, lilac `#9A8BB4`, plus skin/hair. Up to 24 non-transparent colors per character/clip in the final target. Presets only recolor the scenery. Semantic UI tokens remain legible in the theme.

## Grid and anchors

- Tile 16×16 RGBA; modules 32 px. Integer scale 1×/2× preferred, validate real Retina.
- Character cell 48×48, body ~24×32; feet anchor (24,40), margin for hands/mug. Same pivot in all directions.
- Portrait 32×32 (4 expressions per character). Not included in the initial pilot.
- Desk 64×48, chair 24×24, logical station 96×96. Body does not contain desk/chair in the final art; separate props for occlusion.
- Expanded floor plan 768×432 with 8 stations, two rows of 4, desks facing north. Meeting to the northeast, coffee center-east, racks/printer southeast, sofa/plants south and entrance south. Corridor of at least 32 px where actors walk.
- Sidebar 320–400 px: two stations per row, reflow/scroll, do not shrink the whole floor plan until the sprite is illegible. Meeting can be compact/decorative.

## Cast

| ID | Name | Identity |
|---|---|---|
| lia | Lia | dark skin, wide rounded curly hair, teal blazer |
| nico | Nico | short black hair, black headset, coral hoodie, navy blue pants |
| maya | Maya | high brown bun, mustard shirt |
| tom | Tom | short gray hair, broad shoulders, sage vest and lilac sleeves |

Appearance does not bind a QA/dev/ops role or a vendor. The same agent keeps its character across reordering/status change. More agents can reuse the cast with a textual identifier; do not create new art for each session.

## Animations per character (65 slots)

| sourceState / condition | clip | direction | frames | ms/frame | playback |
|---|---|---|---:|---:|---|
| working | coding | north |6|125|loop 750 ms |
| blocked | blocked | north |4|200|loop 800 ms |
| blocked observed > 60 s | waiting | north |4|250|loop 1000 ms |
| done | done | north |6|150|loop 900 ms while host reports |
| idle | idle | north |4|300|loop 1200 ms |
| unknown | unknown | north |1|0|PNG still |
| idle/coffee desk | coffee-sip-seated | north |6|250|one-shot 1500 ms |
| idle/coffee destination | coffee-sip-standing | south |6|250|one-shot 1500 ms |
| idle-long on route | walk | N/E/S/W |6 each|120|loop 720 ms |
| idle at destination | stand-idle | N/E/S/W |1 each|0|PNG still |

North shows the back, south the face, east the right profile, west the left profile. Desk state north only in the MVP; do not multiply the whole cast by 4. No diagonal direction. Do not mirror asymmetric accessories without review: mirrored west in the starter is provisional and explicitly declared. Sip north keeps the back; the mug appears at the right side of the head, it does not turn the character to the camera.

Offline reuses still/unknown + connection overlay; error only appears with its own proof, not as a sixth state. Standing up/sitting down uses a pose and chair cut, not 4 more frames. Coding keeps sourceState working: there is no literal code detection.

## Coffee and wander

Coffee at each drawn opportunity 45–90 s in idle, one sip 1.5 s; workingCoffeeEnabled=false. After > 300000 ms observed idle, stand up and wander through the internal graph at 24 px/s, visit 8–20 s, return to the desk and cooldown 30–60 s. Max 2 wanderers. `blocked`/done return to the desk immediately; working receives immediate status and returns in <= 1.5 s. Unknown/offline/terminated do not walk. [Architecture](ARCHITECTURE.md) defines all cases.

## Presets

Nordic Day: oak/ivory/sage. Botanical: terracotta/soft green/walnut and more plants. Blue Hour: slate/blue/lilac, discreet warm light; no strong neon. Same anchors/doors/corridors. Vary floor/wall/wood/plant/pictures/rug without altering status semantics or clothes. Seed by machine+space ID+generatorVersion+salt and overrides by space/configured group.

## Files

Source `art/characters/nico/coding/north/frame-00.png`; exports `assets/characters/nico/north-coding.webp`, `.gif`, `north-coding-still.png`. Walk likewise `east-walk`, south/west/north; coffee `north-coffee-sip-seated`, `south-coffee-sip-standing`. Atlas of 8 columns of 48×48 per clip with JSON frame rect/duration/pivot. Atlas is source/build, not an assumption about Herdr's cropping API.

## Starter vs final art

The concepts in [art/concept](../art/concept/README.md) are not Herdr screenshots nor collision maps. The pilot in `assets/` is operational for testing files, alpha and playback, but keyframes/curves have simple synthesis and require pixel cleanup. See [ASSETS](ASSETS.md) for the exact inventory and limitations. Only approve production of the batch after inspecting on the Mac.
