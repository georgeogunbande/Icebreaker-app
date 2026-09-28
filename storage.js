// Where the app keeps its data.
// - With UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set: an Upstash Redis database, which survives
//   restarts and redeploys (use this on Render).
// - Without them: JSON files in DATA_DIR. Fine on your own computer, but wiped whenever Render restarts the app.
const fs = require('fs');
const path = require('path');

// Forgive common copy-paste slips: spaces, surrounding quotes, a missing https://, a trailing slash
const tidy = (v) => String(v || '').trim().replace(/^["']+|["']+$/g, '').trim();
let DB_URL = tidy(process.env.UPSTASH_REDIS_REST_URL);
const DB_TOKEN = tidy(process.env.UPSTASH_REDIS_REST_TOKEN);
if (DB_URL && !/^[a-z]+:\/\//i.test(DB_URL)) DB_URL = 'https://' + DB_URL;
DB_URL = DB_URL.replace(/\/+$/, '');
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PREFIX = 'icebreaker:';
const kind = DB_URL && DB_TOKEN ? 'database' : 'temporary';

// Explain setup mistakes in plain words in the Render logs
function setupProblem() {
  if (!DB_URL && !DB_TOKEN) return null; // no database configured: temporary storage, nothing to fix
  if (!DB_URL !== !DB_TOKEN) return 'Only one of UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN is set. Add both in Render > Environment.';
  if (/^rediss?:\/\//i.test(DB_URL)) return 'UPSTASH_REDIS_REST_URL is the redis:// address. Use the REST URL instead: it starts with https:// and is under "REST API" on the Upstash database page.';
  if (!/^https:\/\/[^/\s]+\.upstash\.io$/i.test(DB_URL)) return 'UPSTASH_REDIS_REST_URL should look like https://your-db-12345.upstash.io (from "REST API" on the Upstash database page). It is currently: ' + DB_URL;
  return null;
}
if (setupProblem()) console.error('⚠️ Database setup: ' + setupProblem());

// One Redis command over Upstash's REST API, e.g. ['GET', 'key']
async function redis(command) {
  const res = await fetch(DB_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DB_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(10000),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) {
    throw new Error('Upstash rejected the token (HTTP ' + res.status + '). Copy UPSTASH_REDIS_REST_TOKEN again from "REST API" on the Upstash ' +
      'database page. Use the main token, not the read-only one.');
  }
  if (!res.ok || body.error) throw new Error('Upstash: ' + (body.error || 'HTTP ' + res.status));
  return body.result;
}

// Keys are simple names like "state" or "session-2026-10-04T18-30-00-000Z"
async function get(key) {
  if (kind === 'database') {
    const text = await redis(['GET', PREFIX + key]);
    return text == null ? null : JSON.parse(text);
  }
  try {
    return JSON.parse(await fs.promises.readFile(path.join(DIR, key + '.json'), 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

async function set(key, value) {
  const text = JSON.stringify(value);
  if (kind === 'database') return redis(['SET', PREFIX + key, text]);
  await fs.promises.mkdir(DIR, { recursive: true });
  const file = path.join(DIR, key + '.json');
  await fs.promises.writeFile(file + '.tmp', text); // write then rename, so a crash never leaves half a file
  await fs.promises.rename(file + '.tmp', file);
}

module.exports = { get, set, kind, setupProblem };
