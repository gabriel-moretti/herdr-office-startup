#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Write animated WebP files where every frame is a full-canvas keyframe.

Why: Herdr drops the partial parts of animated WebP frames that only carry what
changed (sub-rectangle frames and/or alpha-blended frames). libwebp's animation
encoder (used by Pillow's save_all) always trims at least the first frame to its
opaque bounding box, even with kmin=0/kmax=1 (verified with `webpmux -info`:
frame 1 stayed e.g. 19x32 at offset 14,8). So each frame is encoded on its own
as a lossless still (VP8L) by Pillow and the animation RIFF container
(VP8X + ANIM + ANMF) is assembled here. No other tools are needed; frames are
never merged, so the file has exactly one frame per timeline slot.

Usage (re-encode only the WebPs from art/characters/nico/**/frame-XX.png,
using the timeline in assets/characters/nico/manifest.json):

    python3 scripts/assets/webp_whole_frames.py            # re-encode
    python3 scripts/assets/webp_whole_frames.py --check    # files equal a fresh encode
    python3 scripts/assets/webp_whole_frames.py --verify   # decoded RGBA == source PNGs
"""
import io
import json
import struct
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]


def _chunk(tag, payload):
    pad = b'\0' if len(payload) % 2 else b''
    return tag + struct.pack('<I', len(payload)) + payload + pad


def _vp8l_chunk(frame):
    """Lossless still WebP via Pillow -> return its raw VP8L chunk (with header)."""
    buf = io.BytesIO()
    frame.convert('RGBA').save(buf, 'WEBP', lossless=True, quality=100, method=6, exact=True)
    data = buf.getvalue()
    assert data[:4] == b'RIFF' and data[8:12] == b'WEBP'
    assert data[12:16] == b'VP8L', f'unexpected still layout {data[12:16]!r}'
    size = struct.unpack('<I', data[16:20])[0]
    return data[12:20 + size + (size % 2)]


def encode(frames, durations, loop_count):
    """frames: same-size RGBA images; durations: ms per frame; loop_count 0 = infinite."""
    w, h = frames[0].size
    assert all(f.size == (w, h) for f in frames) and len(frames) == len(durations)
    body = _chunk(b'VP8X', struct.pack('<B3x', 0x12) + struct.pack('<I', w - 1)[:3] + struct.pack('<I', h - 1)[:3])  # animation|alpha
    body += _chunk(b'ANIM', struct.pack('<IH', 0, loop_count))  # transparent background
    for frame, ms in zip(frames, durations):
        head = (struct.pack('<I', 0)[:3] + struct.pack('<I', 0)[:3] +        # x/2, y/2 = 0,0
                struct.pack('<I', w - 1)[:3] + struct.pack('<I', h - 1)[:3] +
                struct.pack('<I', ms)[:3] +
                struct.pack('<B', 0b10))  # dispose none, blend method "do not blend"
        body += _chunk(b'ANMF', head + _vp8l_chunk(frame))
    return b'RIFF' + struct.pack('<I', 4 + len(body)) + b'WEBP' + body


def clip_inputs(clip):
    frames = [Image.open(ROOT / f['file']).convert('RGBA') for f in clip['frames']]
    return frames, [f['durationMs'] for f in clip['frames']]


def reencode_all(manifest_path=ROOT / 'assets/characters/nico/manifest.json', check=False):
    manifest = json.loads(manifest_path.read_text())
    done = []
    for clip in manifest['clips']:
        if 'webp' not in clip:
            continue
        frames, durations = clip_inputs(clip)
        # Same rule as build_starter.py: infinite loop for looping clips, play once otherwise.
        loop_count = 0 if clip['loop'] else 1
        data = encode(frames, durations, loop_count)
        dest = manifest_path.parent / clip['webp']
        if check:
            assert dest.read_bytes() == data, f'{dest} is not the whole-frame encoding'
        else:
            dest.write_bytes(data)
        done.append(dest.name)
    return done


def verify_decode(manifest_path=ROOT / 'assets/characters/nico/manifest.json'):
    """Decode each WebP and compare every frame's RGBA bytes, duration and loop to the sources."""
    manifest = json.loads(manifest_path.read_text())
    count = 0
    for clip in manifest['clips']:
        if 'webp' not in clip:
            continue
        im = Image.open(manifest_path.parent / clip['webp'])
        assert im.n_frames == clip['frameCount'], (clip['webp'], im.n_frames)
        assert im.info['loop'] == (0 if clip['loop'] else 1), clip['webp']
        for i, f in enumerate(clip['frames']):
            im.seek(i)
            im.load()
            assert im.info['duration'] == f['durationMs'], (clip['webp'], i)
            assert im.convert('RGBA').tobytes() == Image.open(ROOT / f['file']).convert('RGBA').tobytes(), (clip['webp'], i)
            count += 1
    return count


if __name__ == '__main__':
    if '--verify' in sys.argv:
        print(f'decode-compare OK: {verify_decode()} frames RGBA byte-identical to sources; durations and loop match manifest')
        sys.exit(0)
    names = reencode_all(check='--check' in sys.argv)
    print(('checked ' if '--check' in sys.argv else 'wrote ') + f'{len(names)} WebP files')
