// "Find Your People" icebreaker: participants scan a QR code and are assigned a category in
// rotation so categories stay balanced, then find 3–6 others with the same one. No dependencies — run with `node server.js`.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST_PIN = process.env.HOST_PIN || ''; // optional PIN required to reset
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');

// `tip` finishes the sentence "Each person shares one ___."
const CATEGORIES = [
  { name: 'Money', emoji: '💰', tip: 'money tip', color: '#16a34a' },
  { name: 'Career', emoji: '💼', tip: 'career tip', color: '#2563eb' },
  { name: 'Relationships', emoji: '❤️', tip: 'relationship lesson', color: '#db2777' },
  { name: 'Business', emoji: '💡', tip: 'business or productivity tip', color: '#ea580c' },
  { name: 'Faith', emoji: '✝️', tip: 'faith lesson', color: '#7c3aed' },
  { name: 'Purpose', emoji: '🧭', tip: 'lesson about finding your direction', color: '#0891b2' },
];

// state.people maps a device id to { cat: category index, name: first name }.
// state.tips holds each group's best tip for the projector's Tip Wall, newest first.
const EMPTY = () => ({ people: {}, tips: [] });
let state = EMPTY();
try { state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch {}
if (!state.people || !state.tips) state = EMPTY();
const save = () => fs.writeFile(DATA_FILE, JSON.stringify(state), () => {});

// Phone ids are random UUIDs; rejecting anything else also blocks keys like __proto__
const validId = (id) => typeof id === 'string' && /^[A-Za-z0-9-]{8,100}$/.test(id);
const clean = (text, max) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);

function membersOf(i) {
  return Object.values(state.people).filter((p) => p.cat === i).map((p) => p.name);
}

// Put the newcomer in the smallest category; ties go to the earliest one in the list.
// This fills categories in order (Money, Career, ...) and wraps around, so extra
// people spill into the next category and no category is ever more than 1 bigger than another.
function assign(id, name) {
  let person = state.people[id];
  if (!person) {
    const counts = CATEGORIES.map((_, i) => membersOf(i).length);
    person = state.people[id] = { cat: counts.indexOf(Math.min(...counts)), name };
    save();
  } else if (name && name !== person.name) {
    person.name = name;
    save();
  }
  return group(id);
}

// A person's category and how many people share it, or null if they aren't signed up.
function group(id) {
  const person = state.people[id];
  if (!person) return null;
  const tip = state.tips.find((t) => t.id === id);
  return { ...CATEGORIES[person.cat], you: person.name, count: membersOf(person.cat).length, sentTip: tip ? tip.text : null };
}

// One tip per phone; sending again replaces it.
function addTip(id, text) {
  const person = state.people[id];
  state.tips = state.tips.filter((t) => t.id !== id);
  state.tips.unshift({ id, cat: person.cat, name: person.name, text, at: Date.now() });
  save();
}

function stats() {
  return {
    total: Object.keys(state.people).length,
    categories: CATEGORIES.map((cat, i) => {
      const members = membersOf(i);
      return { ...cat, count: members.length, members };
    }),
    tips: state.tips.map(({ cat, name, text, at }) => ({ ...CATEGORIES[cat], by: name, text, at })),
  };
}

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; if (data.length > 1e4) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

// Category list for the phone's shuffle animation
const PUBLIC_CATEGORIES = CATEGORIES.map(({ name, emoji, color }) => ({ name, emoji, color }));

const PAGES = { '/': 'index.html', '/host': 'host.html', '/qrcode.js': 'qrcode.js' };

http.createServer(async (req, res) => {
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
  if (req.method === 'GET' && url.pathname === '/api/categories') return send(res, 200, PUBLIC_CATEGORIES);
  if (req.method === 'GET' && url.pathname === '/api/stats') return send(res, 200, stats());
  if (req.method === 'POST' && url.pathname === '/api/reset') {
    const { pin } = await readBody(req);
    if (HOST_PIN && pin !== HOST_PIN) return send(res, 403, { error: 'Wrong PIN' });
    state = EMPTY();
    save();
    return send(res, 200, stats());
  }
  if (req.method === 'GET' && PAGES[url.pathname]) {
    return fs.readFile(path.join(__dirname, 'public', PAGES[url.pathname]), (err, html) =>
      err ? send(res, 500, 'Error', 'text/plain')
        : send(res, 200, html, url.pathname.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8'));
  }
  send(res, 404, 'Not found', 'text/plain');
}).listen(PORT, () => console.log(`Icebreaker running on http://localhost:${PORT} (host screen: /host)`));
