// Where the app keeps its data.
// - With UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set: an Upstash Redis database, which survives
//   restarts and redeploys (use this on Render).
// - Without them: JSON files in DATA_DIR. Fine on your own computer, but wiped whenever Render restarts the app.
const fs = require('fs');
const path = require('path');

const DB_URL = process.env.UPSTASH_REDIS_REST_URL;
const DB_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PREFIX = 'icebreaker:';
const kind = DB_URL && DB_TOKEN ? 'database' : 'temporary';

// One Redis command over Upstash's REST API, e.g. ['GET', 'key']
async function redis(command) {
  const res = await fetch(DB_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DB_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(10000),
  });
  const body = await res.json().catch(() => ({}));
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

module.exports = { get, set, kind };
