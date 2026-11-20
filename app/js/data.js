// Loads the trophy data file and hands the list to the app.
export async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('Could not load data/trophies.json');
  const data = await response.json();
  const list = Array.isArray(data) ? data : data.trophies;
  return list.slice().sort((a, b) => a.id - b.id);
}

// Loads the same file's audit block: how the list was verified, the
// platinum roadmap facts, the missable correction and what is not yet
// verified. The audit view renders it; the checklist never needs it.
export async function loadAudit() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('Could not load data/trophies.json');
  const data = await response.json();
  return data.audit || null;
}

// Every trophy carries the same cited sources, so the audit view reads
// them off the first trophy instead of duplicating the list here.
export function auditSources(trophies) {
  if (!trophies.length || !trophies[0].sources) return [];
  return trophies[0].sources;
}

// Platinum roadmap facts, as the published launch-day guides report
// them (PowerPyx, GTABase, accessed 20 Nov 2026). Kept beside the
// audit block so the roadmap view can show them without a fetch.
export const ROADMAP_FACTS = [
  { label: 'Difficulty', value: '4 / 10', source: 'PowerPyx' },
  { label: 'Time to platinum', value: '~200 hours', source: 'PowerPyx, GTABase' },
  { label: 'Playthroughs', value: '1', source: 'PowerPyx, GTABase' },
  { label: 'Online trophies', value: '0 — all single-player', source: 'PowerPyx, GTABase' },
  { label: 'Mission replay', value: 'None — save manually', source: 'GTABase' },
  { label: 'Cheats', value: 'Disable trophies & saving', source: 'PowerPyx, GTABase' },
  { label: 'Hardest trophy', value: 'A Long Road (100%)', source: 'PowerPyx, GTABase' },
];

export function trophyById(trophies, id) {
  return trophies.find((t) => t.id === id);
}

export function rarityText(trophy) {
  return trophy.rarity + '% · ' + trophy.rarityLabel + ' (PSNProfiles, 19 Nov 2026)';
}

export const STAGES = [
  { n: 1, title: 'Play the story', intro: 'Chapters 1 to 4, the named missions and the finale. Do these in order; only one thing in this stage can truly be missed — the Chapter 1 meditation (see Missables).' },
  { n: 2, title: 'Strangers & side missions', intro: 'The stranger strands across Leonida. Find their markers on the map and finish each chain to its last mission.' },
  { n: 3, title: 'Activities & skills', intro: 'Shooting ranges, races, stunts and odd jobs. Skill tests and grinds — chip away at them between story beats.' },
  { n: 4, title: 'Collectibles', intro: 'Cards, WAiNK spots, vehicles, garages and the app. Sweep the map clean, area by area, and tick each find off.' },
  { n: 5, title: 'Money & crime', intro: 'Shops, showrooms, marked bills and the beach. Spend and earn your way through the crime economy.' },
  { n: 6, title: 'Cleanup & 100%', intro: 'The last two: 100% completion and the platinum itself. They pop when everything else is done.' },
];

export const KINDS = [
  { key: 'all', label: 'All' },
  { key: 'story', label: 'Story' },
  { key: 'missable', label: 'Missable' },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'activities', label: 'Activities' },
  { key: 'online', label: 'Online' },
];
