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

// My own check, round 2: the trophy file must hold all 55 trophies, each
// with a non-blank guide and at least 9 cited sources, and exactly the
// 4 screenshots the dossier was built from — otherwise the build fails
// here instead of shipping a thinner guide than round 1.
const trophyData = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophyList = Array.isArray(trophyData) ? trophyData : trophyData.trophies;
if (!Array.isArray(trophyList) || trophyList.length !== 55) throw new Error('trophies.json must hold 55 trophies');
for (const t of trophyList) {
  if (!t.guide || !String(t.guide).trim()) throw new Error('trophy ' + t.id + ' has a blank guide');
  if (!Array.isArray(t.sources) || t.sources.length < 9) throw new Error('trophy ' + t.id + ' has fewer than 9 sources');
}
const shotCount = Number(dossierJson?.images?.length ?? 0);
if (shotCount !== 4) throw new Error('expected 4 screenshots, dossier holds ' + shotCount);
