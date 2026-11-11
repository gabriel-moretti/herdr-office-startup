// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sync, DEFAULT_DEST } from '../../scripts/build/sync_assets.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const walk = (d, base = d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name), base) : [relative(base, join(d, e.name))]);

function fresh() {
  const dest = mkdtempSync(join(tmpdir(), 'ous-sync-'));
  return { dest, opts: { dest, allowedRoot: dest }, done: () => rmSync(dest, { recursive: true, force: true }) };
}
const quiet = { log: () => {} };

test('every runtime file in the character manifest exists in the synced copy', () => {
  const t = fresh();
  try {
    sync({ ...t.opts, ...quiet });
    const m = JSON.parse(readFileSync(join(t.dest, 'characters/nico/manifest.json'), 'utf8'));
    assert.ok(m.clips.length > 0);
    for (const c of m.clips) {
      for (const f of c.frameCount > 1 ? [c.webp, c.gif, c.still] : [c.still]) {
        assert.ok(f, `clip ${c.id} missing runtime field`);
        assert.ok(existsSync(join(t.dest, 'characters/nico', f)), `${f} missing`);
      }
    }
    const env = JSON.parse(readFileSync(join(t.dest, 'environment/manifest.json'), 'utf8'));
    for (const p of env.presets) {
      for (const prop of p.props) assert.ok(existsSync(join(t.dest, 'environment', p.id, 'props', `${prop}.png`)));
      assert.equal(readdirSync(join(t.dest, 'environment', p.id, 'tiles')).length, p.tiles);
    }
  } finally { t.done(); }
});

test('every character with a manifest is synced, with its runtime files and portraits', () => {
  const t = fresh();
  try {
    sync({ ...t.opts, ...quiet });
    const ids = readdirSync(join(root, 'assets/characters'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(root, 'assets/characters', e.name, 'manifest.json')))
      .map((e) => e.name);
    assert.ok(ids.includes('nico') && ids.includes('tom') && ids.includes('lia'), ids.join());
    for (const id of ids) {
      const base = join(t.dest, 'characters', id);
      const m = JSON.parse(readFileSync(join(base, 'manifest.json'), 'utf8'));
      assert.equal(m.characterId, id);
      for (const c of m.clips) {
        for (const f of c.frameCount > 1 ? [c.webp, c.gif, c.still] : [c.still]) {
          assert.ok(f && existsSync(join(base, f)), `${id}: ${f} missing`);
        }
      }
      for (const p of m.portraits ?? []) assert.ok(existsSync(join(base, p)), `${id}: ${p} missing`);
    }
    assert.ok((JSON.parse(readFileSync(join(t.dest, 'characters/tom/manifest.json'), 'utf8')).portraits).length > 0);
  } finally { t.done(); }
});

test('no atlas, preview or doc files are copied; art LICENSE is', () => {
  const t = fresh();
  try {
    sync({ ...t.opts, ...quiet });
    const files = walk(t.dest);
    assert.ok(files.length > 0);
    for (const f of files) {
      assert.ok(!/atlas\.png$/.test(f), `atlas copied: ${f}`);
      assert.ok(!f.includes('previews'), `preview copied: ${f}`);
      assert.ok(!/(^|\/)(README\.md|STATUS\.md|validation-report\.json)$/.test(f), `doc copied: ${f}`);
    }
    assert.ok(files.includes('LICENSE'));
    assert.equal(sha(join(t.dest, 'LICENSE')), sha(join(root, 'assets/LICENSE')));
  } finally { t.done(); }
});

test('copies are byte-identical to the pipeline output', () => {
  const t = fresh();
  try {
    sync({ ...t.opts, ...quiet });
    for (const f of walk(t.dest)) assert.equal(sha(join(t.dest, f)), sha(join(root, 'assets', f)), f);
  } finally { t.done(); }
});

test('second run is idempotent', () => {
  const t = fresh();
  try {
    sync({ ...t.opts, ...quiet });
    const r = sync({ ...t.opts, ...quiet });
    assert.equal(r.copied.length, 0);
    assert.equal(r.removed.length, 0);
    assert.ok(r.unchanged > 0);
  } finally { t.done(); }
});

test('sync removes files that are no longer in the subset', () => {
  const t = fresh();
  try {
    sync({ ...t.opts, ...quiet });
    writeFileSync(join(t.dest, 'stale.txt'), 'x');
    const r = sync({ ...t.opts, ...quiet });
    assert.deepEqual(r.removed, ['stale.txt']);
    assert.ok(!existsSync(join(t.dest, 'stale.txt')));
  } finally { t.done(); }
});

test('--check detects a modified file and an extra file, and writes nothing', () => {
  const t = fresh();
  try {
    sync({ ...t.opts, ...quiet });
    assert.equal(sync({ ...t.opts, check: true, ...quiet }).ok, true);

    const victim = join(t.dest, 'characters/nico/manifest.json');
    writeFileSync(victim, '{}');
    const r1 = sync({ ...t.opts, check: true, ...quiet });
    assert.equal(r1.ok, false);
    assert.deepEqual(r1.copied, ['characters/nico/manifest.json']);
    assert.equal(readFileSync(victim, 'utf8'), '{}');

    sync({ ...t.opts, ...quiet });
    writeFileSync(join(t.dest, 'extra.bin'), 'x');
    const r2 = sync({ ...t.opts, check: true, ...quiet });
    assert.equal(r2.ok, false);
    assert.deepEqual(r2.removed, ['extra.bin']);
    assert.ok(existsSync(join(t.dest, 'extra.bin')));
  } finally { t.done(); }
});

test('refuses a destination outside the allowed root', () => {
  const t = fresh();
  try {
    assert.throws(() => sync({ dest: tmpdir(), ...quiet }), /outside/);
    assert.throws(() => sync({ dest: root, ...quiet }), /outside/);
    assert.throws(() => sync({ dest: join(t.dest, '..'), allowedRoot: t.dest, ...quiet }), /outside/);
    assert.ok(DEFAULT_DEST.endsWith(join('mods', 'office-startup-world', 'assets')));
  } finally { t.done(); }
});
