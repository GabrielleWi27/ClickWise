// The compulsory final quiz — reachable at /training/quiz, but only once
// every lesson is actually done (see the Navigate-away guard below). The
// questions are generated from the lessons themselves (see utils/quiz.js),
// so passing this actually requires having retained the material, not
// just having clicked through every lesson.
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchLessons } from '../data/lessons';
import { loadProgress, computeProgress } from '../utils/trainingProgress';
import { buildQuiz, scoreQuiz, saveQuizAttempt, PASS_PERCENT } from '../utils/quiz';

export default function TrainingQuiz() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [trainingDone, setTrainingDone] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null); // { score, total, percent, passed } once submitted
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchLessons(), loadProgress(user.id)]).then(([fetchedLessons, progress]) => {
      const stats = computeProgress(progress, fetchedLessons.length);
      const isDone = fetchedLessons.length > 0 && stats.isDone;
      setLessons(fetchedLessons);
      setTrainingDone(isDone);
      if (isDone) setQuestions(buildQuiz(fetchedLessons));
      setLoading(false);
    });
  }, [user.id]);

  if (loading) {
    return null;
  }

  // Real gate: you can't reach the quiz until every lesson is actually done.
  if (!trainingDone) {
    return <Navigate to="/training" replace />;
  }

  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined);

  const handleSubmit = async () => {
    const scored = scoreQuiz(questions, answers);
    setSaving(true);
    try {
      await saveQuizAttempt(user.id, scored);
      setResult(scored);
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    setQuestions(buildQuiz(lessons));
    setAnswers({});
    setResult(null);
  };

  if (result) {
    return (
      <main className="relative z-10 pt-32 pb-20 px-4 md:px-8 max-w-2xl mx-auto text-center">
        <div
          className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl animate-fade-up ${
            result.passed
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-[#ef233c]/10 border border-[#ef233c]/30 text-[#ef233c]'
          }`}
        >
          <iconify-icon icon={result.passed ? 'material-symbols:verified' : 'material-symbols:replay'}></iconify-icon>
        </div>
        <h1 className="text-3xl font-bold font-manrope tracking-tight mb-2 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {result.passed ? 'Quiz passed!' : "Not quite — let's try again"}
        </h1>
        <p className="text-zinc-400 mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          You scored {result.score}/{result.total} ({result.percent}%). A {PASS_PERCENT}%+ score is required to pass.
        </p>
        <div className="flex gap-4 justify-center flex-wrap animate-fade-up" style={{ animationDelay: '0.15s' }}>
          {!result.passed && (
            <button
              onClick={handleRetake}
              className="px-6 py-3.5 rounded-2xl bg-[#ef233c] hover:bg-red-700 text-white font-bold text-sm transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center gap-2"
            >
              <iconify-icon icon="material-symbols:refresh"></iconify-icon> Retake Quiz
            </button>
          )}
          <Link
            to="/dashboard"
            className={`px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${
              result.passed
                ? 'bg-[#ef233c] hover:bg-red-700 text-white shadow-[0_10px_20px_rgba(239,35,60,0.2)]'
                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
            }`}
          >
            {result.passed ? 'View Your Dashboard' : 'Back to Dashboard'}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
      <Link to="/training" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1.5 mb-6">
        <iconify-icon icon="material-symbols:arrow-back"></iconify-icon> Back to Training
      </Link>

      <div className="mb-8 animate-fade-up">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ef233c]/10 border border-[#ef233c]/20 text-[#ef233c] text-[10px] font-bold uppercase tracking-widest mb-4">
          <iconify-icon icon="material-symbols:quiz"></iconify-icon> Compulsory Final Quiz
        </span>
        <h1 className="text-3xl font-bold font-manrope tracking-tight mb-2">Final Knowledge Check</h1>
        <p className="text-zinc-500">
          {questions.length} questions, one per lesson. Answer every question, then submit — you need {PASS_PERCENT}%+ to pass, and
          you can retake it as many times as you need.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {questions.map((q, qi) => (
          <div key={q.lessonId} className="glass-card rounded-[2rem] p-8 animate-fade-up" style={{ animationDelay: `${0.05 * qi}s` }}>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
              Question {qi + 1} of {questions.length}
            </p>
            <h2 className="text-lg font-bold font-manrope mb-5">{q.prompt}</h2>
            <div className="space-y-3">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers((a) => ({ ...a, [qi]: opt }))}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl border text-sm transition-all ${
                    answers[qi] === opt
                      ? 'bg-[#ef233c]/10 border-[#ef233c] text-white'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || saving}
        className="w-full bg-[#ef233c] hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl py-4 transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2"
      >
        {saving ? 'Submitting…' : allAnswered ? 'Submit Quiz' : `Answer all ${questions.length} questions to submit`}
      </button>
    </main>
  );
}
