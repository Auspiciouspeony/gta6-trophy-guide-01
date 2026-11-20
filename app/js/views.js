// View rendering: checklist rows, detail pane, roadmap, missables,
// planner and settings. All text comes from the trophy data; nothing
// here fetches the network.
import { STAGES, ROADMAP_FACTS, auditSources, rarityText } from './data.js';
import { isEarned, counterValue, progressSummary } from './store.js';
import { filterTrophies, nextUpList, whyNow, isHiddenBySpoiler, missableRisk } from './filters.js';

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function displayName(state, trophy) {
  if (isHiddenBySpoiler(state, trophy)) return 'Hidden story trophy — earn it to reveal';
  return trophy.name;
}

export function displayDescription(state, trophy) {
  if (isHiddenBySpoiler(state, trophy)) return 'Spoiler mode is on. Earn this trophy to see its name and description.';
  return trophy.description;
}

function medalSwatch(trophy) {
  return '<span class="medal ' + trophy.grade + '" title="' + gradeLabel(trophy.grade) + '"></span>';
}

function counterHtml(state, trophy) {
  if (!trophy.target) return '';
  const value = counterValue(state, trophy);
  const unit = trophy.targetUnit ? ' ' + escapeHtml(trophy.targetUnit) : '';
  return '<div class="counter"><button type="button" data-counter="-1" data-id="' + trophy.id + '" aria-label="Decrease counter">−</button>'
    + '<span>' + value + ' / ' + trophy.target + unit + '</span>'
    + '<button type="button" data-counter="1" data-id="' + trophy.id + '" aria-label="Increase counter">+</button></div>';
}

export function checklistRowHtml(state, trophy) {
  const earned = isEarned(state, trophy.id);
  const hidden = isHiddenBySpoiler(state, trophy);
  const risk = missableRisk(trophy);
  return '<article class="row' + (earned ? ' earned' : '') + '" data-open="' + trophy.id + '" tabindex="0">'
    + '<input type="checkbox" data-earned="' + trophy.id + '"' + (earned ? ' checked' : '') + ' aria-label="Mark ' + escapeHtml(displayName(state, trophy)) + ' earned">'
    + '<div class="body"><div class="name">' + escapeHtml(displayName(state, trophy)) + '</div>'
    + '<div class="desc">' + escapeHtml(displayDescription(state, trophy)) + '</div>'
    + '<div class="meta">' + medalSwatch(trophy) + '<span>' + gradeLabel(trophy.grade) + '</span>'
    + '<span class="pill kind">' + escapeHtml(trophy.kind) + '</span>'
    + (risk === 'confirmed-missable' ? '<span class="pill risk">CONFIRMED MISSABLE</span>' : '')
    + (risk === 'story-locked' ? '<span class="pill miss">STORY-LOCKED</span>' : '')
    + '<span class="rarity">' + escapeHtml(rarityText(trophy)) + '</span></div>'
    + (hidden ? '' : counterHtml(state, trophy))
    + '</div></article>';
}

export function renderChecklist(state, trophies, opts, selectedId) {
  const list = filterTrophies(state, trophies, opts);
  let html = '';
  if (opts.kind === 'online') {
    html += '<div class="empty-state"><strong>No online trophies — this list has no online trophy.</strong><br>All 55 trophies are earned in single-player. Use the other kind filters instead.</div>';
  } else if (list.length === 0) {
    html += '<div class="empty-state">No trophies match these filters. Clear the search or pick another kind.</div>';
  }
  html += '<div class="list">' + list.map((t) => checklistRowHtml(state, t)).join('') + '</div>';
  const selected = selectedId ? trophies.find((t) => t.id === selectedId) : null;
  return '<div class="layout"><div>' + html + '</div>' + detailPaneHtml(state, selected) + '</div>';
}

export function detailPaneHtml(state, trophy) {
  if (!trophy) {
    return '<aside class="pane"><p class="empty"><strong>Pick a trophy</strong> to see its guide, steps, missable note and sources.</p>'
      + '<p class="empty">Tick the box when you earn one — progress is saved in this browser, and you can export it from the buttons above.</p></aside>';
  }
  const hidden = isHiddenBySpoiler(state, trophy);
  const earned = isEarned(state, trophy.id);
  const risk = missableRisk(trophy);
  let html = '<aside class="pane"><h2>' + escapeHtml(displayName(state, trophy)) + '</h2>'
    + '<p class="official">“' + escapeHtml(displayDescription(state, trophy)) + '”</p>'
    + '<div class="meta">' + medalSwatch(trophy) + '<span>' + gradeLabel(trophy.grade) + '</span>'
    + '<span class="pill kind">' + escapeHtml(trophy.kind) + '</span>'
    + (risk === 'confirmed-missable' ? '<span class="pill risk">CONFIRMED MISSABLE</span>' : '')
    + (risk === 'story-locked' ? '<span class="pill miss">STORY-LOCKED</span>' : '')
    + '<span class="rarity">' + escapeHtml(rarityText(trophy)) + '</span></div>'
    + '<p><strong>' + (earned ? 'Earned ✓' : 'Not earned yet') + '</strong>'
    + (trophy.target ? ' · ' + counterValue(state, trophy) + ' / ' + trophy.target + ' ' + escapeHtml(trophy.targetUnit || '') : '') + '</p>';
  if (hidden) {
    html += '<p>Spoiler mode is on: this story trophy stays hidden until you earn it. Turn spoiler mode off in Settings, or tick the box to reveal it.</p>';
  } else {
    html += '<h3>Guide</h3><p>' + escapeHtml(trophy.guide) + '</p>';
    html += '<h3>Sources (' + trophy.sources.length + ')</h3><ul class="sources">' + trophy.sources.map((s) => {
      return s.url
        ? '<li><a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.label) + '</a></li>'
        : '<li>' + escapeHtml(s.label) + '</li>';
    }).join('') + '</ul>';
    if (trophy.verified) {
      html += '<p class="verify">✓ Verified: ' + escapeHtml(trophy.verified) + '</p>';
    }
    if (trophy.steps && trophy.steps.length) {
      html += '<h3>Steps (' + trophy.steps.length + ')</h3><ol>' + trophy.steps.map((s) => '<li>' + escapeHtml(s) + '</li>').join('') + '</ol>';
    }
    if (risk === 'confirmed-missable') {
      html += '<h3>When it can be missed</h3><p><strong>This is the one trophy the published guides flag as missable.</strong> Its first meditation, in Chapter 1 at Jason\u2019s house, can be passed by — and there is no mission replay. Do it on your first pass, before leaving Chapter 1.</p>';
    } else if (risk === 'story-locked') {
      html += '<h3>When it can be missed</h3><p>It is story-locked, not truly missable: it unlocks automatically when you finish its chapter or mission, and story missions cannot be skipped. The published guides (PowerPyx, GTABase) list it as unmissable — it is flagged here so you know it belongs to your first pass.</p>';
    } else {
      html += '<h3>When it can be missed</h3><p>It cannot be missed. It can be done any time after the story, during cleanup.</p>';
    }
  }
  html += '<h3>Your note</h3><textarea data-note="' + trophy.id + '" placeholder="Where is it? What worked?">' + escapeHtml(state.notes[trophy.id] || '') + '</textarea>'
    + '<p class="note">Rarities are PSNProfiles figures at launch, 19 Nov 2026 — near 0% because the game released today, and they will rise. Launch-day guides are honest where the official description does not name a place or step.</p></aside>';
  return html;
}

export function renderRoadmap(state, trophies) {
  let html = '<section class="platinum-card"><h2>Platinum Road — the facts</h2>'
    + '<div class="fact-grid">' + ROADMAP_FACTS.map((f) => '<div class="fact"><span class="fact-label">' + escapeHtml(f.label) + '</span><strong>' + escapeHtml(f.value) + '</strong><span class="fact-source">per ' + escapeHtml(f.source) + '</span></div>').join('') + '</div>'
    + '<p>Three steps, per PowerPyx and GTABase: story first (60–80 hours), then the 100% checklist (about 100 hours), then stranger strands and cleanup (10–20 hours). The 100% checklist appears after the story under Progress &gt; Stats &gt; 100% Completion — progress made during the story already counts.</p></section>';
  for (const stage of STAGES) {
    const items = trophies.filter((t) => t.stage === stage.n);
    const earned = items.filter((t) => isEarned(state, t.id)).length;
    const missables = items.filter((t) => t.missable).length;
    const confirmed = items.filter((t) => missableRisk(t) === 'confirmed-missable').length;
    const pct = items.length ? Math.round((earned / items.length) * 100) : 0;
    html += '<section class="stage"><h2>Stage ' + stage.n + ' — ' + escapeHtml(stage.title) + '</h2>'
      + '<p>' + escapeHtml(stage.intro) + '</p>'
      + '<div class="bar"><i style="width:' + pct + '%"></i></div>'
      + '<p><strong>' + earned + ' / ' + items.length + ' earned</strong> · ' + pct + '%'
      + (missables ? ' · ' + missables + ' story-locked' + (confirmed ? ' (incl. ' + confirmed + ' confirmed missable)' : '') : '') + '</p>'
      + '<ul>' + items.map((t) => '<li class="' + (isEarned(state, t.id) ? 'done' : '') + '">' + (isEarned(state, t.id) ? '✓ ' : '') + escapeHtml(displayName(state, t)) + (missableRisk(t) === 'confirmed-missable' ? ' · CONFIRMED MISSABLE' : '') + (missableRisk(t) === 'story-locked' ? ' · STORY-LOCKED' : '') + '</li>').join('') + '</ul></section>';
  }
  return html;
}

export function renderMissables(state, trophies) {
  const items = trophies.filter((t) => t.missable);
  const earned = items.filter((t) => isEarned(state, t.id)).length;
  const confirmed = items.filter((t) => missableRisk(t) === 'confirmed-missable');
  let html = '<div class="miss-note"><strong>' + earned + ' / ' + items.length + ' story-locked trophies earned.</strong> '
    + 'Published guides (PowerPyx, GTABase, KeenGamer) report only ONE truly missable trophy — '
    + 'Positive Mental Attitude, whose first meditation sits in Chapter 1. The other '
    + (items.length - confirmed.length) + ' unlock automatically when you finish their chapter or mission and cannot be skipped; '
    + 'they are listed here so you know they belong to your first pass. There is no mission replay, so save manually at the start and end of every chapter, and keep cheats off — they disable trophies and saving.</div>';
  if (confirmed.length) {
    const t = confirmed[0];
    html += '<div class="miss-note confirmed"><strong>⚠ The one to watch: ' + escapeHtml(displayName(state, t)) + '.</strong> '
      + 'After the mission Down to Earth in Chapter 1, look for Lucia at Jason\u2019s house in the morning; when she mentions meditating, follow her to the balcony and accept. '
      + 'Complete that meditation before leaving Chapter 1. 18 spots in 10 locations, with Jason and Lucia; the last needs both characters, after Coffee Break (Chapter 2).</div>';
  }
  html += '<div class="layout"><div class="list">' + items.map((t) => checklistRowHtml(state, t)).join('') + '</div>';
  html += '<aside class="pane"><h2>Why they can be missed</h2>'
    + '<p>Each trophy here names a story moment in its official description — a chapter to finish, a mission to complete, or a choice to make. Story moments pass: once the chapter closes or the mission is done, that moment is gone.</p>'
    + '<p><strong>Choice trophy:</strong> “Actions Speak Louder” (id 48) is about a choice. Save before a big decision so you can see the other outcome.</p>'
    + '<p><strong>Recovery:</strong> there is no mission replay, per GTABase — so the safe play is to earn each one on the first pass, and to save manually at every chapter boundary.</p></aside></div>';
  return html;
}

// Sources & audit: how the list was verified, the roadmap facts, every
// cited source with its access date, and what is still unverified.
export function renderAudit(state, trophies, audit) {
  const summary = progressSummary(state, trophies);
  const sources = auditSources(trophies);
  const totalSteps = trophies.reduce((n, t) => n + (t.steps || []).length, 0);
  const totalSources = trophies.reduce((n, t) => n + (t.sources || []).length, 0);
  let html = '<div class="audit-intro"><h2>Sources &amp; audit</h2><p>Every guide in this app names its sources, and this page shows the receipts: '
    + 'what was checked, where each fact comes from, and what is still unverified. '
    + 'Your progress: <strong>' + summary.earned + ' / ' + summary.total + ' earned</strong>. '
    + 'The guide holds <strong>' + totalSteps + ' cited steps</strong> and <strong>' + totalSources + ' source citations</strong> across all 55 trophies.</p></div>';
  if (audit) {
    html += '<section class="audit-card"><h2>How this guide was verified</h2><p>Checked ' + escapeHtml(audit.checkedAt) + '.</p><ul>'
      + audit.method.map((m) => '<li>' + escapeHtml(m) + '</li>').join('') + '</ul></section>';
    html += '<section class="audit-card"><h2>Platinum roadmap — the facts</h2><div class="fact-grid">'
      + ROADMAP_FACTS.map((f) => '<div class="fact"><span class="fact-label">' + escapeHtml(f.label) + '</span><strong>' + escapeHtml(f.value) + '</strong><span class="fact-source">per ' + escapeHtml(f.source) + '</span></div>').join('')
      + '</div><p>Hardest trophy: <strong>' + escapeHtml(audit.roadmap.hardest) + '</strong>. Story 60–80 hours, 100% checklist about 100 hours, strangers &amp; cleanup 10–20 hours.</p></section>';
    html += '<section class="audit-card"><h2>The missable correction</h2><p>' + escapeHtml(audit.missableCorrection) + '</p></section>';
    html += '<section class="audit-card"><h2>What is not yet verified</h2><ul>'
      + audit.notVerified.map((m) => '<li>' + escapeHtml(m) + '</li>').join('') + '</ul></section>';
  }
  html += '<section class="audit-card"><h2>Sources cited beside every trophy (' + sources.length + ' per trophy)</h2>'
    + '<p>Each trophy\u2019s guide lists these sources; the guide text is written for this entry in our own words — sources are cited, never copied. Accessed 20 Nov 2026 unless noted.</p><ul class="sources">'
    + sources.map((s) => '<li>' + (s.url ? '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.label) + '</a>' : escapeHtml(s.label)) + '</li>').join('')
    + '</ul></section>';
  return html;
}

export function renderPlanner(state, trophies) {
  const items = nextUpList(state, trophies, 5);
  if (items.length === 0) {
    return '<div class="empty-state"><strong>Platinum done.</strong> Every trophy is earned — 55 of 55.</div>';
  }
  let html = '<p style="color:var(--muted)">Your next 5, in roadmap order — easiest first within each stage. Spoiler mode still hides un-earned story trophies.</p>';
  for (const t of items) {
    html += '<div class="plan-card"><div class="name" style="font-weight:700;font-size:17px">' + medalSwatch(t) + ' ' + escapeHtml(displayName(state, t)) + '</div>'
      + '<div class="why">' + escapeHtml(whyNow(t)) + '</div>'
      + '<div class="meta" style="margin-top:6px;font-size:13px;color:var(--muted)">Stage ' + t.stage + ' · ' + gradeLabel(t.grade) + ' · ' + escapeHtml(rarityText(t))
      + (t.missable ? ' · <span class="pill miss">MISSABLE</span>' : '') + '</div></div>';
  }
  return html;
}

export function renderSettings(state, trophies) {
  const earned = state.earned.length;
  return '<div class="settings-card"><h2>Settings</h2>'
    + '<label><input type="checkbox" id="settingsSpoiler"' + (state.settings.spoiler ? ' checked' : '') + '> Spoiler mode — hide un-earned story trophies</label>'
    + '<label><input type="checkbox" id="settingsHideEarned"' + (state.settings.hideEarned ? ' checked' : '') + '> Hide earned trophies in the checklist</label>'
    + '<label><input type="checkbox" id="settingsTheme"' + (state.settings.theme === 'dark' ? ' checked' : '') + '> Night theme</label>'
    + '<p style="color:var(--muted)">Progress: ' + earned + ' of ' + trophies.length + ' earned. Saved in this browser (localStorage). Export backs it up as a file; import restores it.</p>'
    + '<p><button class="btn primary" id="settingsExport" type="button">Export progress</button> '
    + '<button class="btn" id="settingsReset" type="button">Reset progress</button></p></div>'
    + '<div class="settings-card"><h2>About this guide</h2>'
    + '<p>55 trophies, 1 platinum, 2 gold, 6 silver, 46 bronze. Guides are written for this entry in our own words from the official descriptions, with 10 sources named beside each one — the official list, PSNProfiles, and the published launch-day guides (PowerPyx, GTABase, Push Square, KeenGamer, GTA Spotter, eGamers, TrueAchievements). See Sources &amp; audit for how the list was verified and what is still unverified. The game released 19 Nov 2026 — where a place or step is not pinned down by the official description, the guide says so rather than inventing it.</p>'
    + '<p>Demo helper for screenshots: open the guide with <code>?demo=1&amp;earned=13&amp;spoiler=on&amp;view=roadmap</code> to pre-seed 13 earned trophies and part-way counters before the first render. It changes nothing when the params are absent.</p></div>';
}
