// Icebreaker app: participants scan a QR code and are assigned a category in rotation,
// so groups stay balanced. No dependencies — run with `node server.js`.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST_PIN = process.env.HOST_PIN || ''; // optional PIN required to reset
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');

const CATEGORIES = [
  { name: 'Money', prompt: 'Share one practical money lesson.', color: '#16a34a' },
  { name: 'Career', prompt: 'Share one skill or work lesson.', color: '#2563eb' },
  { name: 'Relationships', prompt: 'Share one lesson about people.', color: '#db2777' },
  { name: 'Business', prompt: 'Share one lesson about creating value.', color: '#ea580c' },
  { name: 'Faith', prompt: 'Share one lesson that strengthens faith.', color: '#7c3aed' },
  { name: 'Purpose', prompt: 'Share one lesson about direction.', color: '#0891b2' },
];

// state.people maps a device id to { cat: category index, name: first name }
let state = { people: {} };
try { state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch {}
if (!state.people) state = { people: {} };
const save = () => fs.writeFile(DATA_FILE, JSON.stringify(state), () => {});

const cleanName = (name) => String(name || '').replace(/\s+/g, ' ').trim().slice(0, 30);

function membersOf(i) {
  return Object.values(state.people).filter((p) => p.cat === i).map((p) => p.name);
}

// Put the newcomer in the smallest category; ties go to the earliest one in the list.
// This fills categories in order (Money, Career, ...) and wraps around, so extra
// people spill into the next category and no group is ever more than 1 bigger than another.
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

// A person's category plus everyone else in it, or null if they aren't signed up.
function group(id) {
  const person = state.people[id];
  if (!person) return null;
  return { ...CATEGORIES[person.cat], you: person.name, members: membersOf(person.cat) };
}

function stats() {
  return {
    total: Object.keys(state.people).length,
    categories: CATEGORIES.map((cat, i) => {
      const members = membersOf(i);
      return { ...cat, count: members.length, members };
    }),
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

const PAGES = { '/': 'index.html', '/host': 'host.html', '/qrcode.js': 'qrcode.js' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');

  if (req.method === 'POST' && url.pathname === '/api/join') {
    const { id, name } = await readBody(req);
    if (typeof id !== 'string' || !id || id.length > 100) return send(res, 400, { error: 'Missing id' });
    if (!cleanName(name)) return send(res, 400, { error: 'Missing name' });
    return send(res, 200, assign(id, cleanName(name)));
  }
  if (req.method === 'GET' && url.pathname === '/api/group') {
    const g = group(url.searchParams.get('id'));
    return g ? send(res, 200, g) : send(res, 404, { error: 'Not signed up' });
  }
  if (req.method === 'GET' && url.pathname === '/api/stats') return send(res, 200, stats());
  if (req.method === 'POST' && url.pathname === '/api/reset') {
    const { pin } = await readBody(req);
    if (HOST_PIN && pin !== HOST_PIN) return send(res, 403, { error: 'Wrong PIN' });
    state = { people: {} };
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
