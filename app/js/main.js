// Boot, hash routing (#/checklist, #/roadmap, #/missables, #/planner,
// #/settings, #/audit) and wiring for every control. The app works
// offline; the only fetch at run time is the local trophy data file.
import { fetchTrophyList, fetchAuditBlock, KIND_FILTERS } from './data.js';
import { readState, writeState, flipEarned, setCounterAmount, saveNote, downloadProgress, loadProgressText, hasEarned, seedDemo, wipeProgress } from './store.js';
import { renderChecklist, renderRoadmap, renderMissables, renderPlanner, renderSettings, renderAudit } from './views.js';

const VIEWS = ['checklist', 'roadmap', 'missables', 'planner', 'settings', 'audit'];

let trophies = [];
let audit = null;
let state = readState();
let pickedId = 2;
let activeKind = 'all';
let searchText = '';
let activeGrade = 'all';

const viewRoot = document.getElementById('view');

function pickView() {
  const hash = location.hash.replace(/^#\/?/, '');
  const params = new URLSearchParams(location.search);
  const shot = params.get('view') || params.get('shot');
  if (shot && VIEWS.includes(shot)) return shot;
  return VIEWS.includes(hash) ? hash : 'checklist';
}

function paintHeader() {
  const earned = state.earned.length;
  document.getElementById('progressText').textContent = earned + ' / ' + trophies.length + ' earned';
  document.getElementById('progressBar').style.width = (trophies.length ? Math.round((earned / trophies.length) * 100) : 0) + '%';
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const total = trophies.filter((trophy) => trophy.grade === grade).length;
    const got = trophies.filter((trophy) => trophy.grade === grade && hasEarned(state, trophy.id)).length;
    return '<b>' + got + '/' + total + '</b> ' + grade;
  }).join(' · ');
  document.getElementById('gradeCounts').innerHTML = counts;
  document.getElementById('spoilerToggle').checked = state.settings.spoiler;
  document.getElementById('hideEarnedToggle').checked = state.settings.hideEarned;
  document.getElementById('themeToggle').textContent = state.settings.theme === 'dark' ? 'Day theme' : 'Night theme';
  document.getElementById('gradeFilter').value = activeGrade;
  document.getElementById('search').value = searchText;
  document.documentElement.setAttribute('data-theme', state.settings.theme);
  document.querySelectorAll('#tabs a').forEach((link) => {
    link.classList.toggle('active', link.dataset.view === pickView());
  });
  document.querySelectorAll('#kindChips .chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.kind === activeKind);
  });
  document.getElementById('toolbar').style.display = pickView() === 'checklist' ? '' : 'none';
}

function paint() {
  paintHeader();
  const view = pickView();
  if (view === 'roadmap') viewRoot.innerHTML = renderRoadmap(state, trophies);
  else if (view === 'missables') viewRoot.innerHTML = renderMissables(state, trophies);
  else if (view === 'planner') viewRoot.innerHTML = renderPlanner(state, trophies);
  else if (view === 'settings') viewRoot.innerHTML = renderSettings(state, trophies);
  else if (view === 'audit') viewRoot.innerHTML = renderAudit(state, trophies, audit);
  else viewRoot.innerHTML = renderChecklist(state, trophies, { kind: activeKind, query: searchText, grade: activeGrade }, pickedId);
  wireView();
}

function wireView() {
  viewRoot.querySelectorAll('[data-earned]').forEach((box) => {
    box.addEventListener('click', (event) => {
      event.stopPropagation();
      flipEarned(state, Number(box.dataset.earned));
      paint();
    });
  });
  viewRoot.querySelectorAll('[data-open]').forEach((row) => {
    row.addEventListener('click', (event) => {
      if (event.target.closest('[data-counter]') || event.target.closest('[data-earned]') || event.target.closest('textarea')) return;
      pickedId = Number(row.dataset.open);
      paint();
    });
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        pickedId = Number(row.dataset.open);
        paint();
      }
    });
  });
  viewRoot.querySelectorAll('[data-counter]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const trophy = trophies.find((t) => t.id === Number(button.dataset.id));
      if (!trophy) return;
      const now = state.counters[trophy.id] || 0;
      setCounterAmount(state, trophy, now + Number(button.dataset.counter));
      paint();
    });
  });
  viewRoot.querySelectorAll('[data-note]').forEach((area) => {
    area.addEventListener('change', () => {
      saveNote(state, Number(area.dataset.note), area.value);
    });
  });
  // Detail pane: mark earned without hunting for the checkbox, and step
  // to the next guide in trophy order.
  viewRoot.querySelectorAll('[data-earned-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      flipEarned(state, Number(button.dataset.earnedToggle));
      paint();
    });
  });
  viewRoot.querySelectorAll('[data-next-guide]').forEach((button) => {
    button.addEventListener('click', () => {
      pickedId = Number(button.dataset.nextGuide);
      paint();
    });
  });
  const clearBtn = viewRoot.querySelector('[data-clear-filters]');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    activeKind = 'all';
    activeGrade = 'all';
    searchText = '';
    paint();
  });
  const settingsExport = document.getElementById('settingsExport');
  if (settingsExport) settingsExport.addEventListener('click', () => downloadProgress(state));
  const settingsReset = document.getElementById('settingsReset');
  if (settingsReset) settingsReset.addEventListener('click', () => {
    if (!confirm('Reset all earned ticks, counters and notes? Settings are kept.')) return;
    state = wipeProgress(state);
    paint();
  });
  const settingsSpoiler = document.getElementById('settingsSpoiler');
  if (settingsSpoiler) settingsSpoiler.addEventListener('change', () => {
    state.settings.spoiler = settingsSpoiler.checked;
    writeState(state);
    paint();
  });
  const settingsHide = document.getElementById('settingsHideEarned');
  if (settingsHide) settingsHide.addEventListener('change', () => {
    state.settings.hideEarned = settingsHide.checked;
    writeState(state);
    paint();
  });
  const settingsTheme = document.getElementById('settingsTheme');
  if (settingsTheme) settingsTheme.addEventListener('change', () => {
    state.settings.theme = settingsTheme.checked ? 'dark' : 'light';
    writeState(state);
    paint();
  });
}

function wireControls() {
  const chips = document.getElementById('kindChips');
  chips.innerHTML = KIND_FILTERS.map((entry) => '<button type="button" class="chip" data-kind="' + entry.key + '">' + entry.label + '</button>').join('');
  chips.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      activeKind = chip.dataset.kind;
      if (pickView() !== 'checklist') location.hash = '#/checklist';
      paint();
    });
  });
  document.getElementById('search').addEventListener('input', (event) => {
    searchText = event.target.value;
    paint();
  });
  document.getElementById('gradeFilter').addEventListener('change', (event) => {
    activeGrade = event.target.value;
    paint();
  });
  document.getElementById('spoilerToggle').addEventListener('change', (event) => {
    state.settings.spoiler = event.target.checked;
    writeState(state);
    paint();
  });
  document.getElementById('hideEarnedToggle').addEventListener('change', (event) => {
    state.settings.hideEarned = event.target.checked;
    writeState(state);
    paint();
  });
  document.getElementById('themeToggle').addEventListener('click', () => {
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    writeState(state);
    paint();
  });
  document.getElementById('exportBtn').addEventListener('click', () => downloadProgress(state));
  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      state = loadProgressText(await file.text());
      paint();
    } catch (error) {
      alert(error.message);
    }
    event.target.value = '';
  });
  window.addEventListener('hashchange', paint);
}

fetchTrophyList().then((list) => {
  trophies = list;
  state = seedDemo(state, trophies);
  // Deep-link one trophy for screenshots and sharing: ?trophy=28 opens
  // it in the guide pane (spoiler mode still hides un-earned story ones).
  const wanted = Number(new URLSearchParams(location.search).get('trophy') || '');
  if (Number.isInteger(wanted) && trophies.some((trophy) => trophy.id === wanted)) pickedId = wanted;
  return fetchAuditBlock().then((block) => { audit = block; }).catch(() => { audit = null; });
}).then(() => {
  wireControls();
  paint();
}).catch((error) => {
  viewRoot.innerHTML = '<div class="empty">Could not load the trophy list: ' + error.message + '</div>';
});
