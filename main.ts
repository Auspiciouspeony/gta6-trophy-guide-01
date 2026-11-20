// Platinum Road hands in the guide: this program copies app/ and
// screenshots/ from beside this file into the output directory and
// writes /output/dossier.json with the vendored make.fun library,
// exactly as the kit's starter did. Below the build, my own checks
// re-read what was written and refuse to finish if the guide came out
// thinner than promised, so a silent write failure can never pass as
// a good build.
// Run it with: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message) {
  throw new Error(message);
}

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// My own checks: the dossier must be real, non-empty JSON, and the
// trophy file must hold all 55 trophies, each with a non-blank guide
// and at least 9 cited sources, with exactly the 4 screenshots the
// dossier was built from — otherwise the build fails here instead of
// shipping a thinner guide than the previous round.
const dossierText = readFileSync(join(outDir, 'dossier.json'), 'utf8');
if (dossierText.trim().length === 0) fail('dossier.json came out empty');
const dossier = JSON.parse(dossierText);
if (!dossier || typeof dossier !== 'object') fail('dossier.json is not valid JSON');

const trophyData = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophyList = Array.isArray(trophyData) ? trophyData : trophyData.trophies;
if (!Array.isArray(trophyList) || trophyList.length !== 55) fail('trophies.json must hold 55 trophies');
for (const trophy of trophyList) {
  if (!trophy.guide || !String(trophy.guide).trim()) fail('trophy ' + trophy.id + ' has a blank guide');
  if (!Array.isArray(trophy.sources) || trophy.sources.length < 9) fail('trophy ' + trophy.id + ' has fewer than 9 sources');
}
const shotCount = Number(dossier?.images?.length ?? 0);
if (shotCount !== 4) fail('expected 4 screenshots, dossier holds ' + shotCount);
