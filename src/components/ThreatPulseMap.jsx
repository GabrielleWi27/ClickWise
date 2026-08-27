// A stylized "global activity" visualization. Two things are deliberately
// kept honest here:
//   1. The continents are a low-poly illustration, not precise geodata.
//   2. Marker POSITIONS are illustrative — the free feeds we use (OpenPhish,
//      URLhaus) don't include geolocation, so pulses sit at real-world
//      cities purely for visual variety, not because a threat was actually
//      seen there. The pop-up content, however, IS real: each marker is
//      paired with an actual entry from the live feed passed in via props.
import { useMemo, useState } from 'react';

const CITIES = [
  { name: 'New York', x: 294, y: 137 },
  { name: 'Toronto', x: 279, y: 129 },
  { name: 'Mexico City', x: 225, y: 196 },
  { name: 'São Paulo', x: 371, y: 315 },
  { name: 'Buenos Aires', x: 338, y: 346 },
  { name: 'London', x: 500, y: 107 },
  { name: 'Berlin', x: 537, y: 104 },
  { name: 'Moscow', x: 604, y: 95 },
  { name: 'Lagos', x: 509, y: 232 },
  { name: 'Johannesburg', x: 578, y: 323 },
  { name: 'Dubai', x: 654, y: 180 },
  { name: 'Mumbai', x: 703, y: 197 },
  { name: 'Singapore', x: 788, y: 246 },
  { name: 'Jakarta', x: 797, y: 267 },
  { name: 'Beijing', x: 823, y: 139 },
  { name: 'Seoul', x: 853, y: 146 },
  { name: 'Tokyo', x: 888, y: 151 },
  { name: 'Sydney', x: 920, y: 344 },
];

// Low-poly continent outlines: simplified [lon, lat] boundary points,
// projected onto the same 1000x500 equirectangular canvas as the cities.
// Not survey-accurate coastlines — a stylized silhouette, on purpose.
function proj([lon, lat]) {
  return [((lon + 180) / 360) * 1000, ((90 - lat) / 180) * 500];
}
function outline(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${proj(p).map((n) => n.toFixed(1)).join(',')}`).join(' ') + ' Z';
}

const CONTINENTS = [
  {
    name: 'North America',
    points: [
      [-165, 68], [-165, 60], [-130, 55], [-125, 40], [-117, 32], [-105, 20], [-97, 16],
      [-90, 14], [-83, 9], [-80, 25], [-81, 31], [-75, 35], [-70, 42], [-65, 45], [-60, 50],
      [-70, 60], [-95, 68], [-130, 70],
    ],
  },
  {
    name: 'South America',
    points: [
      [-80, 10], [-77, 1], [-80, -5], [-70, -18], [-70, -30], [-73, -45], [-68, -55],
      [-65, -52], [-58, -38], [-48, -25], [-35, -8], [-50, 2], [-60, 5], [-70, 10],
    ],
  },
  {
    name: 'Europe',
    points: [
      [-9, 43], [-9, 36], [3, 36], [15, 37], [19, 40], [28, 36], [30, 45], [40, 45],
      [50, 55], [30, 60], [25, 65], [10, 63], [5, 58], [-2, 58],
    ],
  },
  {
    name: 'Africa',
    points: [
      [-17, 15], [-13, 7], [-10, 5], [9, 4], [9, -3], [12, -6], [13, -12], [18, -34],
      [30, -30], [35, -25], [40, -15], [45, 0], [51, 11], [43, 12], [38, 15], [32, 22],
      [25, 32], [10, 37], [-6, 35], [-17, 21],
    ],
  },
  {
    name: 'Asia',
    points: [
      [27, 65], [45, 55], [50, 45], [60, 40], [70, 38], [75, 35], [70, 25], [72, 20],
      [77, 8], [80, 15], [88, 22], [95, 20], [100, 10], [105, 10], [109, 23], [122, 30],
      [130, 35], [140, 45], [160, 60], [170, 68], [140, 73], [60, 72],
    ],
  },
  {
    name: 'Australia',
    points: [
      [113, -22], [114, -34], [129, -32], [137, -35], [145, -38], [150, -37], [153, -28],
      [145, -17], [142, -11], [136, -12], [130, -14], [122, -18],
    ],
  },
];

// Short, plain-language explanations shown in the pop-up — what this
// threat category actually is/does, for anyone who clicks to learn more.
const MALWARE_FAMILY_INFO = {
  mirai: 'IoT botnet malware. Infected devices (routers, cameras, DVRs) get conscripted into a botnet, most often to launch large-scale DDoS attacks.',
  mozi: 'A peer-to-peer IoT botnet related to Mirai. Spreads via weak default device passwords and known vulnerabilities, then joins the botnet.',
  clearfake: 'A fake "update your browser" malware loader — tricks visitors into running malicious code disguised as a legitimate update prompt.',
  amadey: 'A malware loader/downloader, often used to install further payloads like info-stealers or ransomware after the initial infection.',
  gafgyt: 'IoT botnet malware focused on DDoS attacks, a close relative of Mirai.',
  loader: 'A generic malware loader — its job is simply to download and run further malicious payloads on the infected machine.',
  windows: 'A Windows-targeting payload distributed from this URL.',
  '32-bit': 'A 32-bit malware binary distributed from this URL.',
  arm: 'An ARM-architecture malware binary — typically targets routers and embedded/IoT devices.',
  elf: 'A Linux/Unix-format (ELF) malware binary — common for router and IoT-device infections.',
};
function malwareExplanation(family) {
  const key = String(family ?? '').toLowerCase();
  return MALWARE_FAMILY_INFO[key] ?? 'A malware sample currently tracked by URLhaus. No specific family has been matched to it yet.';
}
const PHISHING_EXPLANATION =
  'A live phishing URL — a fake page (often impersonating a login, payment, or delivery-tracking page) designed to trick a visitor into handing over credentials, card details, or other sensitive information.';

// Builds one marker per city, pairing it with a real feed entry so the
// pop-up shows real data even though the pin's location is illustrative.
function buildMarkers(feed) {
  const phishing = feed?.phishing ?? [];
  const malware = feed?.malware ?? [];
  return CITIES.map((city, i) => {
    const useMalware = i % 2 === 1 && malware.length > 0;
    const entry = useMalware ? malware[i % malware.length] : phishing.length > 0 ? phishing[i % phishing.length] : null;
    if (!entry) return { city, type: null };
    return {
      city,
      type: useMalware ? 'malware' : 'phishing',
      entry,
    };
  });
}

function Tooltip({ marker, onClose, pinned }) {
  const { city, type, entry } = marker;
  const badge = type === 'malware' ? entry.family : 'Phishing';
  const explanation = type === 'malware' ? malwareExplanation(entry.family) : PHISHING_EXPLANATION;
  const accent = type === 'malware' ? { text: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/30' } : { text: 'text-[#ef233c]', bg: 'bg-red-500/10', border: 'border-red-500/30' };

  // Flip below the marker when there isn't enough headroom above it
  // (northern-hemisphere cities sit close to the map's top edge), and
  // clamp horizontally so the box doesn't run off the left/right edge.
  let translateX = '-50%';
  if (city.x > 780) translateX = '-85%';
  else if (city.x < 220) translateX = '-15%';
  const flipDown = city.y < 160;
  const translateY = flipDown ? '14px' : 'calc(-100% - 14px)';

  return (
    <div
      className="absolute z-20"
      style={{ left: `${(city.x / 1000) * 100}%`, top: `${(city.y / 500) * 100}%`, transform: `translate(${translateX}, ${translateY})` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-64 glass-panel rounded-2xl p-4 shadow-2xl bg-black/90 border border-white/10">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${accent.border} ${accent.text} ${accent.bg}`}>
            {badge}
          </span>
          {pinned && (
            <button onClick={onClose} className="text-zinc-500 hover:text-white -mt-0.5 -mr-0.5">
              <iconify-icon icon="material-symbols:close" className="text-sm"></iconify-icon>
            </button>
          )}
        </div>
        <div className="font-mono text-[11px] text-zinc-200 break-all mb-2">{entry.host}</div>
        <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">{explanation}</p>
        <div className="pt-2 border-t border-white/10 text-[9px] text-zinc-600 leading-relaxed">
          Source: {entry.source}. Plotted near {city.name} for visual variety only — this is not the entry's real origin.
        </div>
      </div>
    </div>
  );
}

export default function ThreatPulseMap({ feed, loading }) {
  const [hoverIdx, setHoverIdx] = useState(null); // marker index currently under the mouse
  const [pinnedIdx, setPinnedIdx] = useState(null); // marker index "stuck open" from a click

  // Only rebuild the marker list when the feed data actually changes,
  // not on every hover/click re-render.
  const markers = useMemo(() => buildMarkers(feed), [feed]);
  // A pinned (clicked) tooltip takes priority over whatever's just hovered.
  const shownIdx = pinnedIdx ?? hoverIdx;
  const shownMarker = shownIdx !== null ? markers[shownIdx] : null;

  return (
    <div
      className="relative w-full aspect-[2/1] rounded-[1.5rem] overflow-hidden border border-white/10 bg-black"
      onClick={() => setPinnedIdx(null)}
    >
      <svg viewBox="0 0 1000 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="tp-glow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#3a0510" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="1000" height="500" fill="url(#tp-glow)" />

        {/* radar-style grid */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="500" stroke="#ffffff" strokeOpacity="0.04" />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="#ffffff" strokeOpacity="0.04" />
        ))}

        {/* low-poly continents */}
        {CONTINENTS.map((c) => (
          <path key={c.name} d={outline(c.points)} fill="#ef233c" fillOpacity="0.09" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1" strokeLinejoin="round" />
        ))}

        {/* threat markers — static dots, highlighted only on hover/click */}
        {markers.map((m, i) => {
          const interactive = Boolean(m.type);
          const highlighted = shownIdx === i;
          return (
            <g
              key={m.city.name}
              transform={`translate(${m.city.x}, ${m.city.y})`}
              onMouseEnter={() => interactive && setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
              onClick={(e) => {
                if (!interactive) return;
                e.stopPropagation();
                setPinnedIdx((cur) => (cur === i ? null : i));
              }}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
            >
              <circle r="9" fill="transparent" />
              <circle
                r={highlighted ? 3.5 : 1.8}
                fill={highlighted ? '#ff5470' : '#7a7a7a'}
                fillOpacity={highlighted ? 1 : 0.5}
              />
            </g>
          );
        })}
      </svg>

      {/* the pop-up card for whichever marker is hovered or pinned */}
      {shownMarker?.type && (
        <Tooltip marker={shownMarker} pinned={pinnedIdx !== null} onClose={() => setPinnedIdx(null)} />
      )}

      {/* small pulsing "live" badge in the corner */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 pointer-events-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef233c] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef233c]" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
          {loading ? 'Loading live data…' : 'Hover or click a marker'}
        </span>
      </div>
    </div>
  );
}
