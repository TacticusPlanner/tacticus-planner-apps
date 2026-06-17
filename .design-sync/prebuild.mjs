#!/usr/bin/env node
// Deterministic pre-build for design-sync (run from repo root, AFTER
// `pnpm -F @workspace/ui build`):
//   node .design-sync/prebuild.mjs
//
// The @workspace/ui package has no barrel entry and ships Tailwind v4 source,
// neither of which the converter consumes directly. This script produces both:
//   1. packages/ui/dist/index.es.js  — value barrel (the converter's --entry)
//   2. packages/ui/index.d.ts        — type barrel (the .d.ts entry, at pkg root)
//   3. packages/ui/dist/_ds_styles.css (cfg.cssEntry) — compiled Tailwind, with
//      the referenced @fontsource woff2 copied to packages/ui/dist/files/ so the
//      @font-face url(./files/*) refs resolve for the converter's font copy.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST_C = join(ROOT, 'packages/ui/dist/components');

// ── barrels ────────────────────────────────────────────────────────────────
const files = readdirSync(DIST_C).filter((f) => f.endsWith('.d.ts') && !f.endsWith('.d.ts.map'));
writeFileSync(
  join(ROOT, 'packages/ui/dist/index.es.js'),
  files.map((f) => `export * from './components/${f.replace(/\.d\.ts$/, '.js')}';`).join('\n') + '\n',
);
writeFileSync(
  join(ROOT, 'packages/ui/index.d.ts'),
  files.map((f) => `export * from './dist/components/${f.replace(/\.d\.ts$/, '')}';`).join('\n') + '\n',
);
console.error(`» barrels: ${files.length} component modules`);

// ── Tailwind CSS + fonts ─────────────────────────────────────────────────────
const IN = join(ROOT, 'packages/ui/src/styles/globals.css');
const OUT = join(ROOT, 'packages/ui/dist/_ds_styles.css');
const CLI = join(ROOT, '.ds-sync/node_modules/@tailwindcss/cli/dist/index.mjs');
execFileSync(process.execPath, [CLI, '-i', IN, '-o', OUT], { stdio: 'inherit' });

const FONT_PKGS = ['inter', 'dm-sans', 'raleway'].map((f) =>
  join(ROOT, 'packages/ui/node_modules/@fontsource-variable', f, 'files'));
const FILES_OUT = join(ROOT, 'packages/ui/dist/files');
const css = readFileSync(OUT, 'utf8');
const wanted = [...new Set([...css.matchAll(/url\(\.\/files\/([^)'"?#]+\.woff2)\)/g)].map((m) => m[1]))];
mkdirSync(FILES_OUT, { recursive: true });
let copied = 0, missing = [];
for (const name of wanted) {
  const dir = FONT_PKGS.find((d) => existsSync(join(d, name)));
  if (!dir) { missing.push(name); continue; }
  cpSync(join(dir, name), join(FILES_OUT, name));
  copied++;
}
console.error(`» css + fonts: ${copied}/${wanted.length} woff2 → packages/ui/dist/files/`);
if (missing.length) { console.error('  ! missing woff2:', missing.join(', ')); process.exit(1); }
