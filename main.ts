// Leonida Legend — a GTA VI trophy guide entry for make.fun (Node 22, standard library only).
// The guide itself is plain static files under app/: index.html opens it in a
// browser with the network off, its trophy list and original guides live in
// app/data/trophies.json, and screenshots/ holds four real renders of the app.
// This program hands the entry in: it copies app/ and screenshots/ from beside
// this file to /output and writes /output/dossier.json with the vendored
// make.fun library, exactly as the kit's starter does. Leave
// vendor/makefun-frontend.ts unchanged — the scorer rebuilds the dossier with
// its own copy and requires the two to match byte for byte.
//
// Authored for this entry: the guide, the tracker, the roadmap and every line
// below were written in the recorded build session for gta6-trophy-guide-01.
// Serve the app locally with `node serve.ts` (or any static server rooted at
// app/) and open http://localhost:8080. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
