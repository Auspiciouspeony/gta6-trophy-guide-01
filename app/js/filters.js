// Filtering rules: kind chips, grade, search text and spoiler hiding.
// Kept apart from rendering so the checklist, planner and missables
// views all filter the same way.

// Spoiler mode hides a story trophy until it is earned.
export function spoilerHides(state, trophy) {
  return state.settings.spoiler && trophy.kind === 'story' && !state.earned.includes(trophy.id);
}

// How much the missable flag means. The published guides confirm only
// one trophy as truly missable (Positive Mental Attitude, first
// meditation in Chapter 1). The story trophies are flagged because they
// belong to chapters and missions, not because they can be skipped.
export function riskLevel(trophy) {
  if (trophy.risk === 'confirmed-missable') return 'confirmed';
  if (trophy.missable) return 'story';
  return 'open';
}

export function applyFilters(state, trophies, opts) {
  const needle = (opts.query || '').trim().toLowerCase();
  const kind = opts.kind || 'all';
  const grade = opts.grade || 'all';
  return trophies.filter((trophy) => {
    if (kind === 'missable' && !trophy.missable) return false;
    if (kind === 'online') return false;
    if (kind !== 'all' && kind !== 'missable' && trophy.kind !== kind) return false;
    if (grade !== 'all' && trophy.grade !== grade) return false;
    if (state.settings.hideEarned && state.earned.includes(trophy.id)) return false;
    if (needle) {
      const haystack = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide + ' ' + (trophy.steps || []).join(' ')).toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function upcomingTrophies(state, trophies, count) {
  const open = trophies.filter((trophy) => !state.earned.includes(trophy.id));
  open.sort((a, b) => {
    if (a.stage !== b.stage) return a.stage - b.stage;
    return parseFloat(b.rarity) - parseFloat(a.rarity);
  });
  return open.slice(0, count);
}

export function reasonToDoNow(trophy) {
  if (trophy.risk === 'confirmed-missable') return 'CONFIRMED MISSABLE — the Chapter 1 meditation passes by; do it now.';
  if (trophy.missable) return 'Story-locked — do it while the story is open, before it passes.';
  if (trophy.stage === 1) return 'Story beat — it comes next in the campaign order.';
  if (trophy.stage === 2) return 'Stranger strand — finish it now so it is not left for cleanup.';
  if (trophy.kind === 'collectibles') return 'Collectible — grab it while you are in that area anyway.';
  if (trophy.target) return 'Counter trophy — start it early and let the total build up.';
  return 'Quick win — a single action, no grind attached.';
}
