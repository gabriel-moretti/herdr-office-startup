// SPDX-License-Identifier: Apache-2.0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const script = join(root, 'scripts/assets/build_runtime.py');

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'ous-rt-'));
  const py = `
import sys
from PIL import Image
d=sys.argv[1]
import os
def mk(path,n):
    os.makedirs(path,exist_ok=True)
    for i in range(n):
        im=Image.new('RGBA',(48,48),(0,0,0,0))
        for x in range(10+i,20+i):
            for y in range(20,40): im.putpixel((x,y),(200,50*i%255,90,255))
        im.save(f'{path}/frame-{i:02}.png')
mk(d+'/src/zed/coding/north',6)
mk(d+'/src/zed/coffee-sip-seated/north',6)
mk(d+'/src/zed/stand-idle/south',1)
os.makedirs(d+'/src/zed/portraits',exist_ok=True)
Image.new('RGBA',(32,32),(1,2,3,255)).save(d+'/src/zed/portraits/neutral.png')
`;
  execFileSync('python3', ['-c', py, dir]);
  return dir;
}
const run = (dir, ...extra) =>
  spawnSync('python3', [script, 'zed', '--from', join(dir, 'src'), '--out', join(dir, 'out'), ...extra], { encoding: 'utf8' });

test('builds manifest, whole-frame webp, gif, still, portraits per spec timing', () => {
  const dir = fixture();
  try {
    const r = run(dir);
    assert.equal(r.status, 0, r.stderr);
    const out = join(dir, 'out/zed');
    const m = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));
    assert.equal(m.characterId, 'zed');
    assert.equal(m.productionApproved, false);
    assert.equal(m.license, 'CC-BY-4.0');
    const by = (id) => m.clips.find((c) => c.id === id);
    assert.deepEqual(by('coding').durationsMs, Array(6).fill(125));
    assert.equal(by('coding').sourceState, 'working');
    assert.equal(by('coding').playback, 'loop');
    assert.equal(by('coffee-sip-seated').playback, 'once');
    assert.equal(by('coffee-sip-seated').loop, false);
    assert.equal(by('stand-idle').frameCount, 1);
    assert.equal(by('stand-idle').webp, undefined);
    for (const f of ['north-coding.webp', 'north-coding.gif', 'north-coding-still.png',
      'north-coffee-sip-seated.webp', 'south-stand-idle-still.png', 'portraits/neutral.png']) {
      assert.ok(existsSync(join(out, f)), f);
    }
    assert.ok(!existsSync(join(out, 'south-stand-idle.webp')));
    assert.equal(m.clips.length, 3);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('idempotent; --check passes, then detects drift without writing', () => {
  const dir = fixture();
  try {
    assert.equal(run(dir).status, 0);
    assert.equal(run(dir).status, 0);
    assert.equal(run(dir, '--check').status, 0);
    const p = join(dir, 'out/zed/north-coding.gif');
    writeFileSync(p, 'x');
    const r = run(dir, '--check');
    assert.equal(r.status, 1);
    assert.match(r.stdout, /differs: zed\/north-coding\.gif/);
    assert.equal(readFileSync(p, 'utf8'), 'x');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
