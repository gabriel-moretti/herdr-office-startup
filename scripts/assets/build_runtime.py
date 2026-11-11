#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Build Herdr runtime assets (whole-frame WebP, GIF, still PNG, manifest) from staged frames.

usage: build_runtime.py ID [ID...] [--from art/import/characters] [--out assets/characters] [--check]

Reads <from>/<id>/<clip>/<direction>/frame-NN.png and writes <out>/<id>/. Output follows the
Nico manifest schema; atlas fields are omitted (sync_assets skips atlases, validator checks by
what each manifest declares). Only clips that have frames are produced; nothing is invented.
"""
import argparse
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import webp_whole_frames  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
ANCHOR = [24, 40]
# clip id -> (sourceState, ms per frame, loop). WORLD-SPEC clip table.
SPEC = {
    'coding': ('working', 125, True), 'blocked': ('blocked', 200, True),
    'waiting': ('blocked', 250, True), 'done': ('done', 150, True),
    'idle': ('idle', 300, True), 'unknown': ('unknown', 0, False),
    'coffee-sip-seated': ('idle', 250, False), 'coffee-sip-standing': ('idle', 250, False),
    'walk': ('idle', 120, True), 'stand-idle': ('idle', 0, False),
}
DIRS = ('north', 'east', 'south', 'west')
ORDER = list(SPEC)
SOURCE = 'Imported designer sheets, art/import'


def save_png(im, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, optimize=False)


def gif_bytes(frames, durations, loop, tmp):
    gifframes = []
    for frame in frames:
        rgb = frame.convert('RGB').quantize(colors=255, dither=Image.Dither.NONE)
        alpha = frame.getchannel('A')
        rgb.paste(255, mask=alpha.point(lambda x: 255 if x == 0 else 0))
        palette = rgb.getpalette()
        palette += [0] * (768 - len(palette))
        palette[765:768] = [255, 0, 255]
        rgb.putpalette(palette)
        rgb.info['transparency'] = 255
        gifframes.append(rgb)
    kwargs = {'loop': 0} if loop else {}  # no loop extension: play once
    gifframes[0].save(tmp, save_all=True, append_images=gifframes[1:], duration=durations,
                      transparency=255, disposal=2, optimize=False, **kwargs)
    return tmp.read_bytes()


def load_frames(folder):
    files = sorted(folder.glob('frame-*.png'), key=lambda p: int(re.search(r'(\d+)', p.stem).group(1)))
    return [Image.open(p).convert('RGBA') for p in files], files


def build_character(cid, src_root, out_root, tmpdir):
    """Return {relative path: bytes} and the manifest dict."""
    src = src_root / cid
    if not src.is_dir():
        raise SystemExit(f'no staged frames for {cid}: {src}')
    outputs, clips = {}, []
    for clip_id in ORDER:
        for direction in DIRS:
            folder = src / clip_id / direction
            if not folder.is_dir():
                continue
            frames, files = load_frames(folder)
            if not frames:
                continue
            state, ms, loop = SPEC[clip_id]
            n = len(frames)
            for f in frames:
                assert f.size == (48, 48), f'{folder}: frames must be 48x48'
            if n == 1:
                ms, loop = 0, False
            durations = [ms] * n
            base = f'{direction}-{clip_id}'
            still_buf = tmpdir / 'still.png'
            frames[0].save(still_buf)
            outputs[f'{base}-still.png'] = still_buf.read_bytes()
            entry = {
                'id': clip_id, 'sourceState': state, 'direction': direction,
                'frameCount': n,
                'uniqueFrameCount': len({hashlib.sha256(f.tobytes()).hexdigest() for f in frames}),
                'durationsMs': durations, 'anchor': ANCHOR, 'cell': [48, 48], 'loop': loop,
                'playback': 'loop' if loop else ('still' if n == 1 else 'once'),
                'still': f'{base}-still.png',
                'frames': [{'file': p.relative_to(ROOT).as_posix() if p.is_relative_to(ROOT) else p.as_posix(),
                            'durationMs': durations[i]} for i, p in enumerate(files)],
                'status': 'imported-unreviewed', 'manualCleanupRequired': True,
            }
            if n > 1:
                outputs[f'{base}.webp'] = webp_whole_frames.encode(frames, durations, 0 if loop else 1)
                outputs[f'{base}.gif'] = gif_bytes(frames, durations, loop, tmpdir / 'tmp.gif')
                entry.update(webp=f'{base}.webp', gif=f'{base}.gif',
                             previewNote='GIF timing rounded to 10ms; validate WebP loop-count interpretation in Herdr')
            clips.append(entry)
    portraits = []
    pdir = src / 'portraits'
    if pdir.is_dir():
        for p in sorted(pdir.glob('*.png')):
            outputs[f'portraits/{p.name}'] = p.read_bytes()
            portraits.append(f'portraits/{p.name}')
    manifest = {
        'schemaVersion': 1, 'generator': 'scripts/assets/build_runtime.py', 'characterId': cid,
        'license': 'CC-BY-4.0', 'status': 'imported-unreviewed', 'productionApproved': False,
        'source': '2026-11-11 designer batch, art/import',
        'cell': [48, 48], 'anchor': ANCHOR,
        'frameSlots': sum(c['frameCount'] for c in clips),
        'directionConvention': {'north': 'back', 'east': 'right profile', 'south': 'front', 'west': 'left profile'},
        'portraits': portraits,
        'limitations': ['partial clip set: only clips with staged frames are declared; the mod must fall back for the rest',
                        'see art/import/README.md for known camera, scale and proportion limits'],
        'clips': clips,
    }
    outputs['manifest.json'] = (json.dumps(manifest, indent=2) + '\n').encode()
    return outputs


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('ids', nargs='+')
    ap.add_argument('--from', dest='src', default='art/import/characters')
    ap.add_argument('--out', default='assets/characters')
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args(argv)
    src_root, out_root = (ROOT / a.src).resolve(), (ROOT / a.out).resolve()
    import tempfile
    bad = 0
    for cid in a.ids:
        with tempfile.TemporaryDirectory() as t:
            outputs = build_character(cid, src_root, out_root, Path(t))
        dest = out_root / cid
        existing = {p.relative_to(dest).as_posix() for p in dest.rglob('*') if p.is_file()} if dest.is_dir() else set()
        if a.check:
            diff = [k for k, v in outputs.items() if not (dest / k).is_file() or (dest / k).read_bytes() != v]
            extra = sorted(existing - set(outputs))
            for k in diff:
                print(f'differs: {cid}/{k}')
            for k in extra:
                print(f'extra:   {cid}/{k}')
            bad += len(diff) + len(extra)
            continue
        for k in sorted(existing - set(outputs)):
            (dest / k).unlink()
        wrote = 0
        for k, v in outputs.items():
            p = dest / k
            if p.is_file() and p.read_bytes() == v:
                continue
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(v)
            wrote += 1
        print(f'{cid}: {len(outputs)} files ({wrote} written)')
    if a.check:
        print('runtime assets in sync' if not bad else f'{bad} differences')
        return 1 if bad else 0
    return 0


if __name__ == '__main__':
    sys.exit(main())
