// Leonida Legends — hand-in program for the GTA 6 trophy guide (Node 22, stdlib only).
//
// The guide itself is the static app/ folder: index.html, style.css, app.js and
// data/trophies.json, served with app/ as the root, offline, with no build step.
// This program copies app/ and screenshots/ from beside this file into the
// output directory and writes dossier.json there — the summary the judge reads
// (the screenshots, the first load's files and bytes, and the source) — using
// the vendored make.fun library. vendor/makefun-frontend.ts stays exactly as
// the kit shipped it: the scorer rebuilds the dossier with its own copy and
// compares the two byte for byte.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The guide goes in first, then the screenshots beside it, so the output
// directory holds the whole entry: app/, screenshots/, dossier.json.
mkdirSync(outDir, { recursive: true });
cpSync(join(rootDir, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(rootDir, 'screenshots'))) {
  cpSync(join(rootDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest refuse
// an entry the scorer would refuse (more than 4 screenshots or one over 256 KiB;
// more than 993 files and directories in app/ or 48 MiB of app files — app/
// counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`Leonida Legends written to ${outDir} (app/, screenshots/, dossier.json).`);
