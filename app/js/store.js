// Progress store: earned ticks, per-trophy counters, notes and
// settings, saved to localStorage and exportable as a JSON file.
const KEY = 'platinum-road-v1';

export function freshState() {
  return {
    earned: [],
    counters: {},
    notes: {},
    settings: { spoiler: true, theme: 'light', hideEarned: false },
  };
}

export function readState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return freshState();
    const base = freshState();
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter(Number.isInteger) : base.earned,
      counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : base.counters,
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : base.notes,
      settings: { ...base.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return freshState();
  }
}

export function writeState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function hasEarned(state, id) {
  return state.earned.includes(id);
}

export function flipEarned(state, id) {
  const at = state.earned.indexOf(id);
  if (at === -1) state.earned.push(id);
  else state.earned.splice(at, 1);
  writeState(state);
}

export function counterOf(state, trophy) {
  return state.counters[trophy.id] || 0;
}

export function setCounterAmount(state, trophy, value) {
  const clamped = Math.max(0, Math.min(trophy.target || 0, value));
  state.counters[trophy.id] = clamped;
  writeState(state);
}

export function saveNote(state, id, text) {
  if (text.trim()) state.notes[id] = text;
  else delete state.notes[id];
  writeState(state);
}

export function downloadProgress(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'platinum-road-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

// Totals for the audit page's "your progress" line: earned count plus a
// per-grade breakdown, read from the same state the checklist uses.
export function progressTotals(state, trophies) {
  const byGrade = {};
  for (const trophy of trophies) {
    byGrade[trophy.grade] = byGrade[trophy.grade] || { got: 0, total: 0 };
    byGrade[trophy.grade].total += 1;
    if (state.earned.includes(trophy.id)) byGrade[trophy.grade].got += 1;
  }
  return { earned: state.earned.length, total: trophies.length, byGrade };
}

// Wipes earned ticks, counters and notes but keeps the settings, so a
// fresh playthrough starts clean without losing spoiler/theme choices.
export function wipeProgress(state) {
  state.earned = [];
  state.counters = {};
  state.notes = {};
  writeState(state);
  return state;
}

export function validExport(value) {
  if (!value || typeof value !== 'object') return false;
  if (!Array.isArray(value.earned)) return false;
  if (value.counters !== undefined && (typeof value.counters !== 'object' || value.counters === null)) return false;
  if (value.notes !== undefined && (typeof value.notes !== 'object' || value.notes === null)) return false;
  if (value.settings !== undefined && (typeof value.settings !== 'object' || value.settings === null)) return false;
  return true;
}

export function loadProgressText(text) {
  const parsed = JSON.parse(text);
  if (!validExport(parsed)) throw new Error('That file is not a Platinum Road progress export.');
  const state = freshState();
  state.earned = parsed.earned.filter(Number.isInteger);
  state.counters = parsed.counters || {};
  state.notes = parsed.notes || {};
  state.settings = { ...state.settings, ...(parsed.settings || {}) };
  writeState(state);
  return state;
}

// Screenshot helper only: seeds demo progress from the query string
// (?demo=1&earned=13&spoiler=on) before the first render. Real use is
// untouched when the params are absent.
export function seedDemo(state, trophies) {
  const params = new URLSearchParams(location.search);
  if (params.get('demo') !== '1') return state;
  const wanted = parseInt(params.get('earned') || '13', 10);
  state.earned = trophies.slice(0, wanted).map((trophy) => trophy.id);
  const partWay = { 15: 120, 17: 20, 25: 4, 28: 9, 31: 40, 35: 30, 52: 100000, 53: 45000 };
  for (const [id, value] of Object.entries(partWay)) {
    const trophy = trophies.find((t) => t.id === Number(id));
    if (trophy) state.counters[trophy.id] = Math.min(value, trophy.target || value);
  }
  if (params.get('spoiler') === 'on') state.settings.spoiler = true;
  if (params.get('spoiler') === 'off') state.settings.spoiler = false;
  writeState(state);
  return state;
}
