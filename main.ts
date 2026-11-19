// Platinum Road hands in the guide: this program copies app/ and
// screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library, exactly as
// the kit's starter did. My own addition, below the build: I re-read
// the dossier I just wrote and refuse to finish if it came out empty,
// so a silent write failure can never pass as a good build.
// Run it with: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// My own check: the dossier must be a real, non-empty file, or the run fails loudly.
const dossierText = readFileSync(join(out, 'dossier.json'), 'utf8');
if (dossierText.trim().length === 0) throw new Error('dossier.json came out empty');
const dossierJson = JSON.parse(dossierText);
if (!dossierJson || typeof dossierJson !== 'object') throw new Error('dossier.json is not valid JSON');
