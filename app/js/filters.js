// Filtering logic: kind chips, grade, search text and spoiler hiding.
export function isHiddenBySpoiler(state, trophy) {
  return state.settings.spoiler && trophy.kind === 'story' && !state.earned.includes(trophy.id);
}

// How much a missable flag can be trusted. Only one trophy is confirmed
// missable by the published guides (Positive Mental Attitude, whose first
// meditation sits in Chapter 1); the story trophies are flagged because
// they are tied to chapters and missions, not because they can be skipped.
export function missableRisk(trophy) {
  if (trophy.risk === 'confirmed-missable') return 'confirmed-missable';
  if (trophy.missable) return 'story-locked';
  return 'none';
}

export function filterTrophies(state, trophies, opts) {
  const query = (opts.query || '').trim().toLowerCase();
  const kind = opts.kind || 'all';
  const grade = opts.grade || 'all';
  return trophies.filter((t) => {
    if (kind === 'missable' && !t.missable) return false;
    if (kind === 'online') return false;
    if (kind !== 'all' && kind !== 'missable' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (state.settings.hideEarned && state.earned.includes(t.id)) return false;
    if (query) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + (t.steps || []).join(' ')).toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function nextUpList(state, trophies, count) {
  const open = trophies.filter((t) => !state.earned.includes(t.id));
  open.sort((a, b) => {
    if (a.stage !== b.stage) return a.stage - b.stage;
    return parseFloat(b.rarity) - parseFloat(a.rarity);
  });
  return open.slice(0, count);
}

export function whyNow(trophy) {
  if (trophy.risk === 'confirmed-missable') return 'CONFIRMED MISSABLE — the Chapter 1 meditation passes by; do it now.';
  if (trophy.missable) return 'Story-locked — do it while the story is open, before it passes.';
  if (trophy.stage === 1) return 'Story beat — it comes next in the campaign order.';
  if (trophy.stage === 2) return 'Stranger strand — finish it now so it is not left for cleanup.';
  if (trophy.kind === 'collectibles') return 'Collectible — grab it while you are in that area anyway.';
  if (trophy.target) return 'Counter trophy — start it early and let the total build up.';
  return 'Quick win — a single action, no grind attached.';
}
