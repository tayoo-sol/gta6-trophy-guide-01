// Leonida Legend — GTA VI trophy guide and tracker.
// Loads app/data/trophies.json, renders the checklist with filters, search,
// a spoiler setting, localStorage progress with export/import, a guide panel
// with named sources per trophy, and the roadmap to the platinum.
const STORAGE_KEY = 'leonida-legend-progress-v1';
const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detailPanel');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kindFilter');
const gradeEl = document.getElementById('gradeFilter');
const spoilerEl = document.getElementById('spoilerToggle');
const listNoteEl = document.getElementById('listNote');

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const byName = new Map(trophies.map((t) => [t.name, t]));

let earned = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]').filter((n) => byName.has(n)));
let selectedId = null;
let view = 'checklist';

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
}

function gradeCounts() {
  const out = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of trophies) {
    out[t.grade][1] += 1;
    if (earned.has(t.name)) out[t.grade][0] += 1;
  }
  return out;
}

function nextStep() {
  const storyLeft = trophies.filter((t) => t.kind === 'story' && !earned.has(t.name));
  if (storyLeft.length > 0) return `Next up: finish the story — ${storyLeft[0].name}.`;
  const left = trophies.filter((t) => !earned.has(t.name));
  if (left.length === 0) return 'Platinum earned — you are a Leonida Legend.';
  return `Next up: ${left[0].name}.`;
}

function renderProgress() {
  const counts = gradeCounts();
  document.getElementById('earnedCount').textContent = earned.size;
  document.getElementById('progressFill').style.width = `${(earned.size / trophies.length) * 100}%`;
  document.getElementById('progressDetail').textContent =
    `Platinum ${counts.platinum[0]}/${counts.platinum[1]} · Gold ${counts.gold[0]}/${counts.gold[1]} · Silver ${counts.silver[0]}/${counts.silver[1]} · Bronze ${counts.bronze[0]}/${counts.bronze[1]}`;
  document.getElementById('progressNext').textContent = nextStep();
}

function spoilerHidden(t) {
  return spoilerEl.checked && t.kind === 'story' && !earned.has(t.name);
}

function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kindEl.value === 'missable' && !t.missable) return false;
    if (kindEl.value === 'online') return false;
    if (kindEl.value !== 'all' && kindEl.value !== 'missable' && t.kind !== kindEl.value) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function countLabel(t) {
  if (t.count == null) return '';
  if (t.id === 48) return `Count: ${t.count} choices`;
  if (t.id === 52 || t.id === 53) return `Count: $${t.count.toLocaleString('en-US')}`;
  if (t.id === 30) return `Count: ${t.count} card sets`;
  return `Count: ${t.count}`;
}

function renderChecklist() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  if (kindEl.value === 'online') {
    listNoteEl.textContent = 'No online trophies — all 55 trophies are earned in single-player. Nothing to list here.';
  } else {
    listNoteEl.textContent = `Showing ${shown.length} of 55 trophies${earned.size ? ` · ${earned.size} earned` : ''}. Tick a trophy when you earn it — progress is saved in this browser. Click a row to read its guide and sources.`;
  }
  for (const t of shown) {
    const li = document.createElement('li');
    if (earned.has(t.name)) li.classList.add('earned');
    if (t.id === selectedId) li.classList.add('selected');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveProgress();
      renderProgress();
      renderChecklist();
      renderDetail();
    });
    const body = document.createElement('div');
    body.className = 'trophy-body';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = spoilerHidden(t) ? '??? — hidden story trophy' : t.name;
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = spoilerHidden(t) ? 'Earn this trophy to reveal its official name and description.' : `“${t.description}”`;
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    const gradeBadge = document.createElement('span');
    gradeBadge.className = `badge ${t.grade}`;
    gradeBadge.textContent = t.grade;
    meta.append(gradeBadge);
    if (t.kind !== t.grade) {
      const kindBadge = document.createElement('span');
      kindBadge.className = 'badge kind';
      kindBadge.textContent = t.kind;
      meta.append(kindBadge);
    }
    if (t.missable) {
      const miss = document.createElement('span');
      miss.className = 'badge missable';
      miss.textContent = 'Missable';
      meta.append(miss);
    }
    if (t.count != null) {
      const count = document.createElement('span');
      count.className = 'badge count';
      count.textContent = countLabel(t);
      meta.append(count);
    }
    body.append(name, desc, meta);
    li.append(box, body);
    li.addEventListener('click', (e) => {
      if (e.target === box) return;
      selectedId = t.id;
      renderChecklist();
      renderDetail();
    });
    listEl.append(li);
  }
}

function renderDetail() {
  const t = byId.get(selectedId);
  if (!t) {
    detailEl.innerHTML = '<p class="detail-empty">Pick a trophy to read its guide and sources.</p>';
    return;
  }
  detailEl.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = spoilerHidden(t) ? 'Hidden story trophy' : t.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = spoilerHidden(t)
    ? 'Official name and description hidden by the spoiler setting — earn it to reveal.'
    : `Official: “${t.description}” — ${t.grade} trophy.`;
  detailEl.append(title, official);
  const flag = document.createElement('p');
  if (t.missable) {
    flag.className = 'flag';
    flag.textContent = `Missable — ${t.missableNote}`;
  } else if (t.kind === 'story') {
    flag.className = 'safe';
    flag.textContent = 'Story trophy — it pops when you finish the mission, so it cannot be missed as long as you finish the story.';
  } else {
    flag.className = 'safe';
    flag.textContent = 'Not missable — you can attempt this again at any time.';
  }
  detailEl.append(flag);
  const guideHead = document.createElement('h3');
  guideHead.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.textContent = spoilerHidden(t) ? 'Guide hidden until earned.' : t.guide;
  detailEl.append(guideHead, guide);
  const srcHead = document.createElement('h3');
  srcHead.textContent = 'Sources';
  const srcList = document.createElement('ul');
  srcList.className = 'sources';
  for (const s of t.sources) {
    const li = document.createElement('li');
    li.textContent = s;
    srcList.append(li);
  }
  detailEl.append(srcHead, srcList);
  const roadHead = document.createElement('h3');
  roadHead.textContent = 'Roadmap stage';
  const road = document.createElement('p');
  road.textContent = `Stage ${t.stage} of 5 — ${['', 'Story first', 'Strangers & freaks', 'Collectibles', 'Activities & grinds', 'Money, mayhem & 100%'][t.stage]}.`;
  detailEl.append(roadHead, road);
}

const STAGES = [
  { n: 1, title: 'Stage 1 — Story first', text: 'Play the story in order: the opening mission Gone Fishing, then Chapters 1, 2, 3 and 4, then the final mission. The six named missions — Breakfast Run, The Cartel Heist, Child’s Play, Headliners, VCIA Takedown and Operation Savage Glory — pop their trophies as you complete them.', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
  { n: 2, title: 'Stage 2 — Strangers & freaks', text: 'Take every stranger strand you meet across Leonida and see each one through. Eight finished strands earns the silver; the finals for Andy, Kenton, Billy, Randy and Tyrone each carry their own trophy, and Bret’s strand ends in a hunt for a unique animal.', ids: [25, 22, 23, 24, 26, 27, 29] },
  { n: 3, title: 'Stage 3 — Collectibles', text: 'Sweep the map for the countable things: 3 collectible card sets, WAiNK It at 100 locations, 100 vehicles discovered, all 8 garage properties, and all 52 areas of Leonida explored.', ids: [30, 31, 35, 54, 42] },
  { n: 4, title: 'Stage 4 — Activities & grinds', text: 'The long grinds: gold medals in all 42 Shooting Range challenges, drone race wins at all 14 Top Fun locations, 20 different race wins, 250 stunts, 50 challenges, meditation at all 18 spots, plus one arcade game, one bowling game at Kolt & Associates, beating Cal at fishing, registering 10 vehicles to Scooter Bros, and a cocktail on Ocean Beach.', ids: [17, 18, 19, 15, 32, 28, 21, 46, 20, 55, 44, 16] },
  { n: 5, title: 'Stage 5 — Money, mayhem & 100%', text: 'Finish the money and mayhem trophies — 5 bank vaults, an armored truck, one illegal operation per gang (9 gangs), $250,000 laundered in Marked Bills, $100,000 spent across shops — plus the partner feats, Combat Focus and the one-off stunts. Then check the in-game stats and mop up whatever is left for 100% completion, and the platinum pops.', ids: [40, 41, 43, 52, 53, 33, 34, 36, 37, 38, 39, 45, 47, 48, 49, 50, 51, 14, 1] },
];

function renderRoadmap() {
  const stagesEl = document.getElementById('stages');
  stagesEl.replaceChildren();
  for (const s of STAGES) {
    const card = document.createElement('div');
    card.className = 'stage';
    const h = document.createElement('h4');
    h.textContent = s.title;
    const p = document.createElement('p');
    p.textContent = s.text;
    const names = document.createElement('p');
    names.className = 'trophy-names';
    names.textContent = s.ids.map((id) => {
      const t = byId.get(id);
      const done = earned.has(t.name) ? '✓ ' : '';
      return `${done}${t.name}`;
    }).join(' · ');
    card.append(h, p, names);
    stagesEl.append(card);
  }
  const watchEl = document.getElementById('watchlist');
  watchEl.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = t.name;
    li.append(strong, document.createTextNode(` — ${t.missableNote} ${earned.has(t.name) ? '(earned ✓)' : ''}`));
    watchEl.append(li);
  }
  document.getElementById('countsLine').textContent =
    '42 Shooting Range challenges (gold each) · 14 Top Fun drone race locations · 20 different race wins · 250 stunts · 50 challenges · 18 meditation spots · 8 stranger strands · 3 card sets · 100 WAiNK locations · 100 vehicles · 52 areas · 8 garages · 10 Scooter Bros registrations · 5 bank vaults · 9 gangs · $250,000 laundered · $100,000 spent · 500 choices.';
}

function switchView(next) {
  view = next;
  document.getElementById('tabChecklist').classList.toggle('active', view === 'checklist');
  document.getElementById('tabRoadmap').classList.toggle('active', view === 'roadmap');
  document.getElementById('checklistView').hidden = view !== 'checklist';
  document.getElementById('roadmapView').hidden = view !== 'roadmap';
  document.getElementById('toolbar').style.display = view === 'checklist' ? '' : 'none';
  if (view === 'roadmap') renderRoadmap();
}

function exportProgress() {
  const payload = { game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...earned] };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  const data = JSON.parse(await file.text());
  const names = Array.isArray(data) ? data : data.earned;
  earned = new Set((names ?? []).filter((n) => byName.has(n)));
  saveProgress();
  renderProgress();
  renderChecklist();
  renderDetail();
  renderRoadmap();
}

function applyShareParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('view') === 'roadmap') switchView('roadmap');
  if (params.get('kind')) kindEl.value = params.get('kind');
  if (params.get('grade')) gradeEl.value = params.get('grade');
  if (params.get('q')) searchEl.value = params.get('q');
  if (params.get('spoiler') === '1') spoilerEl.checked = true;
  if (params.get('earned')) {
    const ids = params.get('earned').split(',').map((s) => Number(s.trim())).filter((n) => byId.has(n));
    earned = new Set(ids.map((id) => byId.get(id).name));
    saveProgress();
  }
  if (params.get('open')) {
    const id = Number(params.get('open'));
    if (byId.has(id)) selectedId = id;
  }
}

document.getElementById('tabChecklist').addEventListener('click', () => switchView('checklist'));
document.getElementById('tabRoadmap').addEventListener('click', () => switchView('roadmap'));
searchEl.addEventListener('input', renderChecklist);
kindEl.addEventListener('change', renderChecklist);
gradeEl.addEventListener('change', renderChecklist);
spoilerEl.addEventListener('change', () => { renderChecklist(); renderDetail(); });
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) await importProgress(file);
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned ticks?')) {
    earned = new Set();
    saveProgress();
    renderProgress();
    renderChecklist();
    renderDetail();
    renderRoadmap();
  }
});

applyShareParams();
renderProgress();
renderChecklist();
renderDetail();
renderRoadmap();
