// "Find Your People" icebreaker: participants scan a QR code and are assigned a category in
// rotation so categories stay balanced, then find 3–6 others with the same one. No dependencies — run with `node server.js`.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST_PIN = process.env.HOST_PIN || ''; // optional PIN required to reset
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');

// `tip` finishes the sentence "Each person shares one ___."
// `questions` is the group's fun round: quiz cards (options + index of the answer + a fun fact)
// and talk cards (everyone answers out loud).
const CATEGORIES = [
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

// state.people maps a device id to { cat: category index, name, at: join time, team } (team is set once teams are formed).
// state.teamsFormed flips when the host taps "Form teams"; later arrivals are slotted into a team right away.
// state.zones holds each category's meeting spot in the room (e.g. "Left row"), set on the host screen.
// state.tips holds each team's best tip for the projector's Tip Wall, newest first.
const EMPTY = (zones = CATEGORIES.map(() => '')) => ({ people: {}, tips: [], teamsFormed: false, zones });
let state = EMPTY();
try { state = { ...EMPTY(), ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }; } catch {}
if (!state.people || !state.tips) state = EMPTY();
const save = () => fs.writeFile(DATA_FILE, JSON.stringify(state), () => {});

const MAX_TEAM = 6;

// Phone ids are random UUIDs; rejecting anything else also blocks keys like __proto__
const validId = (id) => typeof id === 'string' && /^[A-Za-z0-9-]{8,100}$/.test(id);
const clean = (text, max) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);

// People in a category, in the order they joined
const peopleIn = (i) => Object.values(state.people).filter((p) => p.cat === i);
const membersOf = (i) => peopleIn(i).map((p) => p.name);

// Split every category into the fewest teams of at most 6, as evenly as possible
// (e.g. 7 people -> 4 + 3, 13 people -> 5 + 4 + 4).
function formTeams() {
  CATEGORIES.forEach((_, i) => {
    const people = peopleIn(i);
    const teams = Math.max(1, Math.ceil(people.length / MAX_TEAM));
    people.forEach((p, k) => (p.team = (k % teams) + 1));
  });
  state.teamsFormed = true;
  state.tips = []; // tips are per team, so start the Tip Wall fresh
  save();
}

// Late arrival after teams are formed: join the smallest team in the category, or start a new one if all are full.
function slotIntoTeam(person) {
  const sizes = {};
  for (const p of peopleIn(person.cat)) if (p !== person && p.team) sizes[p.team] = (sizes[p.team] || 0) + 1;
  const smallest = Object.keys(sizes).map(Number).sort((a, b) => sizes[a] - sizes[b] || a - b)[0];
  person.team = smallest && sizes[smallest] < MAX_TEAM ? smallest : Object.keys(sizes).length + 1;
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
    const counts = CATEGORIES.map((_, i) => membersOf(i).length);
    person = state.people[id] = { cat: counts.indexOf(Math.min(...counts)), name, at: Date.now() };
    if (state.teamsFormed) slotIntoTeam(person);
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
    ...CATEGORIES[person.cat], you: person.name, count: membersOf(person.cat).length, zone: state.zones[person.cat],
    team: person.team || null, teammates, sentTip: tip ? tip.text : null, sentBy: tip ? tip.name : null,
  };
}

// One tip per team (or per phone before teams exist); sending again replaces it.
function addTip(id, text) {
  const person = state.people[id], key = tipKey(id);
  state.tips = state.tips.filter((t) => t.key !== key);
  state.tips.unshift({ key, cat: person.cat, team: person.team || null, name: person.name, text, at: Date.now() });
  save();
}

function stats() {
  return {
    total: Object.keys(state.people).length,
    teamsFormed: state.teamsFormed,
    teamCount: CATEGORIES.reduce((n, _, i) => n + teamsOf(i).length, 0),
    joinTimes: Object.values(state.people).map((p) => p.at).filter(Boolean).sort((a, b) => a - b), // for the live data chart
    now: Date.now(),
    categories: CATEGORIES.map((cat, i) => {
      const members = membersOf(i);
      return { name: cat.name, emoji: cat.emoji, color: cat.color, count: members.length, members, zone: state.zones[i], teams: teamsOf(i) };
    }),
    tips: state.tips.map(({ cat, team, name, text, at }) => ({
      name: CATEGORIES[cat].name, emoji: CATEGORIES[cat].emoji, color: CATEGORIES[cat].color, team, by: name, text, at,
    })),
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
  if (req.method === 'POST' && url.pathname.startsWith('/api/host/')) {
    const body = await readBody(req);
    if (HOST_PIN && body.pin !== HOST_PIN) return send(res, 403, { error: 'Wrong PIN' });
    const action = url.pathname.slice('/api/host/'.length);
    if (action === 'reset') { state = EMPTY(state.zones); save(); } // keep meeting spots: the room layout doesn't change
    else if (action === 'teams') formTeams();
    else if (action === 'zones' && Array.isArray(body.zones)) { state.zones = CATEGORIES.map((_, i) => clean(body.zones[i], 40)); save(); }
    else return send(res, 400, { error: 'Unknown action' });
    return send(res, 200, stats());
  }
  if (req.method === 'GET' && PAGES[url.pathname]) {
    return fs.readFile(path.join(__dirname, 'public', PAGES[url.pathname]), (err, html) =>
      err ? send(res, 500, 'Error', 'text/plain')
        : send(res, 200, html, url.pathname.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8'));
  }
  send(res, 404, 'Not found', 'text/plain');
}).listen(PORT, () => console.log(`Icebreaker running on http://localhost:${PORT} (host screen: /host)`));
