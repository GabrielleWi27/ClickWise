// A public, no-account-needed lesson — the only training content anyone
// can access without signing in. Deliberately standalone (unlike
// Training.jsx/LessonPage.jsx, which require a logged-in user and read
// from Supabase): no auth check, no progress saved anywhere, just the
// hardcoded content from src/data/demoContent.js.
import { Link, useNavigate } from 'react-router-dom';
import { DEMO_LESSON } from '../data/demoContent';

export default function DemoTraining() {
  const navigate = useNavigate(); // used below to jump to the demo simulation on button click

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
      <Link to="/" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1.5 mb-6">
        <iconify-icon icon="material-symbols:arrow-back"></iconify-icon> Back to Home
      </Link>

      <div className="flex items-center justify-between mb-2 animate-fade-up">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
          <iconify-icon icon="material-symbols:lock-open"></iconify-icon> Free Preview — No Sign-In Required
        </span>
        <span className="text-xs text-zinc-500">{DEMO_LESSON.minutes} min read</span>
      </div>
      <h1 className="text-3xl font-bold font-manrope tracking-tight mb-2 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {DEMO_LESSON.title}
      </h1>
      <p className="text-zinc-500 mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>{DEMO_LESSON.summary}</p>

      <div className="glass-card rounded-[2rem] p-8 mb-8 space-y-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        {DEMO_LESSON.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-lg font-bold font-manrope mb-3">{section.heading}</h2>
            {section.body.map((para, i) => (
              <p key={i} className="text-sm text-zinc-300 leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-[2rem] p-8 mb-8 border-l-4 border-l-emerald-500 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
          <iconify-icon icon="material-symbols:lightbulb"></iconify-icon> Key Takeaways
        </h3>
        <ul className="space-y-2">
          {DEMO_LESSON.keyTakeaways.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-zinc-300">
              <iconify-icon icon="material-symbols:check-circle" className="text-emerald-400 mt-0.5 shrink-0"></iconify-icon>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => navigate('/demo/simulation')}
        className="w-full bg-[#ef233c] hover:bg-red-700 text-white font-bold rounded-2xl py-4 transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2"
      >
        Now Try a Live Simulation
        <iconify-icon icon="material-symbols:arrow-forward"></iconify-icon>
      </button>
      <p className="text-center text-xs text-zinc-600 mt-4">
        This is 1 of 18 lessons in the full course.{' '}
        <Link to="/sign-up" className="text-[#ef233c] hover:underline">
          Sign up free
        </Link>{' '}
        to unlock the rest.
      </p>
    </main>
  );
}
