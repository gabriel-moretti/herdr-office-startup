// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, lstatSync, existsSync, symlinkSync, rmSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, dirname } from 'node:path';
import { stage } from '../../scripts/build/stage.mjs';

const put = (base, rel, body) => {
  const p = join(base, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
  return p;
};
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const walk = (d, base = d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = join(d, e.name);
    return e.isDirectory() ? walk(p, base) : [relative(base, p)];
  });
const quiet = () => {};

const DECOYS = ['settings.json', 'keys.json', 'mods/other-mod/main.js', 'layouts/main.json', 'layouts/pixel-hq.json'];

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'ous-stage-'));
  const repo = join(dir, 'repo');
  const home = join(dir, 'home');
  put(repo, 'mods/office-startup-world/main.js', 'export default 1;');
  put(repo, 'mods/office-startup-world/mod.json', '{"place":"none"}');
  put(repo, 'mods/office-startup-world/README.md', 'docs');
  put(repo, 'mods/office-startup-world/assets/characters/a.png', 'png');
  put(repo, 'mods/office-startup-git/README.md', 'docs only');
  put(repo, 'mods/not-ours/main.js', 'nope');
  put(repo, 'layouts/office-startup-poc.json', '{}');
  put(repo, 'layouts/other.json', '{}');
  const old = new Date(2020, 0, 1);
  for (const d of DECOYS) { const p = put(home, d, `decoy ${d}`); utimesSync(p, old, old); }
  const snap = () => Object.fromEntries(DECOYS.map((d) => [d, [sha(join(home, d)), lstatSync(join(home, d)).mtimeMs]]));
  return { dir, repo, home, before: snap(), snap, done: () => rmSync(dir, { recursive: true, force: true }) };
}

test('stages only project-owned paths and leaves decoys untouched', () => {
  const t = setup();
  try {
    const r = stage({ repo: t.repo, home: t.home, log: quiet });
    assert.deepEqual(t.snap(), t.before);
    const all = walk(t.home).filter((f) => !DECOYS.includes(f)).sort();
    assert.deepEqual(all, [
      'layouts/office-startup-poc.json',
      'mods/office-startup-world/assets/characters/a.png',
      'mods/office-startup-world/main.js',
      'mods/office-startup-world/mod.json',
    ]);
    assert.deepEqual(r.files.map((f) => f.rel).sort(), all);
    assert.ok(r.files.every((f) => f.action === 'new'));
  } finally { t.done(); }
});

test('README.md is not staged; a mod folder without main.js/mod.json only warns', () => {
  const t = setup();
  try {
    const r = stage({ repo: t.repo, home: t.home, log: quiet });
    assert.ok(!walk(t.home).some((f) => f.endsWith('README.md')));
    assert.ok(r.warnings.some((w) => /office-startup-git/.test(w) && /main\.js/.test(w) && /mod\.json/.test(w)));
    assert.ok(!r.warnings.some((w) => /office-startup-world/.test(w)));
  } finally { t.done(); }
});

test('dry-run writes nothing and reports the same inventory', () => {
  const t = setup();
  try {
    const dry = stage({ repo: t.repo, home: t.home, dryRun: true, log: quiet });
    assert.deepEqual(walk(t.home).sort(), [...DECOYS].sort());
    assert.deepEqual(t.snap(), t.before);
    const real = stage({ repo: t.repo, home: t.home, log: quiet });
    assert.deepEqual(dry.files, real.files);
  } finally { t.done(); }
});

test('printed inventory lists every file written', () => {
  const t = setup();
  try {
    const lines = [];
    stage({ repo: t.repo, home: t.home, log: (s) => lines.push(s) });
    const out = lines.join('\n');
    for (const f of ['layouts/office-startup-poc.json', 'mods/office-startup-world/main.js', 'mods/office-startup-world/mod.json']) {
      assert.ok(out.includes(f), `inventory lacks ${f}`);
    }
  } finally { t.done(); }
});

test('restaging reports changed, same and extra files; keeps extras', () => {
  const t = setup();
  try {
    stage({ repo: t.repo, home: t.home, log: quiet });
    writeFileSync(join(t.repo, 'mods/office-startup-world/main.js'), 'export default 2;');
    put(t.home, 'mods/office-startup-world/leftover.js', 'x');
    const lines = [];
    const r = stage({ repo: t.repo, home: t.home, log: (s) => lines.push(s) });
    const by = Object.fromEntries(r.files.map((f) => [f.rel, f.action]));
    assert.equal(by['mods/office-startup-world/main.js'], 'changed');
    assert.equal(by['mods/office-startup-world/mod.json'], 'same');
    assert.deepEqual(r.extra, ['mods/office-startup-world/leftover.js']);
    assert.ok(existsSync(join(t.home, 'mods/office-startup-world/leftover.js')));
    assert.equal(readFileSync(join(t.home, 'mods/office-startup-world/main.js'), 'utf8'), 'export default 2;');
    assert.ok(lines.join('\n').includes('changed'));
  } finally { t.done(); }
});

test('refuses a symlink planted at the destination mod folder', () => {
  const t = setup();
  try {
    const target = join(t.dir, 'elsewhere');
    put(target, 'keep.txt', 'keep');
    symlinkSync(target, join(t.home, 'mods/office-startup-world'));
    assert.throws(() => stage({ repo: t.repo, home: t.home, log: quiet }), /symlink/);
    assert.deepEqual(readdirSync(target), ['keep.txt']);
    assert.deepEqual(t.snap(), t.before);
  } finally { t.done(); }
});

test('refuses a symlinked file or subfolder inside a staged mod', () => {
  const t = setup();
  try {
    stage({ repo: t.repo, home: t.home, log: quiet });
    const victim = put(t.dir, 'victim.txt', 'victim');
    rmSync(join(t.home, 'mods/office-startup-world/main.js'));
    symlinkSync(victim, join(t.home, 'mods/office-startup-world/main.js'));
    assert.throws(() => stage({ repo: t.repo, home: t.home, log: quiet }), /symlink/);
    assert.equal(readFileSync(victim, 'utf8'), 'victim');
  } finally { t.done(); }
});

test('refuses a symlinked layout file and a symlinked mods/ or layouts/ directory', () => {
  const t = setup();
  try {
    const victim = put(t.dir, 'victim2.txt', 'victim');
    symlinkSync(victim, join(t.home, 'layouts/office-startup-poc.json'));
    assert.throws(() => stage({ repo: t.repo, home: t.home, log: quiet }), /symlink/);
    assert.equal(readFileSync(victim, 'utf8'), 'victim');
    rmSync(join(t.home, 'layouts/office-startup-poc.json'));

    const outside = join(t.dir, 'outside-mods');
    mkdirSync(outside);
    rmSync(join(t.home, 'mods'), { recursive: true });
    symlinkSync(outside, join(t.home, 'mods'));
    assert.throws(() => stage({ repo: t.repo, home: t.home, log: quiet }), /symlink|outside/);
    assert.deepEqual(readdirSync(outside), []);
  } finally { t.done(); }
});

test('refuses a source folder with a symlink', () => {
  const t = setup();
  try {
    symlinkSync(join(t.dir, 'repo/layouts/other.json'), join(t.repo, 'mods/office-startup-world/link.json'));
    assert.throws(() => stage({ repo: t.repo, home: t.home, log: quiet }), /symlink/);
    assert.ok(!existsSync(join(t.home, 'layouts/office-startup-poc.json')), 'nothing written before validation');
  } finally { t.done(); }
});
