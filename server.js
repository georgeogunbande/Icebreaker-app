// RoomSpark, a QR icebreaker for live events. Its activity, "Find Your People": participants scan a QR code,
// get a category (assigned in rotation so categories stay balanced) and are put into teams. No dependencies:
// run with `node server.js`.
const http = require('http');
const fs = require('fs');
const path = require('path');
const storage = require('./storage');

const PORT = process.env.PORT || 3000;
const HOST_PIN = process.env.HOST_PIN || ''; // optional PIN required to reset

// `tip` finishes the sentence "Each person shares one ___."
// `questions` is the group's fun round: quiz cards (options + index of the answer + a fun fact)
// and talk cards (everyone answers out loud).
const BUILT_IN = [
  {
    name: 'Money', emoji: '💰', tip: 'money tip', color: '#16a34a',
    questions: [
      { q: 'Money grows 8% a year. Roughly how long until it doubles?', options: ['5 years', '9 years', '15 years'], answer: 1,
        fact: 'The Rule of 72: divide 72 by the growth rate. 72 ÷ 8 = 9 years.' },
      { talk: 'Would you rather get $1,000 today or $1,500 a year from now? Why?' },
      { q: 'What does “pay yourself first” mean?', options: ['Buy yourself a treat before paying bills', 'Save a set amount the moment you get paid', 'Pay your own salary before your staff'], answer: 1,
        fact: 'Move savings out automatically on payday. Money you never see is money you don’t miss.' },
      { talk: 'What’s the best (or funniest) money decision you’ve ever made?' },
      { q: 'An emergency fund is usually recommended to cover…', options: ['1 week of expenses', '3–6 months of expenses', '5 years of expenses'], answer: 1,
        fact: '3–6 months of expenses turns a job loss or a surprise bill from a crisis into an inconvenience.' },
    ],
  },
  {
    name: 'Career', emoji: '💼', tip: 'career tip', color: '#2563eb',
    questions: [
      { q: 'The Pomodoro technique breaks work into focused blocks of how long?', options: ['10 minutes', '25 minutes', '60 minutes'], answer: 1,
        fact: 'It’s named after the tomato-shaped kitchen timer its inventor used. “Pomodoro” is Italian for tomato. 🍅' },
      { talk: 'What was your very first job, and what did it teach you?' },
      { q: 'At the end of a job interview they ask, “Any questions for us?” Best move?', options: ['“Nope, I’m good!”', 'Ask 2–3 thoughtful questions you prepared', 'Ask only about salary and vacation'], answer: 1,
        fact: 'Having no questions can come across as not interested. Good questions show you’re already picturing yourself in the role.' },
      { talk: 'If you could master any skill overnight, what would it be?' },
      { q: 'Which is more likely to get you hired?', options: ['Sending 100 applications on job boards', 'A referral from someone inside the company', 'A really fancy résumé font'], answer: 1,
        fact: 'Referred candidates are hired at much higher rates than job-board applicants. Your network really is your net worth.' },
    ],
  },
  {
    name: 'Relationships', emoji: '❤️', tip: 'relationship lesson', color: '#db2777',
    questions: [
      { q: 'How fast do people start forming a first impression of your face?', options: ['In a fraction of a second', 'In about a minute', 'In about 10 minutes'], answer: 0,
        fact: 'Princeton researchers found people make judgments about a face in about a tenth of a second.' },
      { talk: 'Who is someone who changed your life, and how?' },
      { q: 'According to Dale Carnegie, what’s the sweetest sound to anyone?', options: ['“Thank you”', 'Their own name', 'Laughter'], answer: 1,
        fact: 'From How to Win Friends and Influence People (1936). Use people’s names, and remember them!' },
      { talk: 'What’s the best advice you’ve ever received about people?' },
      { q: 'In psychologist Arthur Aron’s famous study, what made strangers feel closer?', options: ['Sitting in silence together', 'Asking each other increasingly personal questions', 'Playing a competitive game'], answer: 1,
        fact: 'Pairs who took turns with 36 increasingly personal questions felt much closer. Curiosity builds connection.' },
    ],
  },
  {
    name: 'Business', emoji: '💡', tip: 'business or productivity tip', color: '#ea580c',
    questions: [
      { q: 'Which company started in a garage in 1994 selling books online?', options: ['eBay', 'Amazon', 'Netflix'], answer: 1,
        fact: 'Jeff Bezos started Amazon in his garage in Bellevue, Washington. It sold only books at first.' },
      { talk: 'If you had to start a business tomorrow with just $100, what would it be?' },
      { q: 'In startups, what does “MVP” stand for?', options: ['Most Valuable Player', 'Minimum Viable Product', 'Maximum Value Promise'], answer: 1,
        fact: 'An MVP is the simplest version you can put in front of real customers so you learn fast and cheap.' },
      { talk: 'What’s a product you love so much you’d tell a stranger about it?' },
      { q: 'Roughly how many new US businesses survive their first year?', options: ['About 1 in 5', 'About half', 'About 4 in 5'], answer: 2,
        fact: 'US Bureau of Labor Statistics data: about 4 in 5 make it through year one, but only about half reach year five.' },
    ],
  },
  {
    name: 'Faith', emoji: '✝️', tip: 'faith lesson', color: '#7c3aed',
    questions: [
      { q: 'What is the shortest verse in most English Bibles?', options: ['“Jesus wept.”', '“God is love.”', '“Pray without ceasing.”'], answer: 0,
        fact: 'John 11:35, just two words, when Jesus wept at the death of His friend Lazarus.' },
      { talk: 'What’s a verse, quote or prayer that got you through a hard time?' },
      { q: 'How many books are in the Protestant Bible?', options: ['39', '66', '73'], answer: 1,
        fact: '39 in the Old Testament + 27 in the New Testament = 66. Catholic Bibles have 73.' },
      { talk: 'Where or when do you feel most at peace?' },
      { q: 'Which book of the Bible has the most chapters?', options: ['Genesis', 'Psalms', 'Isaiah'], answer: 1,
        fact: 'Psalms has 150 chapters. It’s the Bible’s songbook.' },
    ],
  },
  {
    name: 'Purpose', emoji: '🧭', tip: 'lesson about finding your direction', color: '#0891b2',
    questions: [
      { q: 'The Japanese word “ikigai” roughly means…', options: ['A reason for being', 'Hard work', 'Early retirement'], answer: 0,
        fact: 'Your ikigai is the reason you get up in the morning.' },
      { talk: 'What would you do if you knew you couldn’t fail?' },
      { q: 'About how old was Colonel Sanders when he started franchising KFC?', options: ['25', '40', '62'], answer: 2,
        fact: 'He started franchising his chicken recipe in 1952, at 62. It’s never too late. 🍗' },
      { talk: 'What did 10-year-old you want to be when you grew up?' },
      { q: 'Which book, by a Holocaust survivor, argues that finding meaning helps people endure almost anything?', options: ['Man’s Search for Meaning', 'The Alchemist', 'Think and Grow Rich'], answer: 0,
        fact: 'Viktor Frankl wrote it in 1946: “Those who have a ‘why’ to live can bear with almost any ‘how.’” (quoting Nietzsche).' },
    ],
  },
];

// Question round for categories the host adds on the Setup tab
const GENERAL_QUESTIONS = [
  { q: 'Which food can stay edible for thousands of years?', options: ['Bread', 'Honey', 'Cheese'], answer: 1,
    fact: 'Archaeologists have found pots of honey in ancient Egyptian tombs that were still edible. 🍯' },
  { talk: 'What’s one small habit that has made a big difference in your life?' },
  { q: 'How long does sunlight take to reach Earth?', options: ['About 8 seconds', 'About 8 minutes', 'About 8 hours'], answer: 1,
    fact: 'About 8 minutes and 20 seconds. The sunlight you see right now left the Sun before this activity started! ☀️' },
  { talk: 'What’s the best piece of advice you’ve ever received?' },
  { q: 'How many hearts does an octopus have?', options: ['1', '2', '3'], answer: 2,
    fact: 'Three! Two pump blood through the gills and one pumps it around the rest of the body. 🐙' },
];
// Colors handed to new categories in order (the built-in six keep their own)
const EXTRA_COLORS = ['#b45309', '#0f766e', '#be123c', '#4f46e5', '#65a30d', '#c026d3', '#0369a1', '#a16207', '#9f1239', '#15803d', '#6d28d9', '#b91c1c'];
const DEFAULT_SETUP = () => ({ categories: BUILT_IN.map((c) => ({ ...c })), maxTeam: 6, autoTeams: 60 });

// state.setup is what the host chose on the Setup tab: { categories: [...], maxTeam }.
// state.people maps a device id to { cat: category index, name, at: join time, team } (team is set once teams are formed).
// state.teamsFormed flips when the host taps "Form teams"; later arrivals are slotted into a team right away.
// state.zones holds each category's meeting spot in the room (e.g. "Left row"), set on the host screen.
// state.tips holds each team's best tip for the projector's Tip Wall, newest first.
// state.brand is the look set on the Setup tab: event title, two colors, and an optional logo (data URL).
// People can also add { email } (optional, for getting the Tip Wall), { score: { right, total } } from the quiz,
// and { feedback: { fun: 1-5, again: 'yes' | 'maybe' | 'no', comment } } from the end screen.
const DEFAULT_BRAND = () => ({ title: 'Find Your People', gold: '#d4a537', bg: '#0b0b0b', logo: '', logoAt: 0 });
const EMPTY = (setup = DEFAULT_SETUP(), zones = setup.categories.map(() => ''), brand = DEFAULT_BRAND()) =>
  ({ people: {}, tips: [], teamsFormed: false, zones, setup, brand });
let state = EMPTY();

// Load saved data before the server starts. If the database can't be reached, retry, then give up and exit
// (Render restarts the app) rather than start empty and overwrite the saved event with nothing.
async function load() {
  for (let attempt = 1; ; attempt++) {
    try {
      const [saved, brand] = await Promise.all([storage.get('state'), storage.get('brand')]);
      if (saved && saved.people && saved.tips) state = { ...EMPTY(), ...saved };
      state.brand = { ...DEFAULT_BRAND(), ...(brand || (saved && saved.brand)) };
      return;
    } catch (e) {
      console.error('Loading saved data failed (attempt ' + attempt + '): ' + e.message);
      if (attempt === 5) {
        console.error('❌ Could not reach the database, so the app did not start (this protects your saved data). ' +
          (storage.setupProblem() || 'Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Render > Environment, ' +
          'or remove both to run without a database.') + ' [Node ' + process.version + ']');
        throw e;
      }
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
}

// Saving is batched: a burst of changes becomes one write about a second later. Writes never overlap,
// so an older snapshot can't land after a newer one. The brand (with its logo) is saved separately, only
// when it changes, to keep these frequent writes small.
let dirty = false, saving = false, timer = null, saveError = null;
function save() {
  dirty = true;
  if (!timer) timer = setTimeout(flush, 800);
}
async function flush() {
  timer = null;
  if (!dirty) return;
  if (saving) { timer = setTimeout(flush, 300); return; }
  saving = true;
  dirty = false;
  const { brand, ...rest } = state;
  try {
    await storage.set('state', rest);
    saveError = null;
  } catch (e) {
    dirty = true;
    saveError = e.message;
    console.error('Save failed, retrying: ' + e.message);
    if (!timer) timer = setTimeout(flush, 3000);
  } finally {
    saving = false;
  }
}
const saveBrand = () => storage.set('brand', state.brand);

// Render stops the app with SIGTERM on redeploys and restarts: write any pending changes first
process.on('SIGTERM', async () => {
  clearTimeout(timer);
  while (saving) await new Promise((r) => setTimeout(r, 100));
  await flush();
  process.exit(0);
});

// The active category list and team size
const cats = () => state.setup.categories;
const maxTeam = () => state.setup.maxTeam;

// Phone ids are random UUIDs; rejecting anything else also blocks keys like __proto__
const validId = (id) => typeof id === 'string' && /^[A-Za-z0-9-]{8,100}$/.test(id);
const clean = (text, max) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);

// People in a category, in the order they joined
const peopleIn = (i) => Object.values(state.people).filter((p) => p.cat === i);
const membersOf = (i) => peopleIn(i).map((p) => p.name);

// Split every category into the fewest teams of at most 6, as evenly as possible
// (e.g. 7 people -> 4 + 3, 13 people -> 5 + 4 + 4).
function formTeams() {
  cats().forEach((_, i) => {
    const people = peopleIn(i);
    const teams = Math.max(1, Math.ceil(people.length / maxTeam()));
    people.forEach((p, k) => (p.team = (k % teams) + 1));
  });
  state.teamsFormed = true;
  state.tips = []; // tips are per team, so start the Tip Wall fresh
  save();
}

// Teams form on their own once scanning goes quiet: `autoTeams` seconds after the last new person
// (set on the Setup tab; 0 means only when the host taps Form teams). Nobody waits on the host.
const autoTeams = () => (state.setup.autoTeams === undefined ? 60 : state.setup.autoTeams);
let autoTimer = null;
function autoTeamsAt() {
  const people = Object.values(state.people);
  if (state.teamsFormed || !autoTeams() || !people.length) return null;
  return Math.max(...people.map((p) => p.at || 0)) + autoTeams() * 1000;
}
function scheduleAutoTeams() {
  clearTimeout(autoTimer);
  const at = autoTeamsAt();
  if (at) autoTimer = setTimeout(() => { if (autoTeamsAt() && autoTeamsAt() <= Date.now() + 50) formTeams(); }, Math.max(0, at - Date.now()));
}

// Late arrival after teams are formed: join the smallest team in the category, or start a new one if all are full.
function slotIntoTeam(person) {
  const sizes = {};
  for (const p of peopleIn(person.cat)) if (p !== person && p.team) sizes[p.team] = (sizes[p.team] || 0) + 1;
  const smallest = Object.keys(sizes).map(Number).sort((a, b) => sizes[a] - sizes[b] || a - b)[0];
  person.team = smallest && sizes[smallest] < maxTeam() ? smallest : Object.keys(sizes).length + 1;
}

function teamsOf(i) {
  const teams = {};
  for (const p of peopleIn(i)) if (p.team) (teams[p.team] = teams[p.team] || []).push(p.name);
  return Object.keys(teams).map(Number).sort((a, b) => a - b).map((team) => ({ team, members: teams[team] }));
}

// Put the newcomer in the smallest category; ties go to the earliest one in the list.
// This fills categories in order (Money, Career, ...) and wraps around, so extra
// people spill into the next category and no category is ever more than 1 bigger than another.
function assign(id, name) {
  let person = state.people[id];
  if (!person) {
    const counts = cats().map((_, i) => membersOf(i).length);
    person = state.people[id] = { cat: counts.indexOf(Math.min(...counts)), name, at: Date.now() };
    if (state.teamsFormed) slotIntoTeam(person);
    else scheduleAutoTeams(); // each new scan pushes automatic team forming back
    save();
  } else if (name && name !== person.name) {
    person.name = name;
    save();
  }
  return group(id);
}

// Tips are one per team once teams exist, otherwise one per phone
const tipKey = (id) => {
  const p = state.people[id];
  return p.team ? 'team:' + p.cat + ':' + p.team : 'id:' + id;
};

// What a phone needs: its category, meeting spot, team and teammates (once formed), and its team's tip.
function group(id) {
  const person = state.people[id];
  if (!person) return null;
  const tip = state.tips.find((t) => t.key === tipKey(id));
  const teammates = person.team ? peopleIn(person.cat).filter((p) => p.team === person.team).map((p) => p.name) : [];
  return {
    ...cats()[person.cat], you: person.name, count: membersOf(person.cat).length, zone: state.zones[person.cat],
    team: person.team || null, teammates, sentTip: tip ? tip.text : null, sentBy: tip ? tip.name : null,
    teamsIn: autoTeamsAt() && Math.max(0, Math.ceil((autoTeamsAt() - Date.now()) / 1000)), // seconds until teams form, or null
  };
}

// One tip per team (or per phone before teams exist); sending again replaces it.
function addTip(id, text) {
  const person = state.people[id], key = tipKey(id);
  state.tips = state.tips.filter((t) => t.key !== key);
  state.tips.unshift({ key, cat: person.cat, team: person.team || null, name: person.name, text, at: Date.now() });
  save();
}

// Quiz leaderboard: one row per team (or per category before teams are formed), ranked by % correct
function leaderboard() {
  const rows = {};
  for (const p of Object.values(state.people)) {
    const key = p.cat + ':' + (p.team || 0);
    const row = rows[key] = rows[key] || { cat: p.cat, team: p.team || null, members: 0, done: 0, right: 0, total: 0 };
    row.members++;
    if (p.score) { row.done++; row.right += p.score.right; row.total += p.score.total; }
  }
  return Object.values(rows).filter((r) => r.done)
    .map((r) => ({ ...r, pct: Math.round((100 * r.right) / r.total), name: cats()[r.cat].name, emoji: cats()[r.cat].emoji, color: cats()[r.cat].color }))
    .sort((a, b) => b.pct - a.pct || b.done - a.done);
}

// A session (the live one, or an archived one) as a spreadsheet (CSV).
// Cells starting with = + - @ are prefixed so Excel won't run them as formulas.
function exportCsv(s = state) {
  const cell = (v) => {
    let t = String(v == null ? '' : v);
    if (/^[=+\-@]/.test(t)) t = "'" + t;
    return '"' + t.replace(/"/g, '""') + '"';
  };
  const list = s.setup.categories;
  const tipFor = (p) => s.tips.find((t) => t.cat === p.cat && (p.team ? t.team === p.team : t.key === 'id:' + p.id));
  const rows = [['Name', 'Category', 'Team', 'Joined at', 'Quiz score', 'Email (opted in)', 'Team tip', 'Tip sent by',
    'Fun rating (1-5)', 'Want it again?', 'Suggestion']];
  for (const [id, p] of Object.entries(s.people)) {
    const tip = tipFor({ ...p, id }), f = p.feedback || {};
    rows.push([p.name, list[p.cat].name, p.team || '', p.at ? new Date(p.at).toISOString() : '',
      p.score ? p.score.right + '/' + p.score.total : '', p.email || '', tip ? tip.text : '', tip ? tip.name : '',
      f.fun || '', f.again || '', f.comment || '']);
  }
  return rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

// Headline numbers for a session: shown on Live Data and saved with each archived session
function summary(s = state) {
  const people = Object.values(s.people);
  const rated = people.filter((p) => p.feedback);
  const again = { yes: 0, maybe: 0, no: 0 };
  for (const p of rated) again[p.feedback.again]++;
  const teams = new Set(people.filter((p) => p.team).map((p) => p.cat + ':' + p.team));
  return {
    total: people.length,
    teams: teams.size,
    tips: s.tips.length,
    quizDone: people.filter((p) => p.score).length,
    emails: people.filter((p) => p.email).length,
    feedback: rated.length,
    funAvg: rated.length ? Math.round((10 * rated.reduce((n, p) => n + p.feedback.fun, 0)) / rated.length) / 10 : null,
    again,
  };
}

// One event's numbers for the pilot report, plus its written feedback and tips (the report quotes a few)
function reportRow(s, meta) {
  const people = Object.values(s.people);
  return {
    ...meta,
    ...summary(s),
    comments: people.filter((p) => p.feedback && p.feedback.comment).map((p) => ({ text: p.feedback.comment, fun: p.feedback.fun })),
    tipList: s.tips.map((t) => ({ text: t.text, category: s.setup.categories[t.cat].name, emoji: s.setup.categories[t.cat].emoji })),
  };
}

// Every archived session, plus the live one if anyone has joined it
async function pilotReport() {
  const sessions = (await storage.get('sessions')) || [];
  const rows = [];
  for (const meta of sessions) {
    const s = await storage.get('session-' + meta.id);
    if (s) rows.push(reportRow(s, { id: meta.id, title: meta.title, startedAt: meta.startedAt, attendance: meta.attendance || null }));
  }
  const live = Object.values(state.people);
  if (live.length) {
    rows.unshift(reportRow(state, { id: 'live', title: state.brand.title + ' (in progress)', attendance: state.attendance || null,
      startedAt: Math.min(...live.map((p) => p.at || Date.now())) }));
  }
  return { rows, brand: publicBrand() };
}

// "How many people were in the room" for an event (the app can't know), used for the report's scan rate
async function setAttendance(id, count) {
  if (id === 'live') { state.attendance = count; save(); return; }
  const sessions = (await storage.get('sessions')) || [];
  const meta = sessions.find((m) => m.id === id);
  if (!meta) throw new Error('Session not found');
  meta.attendance = count;
  await storage.set('sessions', sessions);
}

// Reset files the finished session under "Past sessions" first, so pilot data is never thrown away
async function archiveSession() {
  const people = Object.values(state.people);
  if (!people.length) return;
  const id = new Date().toISOString().replace(/[:.]/g, '-');
  const { brand, ...rest } = state;
  await storage.set('session-' + id, rest);
  const sessions = (await storage.get('sessions')) || [];
  sessions.unshift({ id, title: state.brand.title, startedAt: Math.min(...people.map((p) => p.at || Date.now())), endedAt: Date.now(),
    attendance: state.attendance || null, ...summary() });
  await storage.set('sessions', sessions);
}

function publicBrand() {
  const { title, gold, bg, logo, logoAt } = state.brand;
  return { title, gold, bg, logo: logo ? '/logo?v=' + logoAt : '' };
}

// Title, colors and logo from the Setup tab. The logo arrives as a data URL (PNG, JPEG, SVG or WebP, up to ~300 KB).
function applyBrand(body) {
  const color = (c, fallback) => (/^#[0-9a-f]{6}$/i.test(c) ? c : fallback);
  const b = state.brand;
  b.title = clean(body.title, 40) || 'Find Your People';
  b.gold = color(body.gold, b.gold);
  b.bg = color(body.bg, b.bg);
  if (body.logo === '') { b.logo = ''; b.logoAt = Date.now(); }
  else if (typeof body.logo === 'string' && body.logo !== 'keep') {
    if (!/^data:image\/(png|jpeg|svg\+xml|webp);base64,[A-Za-z0-9+/=]+$/.test(body.logo)) return 'Logo must be a PNG, JPG, SVG or WebP image.';
    b.logo = body.logo; b.logoAt = Date.now();
  }
  return null;
}

function stats() {
  return {
    total: Object.keys(state.people).length,
    teamsFormed: state.teamsFormed,
    teamCount: cats().reduce((n, _, i) => n + teamsOf(i).length, 0),
    joinTimes: Object.values(state.people).map((p) => p.at).filter(Boolean).sort((a, b) => a - b), // for the live data chart
    now: Date.now(),
    maxTeam: maxTeam(),
    autoTeams: autoTeams(),
    teamsAt: autoTeamsAt(), // when teams will form automatically (server clock), or null
    categories: cats().map((cat, i) => {
      const members = membersOf(i);
      return { name: cat.name, emoji: cat.emoji, color: cat.color, count: members.length, members, zone: state.zones[i], teams: teamsOf(i) };
    }),
    leaderboard: leaderboard(),
    quizDone: Object.values(state.people).filter((p) => p.score).length,
    emailCount: Object.values(state.people).filter((p) => p.email).length, // a count only: emails stay out of this public endpoint
    feedback: (({ feedback, funAvg, again }) => ({ count: feedback, funAvg, again }))(summary()), // totals only, no comments
    storage: storage.kind, // 'database' (survives restarts) or 'temporary'
    saveError: !!saveError,
    tips: state.tips.map(({ cat, team, name, text, at }) => ({
      name: cats()[cat].name, emoji: cats()[cat].emoji, color: cats()[cat].color, team, by: name, text, at,
    })),
  };
}

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

function readBody(req, limit = 1e4) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; if (data.length > limit) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

// Host Setup tab: categories (name, emoji, tip wording) and max team size. Built-in categories (even renamed)
// keep their color and questions; new ones get the next extra color and the general questions.
function applySetup(body) {
  const list = Array.isArray(body.categories) ? body.categories : [];
  let extra = 0;
  const categories = [];
  for (const c of list.slice(0, 12)) {
    const name = clean(c && c.name, 24);
    if (!name || categories.some((x) => x.name.toLowerCase() === name.toLowerCase())) continue;
    // `base` is the built-in category a row started from, so a renamed one (Career -> Jobs) keeps its questions
    const base = BUILT_IN.find((b) => b.name === (c.base || name) || b.name.toLowerCase() === name.toLowerCase());
    categories.push({
      name,
      emoji: clean(c.emoji, 8) || (base ? base.emoji : '⭐'),
      tip: clean(c.tip, 60) || (base ? base.tip : 'tip about ' + name.toLowerCase()),
      color: base ? base.color : EXTRA_COLORS[extra++ % EXTRA_COLORS.length],
      questions: base ? base.questions : GENERAL_QUESTIONS,
      base: base ? base.name : null,
    });
  }
  if (categories.length < 2) return 'Choose at least 2 categories.';
  const size = Math.round(Number(body.maxTeam));
  if (!(size >= 3 && size <= 10)) return 'Team size must be between 3 and 10.';
  const auto = Number(body.autoTeams);
  if (![0, 30, 60, 120, 180].includes(auto)) return 'Pick when teams should form.';
  // Keep each category's meeting spot if it's still in the list
  const oldZones = Object.fromEntries(cats().map((c, i) => [c.name.toLowerCase(), state.zones[i]]));
  state = EMPTY({ categories, maxTeam: size, autoTeams: auto }, categories.map((c) => oldZones[c.name.toLowerCase()] || ''), state.brand);
  save();
  return null;
}

const PAGES = { '/': 'index.html', '/host': 'host.html', '/report': 'report.html', '/qrcode.js': 'qrcode.js' };

async function handle(req, res) {
  const url = new URL(req.url, 'http://x');

  if (req.method === 'POST' && url.pathname === '/api/join') {
    const { id, name } = await readBody(req);
    if (!validId(id)) return send(res, 400, { error: 'Bad id' });
    if (!clean(name, 30)) return send(res, 400, { error: 'Missing name' });
    return send(res, 200, assign(id, clean(name, 30)));
  }
  if (req.method === 'GET' && url.pathname === '/api/group') {
    const id = url.searchParams.get('id');
    const g = validId(id) && group(id);
    return g ? send(res, 200, g) : send(res, 404, { error: 'Not signed up' });
  }
  if (req.method === 'POST' && url.pathname === '/api/tip') {
    const { id, text } = await readBody(req);
    if (!validId(id) || !state.people[id]) return send(res, 404, { error: 'Not signed up' });
    if (!clean(text, 200)) return send(res, 400, { error: 'Missing tip' });
    addTip(id, clean(text, 200));
    return send(res, 200, group(id));
  }
  if (req.method === 'POST' && ['/api/score', '/api/email', '/api/feedback'].includes(url.pathname)) {
    const body = await readBody(req);
    const person = validId(body.id) && state.people[body.id];
    if (!person) return send(res, 404, { error: 'Not signed up' });
    if (url.pathname === '/api/score') {
      const right = Math.round(Number(body.right)), total = Math.round(Number(body.total));
      if (!(total >= 1 && total <= 20 && right >= 0 && right <= total)) return send(res, 400, { error: 'Bad score' });
      person.score = { right, total };
    } else if (url.pathname === '/api/feedback') {
      const fun = Math.round(Number(body.fun));
      if (!(fun >= 1 && fun <= 5) || !['yes', 'maybe', 'no'].includes(body.again)) return send(res, 400, { error: 'Pick a rating and an answer.' });
      person.feedback = { fun, again: body.again, comment: clean(body.comment, 300) };
    } else {
      const email = clean(body.email, 100);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: 'That email doesn’t look right.' });
      person.email = email;
    }
    save();
    return send(res, 200, { ok: true });
  }
  if (req.method === 'GET' && url.pathname === '/api/brand') return send(res, 200, publicBrand());
  if (req.method === 'GET' && url.pathname === '/logo') {
    const m = /^data:(image\/[a-z+]+);base64,(.*)$/.exec(state.brand.logo || '');
    if (!m) return send(res, 404, 'No logo', 'text/plain');
    // The CSP stops an uploaded SVG from running scripts
    res.writeHead(200, { 'Content-Type': m[1], 'Cache-Control': 'public, max-age=31536000', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" });
    return res.end(Buffer.from(m[2], 'base64'));
  }
  // Category list for the phone's shuffle animation
  if (req.method === 'GET' && url.pathname === '/api/categories') return send(res, 200, cats().map(({ name, emoji, color }) => ({ name, emoji, color })));
  if (req.method === 'GET' && url.pathname === '/api/setup') {
    return send(res, 200, { categories: cats().map(({ name, emoji, tip, base }) => ({ name, emoji, tip, base: base === undefined ? name : base })), maxTeam: maxTeam(), autoTeams: autoTeams(),
      builtIn: BUILT_IN.map(({ name, emoji, tip }) => ({ name, emoji, tip, base: name })), locked: Object.keys(state.people).length > 0 });
  }
  if (req.method === 'GET' && url.pathname === '/api/stats') return send(res, 200, stats());
  if (req.method === 'POST' && url.pathname.startsWith('/api/host/')) {
    const body = await readBody(req, 5e5); // room for a logo upload
    if (HOST_PIN && body.pin !== HOST_PIN) return send(res, 403, { error: 'Wrong PIN' });
    const action = url.pathname.slice('/api/host/'.length);
    if (action === 'reset') {
      // Archive first; if that fails, keep the live session rather than lose it
      try { await archiveSession(); } catch (e) {
        console.error('Archiving failed: ' + e.message);
        return send(res, 503, { error: 'Couldn’t save this session, so nothing was cleared. Try again in a moment.' });
      }
      state = EMPTY(state.setup, state.zones, state.brand); // keep setup, meeting spots and brand
      scheduleAutoTeams(); // no one here yet, so this just clears any pending timer
      save();
    }
    else if (action === 'setup') {
      if (Object.keys(state.people).length) return send(res, 409, { error: 'People have already joined. Reset first, then change the setup.' });
      const problem = applySetup(body);
      if (problem) return send(res, 400, { error: problem });
    }
    else if (action === 'teams') formTeams();
    else if (action === 'brand') {
      const problem = applyBrand(body);
      if (problem) return send(res, 400, { error: problem });
      await saveBrand();
      return send(res, 200, publicBrand());
    }
    else if (action === 'sessions') return send(res, 200, (await storage.get('sessions')) || []);
    else if (action === 'report') return send(res, 200, await pilotReport());
    else if (action === 'attendance') {
      const count = Math.round(Number(body.count));
      if (!(count >= 0 && count <= 100000) || typeof body.id !== 'string' || !/^(live|[0-9TZ-]{10,40})$/.test(body.id)) return send(res, 400, { error: 'Bad number' });
      try { await setAttendance(body.id, count || null); } catch (e) { return send(res, 404, { error: e.message }); }
      return send(res, 200, { ok: true });
    }
    else if (action === 'export') {
      // The live session, or a past one by id
      let s = state;
      if (body.session) {
        if (!/^[0-9TZ-]{10,40}$/.test(body.session)) return send(res, 400, { error: 'Bad session' });
        s = await storage.get('session-' + body.session);
        if (!s) return send(res, 404, { error: 'Session not found' });
      }
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end('﻿' + exportCsv(s)); // BOM so Excel reads emoji and accents correctly
    }
    else if (action === 'zones' && Array.isArray(body.zones)) { state.zones = cats().map((_, i) => clean(body.zones[i], 40)); save(); }
    else return send(res, 400, { error: 'Unknown action' });
    return send(res, 200, stats());
  }
  if (req.method === 'GET' && PAGES[url.pathname]) {
    return fs.readFile(path.join(__dirname, 'public', PAGES[url.pathname]), (err, html) =>
      err ? send(res, 500, 'Error', 'text/plain')
        : send(res, 200, html, url.pathname.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8'));
  }
  send(res, 404, 'Not found', 'text/plain');
}

// Load saved data first, then start taking requests
load().then(() => {
  scheduleAutoTeams(); // pick up a countdown that was running before a restart
  http.createServer((req, res) => handle(req, res).catch((e) => {
    console.error(e);
    if (!res.headersSent) send(res, 500, { error: 'Something went wrong. Try again.' });
  })).listen(PORT, () => console.log(`RoomSpark running on http://localhost:${PORT} (host screen: /host). Data: ${storage.kind}`));
}).catch(() => process.exit(1));
