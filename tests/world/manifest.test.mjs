// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const modDir = join(root, 'mods', 'office-startup-world');
const INSTALLED_ID = 'office-startup-world';
const ASSET_REF = /mods\/office-startup-world\/assets\/[^"'`\s)]*/g;

/** Findings in one JS source: asset paths referenced, and forbidden path styles. */
export function scanSource(src) {
  const assets = [...src.matchAll(ASSET_REF)].map((m) => m[0]);
  const bad = [];
  if (/\/Users\/|\/home\//.test(src)) bad.push('absolute path');
  if (/["'`]~\//.test(src)) bad.push('home-relative path');
  // repo-root assets/ (not preceded by the mod path)
  if (/(?<!office-startup-world\/)(?<![\w-])["'`]?\.{0,2}\/?assets\/(characters|environment|previews)\//.test(src)) bad.push('repo-root assets/ reference');
  return { assets, bad };
}

test('scanSource flags absolute, home and repo-root paths and lists mod asset refs', () => {
  const ok = scanSource('image("mods/office-startup-world/assets/characters/nico/north-coding.webp")');
  assert.deepEqual(ok.assets, ['mods/office-startup-world/assets/characters/nico/north-coding.webp']);
  assert.deepEqual(ok.bad, []);
  assert.ok(scanSource('"/Users/x/a.png"').bad.includes('absolute path'));
  assert.ok(scanSource('"/home/x/a.png"').bad.includes('absolute path'));
  assert.ok(scanSource('"~/a.png"').bad.includes('home-relative path'));
  assert.ok(scanSource('image("assets/characters/nico/x.webp")').bad.includes('repo-root assets/ reference'));
  assert.ok(scanSource('image("../../assets/characters/nico/x.webp")').bad.includes('repo-root assets/ reference'));
});

test('world mod manifest and asset paths', () => {
  const modJson = join(modDir, 'mod.json');
  assert.ok(existsSync(modJson), 'mods/office-startup-world/mod.json missing');
  const mod = JSON.parse(readFileSync(modJson, 'utf8'));
  assert.equal(mod.place, 'none');
  assert.equal(mod.size, 360);
  assert.equal(basename(modDir), INSTALLED_ID);

  assert.ok(existsSync(join(modDir, 'main.js')), 'mods/office-startup-world/main.js missing');
  const jsFiles = readdirSync(modDir).filter((f) => f.endsWith('.js'));
  for (const f of jsFiles) {
    const { assets, bad } = scanSource(readFileSync(join(modDir, f), 'utf8'));
    assert.deepEqual(bad, [], `${f}: ${bad.join(', ')}`);
    for (const a of assets) assert.ok(existsSync(join(root, a)), `${f}: referenced asset missing: ${a}`);
  }
});

test('only the dev layout turns on the dev clock', () => {
  const dir = join(root, 'layouts');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const devOn = /"dev"\s*:\s*true/.test(readFileSync(join(dir, f), 'utf8'));
    assert.equal(devOn, f === 'office-startup-dev.json', `${f}: dev prop ${devOn ? 'set' : 'missing'}`);
  }
});
