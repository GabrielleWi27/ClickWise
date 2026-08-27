// The compulsory final quiz, taken once every training lesson is done.
// The questions aren't separately authored anywhere — they're generated
// on the fly from the lessons' own key takeaways (one question per
// lesson: the real takeaway vs. 3 real takeaways from *other* lessons as
// distractors). That means the quiz always matches whatever's actually
// in the `lessons` table, and it tests whether the material was actually
// retained rather than just clicked through.
import { supabase } from '../lib/supabaseClient';

export const PASS_PERCENT = 80;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Builds one freshly-shuffled quiz (question order, option order, and
// which takeaway/distractors get picked all randomize on every call —
// so a retake isn't just the same quiz again).
export function buildQuiz(lessons) {
  const allTakeaways = lessons.flatMap((l) => l.keyTakeaways.map((text) => ({ text, lessonId: l.id })));

  const questions = lessons.map((lesson) => {
    const correct = lesson.keyTakeaways[Math.floor(Math.random() * lesson.keyTakeaways.length)];
    const distractorPool = shuffle(allTakeaways.filter((t) => t.lessonId !== lesson.id));
    const distractors = [];
    for (const t of distractorPool) {
      if (distractors.length >= 3) break;
      if (t.text !== correct && !distractors.includes(t.text)) distractors.push(t.text);
    }
    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      prompt: `Which of these is a key takeaway from "${lesson.title}"?`,
      options: shuffle([correct, ...distractors]),
      correctAnswer: correct,
    };
  });

  return shuffle(questions);
}

// `answers` is keyed by question index -> the option text the user picked.
export function scoreQuiz(questions, answers) {
  const total = questions.length;
  const score = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
  const percent = total === 0 ? 0 : Math.round((score / total) * 100);
  return { score, total, percent, passed: percent >= PASS_PERCENT };
}

// Every attempt is kept (see the migration) — "passed" is true if *any*
// past attempt passed, and `lastAttempt` is the most recent one, so the
// UI can show "you scored 60% last time" even after they've since passed.
export async function loadQuizStatus(userId) {
  const { data, error } = await supabase
    .from('training_quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
  if (error) throw new Error(error.message);
  const attempts = data ?? [];
  return {
    attempts,
    lastAttempt: attempts[0] ?? null,
    passed: attempts.some((a) => a.passed),
  };
}

export async function saveQuizAttempt(userId, { score, total, passed }) {
  const { error } = await supabase.from('training_quiz_attempts').insert({ user_id: userId, score, total, passed });
  if (error) throw new Error(error.message);
}
