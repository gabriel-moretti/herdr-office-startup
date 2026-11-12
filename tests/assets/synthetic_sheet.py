# SPDX-License-Identifier: Apache-2.0
"""Test helper: write a synthetic designer sheet (magenta bg, 3x scaled sprites,
8px*3 gaps, JPEG round trip for realistic fringes). Not shipped art.

usage: synthetic_sheet.py OUT.png CELL_W CELL_H ROWCOUNTS(comma list) [SCALE] [kind] [BODY_H] [halo]
BODY_H draws characters taller than the 32 px body the prompts asked for (generators do);
'halo' adds a 1 px dark-red ring (magenta blended into the dark outline by JPEG) around each sprite, like the fringe real sheets carry.
Sprite i (row-major) is a solid rectangle whose colour encodes i, so tests can
check order. Characters: body w 20..24, h 30..32, drawn with the feet 1..3px above
the cell bottom (misalignment), horizontally off-centre by -2..2 px.
"""
import io
import random
import sys
from PIL import Image, ImageDraw

out, cw, ch, rows = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), [int(x) for x in sys.argv[4].split(',')]
scale = int(sys.argv[5]) if len(sys.argv) > 5 else 3
kind = sys.argv[6] if len(sys.argv) > 6 else 'character'
# BODY_H may be one value or one per row ('20/30'): generators draw seated rows shorter.
body_hs = [int(v) for v in sys.argv[7].split('/')] if len(sys.argv) > 7 and sys.argv[7] != '0' else None
halo = len(sys.argv) > 8 and sys.argv[8] == 'halo'
gap = 8
rng = random.Random(7)
W = (max(rows) * (cw + gap) + gap)
H = (len(rows) * (ch + gap) + gap)
sheet = Image.new('RGB', (W, H), (255, 0, 255))
d = ImageDraw.Draw(sheet)
i = 0
for r, n in enumerate(rows):
    for c in range(n):
        x0 = gap + c * (cw + gap)
        y0 = gap + r * (ch + gap)
        color = (20 + (i * 17) % 200, 110 + (i * 5) % 60, 40 + (i * 29) % 160)
        if kind == 'character':
            w = 20 + 2 * (i % 3)
            body_h = body_hs[min(r, len(body_hs) - 1)] if body_hs else 30
            h = body_h + (i % 3)
            left = x0 + (cw - w) // 2 + rng.randint(-2, 2)
            bottom = y0 + ch - 1 - rng.randint(1, 3)
            if halo:
                d.rectangle((left - 1, bottom - h, left + w, bottom + 1), fill=(115, 18, 40))
            d.rectangle((left, bottom - h + 1, left + w - 1, bottom), fill=color)
            d.rectangle((left + 2, bottom - h + 3, left + 5, bottom - h + 6), fill=(240, 220, 200))  # face patch
        else:  # fills the whole cell (portraits, tiles)
            d.rectangle((x0, y0, x0 + cw - 1, y0 + ch - 1), fill=color)
            d.rectangle((x0 + 1, y0 + 1, x0 + 3, y0 + 3), fill=(240, 220, 200))
        i += 1
big = sheet.resize((W * scale, H * scale), Image.Resampling.NEAREST)
buf = io.BytesIO()
big.save(buf, 'JPEG', quality=88)
Image.open(io.BytesIO(buf.getvalue())).convert('RGB').save(out)
