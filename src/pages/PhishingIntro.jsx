// A short, auto-playing animated explainer — "what is phishing, using the
// fishing metaphor" — that plays once before Training unlocks for a new
// account. Enforcement is real (see markPhishingIntroWatched in
// AuthContext + the watched_phishing_intro column), not just a one-time
// popup: Training.jsx and LessonPage.jsx both redirect back here if this
// hasn't been watched yet.
//
// Built as CSS/SVG-animated "scenes" rather than an actual video file —
// there's no video-rendering tool available here, and this achieves the
// same "watch it before you can continue" effect without needing external
// hosting for a video asset.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SCENES = [
  { id: 'title', durationMs: 4500 },
  { id: 'metaphor', durationMs: 7000 },
  { id: 'bite', durationMs: 6500 },
  { id: 'stakes', durationMs: 6500 },
  { id: 'ready', durationMs: null }, // waits for a click, never auto-advances
];

function SceneShell({ children }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-fade-up" style={{ animationDuration: '0.5s' }}>
      {children}
    </div>
  );
}

function Ripples() {
  return (
    <>
      <span className="absolute inset-0 m-auto w-24 h-24 rounded-full border border-[#ef233c]/40 cw-ripple" />
      <span className="absolute inset-0 m-auto w-24 h-24 rounded-full border border-[#ef233c]/40 cw-ripple" style={{ animationDelay: '0.9s' }} />
      <span className="absolute inset-0 m-auto w-24 h-24 rounded-full border border-[#ef233c]/40 cw-ripple" style={{ animationDelay: '1.8s' }} />
    </>
  );
}

function TitleScene() {
  return (
    <SceneShell>
      <div className="relative w-40 h-40 flex items-center justify-center mb-8">
        <Ripples />
        <div className="relative w-24 h-24 rounded-3xl bg-[#ef233c]/10 border border-[#ef233c]/30 flex items-center justify-center cw-bob">
          <iconify-icon icon="material-symbols:phishing" className="text-5xl text-[#ef233c]"></iconify-icon>
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold font-manrope tracking-tight mb-4">What Is Phishing?</h1>
      <p className="text-zinc-400 max-w-md">A single email can compromise an entire company. In the next 30 seconds, here's exactly why.</p>
    </SceneShell>
  );
}

function MetaphorScene() {
  return (
    <SceneShell>
      <div className="grid grid-cols-2 gap-6 md:gap-10 w-full max-w-xl mb-8">
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-6 pt-16 h-56 overflow-hidden">
          <p className="absolute top-4 left-0 right-0 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Real Fishing</p>
          <div className="absolute left-1/2 top-16 -translate-x-1/2 w-px h-16 bg-zinc-600 cw-cast" />
          <div className="absolute left-1/2 top-28 -translate-x-1/2 cw-bob" style={{ animationDelay: '0.4s' }}>
            <iconify-icon icon="material-symbols:phishing" className="text-3xl text-zinc-400"></iconify-icon>
          </div>
          <iconify-icon icon="material-symbols:water" className="absolute bottom-2 left-0 right-0 text-4xl text-blue-500/20 w-full text-center"></iconify-icon>
        </div>
        <div className="relative rounded-3xl border border-[#ef233c]/20 bg-[#ef233c]/[0.03] p-6 pt-16 h-56 overflow-hidden">
          <p className="absolute top-4 left-0 right-0 text-[10px] font-bold uppercase tracking-widest text-[#ef233c]">Phishing</p>
          <div className="absolute left-1/2 top-16 -translate-x-1/2 w-px h-16 bg-[#ef233c]/50 cw-cast" />
          <div className="absolute left-1/2 top-28 -translate-x-1/2 cw-bob" style={{ animationDelay: '0.4s' }}>
            <iconify-icon icon="material-symbols:mark-email-unread" className="text-3xl text-[#ef233c]"></iconify-icon>
          </div>
          <iconify-icon icon="material-symbols:inbox" className="absolute bottom-2 left-0 right-0 text-4xl text-[#ef233c]/20 w-full text-center"></iconify-icon>
        </div>
      </div>
      <p className="text-zinc-300 max-w-xl leading-relaxed">
        Just like a fisherman drops <span className="text-white font-semibold">bait</span> to lure a fish out of hiding, an attacker
        drops a fake email, text, or website — bait designed to look real enough that you bite.
      </p>
    </SceneShell>
  );
}

function BiteScene() {
  return (
    <SceneShell>
      <div className="relative w-full max-w-md h-40 mb-8 flex items-center justify-center">
        <div className="absolute left-1/2 -translate-x-1/2 -top-2">
          <iconify-icon icon="material-symbols:phishing" className="text-5xl text-[#ef233c] cw-bob"></iconify-icon>
        </div>
        <div className="cw-swim-in cw-bite">
          <iconify-icon icon="material-symbols:person" className="text-6xl text-zinc-400"></iconify-icon>
        </div>
      </div>
      <p className="text-zinc-300 max-w-xl leading-relaxed">
        One click on the wrong link, and you're <span className="text-[#ef233c] font-semibold">hooked</span> — your password, your
        data, or your company's money, gone in seconds.
      </p>
    </SceneShell>
  );
}

function StatBar({ label, target, source }) {
  return (
    <div className="text-left">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className="text-lg font-bold font-manrope text-[#ef233c]">{target}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-[#ef233c] rounded-full cw-count-bar" style={{ '--cw-target': target }} />
      </div>
      <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">{source}</p>
    </div>
  );
}

function StakesScene() {
  return (
    <SceneShell>
      <iconify-icon icon="material-symbols:monitoring" className="text-4xl text-[#ef233c] mb-6"></iconify-icon>
      <div className="w-full max-w-sm space-y-5 mb-8">
        <StatBar label="Breaches involving the human element" target="60%" source="Verizon, 2025 DBIR" />
        <StatBar label="Breaches starting with phishing" target="16%" source="Verizon, 2025 DBIR" />
      </div>
      <p className="text-zinc-300 max-w-xl leading-relaxed">
        This isn't rare — it's one of the most common ways real breaches start. That's exactly why staying alert is
        <span className="text-white font-semibold"> everyone's job</span>, not just IT's.
      </p>
    </SceneShell>
  );
}

function ReadyScene({ onStart, starting }) {
  return (
    <SceneShell>
      <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
        <iconify-icon icon="material-symbols:verified-user" className="text-4xl text-emerald-400"></iconify-icon>
      </div>
      <h2 className="text-3xl font-bold font-manrope tracking-tight mb-3">Ready to spot the hook?</h2>
      <p className="text-zinc-400 max-w-md mb-8">
        Complete the training below to build the instinct that keeps you — and your whole team — safe.
      </p>
      <button
        onClick={onStart}
        disabled={starting}
        className="bg-[#ef233c] hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-2xl px-8 py-4 transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center gap-2"
      >
        {starting ? 'Starting…' : 'Start Training'}
        <iconify-icon icon="material-symbols:arrow-forward"></iconify-icon>
      </button>
    </SceneShell>
  );
}

const SCENE_COMPONENTS = {
  title: TitleScene,
  metaphor: MetaphorScene,
  bite: BiteScene,
  stakes: StakesScene,
};

export default function PhishingIntro() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [starting, setStarting] = useState(false);
  const { markPhishingIntroWatched } = useAuth();
  const navigate = useNavigate();

  const scene = SCENES[sceneIndex];
  const isLast = sceneIndex === SCENES.length - 1;

  useEffect(() => {
    if (scene.durationMs == null) return; // last scene waits for a click instead
    const id = setTimeout(() => setSceneIndex((i) => i + 1), scene.durationMs);
    return () => clearTimeout(id);
  }, [sceneIndex]);

  const handleStart = async () => {
    setStarting(true);
    await markPhishingIntroWatched();
    navigate('/training');
  };

  const Scene = SCENE_COMPONENTS[scene.id];

  return (
    <main className="relative z-10 pt-28 pb-12 px-4 md:px-8 max-w-3xl mx-auto min-h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-10">
        <div className="flex gap-1.5 flex-1">
          {SCENES.map((s, i) => (
            <div key={i} className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
              {i < sceneIndex && <div className="h-full w-full bg-[#ef233c]" />}
              {i === sceneIndex && s.durationMs != null && (
                <div
                  key={sceneIndex}
                  className="h-full bg-[#ef233c] cw-scene-fill"
                  style={{ animationDuration: `${s.durationMs}ms` }}
                />
              )}
              {i === sceneIndex && s.durationMs == null && <div className="h-full w-full bg-[#ef233c]" />}
            </div>
          ))}
        </div>
        {!isLast && (
          <button
            onClick={() => setSceneIndex(SCENES.length - 1)}
            className="shrink-0 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            Skip <iconify-icon icon="material-symbols:fast-forward"></iconify-icon>
          </button>
        )}
      </div>

      {isLast ? <ReadyScene onStart={handleStart} starting={starting} /> : <Scene key={scene.id} />}
    </main>
  );
}
