// View rendering: checklist rows, detail pane, roadmap, missables,
// planner and settings. All text comes from the trophy data; nothing
// here fetches the network.
import { STAGES, rarityText } from './data.js';
import { isEarned, counterValue } from './store.js';
import { filterTrophies, nextUpList, whyNow, isHiddenBySpoiler } from './filters.js';

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
  return '<article class="row' + (earned ? ' earned' : '') + '" data-open="' + trophy.id + '" tabindex="0">'
    + '<input type="checkbox" data-earned="' + trophy.id + '"' + (earned ? ' checked' : '') + ' aria-label="Mark ' + escapeHtml(displayName(state, trophy)) + ' earned">'
    + '<div class="body"><div class="name">' + escapeHtml(displayName(state, trophy)) + '</div>'
    + '<div class="desc">' + escapeHtml(displayDescription(state, trophy)) + '</div>'
    + '<div class="meta">' + medalSwatch(trophy) + '<span>' + gradeLabel(trophy.grade) + '</span>'
    + '<span class="pill kind">' + escapeHtml(trophy.kind) + '</span>'
    + (trophy.missable ? '<span class="pill miss">MISSABLE</span>' : '')
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
  let html = '<aside class="pane"><h2>' + escapeHtml(displayName(state, trophy)) + '</h2>'
    + '<p class="official">“' + escapeHtml(displayDescription(state, trophy)) + '”</p>'
    + '<div class="meta">' + medalSwatch(trophy) + '<span>' + gradeLabel(trophy.grade) + '</span>'
    + '<span class="pill kind">' + escapeHtml(trophy.kind) + '</span>'
    + (trophy.missable ? '<span class="pill miss">MISSABLE</span>' : '')
    + '<span class="rarity">' + escapeHtml(rarityText(trophy)) + '</span></div>'
    + '<p><strong>' + (earned ? 'Earned ✓' : 'Not earned yet') + '</strong>'
    + (trophy.target ? ' · ' + counterValue(state, trophy) + ' / ' + trophy.target + ' ' + escapeHtml(trophy.targetUnit || '') : '') + '</p>';
  if (hidden) {
    html += '<p>Spoiler mode is on: this story trophy stays hidden until you earn it. Turn spoiler mode off in Settings, or tick the box to reveal it.</p>';
  } else {
    html += '<h3>Guide</h3><p>' + escapeHtml(trophy.guide) + '</p>';
    html += '<h3>Sources</h3><ul class="sources">' + trophy.sources.map((s) => {
      return s.url
        ? '<li><a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.label) + '</a></li>'
        : '<li>' + escapeHtml(s.label) + '</li>';
    }).join('') + '</ul>';
    if (trophy.steps && trophy.steps.length) {
      html += '<h3>Steps</h3><ol>' + trophy.steps.map((s) => '<li>' + escapeHtml(s) + '</li>').join('') + '</ol>';
    }
    if (trophy.missable) {
      html += '<h3>When it can be missed</h3><p>This trophy is tied to the story: earn it while the mission or chapter is open. If you pass it by, mission replay may recover it — that is unconfirmed, so do it when it appears.</p>';
    } else {
      html += '<h3>When it can be missed</h3><p>It cannot be missed. It can be done any time after the story, during cleanup.</p>';
    }
  }
  html += '<h3>Your note</h3><textarea data-note="' + trophy.id + '" placeholder="Where is it? What worked?">' + escapeHtml(state.notes[trophy.id] || '') + '</textarea>'
    + '<p class="note">Rarities are PSNProfiles figures at launch, 19 Nov 2026 — near 0% because the game released today, and they will rise. Launch-day guides are honest where the official description does not name a place or step.</p></aside>';
  return html;
}

export function renderRoadmap(state, trophies) {
  let html = '';
  for (const stage of STAGES) {
    const items = trophies.filter((t) => t.stage === stage.n);
    const earned = items.filter((t) => isEarned(state, t.id)).length;
    const pct = items.length ? Math.round((earned / items.length) * 100) : 0;
    html += '<section class="stage"><h2>Stage ' + stage.n + ' — ' + escapeHtml(stage.title) + '</h2>'
      + '<p>' + escapeHtml(stage.intro) + '</p>'
      + '<div class="bar"><i style="width:' + pct + '%"></i></div>'
      + '<p><strong>' + earned + ' / ' + items.length + ' earned</strong> · ' + pct + '%</p>'
      + '<ul>' + items.map((t) => '<li class="' + (isEarned(state, t.id) ? 'done' : '') + '">' + (isEarned(state, t.id) ? '✓ ' : '') + escapeHtml(displayName(state, t)) + (t.missable ? ' · MISSABLE' : '') + '</li>').join('') + '</ul></section>';
  }
  return html;
}

export function renderMissables(state, trophies) {
  const items = trophies.filter((t) => t.missable);
  const earned = items.filter((t) => isEarned(state, t.id)).length;
  let html = '<div class="miss-note"><strong>' + earned + ' / ' + items.length + ' missables earned.</strong> '
    + 'These 13 trophies are tied to the story — chapters, named missions and one choice. Earn each one when it appears. '
    + 'If one is missed, mission replay may recover it, but that is unconfirmed — so do not count on it.</div>';
  html += '<div class="layout"><div class="list">' + items.map((t) => checklistRowHtml(state, t)).join('') + '</div>';
  html += '<aside class="pane"><h2>Why they can be missed</h2>'
    + '<p>Each missable trophy names a story moment in its official description — a chapter to finish, a mission to complete, or a choice to make. Story moments pass: once the chapter closes or the mission is done, that moment is gone.</p>'
    + '<p><strong>Choice trophy:</strong> “Actions Speak Louder” (id 48) is about a choice. Save before a big decision so you can see the other outcome.</p>'
    + '<p><strong>Recovery:</strong> mission replay may let you redo a missed mission — unconfirmed at launch. The safe play is to earn each one on the first pass.</p></aside></div>';
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
    + '<p><button class="btn primary" id="settingsExport" type="button">Export progress</button></p></div>'
    + '<div class="settings-card"><h2>About this guide</h2>'
    + '<p>55 trophies, 1 platinum, 2 gold, 6 silver, 46 bronze. Guides are written for this entry in our own words from the official descriptions, with sources named beside each one. The game released 19 Nov 2026 — where a place or step is not pinned down by the official description, the guide says so rather than inventing it.</p>'
    + '<p>Demo helper for screenshots: open the guide with <code>?demo=1&amp;earned=13&amp;spoiler=on&amp;view=roadmap</code> to pre-seed 13 earned trophies and part-way counters before the first render. It changes nothing when the params are absent.</p></div>';
}
