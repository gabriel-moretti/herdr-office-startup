#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Import a designer sprite sheet (magenta #FF00FF background) into normalized frames.

Asset tooling only (Pillow, no network/subprocess). Kinds:

  turnaround  1x4  -> art/characters/<id>/stand-idle/{north,east,south,west}/frame-00.png
  desk-north  6/4/6/4 -> art/characters/<id>/{coding,blocked,done,idle}/north/frame-XX.png
  coffee      6/6  -> art/characters/<id>/coffee-sip-seated/north/ and coffee-sip-standing/south/
  walk        1x6  -> art/characters/<id>/walk/<direction>/frame-XX.png   (--direction or walk-<dir> in file name)
  portraits   1x4  -> art/characters/<id>/portraits/{neutral,focused,alert,happy}.png (32x32)
  tiles       4x4  -> art/import/<preset>/tiles/tile-NN.png (16x16, row-major).
                      art/environment/ does not exist yet; build_starter.py names tiles
                      floor-00..07 / wall-00..07 for indexes 0-7 / 8-15, so a human can rename.
  props       free -> art/import/props-<preset>/NN.png, one trimmed PNG per object, unnamed.

Character frames are 48x48 RGBA, binary alpha, nearest-neighbour downscaled, lowest opaque
row at y=39 (--feet-y) and body bbox centred on x=24. Generated sheets are not pixel exact:
for characters the scale comes from the median figure height (a 32 px body, --body-height),
because generators pack tall figures much closer than the requested cell pitch; portraits and
tiles use their cell size. The background is removed with the same chroma test as
build_starter.keyed() plus a loose test for JPEG fringe pixels, and dark-red fringe left on
sprite edges after downscaling is cleared.

Seated figures are shorter than standing ones: on a coffee sheet use --scale-row 1 (standing
row) so the seated row keeps its proportion; for desk sheets lower --body-height until the head
matches the same character's standing frames (20 for the 2026-11-11 Tom sheet).

A row with more figures than the layout expects is an error: use --pick to choose cells as
"row.col" (0-based, row-major, in output order), e.g. --pick 0.0,0.1,0.2,0.4,0.5,0.6.
Character frames go under --char-root (default art/characters; use art/import/characters to
stage a character until its full set exists).
Refuses to overwrite existing files unless --force; --dry-run writes nothing.
"""
import argparse
import re
import statistics
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CELL = 48
FEET_Y = 39  # lowest opaque row; matches the starter Nico (pivot (24,40), body bbox ends at 40 exclusive)
CENTER_X = 24

# kind -> (rows as expected cell counts, cell size used for scale estimation, gap)
LAYOUT = {
    'turnaround': ([4], 48),
    'desk-north': ([6, 4, 6, 4], 48),
    'coffee': ([6, 6], 48),
    'walk': ([6], 48),
    'portraits': ([4], 32),
    'tiles': ([4, 4, 4, 4], 16),
}
GAP = 8
DIRECTIONS = ('north', 'east', 'south', 'west')
EXPRESSIONS = ('neutral', 'focused', 'alert', 'happy')


def _pixels(im):
    # get_flattened_data is the Pillow 13 API (also in 12.3); getdata is deprecated.
    return im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata()


def is_chroma(r, g, b):
    """Strict key: identical to build_starter.keyed()'s saturated-pink test."""
    return r > 100 and g < 85 and b > max(g * 1.2, r * .38) and r > g * 1.5


def is_fringe(r, g, b):
    """Looser test for JPEG blend pixels between magenta and sprite colours."""
    return r > g + 28 and b > g + 28 and g < 150


class Sheet:
    """Background mask + 8-connected components of the foreground."""

    def __init__(self, im):
        im = im.convert('RGB')
        self.w, self.h = im.size
        self.px = list(_pixels(im))
        w, h = self.w, self.h
        bg = bytearray(w * h)
        for i, (r, g, b) in enumerate(self.px):
            if is_chroma(r, g, b):
                bg[i] = 1
        # Fringe: loosely-pink pixels touching the background are background too (repeat to eat 2px).
        for _ in range(2):
            add = []
            for y in range(h):
                row = y * w
                for x in range(w):
                    i = row + x
                    if bg[i]:
                        continue
                    r, g, b = self.px[i]
                    if not is_fringe(r, g, b):
                        continue
                    if ((x > 0 and bg[i - 1]) or (x < w - 1 and bg[i + 1]) or
                            (y > 0 and bg[i - w]) or (y < h - 1 and bg[i + w])):
                        add.append(i)
            for i in add:
                bg[i] = 1
        self.bg = bg
        self.labels, self.comps = self._components()

    def _components(self):
        w, h, bg = self.w, self.h, self.bg
        labels = [0] * (w * h)
        comps = []  # [x0, y0, x1, y1, area] with inclusive max
        for start in range(w * h):
            if bg[start] or labels[start]:
                continue
            cid = len(comps) + 1
            labels[start] = cid
            stack = [start]
            x0 = x1 = start % w
            y0 = y1 = start // w
            area = 0
            while stack:
                i = stack.pop()
                area += 1
                y, x = divmod(i, w)
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
                for dy in (-1, 0, 1):
                    ny = y + dy
                    if ny < 0 or ny >= h:
                        continue
                    for dx in (-1, 0, 1):
                        nx = x + dx
                        if nx < 0 or nx >= w:
                            continue
                        j = ny * w + nx
                        if not bg[j] and not labels[j]:
                            labels[j] = cid
                            stack.append(j)
            comps.append([x0, y0, x1, y1, area])
        return labels, comps

    def crop_rgba(self, box, ids):
        """RGBA crop of box=(x0,y0,x1,y1 inclusive); only pixels of components in `ids` are opaque."""
        x0, y0, x1, y1 = box
        out = Image.new('RGBA', (x1 - x0 + 1, y1 - y0 + 1))
        data = []
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                i = y * self.w + x
                r, g, b = self.px[i]
                data.append((r, g, b, 255) if self.labels[i] in ids else (0, 0, 0, 0))
        out.putdata(data)
        return out


class ImportError_(Exception):
    pass


def _merge_intervals(items):
    """items: list of (lo, hi, payload-list). Merge overlapping intervals."""
    items = sorted(items, key=lambda t: t[0])
    merged = []
    for lo, hi, ids in items:
        if merged and lo <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], hi)
            merged[-1][2].extend(ids)
        else:
            merged.append([lo, hi, list(ids)])
    return merged


def filter_noise(comps):
    big = max(c[4] for c in comps)
    floor = max(12, big * 0.003)
    return {i + 1: c for i, c in enumerate(comps) if c[4] >= floor}


def _merge_close(cols):
    """Join columns separated by a gap far narrower than a figure (detached hand, mug, steam)."""
    if len(cols) < 2:
        return cols
    width = statistics.median(c[1] - c[0] + 1 for c in cols)
    out = [list(cols[0])]
    for lo, hi, ids in cols[1:]:
        if lo - out[-1][1] < width * 0.25 and (hi - lo + 1) < width * 0.6:
            out[-1][1] = max(out[-1][1], hi)
            out[-1][2] = out[-1][2] + list(ids)
        else:
            out.append([lo, hi, list(ids)])
    return out


def _cell(kept, cids):
    x0 = min(kept[i][0] for i in cids); y0 = min(kept[i][1] for i in cids)
    x1 = max(kept[i][2] for i in cids); y1 = max(kept[i][3] for i in cids)
    return {'box': (x0, y0, x1, y1), 'ids': set(cids)}


def detect_grid(sheet):
    """All rows -> cells as found, without assuming a layout."""
    kept = filter_noise(sheet.comps) if sheet.comps else {}
    if not kept:
        raise ImportError_('no foreground found (is the background #FF00FF?)')
    rows = _merge_intervals([(c[1], c[3], [cid]) for cid, c in kept.items()])
    grid = []
    for _, _, ids in rows:
        cols = _merge_close(_merge_intervals([(kept[i][0], kept[i][2], [i]) for i in ids]))
        grid.append([_cell(kept, cids) for _, _, cids in cols])
    return grid


def pick_cells(grid, expected_rows, pick):
    """Reshape `row.col` picks (output order) into the expected rows."""
    tokens = [p.strip() for p in pick.split(',') if p.strip()]
    if len(tokens) != sum(expected_rows):
        raise ImportError_(f'--pick names {len(tokens)} cells, this kind needs {sum(expected_rows)} {expected_rows}')
    cells = []
    for tok in tokens:
        m = re.fullmatch(r'(\d+)\.(\d+)', tok)
        if not m:
            raise ImportError_(f'--pick entry {tok!r} is not row.col')
        r, c = int(m.group(1)), int(m.group(2))
        if r >= len(grid) or c >= len(grid[r]):
            raise ImportError_(f'--pick entry {tok} is outside the detected grid {[len(x) for x in grid]}')
        cells.append(grid[r][c])
    out, k = [], 0
    for n in expected_rows:
        out.append(cells[k:k + n]); k += n
    return out


def detect_cells(sheet, expected_rows, pick=None):
    """Return rows -> cells; each cell = dict(box=(x0,y0,x1,y1), ids=set)."""
    grid = detect_grid(sheet)
    if pick:
        return pick_cells(grid, expected_rows, pick)
    counts = [len(r) for r in grid]
    if len(grid) != len(expected_rows):
        raise ImportError_(f'found {len(grid)} sprite rows {counts}, expected {len(expected_rows)} {expected_rows}; '
                           'use --pick to choose cells')
    for r, (row, n) in enumerate(zip(grid, expected_rows)):
        if len(row) < n:
            raise ImportError_(f'row {r}: found {len(row)} cells, expected {n}')
        if len(row) > n:
            raise ImportError_(f'row {r}: found {len(row)} cells, expected {n}; use --pick to choose cells')
    return grid


def estimate_scale(rows, cell, kind, sheet_w, body_height=32.0, scale_row=None):
    """Scale estimates from cell pitch (cell+gap) and from sprite size; prints both."""
    cells = [c for row in (rows if scale_row is None else [rows[scale_row]]) for c in row]
    est = {}
    pitches = [b['box'][0] - a['box'][0] for row in rows for a, b in zip(row, row[1:])]
    centres = []
    for row in rows:
        centres += [((b['box'][0] + b['box'][2]) / 2 - (a['box'][0] + a['box'][2]) / 2) for a, b in zip(row, row[1:])]
    if centres:
        est['pitch'] = statistics.median(centres) / (cell + GAP)
    if len(rows) > 1:
        # characters share a foot line per row; fills share the top edge
        key = 3 if kind in ('turnaround', 'desk-north', 'coffee', 'walk') else 1
        ys = [statistics.median(c['box'][key] for c in row) for row in rows]
        est['row-pitch'] = statistics.median([b - a for a, b in zip(ys, ys[1:])]) / (cell + GAP)
    if kind in ('portraits', 'tiles'):
        est['size'] = statistics.median((c['box'][2] - c['box'][0] + 1) for c in cells) / cell
    else:
        est['height'] = statistics.median((c['box'][3] - c['box'][1] + 1) for c in cells) / body_height
    est['sheet'] = sheet_w / (max(len(r) for r in rows) * (cell + GAP) + GAP)  # info only: assumes an 8px outer margin
    # Characters: body height. Generated sheets pack tall figures closer than the requested
    # pitch, so pitch-based estimates come out 2-3x too small for them.
    key = 'size' if kind in ('portraits', 'tiles') else 'height'
    if key in est:
        raw = est[key]
        # Bodies are only roughly measured, so snap near-integers (3.86 -> 4).
        return (float(round(raw)) if round(raw) >= 1 and abs(raw - round(raw)) <= 0.25 else raw), est, key
    raise ImportError_('cannot estimate scale')


def downscale(im, scale):
    if abs(scale - 1) < 1e-6:
        return im
    size = (max(1, round(im.width / scale)), max(1, round(im.height / scale)))
    return im.resize(size, Image.Resampling.NEAREST)


def is_dark_fringe(r, g, b):
    """Magenta blended into a dark outline by JPEG, e.g. (112,16,32). Lilac/coral have high green."""
    return r > 90 and g < 60 and r > 2.5 * g


def binarize(im):
    """Binary alpha, canonical zero RGB under alpha 0, drop residual chroma and edge fringe."""
    w, h = im.size
    px = []
    for r, g, b, a in _pixels(im):
        if a < 128 or is_chroma(r, g, b):
            px.append((0, 0, 0, 0))
        else:
            px.append((r, g, b, 255))
    for _ in range(2):  # fringe is at most ~2 px deep after downscaling
        clear = []
        for i, (r, g, b, a) in enumerate(px):
            if not a or not is_dark_fringe(r, g, b):
                continue
            y, x = divmod(i, w)
            if (x == 0 or not px[i - 1][3] or x == w - 1 or not px[i + 1][3] or
                    y == 0 or not px[i - w][3] or y == h - 1 or not px[i + w][3]):
                clear.append(i)
        for i in clear:
            px[i] = (0, 0, 0, 0)
    out = Image.new('RGBA', im.size)
    out.putdata(px)
    return out


def place_character(sprite, feet_y, centre_x, dx_override=None):
    bb = sprite.getchannel('A').getbbox()
    if bb is None:
        raise ImportError_('empty frame after downscale')
    sprite = sprite.crop(bb)
    w, h = sprite.size
    left = (centre_x - w // 2) if dx_override is None else dx_override
    top = feet_y - (h - 1)
    if left < 0 or left + w > CELL or top < 0:
        raise ImportError_(f'sprite {w}x{h} does not fit a {CELL}x{CELL} cell with feet at y={feet_y}')
    cell = Image.new('RGBA', (CELL, CELL))
    cell.paste(sprite, (left, top))
    return cell


def plan_outputs(kind, args, rows, scale, sheet):
    """Return list of (relative_path, PIL image) and log lines."""
    cid = args.id
    out = []
    flat = [c for row in rows for c in row]

    def sprite_of(c):
        return binarize(downscale(sheet.crop_rgba(c['box'], c['ids']), scale))

    def character(cells, clip, direction, offset=0):
        sprites = [sprite_of(c) for c in cells]
        dx = None
        if args.center == 'clip':
            # Shared horizontal anchor for the whole clip: centre the union bbox, keep relative motion.
            boxes = [s.getchannel('A').getbbox() for s in sprites]
            lo = min(b[0] for b in boxes); hi = max(b[2] for b in boxes)
            base = CENTER_X - (hi - lo) // 2 - lo
        for n, s in enumerate(sprites):
            if args.center == 'clip':
                bb = s.getchannel('A').getbbox()
                frame = place_character(s, args.feet_y, CENTER_X, dx_override=bb[0] + base)
            else:
                frame = place_character(s, args.feet_y, CENTER_X)
            out.append((Path(args.char_root) / cid / clip / direction / f'frame-{n + offset:02}.png', frame))

    if kind == 'turnaround':
        for d, c in zip(DIRECTIONS, flat):
            character([c], 'stand-idle', d)
    elif kind == 'desk-north':
        for clip, cells in zip(('coding', 'blocked', 'done', 'idle'), rows):
            character(cells, clip, 'north')
    elif kind == 'coffee':
        character(rows[0], 'coffee-sip-seated', 'north')
        character(rows[1], 'coffee-sip-standing', 'south')
    elif kind == 'walk':
        character(flat, 'walk', args.direction)
    elif kind == 'portraits':
        for name, c in zip(EXPRESSIONS, flat):
            im = binarize(sheet.crop_rgba(c['box'], c['ids']).resize((32, 32), Image.Resampling.NEAREST))
            out.append((Path(args.char_root) / cid / 'portraits' / f'{name}.png', im))
    elif kind == 'tiles':
        for n, c in enumerate(flat):
            im = sheet.crop_rgba(c['box'], c['ids']).resize((16, 16), Image.Resampling.NEAREST)
            im.putalpha(255)  # tiles are opaque
            out.append((Path('art/import') / args.preset / 'tiles' / f'tile-{n:02}.png', im))
    return out


def extract_props(sheet, args, scale):
    kept = filter_noise(sheet.comps)
    boxes = [[c[0], c[1], c[2], c[3], {i}] for i, c in kept.items()]
    changed = True  # merge objects whose boxes overlap (multi-part props)
    while changed:
        changed = False
        for a in range(len(boxes)):
            for b in range(a + 1, len(boxes)):
                A, B = boxes[a], boxes[b]
                if A[0] <= B[2] and B[0] <= A[2] and A[1] <= B[3] and B[1] <= A[3]:
                    boxes[a] = [min(A[0], B[0]), min(A[1], B[1]), max(A[2], B[2]), max(A[3], B[3]), A[4] | B[4]]
                    del boxes[b]
                    changed = True
                    break
            if changed:
                break
    rows = _merge_intervals([(b[1], b[3], [k]) for k, b in enumerate(boxes)])
    order = []
    for _, _, ks in rows:
        order += sorted(ks, key=lambda k: boxes[k][0])
    out = []
    for n, k in enumerate(order):
        x0, y0, x1, y1, ids = boxes[k]
        im = binarize(downscale(sheet.crop_rgba((x0, y0, x1, y1), ids), scale))
        out.append((Path('art/import') / f'props-{args.preset}' / f'{n:02}.png', im))
    return out, [boxes[k][:4] for k in order]


def infer(args):
    stem = Path(args.sheet).stem
    if args.kind == 'walk' and not args.direction:
        m = re.search(r'walk-(north|east|south|west)', stem)
        args.direction = m.group(1) if m else None
        if not args.direction:
            raise ImportError_('walk needs --direction (or walk-<direction> in the file name)')
    if args.kind in ('tiles', 'props'):
        if not args.preset:
            m = re.match(r'(?:tiles|props)-(.+)$', stem)
            args.preset = m.group(1) if m else None
        if not args.preset:
            raise ImportError_(f'{args.kind} needs --preset (or {args.kind}-<preset> in the file name)')
    elif not args.id:
        m = re.match(r'([a-z0-9]+)-', stem)
        args.id = m.group(1) if m else None
        if not args.id:
            raise ImportError_('need --id (or <id>-<name> in the file name)')


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('sheet')
    ap.add_argument('--kind', required=True, choices=list(LAYOUT) + ['props'])
    ap.add_argument('--id', help='character id (nico, lia, maya, tom)')
    ap.add_argument('--direction', choices=DIRECTIONS, help='walk sheets')
    ap.add_argument('--preset', help='nordic-day, botanical, blue-hour (tiles/props)')
    ap.add_argument('--scale', type=float, help='override the estimated source scale')
    ap.add_argument('--body-height', type=float, default=32.0,
                    help='target figure height in output pixels used to estimate the scale (default 32)')
    ap.add_argument('--scale-row', type=int,
                    help='estimate the scale from this row only (e.g. 1 = the standing row of a coffee sheet)')
    ap.add_argument('--pick', help='choose cells as row.col,row.col,... in output order')
    ap.add_argument('--char-root', default='art/characters',
                    help='where character frames and portraits go (e.g. art/import/characters)')
    ap.add_argument('--feet-y', type=int, default=FEET_Y)
    ap.add_argument('--center', choices=('frame', 'clip'), default='frame',
                    help='centre every frame bbox on x=24 (default) or the clip union bbox (no jitter)')
    ap.add_argument('--out-root', default=str(ROOT), help='repository root to write under')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--force', action='store_true', help='overwrite existing files')
    args = ap.parse_args(argv)
    try:
        infer(args)
        sheet = Sheet(Image.open(args.sheet))
        if args.kind == 'props':
            # props are irregular: scale only if the human asks for it
            scale = args.scale or 1.0
            outputs, boxes = extract_props(sheet, args, scale)
            print(f'{len(outputs)} objects found (native scale {scale:g}; not renamed)')
            for n, b in enumerate(boxes):
                print(f'  object {n:02}: bbox x={b[0]}..{b[2]} y={b[1]}..{b[3]} ({b[2]-b[0]+1}x{b[3]-b[1]+1} px)')
        else:
            expected, cell = LAYOUT[args.kind]
            rows = detect_cells(sheet, expected, args.pick)
            if args.scale_row is not None and not 0 <= args.scale_row < len(rows):
                raise ImportError_(f'--scale-row {args.scale_row} is outside rows 0..{len(rows) - 1}')
            scale, est, source = estimate_scale(rows, cell, args.kind, sheet.w, args.body_height, args.scale_row)
            if args.scale:
                scale, source = args.scale, 'override'
            label = {'height': 'scale from body height', 'size': 'scale from cell size', 'override': 'scale override'}[source]
            print(f'sheet {sheet.w}x{sheet.h}; {label} ~{scale:.2f} '
                  f'(estimates: {", ".join(f"{k} {v:.2f}" for k, v in est.items())}); '
                  f'rows {[len(r) for r in rows]}')
            if abs(scale - round(scale)) > 0.15:
                print('warning: scale is not close to an integer; check the sheet by eye')
            for r, row in enumerate(rows):
                for c, cellinfo in enumerate(row):
                    b = cellinfo['box']
                    print(f'  cell r{r}c{c}: bbox x={b[0]}..{b[2]} y={b[1]}..{b[3]} '
                          f'({b[2]-b[0]+1}x{b[3]-b[1]+1} px, ~{(b[2]-b[0]+1)/scale:.1f}x{(b[3]-b[1]+1)/scale:.1f} out)')
            outputs = plan_outputs(args.kind, args, rows, scale, sheet)
    except ImportError_ as e:
        print(f'error: {e}', file=sys.stderr)
        return 1
    root = Path(args.out_root)
    existing = [p for p, _ in outputs if (root / p).exists()]
    if existing and not args.force and not args.dry_run:
        print(f'error: {len(existing)} output file(s) already exist, e.g. {existing[0]}; use --force to overwrite',
              file=sys.stderr)
        return 2
    for p, im in outputs:
        mark = ' (exists)' if (root / p).exists() else ''
        print(f'{"would write" if args.dry_run else "write"} {p} {im.size[0]}x{im.size[1]}{mark}')
        if not args.dry_run:
            (root / p).parent.mkdir(parents=True, exist_ok=True)
            im.save(root / p)
    return 0


if __name__ == '__main__':
    sys.exit(main())
