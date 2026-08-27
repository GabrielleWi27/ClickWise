// The interactive "do the simulation" page: shows one fake phishing
// email and lets you pick how to respond. Whichever button you press
// (Report / Click / Ignore) immediately decides pass or fail — there's
// only one "correct" choice (Report), the other two both count as fails
// but with different explanations.
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSimulations } from '../data/simulations';
import { fetchLessons } from '../data/lessons';
import { loadResults, saveResult } from '../utils/simResults';
import { loadProgress, isSimulationUnlocked } from '../utils/trainingProgress';
import { difficultyStyle } from '../data/content';

// The feedback shown for each of the 3 possible choices.
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

export default function SimulationPlayer() {
  const { simId } = useParams(); // which simulation, from the URL, e.g. /simulations/sim_password_reset
  const { user } = useAuth();
  const navigate = useNavigate();

  const [simulations, setSimulations] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  // If they've already done this one before, start by showing their
  // previous result instead of the email again (so refreshing the page
  // doesn't lose your result). `action` being set is what switches this
  // page from "showing the choice buttons" to "showing the outcome".
  const [action, setAction] = useState(null);

  useEffect(() => {
    Promise.all([fetchSimulations(), fetchLessons(), loadResults(user.id), loadProgress(user.id)]).then(
      ([sims, fetchedLessons, results, lessonProgress]) => {
        setSimulations(sims);
        setLessons(fetchedLessons);
        setProgress(lessonProgress);
        setAction(results[simId]?.action ?? null);
        setLoading(false);
      }
    );
  }, [simId, user.id]);

  const sim = simulations.find((s) => s.id === simId);

  if (loading) {
    return null;
  }

  if (!sim) {
    return (
      <main className="relative z-10 pt-32 pb-20 px-4 md:px-8 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold font-manrope mb-4">Simulation not found</h1>
        <Link to="/simulations" className="text-[#ef233c] hover:underline text-sm font-bold uppercase tracking-widest">
          Back to Simulations
        </Link>
      </main>
    );
  }

  // Someone tried to jump straight to a simulation's URL without finishing
  // its required lesson first — bounce them back to the Simulations list
  // instead of letting them attempt it.
  if (!isSimulationUnlocked(progress, sim)) {
    return <Navigate to="/simulations" replace />;
  }

  const outcome = action ? OUTCOME_COPY[action] : null;
  // The training lesson right after the one that unlocked this
  // simulation — lets the outcome screen offer "keep going" instead of
  // just dropping them back at the Simulations list.
  const requiredLessonIndex = lessons.findIndex((l) => l.id === sim.requiredLessonId);
  const nextLesson = requiredLessonIndex === -1 ? null : lessons[requiredLessonIndex + 1];

  // Called when they click one of the 3 choice buttons: looks up whether
  // that choice passes or fails, saves it permanently, then shows the result.
  const handleChoice = async (chosenAction) => {
    const { status } = OUTCOME_COPY[chosenAction];
    await saveResult(user.id, sim.id, { status, action: chosenAction });
    setAction(chosenAction);
  };

  // "Retry" just clears the current outcome so the email + choice
  // buttons show again (their old saved result stays until they choose again).
  const handleRetry = () => setAction(null);

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/simulations" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1.5">
          <iconify-icon icon="material-symbols:arrow-back"></iconify-icon> Back to Simulations
        </Link>
        <Link
          to="/simulations"
          title="Leave without completing"
          aria-label="Leave without completing"
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/30 transition-all shrink-0"
        >
          <iconify-icon icon="material-symbols:close"></iconify-icon>
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8 animate-fade-up">
        <h1 className="text-3xl font-bold font-manrope tracking-tight">{sim.name}</h1>
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${difficultyStyle(sim.difficulty)}`}>
          {sim.difficulty}
        </span>
      </div>

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
              onClick={() => handleChoice('report')}
              className="flex-1 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <iconify-icon icon="material-symbols:flag"></iconify-icon> Report as Phishing
            </button>
            <button
              onClick={() => handleChoice('click')}
              className="flex-1 px-6 py-4 rounded-2xl bg-[#ef233c]/10 border border-[#ef233c]/20 hover:bg-[#ef233c]/20 text-[#ef233c] font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <iconify-icon icon="material-symbols:ads-click"></iconify-icon> {sim.ctaLabel}
            </button>
            <button
              onClick={() => handleChoice('ignore')}
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

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate(nextLesson ? `/training/${nextLesson.id}` : '/training')}
              className="flex-1 px-6 py-3.5 rounded-2xl bg-[#ef233c] hover:bg-red-700 text-white font-bold text-sm transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2"
            >
              <iconify-icon icon="material-symbols:school"></iconify-icon>
              {nextLesson ? 'Continue Training' : 'Back to Training'}
            </button>
            <button
              onClick={handleRetry}
              className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/simulations')}
              className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all"
            >
              Back to Simulations
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
