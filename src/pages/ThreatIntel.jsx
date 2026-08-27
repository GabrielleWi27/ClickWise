// Public page: a live view into real phishing/malware infrastructure data
// (via the threat-feed Edge Function), an illustrative activity map, and a
// set of cited facts on what phishing leads to. See threat-feed/index.ts
// for exactly which two free, real sources back the feed panels.
import { useEffect, useState, useCallback } from 'react';
import { fetchThreatFeed } from '../data/threatFeed';
import { formatRelativeTime } from '../utils/activityLog';
import ThreatPulseMap from '../components/ThreatPulseMap';

// Cited, real statistics shown as cards near the bottom of the page —
// each one links phishing to a bigger consequence (ransomware, fraud, etc).
const FACTS = [
  {
    icon: 'material-symbols:person-alert',
    stat: '60%',
    title: 'of breaches involve the human element',
    body: 'Phishing was used as the initial access vector in 16% of all breaches on its own.',
    source: 'Verizon, 2025 Data Breach Investigations Report',
  },
  {
    icon: 'material-symbols:lock-clock',
    stat: '44%',
    title: 'of breaches now involve ransomware',
    body: 'Up from 32% the year before. Phishing/malicious email remains one of ransomware’s top entry vectors.',
    source: 'Verizon 2025 DBIR · Sophos, State of Ransomware 2025',
  },
  {
    icon: 'material-symbols:payments',
    stat: '$3.05B',
    title: 'lost to Business Email Compromise in 2025',
    body: 'From 24,768 reported cases — an average of roughly $123,000 per incident. Phishing-category losses alone grew 208% year over year.',
    source: 'FBI Internet Crime Complaint Center (IC3), 2025 Report',
  },
  {
    icon: 'material-symbols:bug-report',
    stat: 'Emotet',
    title: 'shows how phishing seeds bigger attacks',
    body: 'A banking trojan spread almost entirely through malicious email attachments — later rented out as "access-as-a-service" to deploy ransomware on already-compromised networks.',
    source: 'CISA Alert AA20-280A',
  },
  {
    icon: 'material-symbols:dns',
    stat: 'DDoS',
    title: 'is what botnet malware gets used for',
    body: 'The live feed below tracks real malware families like Mirai and Mozi — once a device is infected with malware like this (however it got in), it can be conscripted into a botnet and used to launch distributed denial-of-service attacks.',
    source: 'abuse.ch URLhaus',
  },
];

// One scrollable card of live feed entries — reused for both the phishing
// list and the malware list below, just with different data/colors/icons.
// `renderItem` lets each caller decide exactly how its own rows look.
function FeedPanel({ title, icon, accent, loading, items, renderItem, emptyLabel }) {
  return (
    <div className="glass-card rounded-[1.5rem] overflow-hidden">
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <div className={`p-2 rounded-xl ${accent.bg} ${accent.text}`}>
          <iconify-icon icon={icon} className="text-lg"></iconify-icon>
        </div>
        <div>
          <h3 className="font-bold font-manrope text-sm">{title}</h3>
          <p className="text-[11px] text-zinc-500">{loading ? 'Loading…' : `${items.length} entries`}</p>
        </div>
      </div>
      <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
        {loading ? (
          // Skeleton placeholder rows while the real data is still loading.
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="h-3 w-3/4 bg-white/10 rounded mb-2" />
              <div className="h-2.5 w-1/3 bg-white/5 rounded" />
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500 text-center">{emptyLabel}</p>
        ) : (
          items.map(renderItem)
        )}
      </div>
    </div>
  );
}

export default function ThreatIntel() {
  const [feed, setFeed] = useState({ phishing: [], malware: [], generatedAt: null });
  const [loading, setLoading] = useState(true); // true only for the very first load
  const [error, setError] = useState('');

  // Fetches the latest feed data. Wrapped in useCallback so the effect
  // below doesn't recreate/reschedule its interval on every render.
  const load = useCallback(async () => {
    try {
      setError('');
      const data = await fetchThreatFeed();
      setFeed(data);
    } catch (err) {
      setError(err.message ?? 'Could not load the live feed right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once immediately, then keep refreshing every 90 seconds so the
  // page feels "live" without the visitor having to refresh it themselves.
  useEffect(() => {
    load();
    const id = setInterval(load, 90_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <main className="relative z-10 pt-28 pb-24 px-4 md:px-8 max-w-[1400px] mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-up">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef233c] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef233c]" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Live Threat Intelligence</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-manrope tracking-tighter mb-4">
          What phishing leads to, <span className="text-[#ef233c]">happening right now</span>
        </h1>
        <p className="text-zinc-400">
          The feeds below pull real, live data from free threat-intelligence sources — not ClickWise's own users. The map is an
          illustrative visualization; the panels underneath are the real data.
        </p>
      </div>

      <div className="mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <ThreatPulseMap feed={feed} loading={loading} />
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
          {error} — showing what we last had, if anything.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <FeedPanel
          title="Live Phishing URLs"
          icon="material-symbols:phishing"
          accent={{ bg: 'bg-red-600/10', text: 'text-[#ef233c]' }}
          loading={loading}
          items={feed.phishing}
          emptyLabel="No entries available right now."
          renderItem={(item, i) => (
            <div key={`${item.url}-${i}`} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-xs text-zinc-300 truncate">{item.host}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">Source: {item.source}</div>
              </div>
              <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase rounded border border-red-500/30 text-[#ef233c] bg-red-500/5">
                Phishing
              </span>
            </div>
          )}
        />
        <FeedPanel
          title="Live Malware & Botnet Infrastructure"
          icon="material-symbols:dns"
          accent={{ bg: 'bg-purple-600/10', text: 'text-purple-400' }}
          loading={loading}
          items={feed.malware}
          emptyLabel="No entries available right now."
          renderItem={(item, i) => (
            <div key={`${item.url}-${i}`} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-xs text-zinc-300 truncate">{item.host}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">
                  {item.dateAdded ? formatRelativeTime(item.dateAdded) : ''} · {item.source}
                </div>
              </div>
              <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase rounded border border-purple-500/30 text-purple-300 bg-purple-500/5">
                {item.family}
              </span>
            </div>
          )}
        />
      </div>

      <div className="mb-8 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="text-2xl font-bold font-manrope tracking-tight mb-2">Where a single click leads</h2>
        <p className="text-zinc-500 text-sm max-w-2xl">
          Phishing isn't a dead end on its own — it's usually the first step. Here's what the research says happens next.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FACTS.map((f) => (
          <div key={f.title} className="glass-card rounded-[1.5rem] p-6">
            <div className="p-2.5 bg-white/5 rounded-xl inline-flex mb-4 text-[#ef233c]">
              <iconify-icon icon={f.icon} className="text-xl"></iconify-icon>
            </div>
            <div className="text-3xl font-bold font-manrope tracking-tight mb-2">{f.stat}</div>
            <div className="font-bold text-sm mb-2">{f.title}</div>
            <p className="text-zinc-500 text-xs leading-relaxed mb-3">{f.body}</p>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{f.source}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
