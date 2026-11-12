// SPDX-License-Identifier: Apache-2.0
// Behavioural tests for scripts/assets/import_sheets.py using synthetic sheets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const importer = join(root, 'scripts/assets/import_sheets.py');
const maker = join(here, 'synthetic_sheet.py');
const probe = spawnSync('python3', ['-c', 'import PIL'], { stdio: 'ignore' });
const skip = probe.status === 0 ? false : 'python3 with Pillow not available; skipping importer tests';

const tmp = mkdtempSync(join(tmpdir(), 'import-sheets-'));
process.on('exit', () => rmSync(tmp, { recursive: true, force: true }));

function sheet(name, cw, ch, rows, scale = 3, kind = 'character', bodyH = 0, halo = '') {
  const p = join(tmp, name);
  execFileSync('python3', [maker, p, String(cw), String(ch), rows, String(scale), kind, String(bodyH), halo]);
  return p;
}
function run(args, expectFail = false) {
  const r = spawnSync('python3', [importer, ...args], { encoding: 'utf8' });
  if (!expectFail) assert.equal(r.status, 0, `importer failed: ${r.stdout}\n${r.stderr}`);
  return r;
}
// Python helper to inspect an output frame: prints "w h bottom left right minAlpha pinkish r g b"
function inspect(file) {
  const code = `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGBA')
bb = im.getchannel('A').getbbox()
px = list(im.getdata())
pink = sum(1 for r,g,b,a in px if a and r>100 and g<85 and b>max(g*1.2,r*.38) and r>g*1.5)
alphas = sorted(set(a for r,g,b,a in px))
cx,cy = (bb[0]+bb[2])//2, (bb[1]+bb[3])//2
print(im.size[0], im.size[1], bb[1], bb[3]-1, bb[0], bb[2]-1, pink, ','.join(map(str,alphas)), *im.getpixel((cx,cy))[:3])
`;
  const [w, h, top, bottom, left, right, pink, alphas, r, g, b] =
    execFileSync('python3', ['-c', code, file], { encoding: 'utf8' }).trim().split(/[\s]+/);
  return { w: +w, h: +h, top: +top, bottom: +bottom, left: +left, right: +right, pink: +pink, alphas, rgb: [+r, +g, +b] };
}
function expectedColor(i) { return [20 + (i * 17) % 200, 110 + (i * 5) % 60, 40 + (i * 29) % 160]; }
const close = (a, b, tol = 40) => a.every((v, k) => Math.abs(v - b[k]) <= tol);
const frame = (out, id, clip, dir, n) => join(out, 'art/characters', id, clip, dir, `frame-${String(n).padStart(2, '0')}.png`);

test('walk sheet: 6 cells, order, 48x48, feet at y=39, centered, no magenta', { skip }, () => {
  const out = join(tmp, 'walk'); mkdirSync(out);
  const s = sheet('nico-walk-east.png', 48, 48, '6');
  const r = run(['--kind', 'walk', '--id', 'nico', '--direction', 'east', '--out-root', out, s]);
  assert.match(r.stdout, /scale/i);
  for (let i = 0; i < 6; i++) {
    const f = frame(out, 'nico', 'walk', 'east', i);
    assert.ok(existsSync(f), `missing ${f}`);
    const m = inspect(f);
    assert.deepEqual([m.w, m.h], [48, 48]);
    assert.equal(m.bottom, 39, `frame ${i} feet`);
    assert.ok(Math.abs((m.left + m.right + 1) / 2 - 24) <= 0.5, `frame ${i} centre ${m.left}..${m.right}`);
    assert.equal(m.pink, 0);
    assert.equal(m.alphas, '0,255');
    assert.ok(close(m.rgb, expectedColor(i)), `frame ${i} colour ${m.rgb}`);
  }
  assert.ok(!existsSync(frame(out, 'nico', 'walk', 'east', 6)));
});

test('desk-north sheet: rows 6/4/6/4 land in coding/blocked/done/idle', { skip }, () => {
  const out = join(tmp, 'desk'); mkdirSync(out);
  const s = sheet('nico-desk-north.png', 48, 48, '6,4,6,4');
  run(['--kind', 'desk-north', '--id', 'nico', '--out-root', out, s]);
  const counts = { coding: 6, blocked: 4, done: 6, idle: 4 };
  let i = 0;
  for (const [clip, n] of Object.entries(counts)) {
    const dir = join(out, 'art/characters/nico', clip, 'north');
    assert.equal(readdirSync(dir).length, n, clip);
    for (let k = 0; k < n; k++, i++) {
      const m = inspect(frame(out, 'nico', clip, 'north', k));
      assert.equal(m.bottom, 39);
      assert.ok(close(m.rgb, expectedColor(i)), `${clip}/${k} order`);
    }
  }
});

test('turnaround and coffee map to the existing clip/direction names', { skip }, () => {
  const out = join(tmp, 'ta'); mkdirSync(out);
  run(['--kind', 'turnaround', '--id', 'nico', '--out-root', out, sheet('nico-turnaround.png', 48, 48, '4')]);
  for (const [k, d] of ['north', 'east', 'south', 'west'].entries()) {
    const m = inspect(frame(out, 'nico', 'stand-idle', d, 0));
    assert.equal(m.bottom, 39);
    assert.ok(close(m.rgb, expectedColor(k)), d);
  }
  run(['--kind', 'coffee', '--id', 'nico', '--out-root', out, sheet('nico-coffee.png', 48, 48, '6,6')]);
  assert.equal(readdirSync(join(out, 'art/characters/nico/coffee-sip-seated/north')).length, 6);
  assert.equal(readdirSync(join(out, 'art/characters/nico/coffee-sip-standing/south')).length, 6);
});

test('works at a non-3x, non-integer-looking scale', { skip }, () => {
  const out = join(tmp, 'scale4'); mkdirSync(out);
  const r = run(['--kind', 'walk', '--id', 'nico', '--direction', 'north', '--out-root', out,
    sheet('nico-walk-north-4x.png', 48, 48, '6', 4)]);
  assert.match(r.stdout, /scale[a-z ]*~4\.00/i);
  const m = inspect(frame(out, 'nico', 'walk', 'north', 3));
  assert.equal(m.bottom, 39);
});

test('portraits are 32x32 named by expression; tiles are 16x16', { skip }, () => {
  const out = join(tmp, 'pt'); mkdirSync(out);
  run(['--kind', 'portraits', '--id', 'nico', '--out-root', out, sheet('nico-portraits.png', 32, 32, '4', 3, 'fill')]);
  for (const e of ['neutral', 'focused', 'alert', 'happy']) {
    const m = inspect(join(out, 'art/characters/nico/portraits', `${e}.png`));
    assert.deepEqual([m.w, m.h], [32, 32]);
    assert.equal(m.pink, 0);
  }
  run(['--kind', 'tiles', '--preset', 'botanical', '--out-root', out, sheet('tiles-botanical.png', 16, 16, '4,4,4,4', 3, 'fill')]);
  const dir = join(out, 'art/import/botanical/tiles');
  assert.equal(readdirSync(dir).length, 16);
  assert.deepEqual(inspect(join(dir, 'tile-15.png')).w, 16);
});

test('props: each object to its own trimmed PNG, unnamed', { skip }, () => {
  const out = join(tmp, 'props'); mkdirSync(out);
  run(['--kind', 'props', '--preset', 'nordic-day', '--out-root', out, sheet('props-nordic-day.png', 32, 32, '3,2', 3, 'fill')]);
  const dir = join(out, 'art/import/props-nordic-day');
  assert.deepEqual(readdirSync(dir).sort(), ['00.png', '01.png', '02.png', '03.png', '04.png']);
});

test('dry-run writes nothing; existing frames need --force', { skip }, () => {
  const out = join(tmp, 'ow'); mkdirSync(out);
  const s = sheet('nico-walk-west.png', 48, 48, '6');
  const base = ['--kind', 'walk', '--id', 'nico', '--direction', 'west', '--out-root', out];
  const dry = run([...base, '--dry-run', s]);
  assert.match(dry.stdout, /would write/i);
  assert.ok(!existsSync(join(out, 'art')));
  run([...base, s]);
  const again = run([...base, s], true);
  assert.notEqual(again.status, 0);
  assert.match(again.stderr, /--force/);
  run([...base, '--force', s]);
});

test('wrong cell count is an error and writes nothing', { skip }, () => {
  const out = join(tmp, 'bad'); mkdirSync(out);
  const r = run(['--kind', 'walk', '--id', 'nico', '--direction', 'south', '--out-root', out,
    sheet('nico-walk-five.png', 48, 48, '5')], true);
  assert.notEqual(r.status, 0);
  assert.ok(!existsSync(join(out, 'art')));
});

// Real generated sheets (2026-11-11 batch) draw figures much taller than the cell pitch the
// prompt asked for, carry extra or misplaced cells, and leave a dark-pink fringe.

test('tall figures packed closely: scale comes from body height, not cell pitch', { skip }, () => {
  const out = join(tmp, 'tall'); mkdirSync(out);
  const s = sheet('lia-walk-south.png', 40, 90, '6', 3, 'character', 72);
  const r = run(['--kind', 'walk', '--id', 'lia', '--out-root', out, s]);
  assert.match(r.stdout, /scale from body height/);
  for (let i = 0; i < 6; i++) {
    const m = inspect(frame(out, 'lia', 'walk', 'south', i));
    assert.equal(m.bottom, 39);
    const h = m.bottom - m.top + 1;
    assert.ok(h >= 30 && h <= 34, `frame ${i} body height ${h}`);
  }
});

test('an extra cell is an error unless --pick chooses the cells', { skip }, () => {
  const out = join(tmp, 'pick'); mkdirSync(out);
  const s = sheet('lia-walk-west.png', 48, 48, '7');
  const bad = run(['--kind', 'walk', '--id', 'lia', '--out-root', out, s], true);
  assert.notEqual(bad.status, 0, 'seven figures must not be silently merged into six');
  assert.match(bad.stderr, /--pick/);
  run(['--kind', 'walk', '--id', 'lia', '--out-root', out, '--pick', '0.0,0.1,0.2,0.4,0.5,0.6', s]);
  [0, 1, 2, 4, 5, 6].forEach((src, n) =>
    assert.ok(close(inspect(frame(out, 'lia', 'walk', 'west', n)).rgb, expectedColor(src)), `frame ${n} should be source ${src}`));
});

test('--pick reorders cells across rows and rejects the wrong count', { skip }, () => {
  const out = join(tmp, 'pick-portraits'); mkdirSync(out);
  const s = sheet('tom-portraits.png', 32, 32, '8,8,8,8', 4, 'fill');
  run(['--kind', 'portraits', '--id', 'tom', '--out-root', out, '--pick', '2.0,0.3,1.5,3.7', s]);
  const names = ['neutral', 'focused', 'alert', 'happy'];
  [16, 3, 13, 31].forEach((src, n) => {
    const p = join(out, 'art/characters/tom/portraits', `${names[n]}.png`);
    assert.ok(close(inspect(p).rgb, expectedColor(src)), `${names[n]} should be source cell ${src}`);
  });
  const bad = run(['--kind', 'portraits', '--id', 'tom', '--out-root', join(tmp, 'x'), '--pick', '0.0,0.1', s], true);
  assert.notEqual(bad.status, 0);
});

test('dark-red fringe around sprites is removed, lilac clothing is kept', { skip }, () => {
  const out = join(tmp, 'halo'); mkdirSync(out);
  const s = sheet('tom-walk-east.png', 48, 48, '6', 3, 'character', 0, 'halo');
  run(['--kind', 'walk', '--id', 'tom', '--out-root', out, s]);
  const fringe = Number(execFileSync('python3', ['-c', `
import sys, glob
from PIL import Image
n = 0
for f in glob.glob(sys.argv[1] + '/**/*.png', recursive=True):
    for r, g, b, a in Image.open(f).convert('RGBA').getdata():
        if a and r > 90 and g < 60 and r > 2.5 * g: n += 1
print(n)`, out], { encoding: 'utf8' }));
  assert.equal(fringe, 0);
  // Tom's lilac sleeves (154,139,180) are a real colour and must survive.
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
im = Image.new('RGB', (200, 120), (255, 0, 255)); d = ImageDraw.Draw(im)
for i in range(6): d.rectangle((10 + i * 30, 20, 30 + i * 30, 100), fill=(154, 139, 180))
im.save(sys.argv[1])`, join(tmp, 'tom-walk-north.png')]);
  run(['--kind', 'walk', '--id', 'tom', '--out-root', out, '--scale', '2.5', join(tmp, 'tom-walk-north.png')]);
  const kept = execFileSync('python3', ['-c', `
import sys
from PIL import Image
print(sum(1 for r, g, b, a in Image.open(sys.argv[1]).convert('RGBA').getdata() if a and (r, g, b) == (154, 139, 180)))`,
    frame(out, 'tom', 'walk', 'north', 0)], { encoding: 'utf8' });
  assert.ok(Number(kept) > 50, `lilac pixels kept: ${kept}`);
});

test('--char-root stages characters outside art/characters', { skip }, () => {
  const out = join(tmp, 'staged'); mkdirSync(out);
  const s = sheet('maya-walk-north.png', 48, 48, '6');
  run(['--kind', 'walk', '--id', 'maya', '--out-root', out, '--char-root', 'art/import/characters', s]);
  assert.ok(existsSync(join(out, 'art/import/characters/maya/walk/north/frame-00.png')));
  assert.ok(!existsSync(join(out, 'art/characters')));
});

test('--scale-row takes the scale from one row so a shorter seated row keeps its proportion', { skip }, () => {
  const out = join(tmp, 'scale-row'); mkdirSync(out);
  const s = sheet('tom-coffee.png', 48, 120, '6,6', 3, 'character', '60/96');
  run(['--kind', 'coffee', '--id', 'tom', '--out-root', out, '--scale-row', '1', s]);
  const height = (clip, dir) => { const m = inspect(frame(out, 'tom', clip, dir, 0)); return m.bottom - m.top + 1; };
  const standing = height('coffee-sip-standing', 'south');
  const seated = height('coffee-sip-seated', 'north');
  assert.ok(standing >= 31 && standing <= 34, `standing ${standing}`);
  assert.ok(seated >= 19 && seated <= 23, `seated ${seated} should stay ~60/96 of standing`);
});
