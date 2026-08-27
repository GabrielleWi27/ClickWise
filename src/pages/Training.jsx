// The Training list page (the "/training" route): a progress bar plus
// every lesson (from the real `lessons` table) in order. Lessons must be
// done in sequence — each one only becomes clickable once the one before
// it is finished (see isLessonUnlocked in utils/trainingProgress.js).
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchLessons } from '../data/lessons';
import { loadProgress, computeProgress, isLessonUnlocked } from '../utils/trainingProgress';
import { loadQuizStatus, PASS_PERCENT } from '../utils/quiz';

export default function Training() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [quizStatus, setQuizStatus] = useState(null);

  useEffect(() => {
    fetchLessons().then(setLessons);
    loadProgress(user.id).then(setProgress);
    loadQuizStatus(user.id).then(setQuizStatus);
  }, [user.id]);

  // Real, server-enforced gate: nobody sees the lesson list until they've
  // watched the "What Is Phishing?" intro at least once.
  if (!user.watchedPhishingIntro) {
    return <Navigate to="/training/intro" replace />;
  }

  const stats = computeProgress(progress, lessons.length);

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-[1000px] mx-auto">
      <div className="mb-10 animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold font-manrope tracking-tighter">Security Training</h1>
          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[#ef233c] text-[10px] font-bold uppercase tracking-wider border border-white/5">
            Compulsory
          </span>
        </div>
        <p className="text-zinc-500">
          Complete every lesson, in order, to build the habits that keep you and ClickWise safe from phishing.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-8 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Your Progress</p>
            <p className="text-2xl font-bold font-manrope">
              {stats.completed}
              <span className="text-zinc-600 text-lg">/{stats.total} lessons</span>
            </p>
          </div>
          {stats.isDone ? (
            <span className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold rounded-xl">
              <iconify-icon icon="material-symbols:check-circle"></iconify-icon> Training Complete
            </span>
          ) : (
            <span className="text-sm text-zinc-500">{stats.total - stats.completed} lesson{stats.total - stats.completed === 1 ? '' : 's'} remaining</span>
          )}
        </div>
        <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#ef233c] rounded-full shadow-[0_0_10px_rgba(239,35,60,0.5)] step-transition"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
      </div>

      {/* Once every lesson is done, the compulsory final quiz becomes the
          last step — shown here so it's impossible to miss. */}
      {stats.isDone && quizStatus && (
        <div
          className={`glass-card rounded-3xl p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up border-l-4 ${
            quizStatus.passed ? 'border-l-emerald-500' : 'border-l-[#ef233c]'
          }`}
          style={{ animationDelay: '0.15s' }}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                quizStatus.passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#ef233c]/10 text-[#ef233c] border border-[#ef233c]/20'
              }`}
            >
              <iconify-icon icon={quizStatus.passed ? 'material-symbols:verified' : 'material-symbols:quiz'}></iconify-icon>
            </div>
            <div>
              <h3 className="font-bold font-manrope">Compulsory Final Quiz</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {quizStatus.passed
                  ? `Passed — ${quizStatus.lastAttempt.score}/${quizStatus.lastAttempt.total} on your last attempt.`
                  : quizStatus.lastAttempt
                    ? `Last attempt: ${quizStatus.lastAttempt.score}/${quizStatus.lastAttempt.total} — you need ${PASS_PERCENT}%+ to pass.`
                    : `All lessons are done — take the ${PASS_PERCENT}%-to-pass quiz to earn your certificate.`}
              </p>
            </div>
          </div>
          <Link
            to="/training/quiz"
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              quizStatus.passed
                ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                : 'bg-[#ef233c] hover:bg-red-700 text-white shadow-[0_10px_20px_rgba(239,35,60,0.2)]'
            }`}
          >
            {quizStatus.passed ? 'Review Quiz' : quizStatus.lastAttempt ? 'Retake Quiz' : 'Take the Quiz'}
            <iconify-icon icon="material-symbols:arrow-forward"></iconify-icon>
          </Link>
        </div>
      )}

      <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        {lessons.map((lesson, i) => {
          const done = !!progress[lesson.id];
          const unlocked = isLessonUnlocked(progress, lessons, lesson.id);

          // We build the row's visual content once, then decide below
          // whether to wrap it in a clickable <Link> (if unlocked) or a
          // plain, unclickable <div> (if still locked).

          const content = (
            <div
              className={`glass-card rounded-3xl p-6 flex items-center gap-5 transition-all ${
                unlocked ? 'hover:border-[#ef233c]/30' : 'opacity-50'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold font-manrope shrink-0 ${
                  done ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 border border-white/10 text-zinc-400'
                }`}
              >
                {done ? <iconify-icon icon="material-symbols:check"></iconify-icon> : i + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-bold font-manrope">{lesson.title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{lesson.summary}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{lesson.minutes} min</p>
                {!unlocked && (
                  <span className="flex items-center gap-1 text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
                    <iconify-icon icon="material-symbols:lock"></iconify-icon> Locked
                  </span>
                )}
                {unlocked && done && (
                  <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">Completed</span>
                )}
                {unlocked && !done && (
                  <span className="text-[10px] text-[#ef233c] uppercase font-bold tracking-widest">Start</span>
                )}
              </div>
            </div>
          );

          return unlocked ? (
            <Link key={lesson.id} to={`/training/${lesson.id}`}>
              {content}
            </Link>
          ) : (
            <div key={lesson.id} className="cursor-not-allowed">
              {content}
            </div>
          );
        })}
      </div>
    </main>
  );
}
