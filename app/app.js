// Leonida Legends — GTA VI trophy guide & tracker (offline, no network at run time).
// Fetches app/data/trophies.json once, paints the roadmap, the checklist and the
// guide panel, and keeps earned trophies in localStorage. Progress exports to a
// file and imports back from one.
const SAVE_KEY = 'leonida-legends-progress-v1';
const KINDS = ['all', 'story', 'missable', 'collectibles', 'activities', 'online'];

const $ = (id) => document.getElementById(id);
const els = {
  list: $('checklist'),
  empty: $('noResults'),
  count: $('earnedCount'),
  pct: $('earnedPct'),
  grades: $('gradeBreakdown'),
  fill: $('progressFill'),
  note: $('resultCount'),
  search: $('searchBox'),
  grade: $('gradeFilter'),
  spoiler: $('spoilerSwitch'),
  earnedOnly: $('earnedOnly'),
  panel: $('guidePanel'),
};

const state = {
  trophies: [],
  stages: [],
  earned: new Set(readSaved()),
  kind: 'all',
  current: null,
};

function readSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((name) => typeof name === 'string') : [];
  } catch {
    return [];
  }
}

function writeSaved() {
  localStorage.setItem(SAVE_KEY, JSON.stringify([...state.earned].sort()));
}

function esc(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function cap(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function spoilerMasked(trophy) {
  return els.spoiler.checked && trophy.hidden && !state.earned.has(trophy.name);
}

function kindMatches(trophy) {
  if (state.kind === 'all') return true;
  if (state.kind === 'missable') return trophy.missable === true;
  if (state.kind === 'online') return trophy.kinds.includes('online');
  return trophy.kinds.includes(state.kind);
}

function filteredList() {
  const query = els.search.value.trim().toLowerCase();
  return state.trophies.filter((trophy) => {
    if (!kindMatches(trophy)) return false;
    if (els.grade.value !== 'all' && trophy.grade !== els.grade.value) return false;
    if (els.earnedOnly.checked && !state.earned.has(trophy.name)) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.sources.join(' ')}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function paintProgress() {
  const total = state.trophies.length || 55;
  const done = state.trophies.filter((t) => state.earned.has(t.name)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  els.count.textContent = `${done} of ${total} earned`;
  els.pct.textContent = `${pct}%`;
  els.fill.style.width = `${pct}%`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const all = state.trophies.filter((t) => t.grade === grade).length;
    const got = state.trophies.filter((t) => t.grade === grade && state.earned.has(t.name)).length;
    return `${cap(grade)} ${got}/${all}`;
  });
  els.grades.textContent = parts.join(' · ');
}

function paintRoadmap() {
  const list = $('roadmapSteps');
  list.innerHTML = state.stages.map((stage) => `
    <li>
      <span class="step-num">${stage.stage}</span>
      <div><h3>${esc(stage.title)}</h3><p>${esc(stage.text)}</p></div>
      <span class="step-total">${stage.trophies.length} trophies</span>
    </li>`).join('');
  const missed = state.trophies.filter((t) => t.missable).length;
  $('missableNote').textContent =
    `${missed} trophies are flagged missable — finish them in the story flow.`;
}

function cardHtml(trophy) {
  const earned = state.earned.has(trophy.name);
  const masked = spoilerMasked(trophy);
  const name = masked ? 'Hidden trophy — earn it to reveal' : esc(trophy.name);
  const desc = masked
    ? 'A story trophy PlayStation hides until it is earned.'
    : esc(trophy.description);
  const tags = [];
  if (trophy.missable) tags.push('<span class="tag missable-tag">⚠ Missable</span>');
  if (trophy.hidden) tags.push('<span class="tag hidden-tag">Hidden</span>');
  if (typeof trophy.count === 'number') {
    tags.push(`<span class="tag count-tag">Count: ${trophy.count.toLocaleString('en-US')}</span>`);
  }
  return `
    <li>
      <button type="button" class="trophy-row${earned ? ' done' : ''}" data-trophy="${trophy.id}" aria-pressed="${earned}">
        <input type="checkbox" class="tick" data-tick="${trophy.id}" ${earned ? 'checked' : ''} aria-label="Mark ${esc(trophy.name)} as earned">
        <div>
          <h3 class="${masked ? 'hidden-name' : ''}">${name}</h3>
          <p class="blurb">${desc}</p>
          <div class="tags">${tags.join('')}</div>
        </div>
        <span class="grade-pill grade-${trophy.grade}">${cap(trophy.grade)}</span>
      </button>
    </li>`;
}

function paintList() {
  const shown = filteredList();
  els.list.innerHTML = shown.map(cardHtml).join('');
  els.empty.hidden = shown.length !== 0;
  const kindName = state.kind === 'all' ? 'all kinds' : state.kind;
  els.note.textContent = shown.length === state.trophies.length
    ? `Showing all ${state.trophies.length} trophies.`
    : `Showing ${shown.length} of ${state.trophies.length} trophies (${kindName}` +
      `${els.grade.value !== 'all' ? `, ${els.grade.value}` : ''}` +
      `${els.search.value.trim() ? `, matching “${els.search.value.trim()}”` : ''}).`;
  paintProgress();
}

function setEarned(name, isEarned) {
  if (isEarned) state.earned.add(name);
  else state.earned.delete(name);
  writeSaved();
  paintList();
  if (state.current && state.current.name === name) syncGuideToggle();
}

function showGuide(trophy) {
  state.current = trophy;
  const masked = spoilerMasked(trophy);
  $('guideTitle').textContent = masked ? 'Hidden trophy' : trophy.name;
  $('guideMeta').textContent =
    `${cap(trophy.grade)} · ${trophy.hidden ? 'Hidden on PlayStation' : 'Visible on PlayStation'}` +
    `${trophy.missable ? ' · Missable' : ''}` +
    `${typeof trophy.count === 'number' ? ` · Count: ${trophy.count.toLocaleString('en-US')}` : ''}`;
  $('guideDesc').textContent = masked
    ? 'This story trophy stays hidden until you earn it.'
    : trophy.description;
  const warn = $('guideMissable');
  if (trophy.missable && trophy.missable_reason) {
    warn.hidden = false;
    warn.textContent = `⚠ Missable: ${trophy.missable_reason}`;
  } else {
    warn.hidden = true;
  }
  $('guideBody').textContent = trophy.guide;
  $('guideSources').innerHTML = trophy.sources.map((s) => `<li>${esc(s)}</li>`).join('');
  syncGuideToggle();
  els.panel.hidden = false;
  els.panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function syncGuideToggle() {
  $('guideEarned').checked = state.earned.has(state.current.name);
}

function hideGuide() {
  state.current = null;
  els.panel.hidden = true;
}

function downloadProgress() {
  const blob = new Blob(
    [JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...state.earned].sort() }, null, 2)],
    { type: 'application/json' },
  );
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'gta6-trophy-progress.json';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

async function uploadProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(state.trophies.map((t) => t.name));
    state.earned = new Set(names.filter((n) => typeof n === 'string' && known.has(n)));
    writeSaved();
    paintList();
    els.note.textContent = `Imported ${state.earned.size} earned trophies.`;
  } catch {
    els.note.textContent = 'That file could not be imported — it is not a progress export from this guide.';
  }
}

function setKind(kind) {
  state.kind = kind;
  for (const chip of document.querySelectorAll('#kindFilters .kind-btn')) {
    chip.classList.toggle('on', chip.dataset.kind === kind);
  }
}

function readUrl() {
  const params = new URLSearchParams(location.search);
  const kind = params.get('filter');
  if (kind && KINDS.includes(kind)) setKind(kind);
  const grade = params.get('grade');
  if (grade && ['platinum', 'gold', 'silver', 'bronze'].includes(grade)) els.grade.value = grade;
  if (params.get('spoiler') === '0') els.spoiler.checked = false;
  const trophyId = Number(params.get('trophy'));
  if (Number.isInteger(trophyId)) {
    const trophy = state.trophies.find((t) => t.id === trophyId);
    if (trophy) showGuide(trophy);
  }
  if (params.get('view') === 'roadmap') {
    $('roadmapBox').scrollIntoView();
  }
}

els.list.addEventListener('click', (event) => {
  const tick = event.target.closest('[data-tick]');
  if (tick) {
    event.stopPropagation();
    const trophy = state.trophies.find((t) => t.id === Number(tick.dataset.tick));
    if (trophy) setEarned(trophy.name, tick.checked);
    return;
  }
  const card = event.target.closest('[data-trophy]');
  if (card) {
    const trophy = state.trophies.find((t) => t.id === Number(card.dataset.trophy));
    if (trophy) showGuide(trophy);
  }
});
$('kindFilters').addEventListener('click', (event) => {
  const chip = event.target.closest('.kind-btn');
  if (!chip) return;
  setKind(chip.dataset.kind);
  paintList();
});
els.grade.addEventListener('change', paintList);
els.search.addEventListener('input', paintList);
els.spoiler.addEventListener('change', paintList);
els.earnedOnly.addEventListener('change', paintList);
$('exportProgress').addEventListener('click', downloadProgress);
$('importProgress').addEventListener('change', (event) => {
  uploadProgress(event.target.files[0]);
  event.target.value = '';
});
$('clearProgress').addEventListener('click', () => {
  if (!state.earned.size) return;
  if (window.confirm('Clear all earned trophies? This cannot be undone (export first if you want a backup).')) {
    state.earned = new Set();
    writeSaved();
    paintList();
  }
});
$('guideClose').addEventListener('click', hideGuide);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !els.panel.hidden) hideGuide();
});
$('guideEarned').addEventListener('change', (event) => {
  if (state.current) setEarned(state.current.name, event.target.checked);
});
$('roadmapCollapse').addEventListener('click', (event) => {
  const list = $('roadmapSteps');
  const hidden = list.hidden;
  list.hidden = !hidden;
  event.target.textContent = hidden ? 'Hide roadmap' : 'Show roadmap';
  event.target.setAttribute('aria-expanded', String(hidden));
});

const data = await (await fetch('data/trophies.json')).json();
state.trophies = data.trophies;
state.stages = data.roadmap ?? [];
paintRoadmap();
readUrl();
paintList();
