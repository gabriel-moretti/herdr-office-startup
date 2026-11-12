// SPDX-License-Identifier: Apache-2.0
// Herdr drops the partial (sub-rectangle / blended) parts of animated WebP
// frames, so every frame must be a full-canvas, non-blended keyframe.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const charsDir = join(root, 'assets', 'characters');

function hasWebpmux() {
  try {
    execFileSync('webpmux', ['-help'], { stdio: 'ignore' });
    return true;
  } catch (e) {
    return e.code !== 'ENOENT'; // non-zero exit from -help still means it is installed
  }
}

const available = hasWebpmux();
const skip = available ? false : 'webpmux not on PATH (install libwebp); skipping WebP frame check';

function webpFiles() {
  if (!existsSync(charsDir)) return [];
  const out = [];
  for (const id of readdirSync(charsDir, { withFileTypes: true })) {
    if (!id.isDirectory()) continue;
    for (const f of readdirSync(join(charsDir, id.name))) {
      if (f.endsWith('.webp')) out.push(join(charsDir, id.name, f));
    }
  }
  return out.sort();
}

function parse(file) {
  const text = execFileSync('webpmux', ['-info', file], { encoding: 'utf8' });
  const canvas = /Canvas size: (\d+) x (\d+)/.exec(text);
  assert.ok(canvas, `no canvas size in webpmux output for ${file}`);
  const frames = [];
  for (const line of text.split('\n')) {
    const m = /^\s*(\d+):\s+(\d+)\s+(\d+)\s+(\w+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\w+)\s+(\w+)/.exec(line);
    if (m) frames.push({ n: +m[1], w: +m[2], h: +m[3], x: +m[5], y: +m[6], blend: m[9] });
  }
  return { cw: +canvas[1], ch: +canvas[2], frames };
}

test('character WebPs exist', { skip }, () => {
  assert.ok(webpFiles().length > 0, 'no assets/characters/*/*.webp found');
});

for (const file of webpFiles()) {
  test(`full-canvas, unblended frames: ${file.slice(root.length + 1)}`, { skip }, () => {
    const { cw, ch, frames } = parse(file);
    assert.ok(frames.length > 0, 'no frames parsed');
    for (const f of frames) {
      assert.deepEqual(
        { w: f.w, h: f.h, x: f.x, y: f.y, blend: f.blend },
        { w: cw, h: ch, x: 0, y: 0, blend: 'no' },
        `frame ${f.n} is not a full-canvas unblended keyframe`
      );
    }
  });
}
