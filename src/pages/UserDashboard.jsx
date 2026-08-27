// The Employee's personal dashboard — landing page after they log in.
// Everything on this page is real, per-person data pulled from Supabase:
// their simulation results (simResults.js) and their training lesson
// progress (trainingProgress.js).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { fetchSimulations } from '../data/simulations';
import { fetchLessons } from '../data/lessons';
import { loadResults, computeStats } from '../utils/simResults';
import { loadProgress, computeProgress, isSimulationUnlocked } from '../utils/trainingProgress';
import { difficultyStyle } from '../data/content';
import { downloadCertificate } from '../utils/certificate';
import { loadQuizStatus, PASS_PERCENT as QUIZ_PASS_PERCENT } from '../utils/quiz';

// The bar every employee has to clear to earn a certificate: every lesson
// finished, every simulation attempted, and at least 80% of those
// attempts passed (reported rather than clicked/ignored).
const CERTIFICATE_PASS_RATE = 80;

// Picks the right greeting for whatever time it is on the visitor's own
// device (before noon / before 6pm / otherwise).
function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function UserDashboard() {
  const { user } = useAuth();
  const { getOrgById } = useOrg();
  const [simulations, setSimulations] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [results, setResults] = useState({}); // this person's simulation results, keyed by simulation id
  const [lessonProgress, setLessonProgress] = useState({}); // this person's completed lessons, keyed by lesson id
  const [org, setOrg] = useState(null);
  const [certBusy, setCertBusy] = useState(false);
  const [quizStatus, setQuizStatus] = useState({ passed: false, lastAttempt: null });

  useEffect(() => {
    fetchSimulations().then(setSimulations);
    fetchLessons().then(setLessons);
    loadResults(user.id).then(setResults);
    loadProgress(user.id).then(setLessonProgress);
    getOrgById(user.orgId).then(setOrg);
    loadQuizStatus(user.id).then(setQuizStatus);
  }, [user.id, user.orgId, getOrgById]);

  const stats = computeStats(results, simulations.length); // the summary numbers (completed/passed/etc.)
  const trainingStats = computeProgress(lessonProgress, lessons.length);

  // Earning the certificate needs every lesson done, every simulation
  // actually attempted (not just a high pass rate on a handful of them),
  // a pass rate that clears the bar, AND a passing attempt on the
  // compulsory final quiz — training isn't "complete" until it's been
  // demonstrated, not just clicked through.
  const allSimsAttempted = stats.total > 0 && stats.completed === stats.total;
  const isCertified = trainingStats.isDone && allSimsAttempted && (stats.passRate ?? 0) >= CERTIFICATE_PASS_RATE && quizStatus.passed;

  const handleDownloadCertificate = async () => {
    setCertBusy(true);
    try {
      await downloadCertificate({
        name: user.name,
        orgName: org?.name ?? '',
        passRate: stats.passRate,
        simCount: stats.total,
        lessonCount: trainingStats.total,
        issuedOn: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      });
    } finally {
      setCertBusy(false);
    }
  };

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 animate-fade-up">
        <div>
          <h1 className="text-4xl font-bold font-manrope tracking-tighter mb-2">
            {timeOfDayGreeting()}, {user.name.split(' ')[0]}
          </h1>
          <p className="text-zinc-500">Your security awareness marks and training progress.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Link
            to="/training"
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
          >
            <iconify-icon icon="material-symbols:school"></iconify-icon>
            Continue Training
          </Link>
          <Link
            to="/simulations"
            className="px-5 py-2.5 bg-[#ef233c] hover:bg-red-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(239,35,60,0.3)]"
          >
            <iconify-icon icon="material-symbols:track-changes"></iconify-icon>
            Take a Simulation
          </Link>
        </div>
      </div>

      {/* 4 top-level stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-400 inline-flex mb-4">
            <iconify-icon icon="material-symbols:track-changes" className="text-xl"></iconify-icon>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Simulations Completed</div>
          <div className="text-4xl font-bold font-manrope tracking-tight">
            {stats.completed}
            <span className="text-zinc-600 text-xl font-medium">/{stats.total}</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-2.5 bg-purple-600/10 rounded-xl text-purple-400 inline-flex mb-4">
            <iconify-icon icon="material-symbols:gpp-maybe" className="text-xl"></iconify-icon>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Risk Score</div>
          <div className="text-4xl font-bold font-manrope tracking-tight">{stats.riskScore === null ? '—' : stats.riskScore}</div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-2.5 bg-emerald-600/10 rounded-xl text-emerald-400 inline-flex mb-4">
            <iconify-icon icon="material-symbols:school" className="text-xl"></iconify-icon>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Lessons Completed</div>
          <div className="text-4xl font-bold font-manrope tracking-tight">
            {trainingStats.completed}
            <span className="text-zinc-600 text-xl font-medium">/{trainingStats.total}</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-2.5 bg-zinc-600/10 rounded-xl text-zinc-300 inline-flex mb-4">
            <iconify-icon icon={trainingStats.isDone ? 'material-symbols:check-circle' : 'material-symbols:hourglass-empty'} className="text-xl"></iconify-icon>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Training Status</div>
          <div className={`text-2xl font-bold font-manrope tracking-tight ${trainingStats.isDone ? 'text-emerald-400' : ''}`}>
            {trainingStats.isDone ? 'Complete' : `${trainingStats.percent}%`}
          </div>
        </div>
      </div>

      {isCertified ? (
        <div className="glass-card rounded-[2rem] p-8 mb-10 animate-fade-up border-l-4 border-l-emerald-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-6" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl shrink-0">
              <iconify-icon icon="material-symbols:workspace-premium"></iconify-icon>
            </div>
            <div>
              <h2 className="text-xl font-bold font-manrope tracking-tight">You've earned your certificate!</h2>
              <p className="text-sm text-zinc-500 mt-1">
                All {trainingStats.total} lessons complete, {stats.passRate}% simulation pass rate. Nice work.
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadCertificate}
            disabled={certBusy}
            className="px-6 py-3 bg-[#ef233c] hover:bg-red-700 disabled:opacity-40 text-white font-bold rounded-2xl transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center gap-2 shrink-0"
          >
            <iconify-icon icon="material-symbols:download"></iconify-icon>
            {certBusy ? 'Preparing…' : 'Download Certificate'}
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-[2rem] p-8 mb-10 animate-fade-up flex flex-col md:flex-row items-start md:items-center justify-between gap-6" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center text-2xl shrink-0">
              <iconify-icon icon="material-symbols:workspace-premium"></iconify-icon>
            </div>
            <div>
              <h2 className="text-lg font-bold font-manrope tracking-tight">Certificate of Completion</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Finish all {trainingStats.total} lessons, attempt every simulation, reach a {CERTIFICATE_PASS_RATE}% pass rate, and
                pass the compulsory final quiz ({QUIZ_PASS_PERCENT}%+) to unlock your downloadable certificate.
              </p>
            </div>
          </div>
          {trainingStats.isDone && !quizStatus.passed && (
            <Link
              to="/training/quiz"
              className="shrink-0 px-5 py-2.5 bg-[#ef233c] hover:bg-red-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(239,35,60,0.3)]"
            >
              <iconify-icon icon="material-symbols:quiz"></iconify-icon>
              {quizStatus.lastAttempt ? 'Retake Final Quiz' : 'Take Final Quiz'}
            </Link>
          )}
        </div>
      )}

      {/* every lesson, its lock/progress state, and a Start/Review link */}
      <div className="glass-card rounded-[2rem] overflow-hidden mb-10 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <div className="p-8 border-b border-white/10">
          <h2 className="text-xl font-bold font-manrope tracking-tight">Your Lessons</h2>
          <p className="text-xs text-zinc-500 mt-1">Progress through your compulsory security training.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <th className="px-8 py-4">Lesson</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Completed</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/5">
              {lessons.map((lesson, i) => {
                const done = lessonProgress[lesson.id];
                // A lesson is unlocked if it's the first one, OR the lesson
                // right before it (in order) is done.
                const unlocked = i === 0 || !!lessonProgress[lessons[i - 1].id];
                return (
                  <tr key={lesson.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-medium">{lesson.title}</div>
                      <div className="text-[10px] text-zinc-500">{lesson.minutes} min</div>
                    </td>
                    <td className="px-4 py-5">
                      {done ? (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <iconify-icon icon="material-symbols:check-circle"></iconify-icon> Completed
                        </span>
                      ) : unlocked ? (
                        <span className="flex items-center gap-1.5 text-[#ef233c]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ef233c]" /> Not Started
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-zinc-600">
                          <iconify-icon icon="material-symbols:lock"></iconify-icon> Locked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-5 text-zinc-500 text-xs">{done ? new Date(done.completedAt).toLocaleDateString() : '—'}</td>
                    <td className="px-8 py-5 text-right">
                      {unlocked ? (
                        <Link to={`/training/${lesson.id}`} className="text-xs font-bold uppercase tracking-widest text-[#ef233c] hover:underline">
                          {done ? 'Review' : 'Start'}
                        </Link>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-700">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* every simulation, its pass/fail result, and a Start/Retry link */}
      <div className="glass-card rounded-[2rem] overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="p-8 border-b border-white/10">
          <h2 className="text-xl font-bold font-manrope tracking-tight">Your Marks</h2>
          <p className="text-xs text-zinc-500 mt-1">Results for every simulation assigned to you.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <th className="px-8 py-4">Simulation</th>
                <th className="px-4 py-4">Difficulty</th>
                <th className="px-4 py-4">Result</th>
                <th className="px-4 py-4">Your Action</th>
                <th className="px-4 py-4">Completed</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/5">
              {simulations.map((sim) => {
                const result = results[sim.id];
                const unlocked = isSimulationUnlocked(lessonProgress, sim);
                return (
                  <tr key={sim.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-medium">{sim.name}</div>
                      <div className="text-[10px] text-zinc-500">{sim.category}</div>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${difficultyStyle(sim.difficulty)}`}>
                        {sim.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      {!unlocked && (
                        <span className="flex items-center gap-1.5 text-zinc-600">
                          <iconify-icon icon="material-symbols:lock"></iconify-icon> Locked
                        </span>
                      )}
                      {unlocked && !result && (
                        <span className="flex items-center gap-1.5 text-zinc-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                          Not Started
                        </span>
                      )}
                      {result?.status === 'passed' && (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <iconify-icon icon="material-symbols:check-circle"></iconify-icon> Passed
                        </span>
                      )}
                      {result?.status === 'failed' && (
                        <span className="flex items-center gap-1.5 text-[#ef233c]">
                          <iconify-icon icon="material-symbols:cancel"></iconify-icon> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-5 text-zinc-400 capitalize">{result?.action ?? '—'}</td>
                    <td className="px-4 py-5 text-zinc-500 text-xs">
                      {result ? new Date(result.completedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {unlocked ? (
                        <Link
                          to={`/simulations/${sim.id}`}
                          className="text-xs font-bold uppercase tracking-widest text-[#ef233c] hover:underline"
                        >
                          {result ? 'Retry' : 'Start'}
                        </Link>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-700">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
