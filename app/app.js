// Leonida Legends — GTA VI trophy guide & tracker (offline, no network at run time).
// Loads app/data/trophies.json once, renders the checklist, roadmap and guide panel,
// and saves earned trophies in localStorage. Progress can be exported and imported.
const STORAGE_KEY = 'leonida-legends-progress-v1';

const listEl = document.getElementById('trophyList');
const emptyEl = document.getElementById('emptyState');
const progressText = document.getElementById('progressText');
const percentText = document.getElementById('percentText');
const gradeText = document.getElementById('gradeText');
const filterNote = document.getElementById('filterNote');
const searchInput = document.getElementById('searchInput');
const gradeSelect = document.getElementById('gradeSelect');
const spoilerToggle = document.getElementById('spoilerToggle');
const earnedOnlyToggle = document.getElementById('earnedOnlyToggle');
const detailPanel = document.getElementById('detailPanel');

let trophies = [];
let roadmap = [];
let missableSummary = '';
let earned = new Set(loadProgress());
let activeKind = 'all';
let openTrophy = null;

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort()));
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function isSpoilerHidden(trophy) {
  return spoilerToggle.checked && trophy.hidden && !earned.has(trophy.name);
}

function matchesKind(trophy) {
  if (activeKind === 'all') return true;
  if (activeKind === 'missable') return trophy.missable === true;
  if (activeKind === 'online') return trophy.kinds.includes('online');
  return trophy.kinds.includes(activeKind);
}

function visibleTrophies() {
  const query = searchInput.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (!matchesKind(t)) return false;
    if (gradeSelect.value !== 'all' && t.grade !== gradeSelect.value) return false;
    if (earnedOnlyToggle.checked && !earned.has(t.name)) return false;
    if (query) {
      const hay = `${t.name} ${t.description} ${t.guide} ${t.sources.join(' ')}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

function renderProgress() {
  const total = trophies.length || 55;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressText.textContent = `${done} of ${total} earned`;
  percentText.textContent = `${pct}%`;
  document.getElementById('progressFill').style.width = `${pct}%`;
  const counts = {};
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const all = trophies.filter((t) => t.grade === grade).length;
    const got = trophies.filter((t) => t.grade === grade && earned.has(t.name)).length;
    counts[grade] = `${gradeLabel(grade)} ${got}/${all}`;
  }
  gradeText.textContent = Object.values(counts).join(' · ');
}

function renderRoadmap() {
  const list = document.getElementById('roadmapList');
  list.replaceChildren();
  for (const stage of roadmap) {
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = stage.stage;
    const body = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = stage.title;
    const text = document.createElement('p');
    text.textContent = stage.text;
    body.append(title, text);
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = `${stage.trophies.length} trophies`;
    li.append(num, body, count);
    list.append(li);
  }
  const missed = trophies.filter((t) => t.missable).length;
  document.getElementById('missableCount').textContent =
    `${missed} trophies are flagged missable — finish them in the story flow.`;
}

function trophyCard(trophy) {
  const card = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'trophy-card' + (earned.has(trophy.name) ? ' earned' : '');
  button.setAttribute('aria-pressed', String(earned.has(trophy.name)));

  const tick = document.createElement('input');
  tick.type = 'checkbox';
  tick.className = 'tick';
  tick.checked = earned.has(trophy.name);
  tick.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  tick.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleEarned(trophy.name, tick.checked);
  });

  const body = document.createElement('div');
  const name = document.createElement('h3');
  if (isSpoilerHidden(trophy)) {
    name.textContent = 'Hidden trophy — earn it to reveal';
    name.className = 'spoiler-name';
  } else {
    name.textContent = trophy.name;
  }
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = isSpoilerHidden(trophy)
    ? 'A story trophy PlayStation hides until it is earned.'
    : trophy.description;
  body.append(name, desc);

  const flags = document.createElement('div');
  flags.className = 'flags';
  if (trophy.missable) {
    const flag = document.createElement('span');
    flag.className = 'flag missable';
    flag.textContent = '⚠ Missable';
    flags.append(flag);
  }
  if (trophy.hidden) {
    const flag = document.createElement('span');
    flag.className = 'flag hidden-flag';
    flag.textContent = 'Hidden';
    flags.append(flag);
  }
  if (typeof trophy.count === 'number') {
    const flag = document.createElement('span');
    flag.className = 'flag count';
    flag.textContent = `Count: ${trophy.count.toLocaleString('en-US')}`;
    flags.append(flag);
  }
  body.append(flags);

  const badge = document.createElement('span');
  badge.className = `grade-badge grade-${trophy.grade}`;
  badge.textContent = gradeLabel(trophy.grade);

  button.append(tick, body, badge);
  button.addEventListener('click', () => openDetail(trophy));
  card.append(button);
  return card;
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren(...shown.map(trophyCard));
  emptyEl.hidden = shown.length !== 0;
  const kindName = activeKind === 'all' ? 'all kinds' : activeKind;
  filterNote.textContent = shown.length === trophies.length
    ? `Showing all ${trophies.length} trophies.`
    : `Showing ${shown.length} of ${trophies.length} trophies (${kindName}${gradeSelect.value !== 'all' ? `, ${gradeSelect.value}` : ''}${searchInput.value.trim() ? `, matching “${searchInput.value.trim()}”` : ''}).`;
  renderProgress();
}

function toggleEarned(name, isEarned) {
  if (isEarned) earned.add(name);
  else earned.delete(name);
  saveProgress();
  renderList();
  if (openTrophy && openTrophy.name === name) syncDetailEarned();
}

function openDetail(trophy) {
  openTrophy = trophy;
  document.getElementById('detailName').textContent =
    isSpoilerHidden(trophy) ? 'Hidden trophy' : trophy.name;
  document.getElementById('detailMeta').textContent =
    `${gradeLabel(trophy.grade)} · ${trophy.hidden ? 'Hidden on PlayStation' : 'Visible on PlayStation'}${trophy.missable ? ' · Missable' : ''}${typeof trophy.count === 'number' ? ` · Count: ${trophy.count.toLocaleString('en-US')}` : ''}`;
  document.getElementById('detailDesc').textContent =
    isSpoilerHidden(trophy) ? 'This story trophy stays hidden until you earn it.' : trophy.description;
  const missableEl = document.getElementById('detailMissable');
  if (trophy.missable && trophy.missable_reason) {
    missableEl.hidden = false;
    missableEl.textContent = `⚠ Missable: ${trophy.missable_reason}`;
  } else {
    missableEl.hidden = true;
  }
  document.getElementById('detailGuide').textContent = trophy.guide;
  const sources = document.getElementById('detailSources');
  sources.replaceChildren();
  for (const source of trophy.sources) {
    const li = document.createElement('li');
    li.textContent = source;
    sources.append(li);
  }
  syncDetailEarned();
  detailPanel.hidden = false;
  detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function syncDetailEarned() {
  const box = document.getElementById('detailEarned');
  box.checked = earned.has(openTrophy.name);
}

function closeDetail() {
  openTrophy = null;
  detailPanel.hidden = true;
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort() }, null, 2)], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'gta6-trophy-progress.json';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => typeof n === 'string' && known.has(n)));
    saveProgress();
    renderList();
    filterNote.textContent = `Imported ${earned.size} earned trophies.`;
  } catch {
    filterNote.textContent = 'That file could not be imported — it is not a progress export from this guide.';
  }
}

function applyUrlState() {
  const params = new URLSearchParams(location.search);
  const kind = params.get('filter');
  if (kind && ['all', 'story', 'missable', 'collectibles', 'activities', 'online'].includes(kind)) {
    setKind(kind);
  }
  const grade = params.get('grade');
  if (grade && ['platinum', 'gold', 'silver', 'bronze'].includes(grade)) gradeSelect.value = grade;
  if (params.get('spoiler') === '0') spoilerToggle.checked = false;
  const trophyId = Number(params.get('trophy'));
  if (Number.isInteger(trophyId)) {
    const trophy = trophies.find((t) => t.id === trophyId);
    if (trophy) openDetail(trophy);
  }
  if (params.get('view') === 'roadmap') {
    document.getElementById('roadmapSection').scrollIntoView();
  }
}

function setKind(kind) {
  activeKind = kind;
  for (const chip of document.querySelectorAll('#kindChips .chip')) {
    chip.classList.toggle('active', chip.dataset.kind === kind);
  }
}

document.getElementById('kindChips').addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (!chip) return;
  setKind(chip.dataset.kind);
  renderList();
});
gradeSelect.addEventListener('change', renderList);
searchInput.addEventListener('input', renderList);
spoilerToggle.addEventListener('change', renderList);
earnedOnlyToggle.addEventListener('change', renderList);
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (event) => {
  importProgress(event.target.files[0]);
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!earned.size) return;
  if (window.confirm('Clear all earned trophies? This cannot be undone (export first if you want a backup).')) {
    earned = new Set();
    saveProgress();
    renderList();
  }
});
document.getElementById('detailClose').addEventListener('click', closeDetail);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !detailPanel.hidden) closeDetail();
});
document.getElementById('detailEarned').addEventListener('change', (event) => {
  if (openTrophy) toggleEarned(openTrophy.name, event.target.checked);
});
document.getElementById('roadmapToggle').addEventListener('click', (event) => {
  const list = document.getElementById('roadmapList');
  const hidden = list.hidden;
  list.hidden = !hidden;
  event.target.textContent = hidden ? 'Hide roadmap' : 'Show roadmap';
  event.target.setAttribute('aria-expanded', String(hidden));
});

const data = await (await fetch('data/trophies.json')).json();
trophies = data.trophies;
roadmap = data.roadmap ?? [];
missableSummary = data.missable_summary ?? '';
renderRoadmap();
applyUrlState();
renderList();
