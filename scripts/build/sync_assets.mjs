// SPDX-License-Identifier: Apache-2.0
// Copies the runtime subset of root assets/ into mods/office-startup-world/assets/.
// The destination is fully owned by this script: stale files are deleted.
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, copyFileSync, rmSync, realpathSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_DEST = join(REPO, 'mods', 'office-startup-world', 'assets');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

/** Resolve through symlinks for the longest existing prefix. */
function real(p) {
  let cur = resolve(p);
  const rest = [];
  while (!existsSync(cur)) { rest.unshift(cur.slice(dirname(cur).length + 1)); cur = dirname(cur); }
  return join(realpathSync(cur), ...rest);
}

function inside(child, parent) {
  const c = real(child), p = real(parent);
  return c !== p && c.startsWith(p + sep);
}

/** Map of relative path (posix, under assets/) -> absolute source file. */
export function buildPlan(repo = REPO) {
  const src = join(repo, 'assets');
  const plan = new Map();
  const add = (rel) => {
    const abs = join(src, rel);
    if (!existsSync(abs)) throw new Error(`runtime asset missing in pipeline output: ${rel}`);
    plan.set(rel, abs);
  };

  add('LICENSE');

  const charDir = 'characters/nico';
  add(`${charDir}/manifest.json`);
  const cm = readJson(join(src, charDir, 'manifest.json'));
  for (const c of cm.clips) {
    // atlas entries are intentionally skipped
    // single-frame clips ship only a still
    const files = c.frameCount > 1 ? [c.webp, c.gif, c.still] : [c.still];
    for (const f of files) {
      if (!f) throw new Error(`clip ${c.id} (${c.direction}) lacks a runtime file`);
      add(`${charDir}/${f}`);
    }
  }

  add('environment/manifest.json');
  const em = readJson(join(src, 'environment', 'manifest.json'));
  for (const p of em.presets) {
    for (const prop of p.props) add(`environment/${p.id}/props/${prop}.png`);
    const tiles = readdirSync(join(src, 'environment', p.id, 'tiles')).filter((f) => f.endsWith('.png')).sort();
    if (tiles.length !== p.tiles) throw new Error(`${p.id}: manifest says ${p.tiles} tiles, found ${tiles.length}`);
    for (const t of tiles) add(`environment/${p.id}/tiles/${t}`);
  }
  return plan;
}

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? listFiles(p, base) : [relative(base, p).split(sep).join('/')];
  });
}

function pruneEmptyDirs(dir, keepRoot) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) pruneEmptyDirs(join(dir, e.name), false);
  }
  if (!keepRoot && readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
}

/**
 * @param {{dest?: string, allowedRoot?: string, check?: boolean, repo?: string, log?: (s:string)=>void}} o
 * @returns {{ok: boolean, copied: string[], removed: string[], unchanged: number, bytes: number}}
 */
export function sync({ dest = DEFAULT_DEST, allowedRoot = DEFAULT_DEST, check = false, repo = REPO, log = console.log } = {}) {
  const d = resolve(dest);
  const root = resolve(allowedRoot);
  if (d !== root && !inside(d, root)) throw new Error(`destination ${d} is outside ${root}`);
  if (real(d) !== real(root) && !inside(d, root)) throw new Error(`destination ${d} is outside ${root}`);
  if (existsSync(d) && lstatSync(d).isSymbolicLink()) throw new Error(`destination ${d} is a symlink`);
  if (real(d) === resolve(repo) || real(d) === sep) throw new Error(`destination ${d} is outside any asset folder`);

  const plan = buildPlan(repo);
  const copied = [];
  let unchanged = 0, bytes = 0;
  for (const [rel, abs] of plan) {
    const out = join(d, rel);
    const same = existsSync(out) && lstatSync(out).isFile() && sha(out) === sha(abs);
    bytes += lstatSync(abs).size;
    if (same) { unchanged++; continue; }
    copied.push(rel);
    if (!check) { mkdirSync(dirname(out), { recursive: true }); copyFileSync(abs, out); }
  }
  const removed = listFiles(d).filter((f) => !plan.has(f)).sort();
  if (!check) {
    for (const f of removed) rmSync(join(d, f));
    if (existsSync(d)) pruneEmptyDirs(d, true);
  }
  const ok = copied.length === 0 && removed.length === 0;
  const verb = check ? 'would copy' : 'copied';
  log(`${verb} ${copied.length}, ${check ? 'would remove' : 'removed'} ${removed.length}, unchanged ${unchanged}, ${plan.size} files, ${bytes} bytes total`);
  if (check) {
    for (const f of copied) log(`  differs: ${f}`);
    for (const f of removed) log(`  extra:   ${f}`);
    log(ok ? 'assets in sync' : 'assets out of sync: run `npm run sync-assets`');
  }
  return { ok, copied, removed, unchanged, bytes };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => a !== '--check');
  if (unknown.length) { console.error(`unknown argument: ${unknown.join(' ')}`); process.exit(2); }
  try {
    const r = sync({ check: args.includes('--check') });
    process.exit(args.includes('--check') && !r.ok ? 1 : 0);
  } catch (e) { console.error(`sync_assets: ${e.message}`); process.exit(2); }
}
