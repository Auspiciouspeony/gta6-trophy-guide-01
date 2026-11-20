// Boot, hash routing (#/checklist, #/roadmap, #/missables, #/planner,
// #/settings, #/audit) and wiring of every control. No network at run
// time beyond loading the local data file.
import { loadTrophies, loadAudit, KINDS } from './data.js';
import { loadState, saveState, toggleEarned, setCounter, setNote, exportState, importStateText, isEarned, applyDemoParams, resetProgress } from './store.js';
import { renderChecklist, renderRoadmap, renderMissables, renderPlanner, renderSettings, renderAudit } from './views.js';

let trophies = [];
let audit = null;
let state = loadState();
let selectedId = 2;
let kind = 'all';
let query = '';
let grade = 'all';

const viewEl = document.getElementById('view');

function currentView() {
  const hash = location.hash.replace(/^#\/?/, '');
  const params = new URLSearchParams(location.search);
  const shot = params.get('view') || params.get('shot');
  const name = ['checklist', 'roadmap', 'missables', 'planner', 'settings', 'audit'].includes(hash) ? hash : 'checklist';
  if (shot && ['checklist', 'roadmap', 'missables', 'planner', 'settings', 'audit'].includes(shot)) return shot;
  return name;
}

function updateHeader() {
  const earned = state.earned.length;
  document.getElementById('progressText').textContent = earned + ' / ' + trophies.length + ' earned';
  document.getElementById('progressBar').style.width = (trophies.length ? Math.round((earned / trophies.length) * 100) : 0) + '%';
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && isEarned(state, t.id)).length;
    return '<b>' + got + '/' + total + '</b> ' + g;
  }).join(' · ');
  document.getElementById('gradeCounts').innerHTML = counts;
  document.getElementById('spoilerToggle').checked = state.settings.spoiler;
  document.getElementById('hideEarnedToggle').checked = state.settings.hideEarned;
  document.getElementById('themeToggle').textContent = state.settings.theme === 'dark' ? 'Day theme' : 'Night theme';
  document.getElementById('gradeFilter').value = grade;
  document.getElementById('search').value = query;
  document.documentElement.setAttribute('data-theme', state.settings.theme);
  document.querySelectorAll('#tabs a').forEach((a) => {
    a.classList.toggle('active', a.dataset.view === currentView());
  });
  document.querySelectorAll('#kindChips .chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.kind === kind);
  });
  document.getElementById('toolbar').style.display = currentView() === 'checklist' ? '' : 'none';
}

function render() {
  updateHeader();
  const view = currentView();
  if (view === 'roadmap') viewEl.innerHTML = renderRoadmap(state, trophies);
  else if (view === 'missables') viewEl.innerHTML = renderMissables(state, trophies);
  else if (view === 'planner') viewEl.innerHTML = renderPlanner(state, trophies);
  else if (view === 'settings') viewEl.innerHTML = renderSettings(state, trophies);
  else if (view === 'audit') viewEl.innerHTML = renderAudit(state, trophies, audit);
  else viewEl.innerHTML = renderChecklist(state, trophies, { kind, query, grade }, selectedId);
  bindView();
}

function bindView() {
  viewEl.querySelectorAll('[data-earned]').forEach((box) => {
    box.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleEarned(state, Number(box.dataset.earned));
      render();
    });
  });
  viewEl.querySelectorAll('[data-open]').forEach((row) => {
    row.addEventListener('click', (event) => {
      if (event.target.closest('[data-counter]') || event.target.closest('[data-earned]') || event.target.closest('textarea')) return;
      selectedId = Number(row.dataset.open);
      render();
    });
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        selectedId = Number(row.dataset.open);
        render();
      }
    });
  });
  viewEl.querySelectorAll('[data-counter]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const trophy = trophies.find((t) => t.id === Number(btn.dataset.id));
      if (!trophy) return;
      const current = state.counters[trophy.id] || 0;
      setCounter(state, trophy, current + Number(btn.dataset.counter));
      render();
    });
  });
  viewEl.querySelectorAll('[data-note]').forEach((area) => {
    area.addEventListener('change', () => {
      setNote(state, Number(area.dataset.note), area.value);
    });
  });
  const settingsExport = document.getElementById('settingsExport');
  if (settingsExport) settingsExport.addEventListener('click', () => exportState(state));
  const settingsReset = document.getElementById('settingsReset');
  if (settingsReset) settingsReset.addEventListener('click', () => {
    if (!confirm('Reset all earned ticks, counters and notes? Settings are kept.')) return;
    state = resetProgress(state);
    render();
  });
  const settingsSpoiler = document.getElementById('settingsSpoiler');
  if (settingsSpoiler) settingsSpoiler.addEventListener('change', () => {
    state.settings.spoiler = settingsSpoiler.checked;
    saveState(state);
    render();
  });
  const settingsHide = document.getElementById('settingsHideEarned');
  if (settingsHide) settingsHide.addEventListener('change', () => {
    state.settings.hideEarned = settingsHide.checked;
    saveState(state);
    render();
  });
  const settingsTheme = document.getElementById('settingsTheme');
  if (settingsTheme) settingsTheme.addEventListener('change', () => {
    state.settings.theme = settingsTheme.checked ? 'dark' : 'light';
    saveState(state);
    render();
  });
}

function initControls() {
  const chips = document.getElementById('kindChips');
  chips.innerHTML = KINDS.map((k) => '<button type="button" class="chip" data-kind="' + k.key + '">' + k.label + '</button>').join('');
  chips.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      kind = chip.dataset.kind;
      if (currentView() !== 'checklist') location.hash = '#/checklist';
      render();
    });
  });
  document.getElementById('search').addEventListener('input', (event) => {
    query = event.target.value;
    render();
  });
  document.getElementById('gradeFilter').addEventListener('change', (event) => {
    grade = event.target.value;
    render();
  });
  document.getElementById('spoilerToggle').addEventListener('change', (event) => {
    state.settings.spoiler = event.target.checked;
    saveState(state);
    render();
  });
  document.getElementById('hideEarnedToggle').addEventListener('change', (event) => {
    state.settings.hideEarned = event.target.checked;
    saveState(state);
    render();
  });
  document.getElementById('themeToggle').addEventListener('click', () => {
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    saveState(state);
    render();
  });
  document.getElementById('exportBtn').addEventListener('click', () => exportState(state));
  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      state = importStateText(await file.text());
      render();
    } catch (error) {
      alert(error.message);
    }
    event.target.value = '';
  });
  window.addEventListener('hashchange', render);
}

loadTrophies().then((list) => {
  trophies = list;
  state = applyDemoParams(state, trophies);
  // Deep-link a trophy for screenshots and sharing: ?trophy=28 selects
  // it in the detail pane (spoiler mode still hides un-earned story ones).
  const wanted = Number(new URLSearchParams(location.search).get('trophy') || '');
  if (Number.isInteger(wanted) && trophies.some((t) => t.id === wanted)) selectedId = wanted;
  return loadAudit().then((a) => { audit = a; }).catch(() => { audit = null; });
}).then(() => {
  initControls();
  render();
}).catch((error) => {
  viewEl.innerHTML = '<div class="empty-state">Could not load the trophy list: ' + error.message + '</div>';
});
