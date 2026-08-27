// A public, no-account-needed simulation — the only simulation anyone can
// try without signing in. Deliberately standalone (unlike
// MySimulations.jsx/SimulationPlayer.jsx, which require a logged-in user
// and save results to Supabase): no auth check, no result saved anywhere,
// just the hardcoded content from src/data/demoContent.js.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DEMO_SIMULATION as sim } from '../data/demoContent';
import { difficultyStyle } from '../data/content';

// The feedback shown for each of the 3 possible choices — same copy as
// the real SimulationPlayer.jsx, since the demo should feel identical.
const OUTCOME_COPY = {
  report: {
    status: 'passed',
    title: 'Correct — you reported it!',
    detail: 'This was a simulated phishing email. Reporting suspicious messages instead of acting on them is exactly the right move.',
  },
  click: {
    status: 'failed',
    title: 'You took the bait',
    detail: 'This was a simulated phishing email. Clicking through (or opening the attachment) is exactly what a real attacker is counting on.',
  },
  ignore: {
    status: 'failed',
    title: 'Close, but not quite',
    detail: "This was a simulated phishing email. Not clicking is good, but ignoring it means it wasn't reported — attackers rely on suspicious emails going unreported so they can keep targeting others.",
  },
};

export default function DemoSimulation() {
  const [action, setAction] = useState(null); // which button they clicked, or null before choosing
  const outcome = action ? OUTCOME_COPY[action] : null; // the feedback to show for that choice

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
      <Link to="/demo" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1.5 mb-6">
        <iconify-icon icon="material-symbols:arrow-back"></iconify-icon> Back to Free Lesson
      </Link>

      <div className="flex items-center gap-3 mb-2 animate-fade-up">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
          <iconify-icon icon="material-symbols:lock-open"></iconify-icon> Free Preview
        </span>
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${difficultyStyle(sim.difficulty)}`}>
          {sim.difficulty}
        </span>
      </div>
      <h1 className="text-3xl font-bold font-manrope tracking-tight mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {sim.name}
      </h1>

      <div className="glass-card rounded-[2rem] overflow-hidden mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="p-6 border-b border-white/10 space-y-2">
          <div className="flex gap-3 text-sm">
            <span className="text-zinc-500 w-16 shrink-0">From</span>
            <span className="text-zinc-200 font-mono text-xs">{sim.sender}</span>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-zinc-500 w-16 shrink-0">Subject</span>
            <span className="text-white font-semibold">{sim.subject}</span>
          </div>
        </div>
        <div className="p-8 space-y-4">
          {sim.body.map((line, i) => (
            <p key={i} className="text-sm text-zinc-300 leading-relaxed">
              {line}
            </p>
          ))}
          <div className="pt-2">
            <span className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm rounded-lg">
              {sim.ctaLabel}
            </span>
          </div>
        </div>
      </div>

      {!outcome ? (
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">What do you do?</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setAction('report')}
              className="flex-1 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <iconify-icon icon="material-symbols:flag"></iconify-icon> Report as Phishing
            </button>
            <button
              onClick={() => setAction('click')}
              className="flex-1 px-6 py-4 rounded-2xl bg-[#ef233c]/10 border border-[#ef233c]/20 hover:bg-[#ef233c]/20 text-[#ef233c] font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <iconify-icon icon="material-symbols:ads-click"></iconify-icon> {sim.ctaLabel}
            </button>
            <button
              onClick={() => setAction('ignore')}
              className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <iconify-icon icon="material-symbols:delete"></iconify-icon> Ignore / Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div
            className={`glass-card rounded-3xl p-8 mb-6 border-l-4 ${
              outcome.status === 'passed' ? 'border-l-emerald-500' : 'border-l-[#ef233c]'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <iconify-icon
                icon={outcome.status === 'passed' ? 'material-symbols:check-circle' : 'material-symbols:cancel'}
                className={`text-2xl ${outcome.status === 'passed' ? 'text-emerald-400' : 'text-[#ef233c]'}`}
              ></iconify-icon>
              <h2 className="text-xl font-bold font-manrope">{outcome.title}</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">{outcome.detail}</p>

            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">What gave it away</p>
            <ul className="space-y-2">
              {sim.redFlags.map((flag) => (
                <li key={flag} className="flex items-start gap-2 text-sm text-zinc-300">
                  <iconify-icon icon="material-symbols:warning" className="text-amber-400 mt-0.5 shrink-0"></iconify-icon>
                  {flag}
                </li>
              ))}
            </ul>
          </div>

          {/* the sales pitch shown after any choice — Retry stays on this page, Sign Up leaves it */}
          <div className="glass-card rounded-3xl p-8 text-center">
            <h3 className="text-lg font-bold font-manrope mb-2">Liked the preview?</h3>
            <p className="text-sm text-zinc-500 mb-6">
              This was 1 of 18 simulations. Sign up free to unlock the full library, real progress tracking, and org-wide reporting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setAction(null)}
                className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all"
              >
                Retry
              </button>
              <Link
                to="/sign-up"
                className="flex-1 px-6 py-3.5 rounded-2xl bg-[#ef233c] hover:bg-red-700 text-white font-bold text-sm transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2"
              >
                Sign Up Free <iconify-icon icon="material-symbols:arrow-forward"></iconify-icon>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
