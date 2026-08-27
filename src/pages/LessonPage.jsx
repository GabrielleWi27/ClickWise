// The page that actually shows one lesson's reading material and lets
// you mark it complete. Reached via /training/:lessonId (the lessonId
// part of the URL tells us which lesson to show).
//
// Completing a lesson for the first time is gated two ways, so "complete"
// actually means "read", not just "clicked a button":
//  - click-to-reveal: each section starts collapsed and has to be opened
//    before its content counts as read
//  - a reading timer: the Continue button stays locked until enough time
//    has passed for the lesson's own estimated reading time (`minutes`),
//    pausing whenever this browser tab isn't actually visible
// Revisiting an already-completed lesson skips both gates — you've
// already proven you read it once.
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchLessons } from '../data/lessons';
import { fetchSimulations } from '../data/simulations';
import { loadProgress, markComplete, isLessonUnlocked } from '../utils/trainingProgress';

function formatRemaining(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LessonPage() {
  const { lessonId } = useParams(); // which lesson, from the URL
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  // Click-to-reveal + reading-timer state, reset every time the lesson changes.
  const [revealed, setRevealed] = useState(() => new Set());
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    Promise.all([fetchLessons(), fetchSimulations(), loadProgress(user.id)]).then(([fetchedLessons, fetchedSims, fetchedProgress]) => {
      setLessons(fetchedLessons);
      setSimulations(fetchedSims);
      setProgress(fetchedProgress);
      // Was this lesson already completed before? If so, start in the
      // "already done" state instead of pretending it's their first time.
      setDone(!!fetchedProgress[lessonId]);
      setLoading(false);
    });
  }, [lessonId, user.id]);

  useEffect(() => {
    setRevealed(new Set());
    setSecondsElapsed(0);
  }, [lessonId]);

  // The reading timer only runs for a first-time (not-yet-done) lesson,
  // and only while this tab is actually the visible one — so someone
  // can't start it, tab away, and come back to a "fully read" lesson.
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setSecondsElapsed((s) => s + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lessonId, done]);

  if (loading) {
    return null;
  }

  // Someone jumped straight to a lesson URL without watching the intro
  // first — bounce them there instead of the Training list.
  if (!user.watchedPhishingIntro) {
    return <Navigate to="/training/intro" replace />;
  }

  const index = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[index];

  // Someone typed a bad/old lesson id into the URL — show a friendly message.
  if (!lesson) {
    return (
      <main className="relative z-10 pt-32 pb-20 px-4 md:px-8 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold font-manrope mb-4">Lesson not found</h1>
        <Link to="/training" className="text-[#ef233c] hover:underline text-sm font-bold uppercase tracking-widest">
          Back to Training
        </Link>
      </main>
    );
  }

  // This is what actually enforces "compulsory in order" — if someone
  // tries to jump straight to a locked lesson's URL, bounce them back to
  // the Training list instead of letting them read ahead.
  if (!isLessonUnlocked(progress, lessons, lessonId)) {
    return <Navigate to="/training" replace />;
  }

  const isLast = index === lessons.length - 1;
  const nextLesson = lessons[index + 1];
  // The one simulation (if any) this lesson unlocks — see requiredLessonId
  // in data/simulations.js.
  const pairedSim = simulations.find((s) => s.requiredLessonId === lesson.id);

  const requiredSeconds = lesson.minutes * 60;
  const allRevealed = lesson.sections.every((_, i) => revealed.has(i));
  const timeReady = secondsElapsed >= requiredSeconds;
  const canContinue = allRevealed && timeReady;
  const remainingLabel = formatRemaining(Math.max(0, requiredSeconds - secondsElapsed));

  const revealSection = (i) => setRevealed((prev) => new Set(prev).add(i));

  // Marks this lesson done (only reachable once every gate is cleared).
  // Doesn't auto-navigate anywhere — instead it reveals a "what's next"
  // panel with explicit buttons (matching simulation / next lesson).
  const handleMarkComplete = async () => {
    await markComplete(user.id, lessonId);
    setDone(true);
  };

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/training" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1.5">
          <iconify-icon icon="material-symbols:arrow-back"></iconify-icon> Back to Training
        </Link>
        <Link
          to="/training"
          title="Leave without completing — this won't count toward your progress"
          aria-label="Leave without completing"
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/30 transition-all shrink-0"
        >
          <iconify-icon icon="material-symbols:close"></iconify-icon>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-2 animate-fade-up">
        <span className="text-xs font-bold uppercase tracking-widest text-[#ef233c]">
          Lesson {index + 1} of {lessons.length}
        </span>
        <span className="text-xs text-zinc-500">{lesson.minutes} min read</span>
      </div>
      <h1 className="text-3xl font-bold font-manrope tracking-tight mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {lesson.title}
      </h1>

      {done ? (
        // Already proven they read this one — show it fully open, no gates.
        <div className="glass-card rounded-[2rem] p-8 mb-8 space-y-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {lesson.sections.map((section) => (
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
      ) : (
        // First time through: click-to-reveal cards, one per section.
        <div className="space-y-4 mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {lesson.sections.map((section, i) =>
            revealed.has(i) ? (
              <div key={section.heading} className="glass-card rounded-3xl p-6 border-l-4 border-l-[#ef233c]/40 animate-fade-up">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-sm">
                    <iconify-icon icon="material-symbols:check"></iconify-icon>
                  </div>
                  <h2 className="font-bold font-manrope">{section.heading}</h2>
                </div>
                {section.body.map((para, pi) => (
                  <p key={pi} className="text-sm text-zinc-300 leading-relaxed mb-2 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <button
                key={section.heading}
                onClick={() => revealSection(i)}
                className="w-full text-left glass-card rounded-3xl p-6 flex items-center justify-between gap-4 hover:border-[#ef233c]/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0 text-sm font-bold font-manrope">
                    {i + 1}
                  </div>
                  <div>
                    <h2 className="font-bold font-manrope">{section.heading}</h2>
                    <p className="text-xs text-zinc-500">Click to reveal this section</p>
                  </div>
                </div>
                <iconify-icon icon="material-symbols:chevron-right" className="text-zinc-500 shrink-0"></iconify-icon>
              </button>
            )
          )}
        </div>
      )}

      <div className="glass-card rounded-[2rem] p-8 mb-8 border-l-4 border-l-emerald-500 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
          <iconify-icon icon="material-symbols:lightbulb"></iconify-icon> Key Takeaways
        </h3>
        <ul className="space-y-2">
          {lesson.keyTakeaways.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-zinc-300">
              <iconify-icon icon="material-symbols:check-circle" className="text-emerald-400 mt-0.5 shrink-0"></iconify-icon>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {!done ? (
        <>
          <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 px-1">
            <span className="flex items-center gap-1.5">
              <iconify-icon icon="material-symbols:menu-book"></iconify-icon>
              {revealed.size}/{lesson.sections.length} sections read
            </span>
            {!timeReady && (
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="material-symbols:timer-outline"></iconify-icon>
                {remainingLabel} remaining
              </span>
            )}
          </div>
          <button
            onClick={handleMarkComplete}
            disabled={!canContinue}
            className="w-full bg-[#ef233c] hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#ef233c] text-white font-bold rounded-2xl py-4 transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2"
          >
            {canContinue
              ? isLast
                ? 'Mark Complete & Finish'
                : 'Mark Complete & Continue'
              : !allRevealed
                ? 'Reveal every section to continue'
                : `Keep reading — ${remainingLabel} left`}
            {canContinue && <iconify-icon icon="material-symbols:arrow-forward"></iconify-icon>}
          </button>
        </>
      ) : (
        <div className="glass-card rounded-[2rem] p-8 border-l-4 border-l-emerald-500 animate-fade-up">
          <div className="flex items-center gap-3 mb-2">
            <iconify-icon icon="material-symbols:check-circle" className="text-emerald-400 text-2xl"></iconify-icon>
            <h3 className="font-bold font-manrope text-lg">Lesson complete</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-6">What would you like to do next?</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {pairedSim && (
              <button
                onClick={() => navigate(`/simulations/${pairedSim.id}`)}
                className="flex-1 px-6 py-3.5 rounded-2xl bg-[#ef233c] hover:bg-red-700 text-white font-bold text-sm transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2"
              >
                <iconify-icon icon="material-symbols:track-changes"></iconify-icon> Try the Matching Simulation
              </button>
            )}
            {!isLast ? (
              <button
                onClick={() => navigate(`/training/${nextLesson.id}`)}
                className={`flex-1 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  pairedSim
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                    : 'bg-[#ef233c] hover:bg-red-700 text-white shadow-[0_10px_20px_rgba(239,35,60,0.2)]'
                }`}
              >
                Continue to Next Lesson <iconify-icon icon="material-symbols:arrow-forward"></iconify-icon>
              </button>
            ) : (
              <button
                onClick={() => navigate('/training')}
                className={`flex-1 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  pairedSim
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                    : 'bg-[#ef233c] hover:bg-red-700 text-white shadow-[0_10px_20px_rgba(239,35,60,0.2)]'
                }`}
              >
                Back to Training <iconify-icon icon="material-symbols:arrow-forward"></iconify-icon>
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
