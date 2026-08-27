// Public, unauthenticated proxy for real, free threat-intelligence feeds.
// Runs server-side because both source feeds either lack CORS headers for
// direct browser fetches or are too large to reasonably download client-side
// on every page view. This function fetches them, trims to the newest
// handful of entries, and re-serves a small shaped JSON payload.
//
// Sources (both genuinely real, live, free, no API key required):
//   - OpenPhish community feed: live phishing URLs, refreshed regularly.
//   - abuse.ch URLhaus: live malware-distribution/botnet-infrastructure
//     URLs. Note this feed does NOT itself track phishing — it's shown
//     separately as "malware & botnet infrastructure" so the two data
//     sources aren't conflated.
//
// Results are cached in-module for a few minutes (matches the upstream
// feeds' own cache windows) so repeated page views don't re-download the
// multi-megabyte URLhaus feed on every request.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const CACHE_TTL_MS = 3 * 60 * 1000;
// Lives in memory for as long as this function instance stays warm —
// resets if Deno spins up a fresh instance, which is fine since it'll
// just refetch once.
let cache: { at: number; body: unknown } | null = null;

// Small helper so every response below is valid JSON with the right headers.
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// Pulls just the domain out of a full URL, e.g.
// "https://evil.example.com/login" -> "evil.example.com".
function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

// URLhaus tags a URL with every malware family/architecture it matches
// (e.g. ["elf","mirai","32-bit"]) — pick the most human-recognizable one
// to show as a single label.
const KNOWN_FAMILIES = ['Mirai', 'Mozi', 'ClearFake', 'Amadey', 'Gafgyt', 'QakBot', 'Emotet', 'Loader'];
function familyOf(tags: string[]) {
  const hit = tags.find((t) => KNOWN_FAMILIES.some((f) => f.toLowerCase() === t.toLowerCase()));
  return hit ?? tags[0] ?? 'Unclassified';
}

async function fetchPhishing() {
  const res = await fetch('https://openphish.com/feed.txt');
  if (!res.ok) return [];
  const text = await res.text();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  // The feed has no per-entry timestamp, so a random sample is as
  // representative as "the top N" — shuffle lightly by taking a spread
  // across the file rather than always the same first 18 lines.
  const picked: string[] = [];
  const step = Math.max(1, Math.floor(lines.length / 18));
  for (let i = 0; i < lines.length && picked.length < 18; i += step) picked.push(lines[i]);
  return picked.map((url) => ({ url, host: hostOf(url), source: 'OpenPhish' }));
}

async function fetchMalware() {
  const res = await fetch('https://urlhaus.abuse.ch/downloads/json_recent/');
  if (!res.ok) return [];
  const data = await res.json();
  const entries: any[] = [];
  for (const k in data) entries.push(...data[k]);
  entries.sort((a, b) => String(b.dateadded).localeCompare(String(a.dateadded)));
  return entries.slice(0, 18).map((e) => ({
    url: e.url,
    host: hostOf(e.url),
    family: familyOf(e.tags ?? []),
    dateAdded: String(e.dateadded).replace(' ', 'T').replace(' UTC', 'Z'),
    link: e.urlhaus_link,
    source: 'URLhaus (abuse.ch)',
  }));
}

// The actual function entry point — runs once per request.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS }); // browser's CORS preflight check
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  // Serve the cached copy if it's still fresh — avoids re-downloading the
  // (multi-megabyte) upstream feeds on every single page view.
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return json(cache.body);
  }

  try {
    const [phishing, malware] = await Promise.all([fetchPhishing(), fetchMalware()]);
    const body = { generatedAt: new Date().toISOString(), phishing, malware };
    cache = { at: Date.now(), body };
    return json(body);
  } catch (err) {
    if (cache) return json(cache.body); // serve stale rather than fail
    return json({ error: err.message ?? 'Unexpected error' }, 500);
  }
});
