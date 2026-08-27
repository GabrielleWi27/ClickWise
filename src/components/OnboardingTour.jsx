// A short, role-aware welcome tour shown as a popup the first time a user
// signs in. "Seen" is tracked per-account in localStorage (not a database
// column) — this is just onboarding polish, not something that needs to
// sync across devices or survive a database reset.
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TOUR_STEPS_BY_ROLE } from '../data/onboardingTour';

// The localStorage key that remembers "this specific account has already
// seen the tour" — unique per user id, so two accounts on the same
// browser don't share one flag.
function seenKey(userId) {
  return `clickwise_tour_seen_${userId}`;
}

export default function OnboardingTour() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false); // whether the popup is currently showing
  const [step, setStep] = useState(0); // which slide (0-indexed) is currently shown

  // The right slide deck for this user's role (or null if nobody's logged in).
  const steps = user ? TOUR_STEPS_BY_ROLE[user.role] : null;

  // Whenever the logged-in user changes, check localStorage: if this
  // account has never dismissed the tour before, pop it open from the start.
  useEffect(() => {
    if (!user || !steps) return;
    const alreadySeen = localStorage.getItem(seenKey(user.id)) === 'true';
    if (!alreadySeen) {
      setStep(0);
      setOpen(true);
    }
  }, [user?.id]);

  // Nothing to show: popup closed, nobody logged in, or no tour for this role.
  if (!open || !user || !steps) return null;

  // Closing the popup (via Skip, the backdrop, or finishing the last step)
  // permanently remembers it was seen, so it won't pop up again for this account.
  const dismiss = () => {
    localStorage.setItem(seenKey(user.id), 'true');
    setOpen(false);
  };

  const isLast = step === steps.length - 1;
  const current = steps[step]; // the slide currently on screen

  return (
    // Clicking the dark backdrop dismisses the tour, same as Skip.
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-up"
      style={{ animationDuration: '0.3s' }}
      onClick={dismiss}
    >
      {/* stopPropagation so clicking *inside* the card doesn't also trigger the backdrop's dismiss */}
      <div
        className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={dismiss} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
          Skip
        </button>

        <div className="w-14 h-14 rounded-2xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center text-[#ef233c] mb-6">
          <iconify-icon icon={current.icon} className="text-2xl"></iconify-icon>
        </div>

        <h2 className="text-xl font-bold font-manrope mb-3">{current.title}</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">{current.body}</p>

        <div className="flex items-center justify-between">
          {/* progress dots — one per slide, the current one stretches into a bar */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-[#ef233c]' : 'w-1.5 bg-white/15'}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
              className="px-5 py-2.5 rounded-xl bg-[#ef233c] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-1.5"
            >
              {isLast ? 'Get Started' : 'Next'}
              <iconify-icon icon="material-symbols:arrow-forward" className="text-sm"></iconify-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
