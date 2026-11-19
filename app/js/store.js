// Progress store: earned set, per-trophy counters, notes and settings,
// saved to localStorage and exportable/importable as a JSON file.
const KEY = 'platinum-road-v1';

export function defaultState() {
  return {
    earned: [],
    counters: {},
    notes: {},
    settings: { spoiler: true, theme: 'light', hideEarned: false },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaultState();
    const base = defaultState();
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter(Number.isInteger) : base.earned,
      counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : base.counters,
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : base.notes,
      settings: { ...base.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function toggleEarned(state, id) {
  const i = state.earned.indexOf(id);
  if (i === -1) state.earned.push(id);
  else state.earned.splice(i, 1);
  saveState(state);
}

export function counterValue(state, trophy) {
  return state.counters[trophy.id] || 0;
}

export function setCounter(state, trophy, value) {
  const clamped = Math.max(0, Math.min(trophy.target || 0, value));
  state.counters[trophy.id] = clamped;
  saveState(state);
}

export function setNote(state, id, text) {
  if (text.trim()) state.notes[id] = text;
  else delete state.notes[id];
  saveState(state);
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'platinum-road-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function validateImported(value) {
  if (!value || typeof value !== 'object') return false;
  if (!Array.isArray(value.earned)) return false;
  if (value.counters !== undefined && (typeof value.counters !== 'object' || value.counters === null)) return false;
  if (value.notes !== undefined && (typeof value.notes !== 'object' || value.notes === null)) return false;
  if (value.settings !== undefined && (typeof value.settings !== 'object' || value.settings === null)) return false;
  return true;
}

export function importStateText(text) {
  const parsed = JSON.parse(text);
  if (!validateImported(parsed)) throw new Error('That file is not a Platinum Road progress export.');
  const state = defaultState();
  state.earned = parsed.earned.filter(Number.isInteger);
  state.counters = parsed.counters || {};
  state.notes = parsed.notes || {};
  state.settings = { ...state.settings, ...(parsed.settings || {}) };
  saveState(state);
  return state;
}

// Screenshot helper only: seeds demo progress from URL query params
// (?demo=1&earned=13&spoiler=on) before the first render. Real behaviour
// is untouched when the params are absent.
export function applyDemoParams(state, trophies) {
  const params = new URLSearchParams(location.search);
  if (params.get('demo') !== '1') return state;
  const wanted = parseInt(params.get('earned') || '13', 10);
  const seed = trophies.slice(0, wanted).map((t) => t.id);
  state.earned = seed;
  const partWay = { 15: 120, 17: 20, 25: 4, 28: 9, 31: 40, 35: 30, 52: 100000, 53: 45000 };
  for (const [id, value] of Object.entries(partWay)) {
    const trophy = trophies.find((t) => t.id === Number(id));
    if (trophy) state.counters[trophy.id] = Math.min(value, trophy.target || value);
  }
  if (params.get('spoiler') === 'on') state.settings.spoiler = true;
  if (params.get('spoiler') === 'off') state.settings.spoiler = false;
  saveState(state);
  return state;
}
