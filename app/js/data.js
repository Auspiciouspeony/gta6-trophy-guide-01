// Data access for Platinum Road: fetches the single trophy file and
// exposes the roadmap facts, stage plan and kind filters the views use.
// Nothing here touches the network beyond the local data file.
const DATA_URL = 'data/trophies.json';

async function readDataFile() {
  const reply = await fetch(DATA_URL);
  if (!reply.ok) throw new Error('Could not load data/trophies.json');
  return reply.json();
}

export async function fetchTrophyList() {
  const data = await readDataFile();
  const list = Array.isArray(data) ? data : data.trophies;
  return list.slice().sort((first, second) => first.id - second.id);
}

export async function fetchAuditBlock() {
  const data = await readDataFile();
  return data.audit || null;
}

// Every trophy carries the same ten cited sources, so the audit page
// borrows the list from the first trophy instead of keeping a copy.
export function sharedSourceList(trophies) {
  if (!trophies.length || !trophies[0].sources) return [];
  return trophies[0].sources;
}

export function findTrophy(trophies, id) {
  return trophies.find((trophy) => trophy.id === id);
}

export function rarityCaption(trophy) {
  return trophy.rarity + '% · ' + trophy.rarityLabel + ' (PSNProfiles, 19 Nov 2026)';
}

// Platinum facts the way the launch-day guides report them (PowerPyx and
// GTABase, read 20 Nov 2026). The roadmap and audit pages both read them
// from here so the numbers never drift apart.
export const PLATINUM_FACTS = [
  { label: 'Difficulty', value: '4 / 10', source: 'PowerPyx' },
  { label: 'Time to platinum', value: '~200 hours', source: 'PowerPyx, GTABase' },
  { label: 'Playthroughs needed', value: '1', source: 'PowerPyx, GTABase' },
  { label: 'Online trophies', value: '0 — single-player only', source: 'PowerPyx, GTABase' },
  { label: 'Mission replay', value: 'None — save by hand', source: 'GTABase' },
  { label: 'Cheats', value: 'Switch trophies & saving off', source: 'PowerPyx, GTABase' },
  { label: 'Hardest trophy', value: 'A Long Road (100%)', source: 'PowerPyx, GTABase' },
];

export const ROADMAP_STAGES = [
  { n: 1, title: 'Play the story', intro: 'Chapters 1 to 4, the named missions and the finale, in order. Almost everything here unlocks on its own — the one thing that can genuinely slip past you is the Chapter 1 meditation (see Missables).' },
  { n: 2, title: 'Strangers & side missions', intro: 'The stranger strands scattered across Leonida. Follow their map markers and play each chain through to its final mission.' },
  { n: 3, title: 'Activities & skills', intro: 'Ranges, races, stunts and odd jobs. Skill tests and slow grinds — work through them between story beats rather than in one sitting.' },
  { n: 4, title: 'Collectibles', intro: 'Cards, WAiNK spots, vehicles, garages and the app. Clear the map area by area and tick each find off as you go.' },
  { n: 5, title: 'Money & crime', intro: 'Shops, showrooms, marked bills and the beach. Earn and spend your way through the crime economy.' },
  { n: 6, title: 'Cleanup & 100%', intro: 'The final two: full completion, then the platinum itself. Both pop once everything else is done.' },
];

export const KIND_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'story', label: 'Story' },
  { key: 'missable', label: 'Missable' },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'activities', label: 'Activities' },
  { key: 'online', label: 'Online' },
];
