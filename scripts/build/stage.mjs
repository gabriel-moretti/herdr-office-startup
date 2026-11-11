// SPDX-License-Identifier: Apache-2.0
// Development staging: copies project-owned mods/layouts into the Herdr app home.
// Writes only mods/office-startup-* and layouts/office-startup-*.json.
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MOD_DIR = /^office-startup-[A-Za-z0-9._-]+$/;
const LAYOUT = /^office-startup-[A-Za-z0-9._-]+\.json$/;
const ALLOWED = /^(mods\/office-startup-[A-Za-z0-9._-]+\/[^/].*|layouts\/office-startup-[A-Za-z0-9._-]+\.json)$/;

const lstatOrNull = (p) => { try { return lstatSync(p); } catch { return null; } };
const same = (a, b) => readFileSync(a).equals(readFileSync(b));

/** Source files under dir (posix-relative), refusing symlinks and skipping README.md at the folder root. */
function sourceFiles(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isSymbolicLink()) throw new Error(`source contains a symlink: ${p}`);
    if (e.isDirectory()) return sourceFiles(p, base);
    const rel = relative(base, p).split(sep).join('/');
    return rel === 'README.md' ? [] : [rel];
  });
}

function destFiles(dir, base = dir) {
  const st = lstatOrNull(dir);
  if (!st || !st.isDirectory()) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? destFiles(p, base) : [relative(base, p).split(sep).join('/')];
  });
}

/** Throw if any existing component of destRel below home is a symlink or escapes home. */
function assertSafeDest(home, rel) {
  if (!ALLOWED.test(rel) || rel.split('/').includes('..')) throw new Error(`refusing path outside project-owned prefixes: ${rel}`);
  let cur = home;
  for (const part of rel.split('/')) {
    cur = join(cur, part);
    const st = lstatOrNull(cur);
    if (!st) break;
    if (st.isSymbolicLink()) throw new Error(`refusing symlinked destination: ${cur}`);
  }
  const real = realpathSync(existsSync(join(home, rel)) ? join(home, rel) : nearestExisting(join(home, rel)));
  const realHome = realpathSync(home);
  if (!real.startsWith(realHome + sep)) throw new Error(`destination resolves outside the home: ${rel}`);
}

function nearestExisting(p) {
  let cur = p;
  while (!existsSync(cur)) cur = dirname(cur);
  return cur;
}

/**
 * @param {{repo?: string, home?: string, dryRun?: boolean, log?: (s:string)=>void}} o
 * @returns {{files: {rel:string, action:'new'|'changed'|'same'}[], extra: string[], warnings: string[]}}
 */
export function stage({ repo = REPO, home = join(homedir(), '.config', 'herdr-app'), dryRun = false, log = console.log } = {}) {
  home = resolve(home);
  if (!existsSync(home)) throw new Error(`app home does not exist: ${home}`);
  const jobs = []; // {src, rel}
  const warnings = [];
  const roots = [];

  const modsDir = join(repo, 'mods');
  for (const name of existsSync(modsDir) ? readdirSync(modsDir).sort() : []) {
    if (!MOD_DIR.test(name) || !lstatSync(join(modsDir, name)).isDirectory()) continue;
    const dir = join(modsDir, name);
    const files = sourceFiles(dir);
    roots.push(`mods/${name}`);
    const missing = ['main.js', 'mod.json'].filter((f) => !files.includes(f));
    if (missing.length) warnings.push(`warning: mods/${name} has no ${missing.join(' or ')} yet`);
    for (const f of files) jobs.push({ src: join(dir, f), rel: `mods/${name}/${f}` });
  }
  const layoutsDir = join(repo, 'layouts');
  for (const name of existsSync(layoutsDir) ? readdirSync(layoutsDir).sort() : []) {
    if (!LAYOUT.test(name)) continue;
    const src = join(layoutsDir, name);
    if (lstatSync(src).isSymbolicLink()) throw new Error(`source contains a symlink: ${src}`);
    jobs.push({ src, rel: `layouts/${name}` });
  }

  // validate everything before writing anything
  for (const j of jobs) assertSafeDest(home, j.rel);

  const files = jobs.map((j) => {
    const dst = join(home, j.rel);
    const action = !existsSync(dst) ? 'new' : same(j.src, dst) ? 'same' : 'changed';
    return { rel: j.rel, action, src: j.src };
  });
  const staged = new Set(files.map((f) => f.rel));
  const extra = roots.flatMap((r) => destFiles(join(home, r), home)).filter((f) => !staged.has(f)).sort();

  if (!dryRun) {
    for (const f of files) {
      if (f.action === 'same') continue;
      const dst = join(home, f.rel);
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(f.src, dst);
    }
  }

  log(`${dryRun ? 'dry run: would stage' : 'staged'} into ${home}`);
  for (const f of files) log(`  ${f.action.padEnd(7)} ${f.rel}`);
  for (const f of extra) log(`  extra   ${f} (present in home, not in repo; left in place)`);
  for (const w of warnings) log(w);
  const n = (a) => files.filter((f) => f.action === a).length;
  log(`${files.length} files: ${n('new')} new, ${n('changed')} changed, ${n('same')} unchanged${dryRun ? ' (nothing written)' : ''}`);
  return { files: files.map(({ rel, action }) => ({ rel, action })), extra, warnings };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const o = {};
  try {
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--dry-run') o.dryRun = true;
      else if (args[i] === '--home' && args[i + 1]) o.home = args[++i];
      else throw new Error(`unknown or incomplete argument: ${args[i]}`);
    }
    stage(o);
  } catch (e) { console.error(`stage: ${e.message}`); process.exit(2); }
}
