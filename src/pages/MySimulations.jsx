// The Simulations list page (the "/simulations" route) — a card grid of
// every simulation from the real `simulations` table, showing whether
// each one has been passed/failed yet. Clicking a card opens
// SimulationPlayer.jsx to actually do it. Each simulation is paired with
// a training lesson (see data/simulations.js's requiredLessonId) that
// must be completed first — locked cards show which lesson unlocks them.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSimulations } from '../data/simulations';
import { fetchLessons } from '../data/lessons';
import { loadResults, computeStats } from '../utils/simResults';
import { loadProgress, isSimulationUnlocked } from '../utils/trainingProgress';
import { difficultyStyle } from '../data/content';

export default function MySimulations() {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState([]); // every simulation in the library
  const [lessons, setLessons] = useState([]); // needed only to show which lesson unlocks a locked sim
  const [results, setResults] = useState({}); // this person's past attempts, keyed by simulation id
  const [progress, setProgress] = useState({}); // this person's completed lessons, keyed by lesson id

  useEffect(() => {
    fetchSimulations().then(setSimulations);
    fetchLessons().then(setLessons);
    loadResults(user.id).then(setResults);
    loadProgress(user.id).then(setProgress);
  }, [user.id]);

  const stats = computeStats(results, simulations.length); // completed/passed/pass-rate summary numbers
  // Quick lookup: lesson id -> lesson title, used to show "Complete X first" on locked cards.
  const lessonTitleById = Object.fromEntries(lessons.map((l) => [l.id, l.title]));

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 animate-fade-up">
        <div>
          <h1 className="text-4xl font-bold font-manrope tracking-tighter mb-2">Security Simulations</h1>
          <p className="text-zinc-500">Spot the phishing attempt. Report it before you take the bait.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card p-6 rounded-3xl">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Completed</div>
          <div className="text-4xl font-bold font-manrope tracking-tight">
            {stats.completed}
            <span className="text-zinc-600 text-xl font-medium">/{stats.total}</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Passed</div>
          <div className="text-4xl font-bold font-manrope tracking-tight text-emerald-400">{stats.passed}</div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Pass Rate</div>
          <div className="text-4xl font-bold font-manrope tracking-tight">{stats.passRate === null ? '—' : `${stats.passRate}%`}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        {simulations.map((sim) => {
          const result = results[sim.id];
          const unlocked = isSimulationUnlocked(progress, sim); // has its required lesson been completed?
          return (
            <div key={sim.id} className={`glass-card rounded-3xl p-6 flex flex-col ${unlocked ? '' : 'opacity-60'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${difficultyStyle(sim.difficulty)}`}>
                  {sim.difficulty}
                </span>
                {result?.status === 'passed' && (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <iconify-icon icon="material-symbols:check-circle"></iconify-icon> Passed
                  </span>
                )}
                {result?.status === 'failed' && (
                  <span className="flex items-center gap-1.5 text-[#ef233c] text-xs font-bold">
                    <iconify-icon icon="material-symbols:cancel"></iconify-icon> Failed
                  </span>
                )}
                {!result && !unlocked && (
                  <span className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold">
                    <iconify-icon icon="material-symbols:lock"></iconify-icon> Locked
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold font-manrope mb-1">{sim.name}</h3>
              <p className="text-xs text-zinc-500 mb-4">{sim.category}</p>
              <div className="bg-black/30 border border-white/5 rounded-xl p-3 mb-6 flex-1">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Subject</p>
                <p className="text-sm text-zinc-300 line-clamp-2">{sim.subject}</p>
              </div>
              {unlocked ? (
                <Link
                  to={`/simulations/${sim.id}`}
                  className={
                    result
                      ? 'w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest transition-all text-center'
                      : 'w-full py-3 rounded-2xl bg-[#ef233c] hover:bg-red-700 text-xs font-bold uppercase tracking-widest transition-all text-center shadow-[0_10px_20px_rgba(239,35,60,0.2)]'
                  }
                >
                  {result ? 'Retry Simulation' : 'Start Simulation'}
                </Link>
              ) : (
                <Link
                  to="/training"
                  className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 text-xs font-bold uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <iconify-icon icon="material-symbols:lock"></iconify-icon>
                  Complete "{lessonTitleById[sim.requiredLessonId] ?? 'a lesson'}" first
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
