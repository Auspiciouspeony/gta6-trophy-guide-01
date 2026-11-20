// All rendering: checklist rows, the guide pane, roadmap, missables,
// planner, settings and the audit page. Text comes from the trophy
// data; nothing here fetches the network.
import { ROADMAP_STAGES, PLATINUM_FACTS, sharedSourceList, rarityCaption } from './data.js';
import { hasEarned, counterOf, progressTotals } from './store.js';
import { applyFilters, upcomingTrophies, reasonToDoNow, spoilerHides, riskLevel } from './filters.js';

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function gradeWord(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function shownName(state, trophy) {
  if (spoilerHides(state, trophy)) return 'Hidden story trophy — earn it to reveal';
  return trophy.name;
}

export function shownDescription(state, trophy) {
  if (spoilerHides(state, trophy)) return 'Spoiler mode is on. Earn this trophy to see its name and description.';
  return trophy.description;
}

function medalDot(trophy) {
  return '<span class="medal ' + trophy.grade + '" title="' + gradeWord(trophy.grade) + '"></span>';
}

function riskPills(trophy) {
  const risk = riskLevel(trophy);
  if (risk === 'confirmed') return '<span class="pill risk">CONFIRMED MISSABLE</span>';
  if (risk === 'story') return '<span class="pill miss">STORY-LOCKED</span>';
  return '';
}

function counterControls(state, trophy) {
  if (!trophy.target) return '';
  const value = counterOf(state, trophy);
  const unit = trophy.targetUnit ? ' ' + esc(trophy.targetUnit) : '';
  return '<div class="counter"><button type="button" data-counter="-1" data-id="' + trophy.id + '" aria-label="Decrease counter">−</button>'
    + '<span>' + value + ' / ' + trophy.target + unit + '</span>'
    + '<button type="button" data-counter="1" data-id="' + trophy.id + '" aria-label="Increase counter">+</button></div>';
}

export function checklistRow(state, trophy) {
  const earned = hasEarned(state, trophy.id);
  const hidden = spoilerHides(state, trophy);
  return '<article class="row' + (earned ? ' earned' : '') + '" data-open="' + trophy.id + '" tabindex="0">'
    + '<input type="checkbox" data-earned="' + trophy.id + '"' + (earned ? ' checked' : '') + ' aria-label="Mark ' + esc(shownName(state, trophy)) + ' earned">'
    + '<div class="body"><div class="name">' + esc(shownName(state, trophy)) + '</div>'
    + '<div class="desc">' + esc(shownDescription(state, trophy)) + '</div>'
    + '<div class="meta">' + medalDot(trophy) + '<span>' + gradeWord(trophy.grade) + '</span>'
    + '<span class="pill kind">' + esc(trophy.kind) + '</span>'
    + riskPills(trophy)
    + '<span class="rarity">' + esc(rarityCaption(trophy)) + '</span></div>'
    + (hidden ? '' : counterControls(state, trophy))
    + '</div></article>';
}

export function renderChecklist(state, trophies, opts, selectedId) {
  const list = applyFilters(state, trophies, opts);
  const filtersActive = opts.kind !== 'all' || opts.grade !== 'all' || (opts.query || '').trim() !== '';
  let html = '<p class="result-count">Showing <strong>' + list.length + '</strong> of ' + trophies.length + ' trophies'
    + (filtersActive ? ' — filters are on' : '') + '</p>';
  if (opts.kind === 'online') {
    html += '<div class="empty"><strong>No online trophies — this list has none.</strong><br>All 55 trophies are earned in single-player. Try the other kind filters instead.</div>';
  } else if (list.length === 0) {
    html += '<div class="empty"><strong>Nothing matches those filters.</strong><br>Clear the search or pick another kind to see the list again.'
      + '<br><button class="btn" type="button" data-clear-filters style="margin-top:12px">Clear search &amp; filters</button></div>';
  }
  html += '<div class="list">' + list.map((trophy) => checklistRow(state, trophy)).join('') + '</div>';
  const selected = selectedId ? trophies.find((trophy) => trophy.id === selectedId) : null;
  const nextId = selected ? nextTrophyId(trophies, selected.id) : null;
  return '<div class="split"><div>' + html + '</div>' + detailPane(state, selected, nextId) + '</div>';
}

// Next trophy in id order, wrapping to the start — the detail pane's
// "Next guide" button walks the whole list one guide at a time.
function nextTrophyId(trophies, id) {
  const sorted = trophies.slice().sort((a, b) => a.id - b.id);
  const at = sorted.findIndex((trophy) => trophy.id === id);
  if (at === -1) return null;
  return sorted[(at + 1) % sorted.length].id;
}

export function detailPane(state, trophy, nextId) {
  if (!trophy) {
    return '<aside class="detail"><p class="hint"><strong>Pick a trophy</strong> to see its guide, steps, missable note and sources.</p>'
      + '<p class="hint">Tick the box when you earn one — progress is saved in this browser, and you can export it from the buttons above.</p></aside>';
  }
  const hidden = spoilerHides(state, trophy);
  const earned = hasEarned(state, trophy.id);
  const risk = riskLevel(trophy);
  let html = '<aside class="detail"><h2>' + esc(shownName(state, trophy)) + '</h2>'
    + '<p class="quote">“' + esc(shownDescription(state, trophy)) + '”</p>'
    + '<div class="meta">' + medalDot(trophy) + '<span>' + gradeWord(trophy.grade) + '</span>'
    + '<span class="pill kind">' + esc(trophy.kind) + '</span>'
    + riskPills(trophy)
    + '<span class="rarity">' + esc(rarityCaption(trophy)) + '</span></div>'
    + '<p><strong>' + (earned ? 'Earned ✓' : 'Not earned yet') + '</strong>'
    + (trophy.target ? ' · ' + counterOf(state, trophy) + ' / ' + trophy.target + ' ' + esc(trophy.targetUnit || '') : '') + '</p>'
    + '<p><button class="btn primary" type="button" data-earned-toggle="' + trophy.id + '">' + (earned ? 'Mark as not earned' : 'Mark earned') + '</button>'
    + (nextId ? ' <button class="btn" type="button" data-next-guide="' + nextId + '">Next guide →</button>' : '') + '</p>';
  if (hidden) {
    html += '<p>Spoiler mode is on: this story trophy stays hidden until you earn it. Turn spoiler mode off in Settings, or tick the box to reveal it.</p>';
  } else {
    html += '<h3>Guide</h3><p>' + esc(trophy.guide) + '</p>';
    html += '<h3>Sources (' + trophy.sources.length + ')</h3><ul class="sources">' + trophy.sources.map((source) => {
      return source.url
        ? '<li><a href="' + esc(source.url) + '" target="_blank" rel="noopener">' + esc(source.label) + '</a></li>'
        : '<li>' + esc(source.label) + '</li>';
    }).join('') + '</ul>';
    if (trophy.verified) {
      html += '<p class="checked-line">✓ Verified: ' + esc(trophy.verified) + '</p>';
    }
    if (trophy.steps && trophy.steps.length) {
      html += '<h3>Steps (' + trophy.steps.length + ')</h3><ol>' + trophy.steps.map((step) => '<li>' + esc(step) + '</li>').join('') + '</ol>';
    }
    if (risk === 'confirmed') {
      html += '<h3>When it can be missed</h3><p><strong>This is the one trophy the published guides flag as missable.</strong> Its first meditation, in Chapter 1 at Jason\u2019s house, can be passed by — and there is no mission replay. Do it on your first pass, before leaving Chapter 1.</p>';
    } else if (risk === 'story') {
      html += '<h3>When it can be missed</h3><p>It is story-locked, not truly missable: it unlocks automatically when you finish its chapter or mission, and story missions cannot be skipped. The published guides (PowerPyx, GTABase) list it as unmissable — it is flagged here so you know it belongs to your first pass.</p>';
    } else {
      html += '<h3>When it can be missed</h3><p>It cannot be missed. It can be done any time after the story, during cleanup.</p>';
    }
  }
  html += '<h3>Your note</h3><textarea data-note="' + trophy.id + '" placeholder="Where is it? What worked?">' + esc(state.notes[trophy.id] || '') + '</textarea>'
    + '<p class="fine-print">Rarities are PSNProfiles figures at launch, 19 Nov 2026 — near 0% because the game released today, and they will rise. Launch-day guides are honest where the official description does not name a place or step.</p></aside>';
  return html;
}

export function renderRoadmap(state, trophies) {
  let html = '<section class="facts-card"><h2>Platinum Road — the facts</h2>'
    + '<div class="facts">' + PLATINUM_FACTS.map((fact) => '<div class="fact-cell"><span class="fact-key">' + esc(fact.label) + '</span><strong>' + esc(fact.value) + '</strong><span class="fact-from">per ' + esc(fact.source) + '</span></div>').join('') + '</div>'
    + '<p>Three steps, per PowerPyx and GTABase: story first (60–80 hours), then the 100% checklist (about 100 hours), then stranger strands and cleanup (10–20 hours). The 100% checklist appears after the story under Progress &gt; Stats &gt; 100% Completion — progress made during the story already counts.</p></section>';
  for (const stage of ROADMAP_STAGES) {
    const items = trophies.filter((trophy) => trophy.stage === stage.n);
    const earned = items.filter((trophy) => hasEarned(state, trophy.id)).length;
    const locked = items.filter((trophy) => trophy.missable).length;
    const confirmed = items.filter((trophy) => riskLevel(trophy) === 'confirmed').length;
    const pct = items.length ? Math.round((earned / items.length) * 100) : 0;
    html += '<section class="stage"><h2>Stage ' + stage.n + ' — ' + esc(stage.title) + '</h2>'
      + '<p>' + esc(stage.intro) + '</p>'
      + '<div class="bar"><i style="width:' + pct + '%"></i></div>'
      + '<p><strong>' + earned + ' / ' + items.length + ' earned</strong> · ' + pct + '%'
      + (locked ? ' · ' + locked + ' story-locked' + (confirmed ? ' (incl. ' + confirmed + ' confirmed missable)' : '') : '') + '</p>'
      + '<ul>' + items.map((trophy) => '<li class="' + (hasEarned(state, trophy.id) ? 'done' : '') + '">' + (hasEarned(state, trophy.id) ? '✓ ' : '') + esc(shownName(state, trophy)) + (riskLevel(trophy) === 'confirmed' ? ' · CONFIRMED MISSABLE' : '') + (riskLevel(trophy) === 'story' ? ' · STORY-LOCKED' : '') + '</li>').join('') + '</ul></section>';
  }
  return html;
}

export function renderMissables(state, trophies) {
  const items = trophies.filter((trophy) => trophy.missable);
  const earned = items.filter((trophy) => hasEarned(state, trophy.id)).length;
  const confirmed = items.filter((trophy) => riskLevel(trophy) === 'confirmed');
  let html = '<div class="callout"><strong>' + earned + ' / ' + items.length + ' story-locked trophies earned.</strong> '
    + 'Published guides (PowerPyx, GTABase, KeenGamer) report only ONE truly missable trophy — '
    + 'Positive Mental Attitude, whose first meditation sits in Chapter 1. The other '
    + (items.length - confirmed.length) + ' unlock automatically when you finish their chapter or mission and cannot be skipped; '
    + 'they are listed here so you know they belong to your first pass. There is no mission replay, so save manually at the start and end of every chapter, and keep cheats off — they disable trophies and saving.</div>';
  if (confirmed.length) {
    const trophy = confirmed[0];
    html += '<div class="callout watch"><strong>⚠ The one to watch: ' + esc(shownName(state, trophy)) + '.</strong> '
      + 'After the mission Down to Earth in Chapter 1, look for Lucia at Jason\u2019s house in the morning; when she mentions meditating, follow her to the balcony and accept. '
      + 'Complete that meditation before leaving Chapter 1. 18 spots in 10 locations, with Jason and Lucia; the last needs both characters, after Coffee Break (Chapter 2).</div>';
  }
  html += '<div class="callout order"><strong>First-pass order — work through them in this order.</strong><ol>'
    + items.map((trophy) => '<li class="' + (hasEarned(state, trophy.id) ? 'done' : '') + '">' + (hasEarned(state, trophy.id) ? '✓ ' : '') + esc(shownName(state, trophy))
      + ' — Stage ' + trophy.stage + (riskLevel(trophy) === 'confirmed' ? ' · do the Chapter 1 meditation first' : ' · unlocks with its story moment') + '</li>').join('')
    + '</ol><p>Tick each one off as its moment arrives; the list is in trophy order, which follows the story.</p></div>';
  html += '<div class="split"><div class="list">' + items.map((trophy) => checklistRow(state, trophy)).join('') + '</div>';
  html += '<aside class="detail"><h2>Why they can be missed</h2>'
    + '<p>Each trophy here names a story moment in its official description — a chapter to finish, a mission to complete, or a choice to make. Story moments pass: once the chapter closes or the mission is done, that moment is gone.</p>'
    + '<p><strong>Choice trophy:</strong> “Actions Speak Louder” (id 48) is about a choice. Save before a big decision so you can see the other outcome.</p>'
    + '<p><strong>Recovery:</strong> there is no mission replay, per GTABase — so the safe play is to earn each one on the first pass, and to save manually at every chapter boundary.</p></aside></div>';
  return html;
}

// Sources & audit: how the list was verified, the roadmap facts, every
// cited source with its access date, and what is still unverified.
export function renderAudit(state, trophies, audit) {
  const summary = progressTotals(state, trophies);
  const sources = sharedSourceList(trophies);
  const totalSteps = trophies.reduce((n, trophy) => n + (trophy.steps || []).length, 0);
  const totalSources = trophies.reduce((n, trophy) => n + (trophy.sources || []).length, 0);
  let html = '<div class="audit-head"><h2>Sources &amp; audit</h2><p>Every guide in this app names its sources, and this page shows the receipts: '
    + 'what was checked, where each fact comes from, and what is still unverified. '
    + 'Your progress: <strong>' + summary.earned + ' / ' + summary.total + ' earned</strong>. '
    + 'The guide holds <strong>' + totalSteps + ' cited steps</strong> and <strong>' + totalSources + ' source citations</strong> across all 55 trophies.</p></div>';
  if (audit) {
    html += '<section class="audit-block"><h2>How this guide was verified</h2><p>Checked ' + esc(audit.checkedAt) + '.</p><ul>'
      + audit.method.map((line) => '<li>' + esc(line) + '</li>').join('') + '</ul></section>';
    html += '<section class="audit-block"><h2>Platinum roadmap — the facts</h2><div class="facts">'
      + PLATINUM_FACTS.map((fact) => '<div class="fact-cell"><span class="fact-key">' + esc(fact.label) + '</span><strong>' + esc(fact.value) + '</strong><span class="fact-from">per ' + esc(fact.source) + '</span></div>').join('')
      + '</div><p>Hardest trophy: <strong>' + esc(audit.roadmap.hardest) + '</strong>. Story 60–80 hours, 100% checklist about 100 hours, strangers &amp; cleanup 10–20 hours.</p></section>';
    html += '<section class="audit-block"><h2>The missable correction</h2><p>' + esc(audit.missableCorrection) + '</p></section>';
    html += '<section class="audit-block"><h2>What is not yet verified</h2><ul>'
      + audit.notVerified.map((line) => '<li>' + esc(line) + '</li>').join('') + '</ul></section>';
  }
  html += '<section class="audit-block"><h2>Sources cited beside every trophy (' + sources.length + ' per trophy)</h2>'
    + '<p>Each trophy\u2019s guide lists these sources; the guide text is written for this entry in our own words — sources are cited, never copied. Accessed 20 Nov 2026 unless noted.</p><ul class="sources">'
    + sources.map((source) => '<li>' + (source.url ? '<a href="' + esc(source.url) + '" target="_blank" rel="noopener">' + esc(source.label) + '</a>' : esc(source.label)) + '</li>').join('')
    + '</ul></section>';
  return html;
}

export function renderPlanner(state, trophies) {
  const items = upcomingTrophies(state, trophies, 5);
  if (items.length === 0) {
    return '<div class="empty"><strong>Platinum done.</strong> Every trophy is earned — 55 of 55.</div>';
  }
  let html = '<p style="color:var(--muted)">Your next 5, in roadmap order — easiest first within each stage. Spoiler mode still hides un-earned story trophies.</p>';
  for (const trophy of items) {
    html += '<div class="next-card"><div class="name" style="font-weight:700;font-size:17px">' + medalDot(trophy) + ' ' + esc(shownName(state, trophy)) + '</div>'
      + '<div class="why">' + esc(reasonToDoNow(trophy)) + '</div>'
      + '<div class="meta" style="margin-top:6px;font-size:13px;color:var(--muted)">Stage ' + trophy.stage + ' · ' + gradeWord(trophy.grade) + ' · ' + esc(rarityCaption(trophy))
      + (trophy.missable ? ' · <span class="pill miss">MISSABLE</span>' : '') + '</div></div>';
  }
  return html;
}

export function renderSettings(state, trophies) {
  const earned = state.earned.length;
  return '<div class="panel"><h2>Settings</h2>'
    + '<label><input type="checkbox" id="settingsSpoiler"' + (state.settings.spoiler ? ' checked' : '') + '> Spoiler mode — hide un-earned story trophies</label>'
    + '<label><input type="checkbox" id="settingsHideEarned"' + (state.settings.hideEarned ? ' checked' : '') + '> Hide earned trophies in the checklist</label>'
    + '<label><input type="checkbox" id="settingsTheme"' + (state.settings.theme === 'dark' ? ' checked' : '') + '> Night theme</label>'
    + '<p style="color:var(--muted)">Progress: ' + earned + ' of ' + trophies.length + ' earned. Saved in this browser (localStorage). Export backs it up as a file; import restores it.</p>'
    + '<p><button class="btn primary" id="settingsExport" type="button">Export progress</button> '
    + '<button class="btn" id="settingsReset" type="button">Reset progress</button></p></div>'
    + '<div class="panel"><h2>About this guide</h2>'
    + '<p>55 trophies, 1 platinum, 2 gold, 6 silver, 46 bronze. Guides are written for this entry in our own words from the official descriptions, with 10 sources named beside each one — the official list, PSNProfiles, and the published launch-day guides (PowerPyx, GTABase, Push Square, KeenGamer, GTA Spotter, eGamers, TrueAchievements). See Sources &amp; audit for how the list was verified and what is still unverified. The game released 19 Nov 2026 — where a place or step is not pinned down by the official description, the guide says so rather than inventing it.</p>'
    + '<p>Demo helper for screenshots: open the guide with <code>?demo=1&amp;earned=13&amp;spoiler=on&amp;view=roadmap</code> to pre-seed 13 earned trophies and part-way counters before the first render. It changes nothing when the params are absent.</p></div>';
}
