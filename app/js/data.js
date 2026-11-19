// Loads the trophy data file and hands the list to the app.
export async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('Could not load data/trophies.json');
  const data = await response.json();
  const list = Array.isArray(data) ? data : data.trophies;
  return list.slice().sort((a, b) => a.id - b.id);
}

export function trophyById(trophies, id) {
  return trophies.find((t) => t.id === id);
}

export function rarityText(trophy) {
  return trophy.rarity + '% · ' + trophy.rarityLabel + ' (PSNProfiles, 19 Nov 2026)';
}

export const STAGES = [
  { n: 1, title: 'Play the story', intro: 'Chapters 1 to 4, the named missions and the finale. Do these in order, and do the missables when they appear — they do not come back.' },
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
