// The 4-step "Create your organization" wizard: account details, plan
// choice, payment, then a confirmation screen that actually creates the
// company and logs you in as its Org Admin. Only ONE step is visible at
// a time — which one is controlled by the `step` state number (1-4).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { PLANS, formatKsh } from '../data/plans';
import { deriveNameFromEmail } from '../utils/deriveName';

// Free personal email providers we don't allow — signing up requires a
// real company/work email address.
const BLOCKED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'live.com',
  'msn.com',
  'mail.com',
  'protonmail.com',
  'yandex.com',
];

// Text shown next to "Step X of 4" at the top of the wizard.
const STEP_LABELS = ['Account Setup', 'Choose Plan', 'Payment', 'Confirmation'];

// True if the email's domain isn't one of the personal ones blocked above.
function isBusinessEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return !!domain && !BLOCKED_DOMAINS.includes(domain);
}

// Checks the password against the 3 rules shown as a live checklist:
// at least 8 characters, a mix of letters+numbers, and a special character.
function passwordChecks(password) {
  return {
    length: password.length >= 8,
    letterAndNumber: /[a-zA-Z]/.test(password) && /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
}

export default function SignUp() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  // `step` is usually 1-4, but becomes the string 'join' when this email's
  // domain already belongs to an existing organization — in that case
  // there's no plan to choose or payment to make, just a password to set.
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [joiningOrg, setJoiningOrg] = useState(null); // { id, name } of the org this email's domain matches
  const [planId, setPlanId] = useState('professional'); // pre-selects the recommended plan
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const checks = passwordChecks(password);
  const passwordValid = checks.length && checks.letterAndNumber && checks.special;
  const selectedPlan = PLANS.find((p) => p.id === planId);

  // The account itself gets created here, once we know whether this email
  // is joining an existing org or starting a brand-new one.
  const createAccount = async () => {
    const name = deriveNameFromEmail(email);
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) throw error;
    return name;
  };

  // Step 1 -> next: validate the email and password, then check whether
  // this email's domain already belongs to a company on the platform —
  // if so, there's nothing left to choose, they just join it directly.
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (domain === 'clickwise.io') {
      setEmailError('ClickWise staff accounts already exist — please sign in instead of creating a new organization.');
      return;
    }
    if (!isBusinessEmail(email)) {
      setEmailError('Please use your company email address, not a personal one (gmail.com, yahoo.com, hotmail.com, etc.)');
      return;
    }
    if (!passwordValid) return;
    setEmailError('');

    setCheckingDomain(true);
    const { data: matches } = await supabase.rpc('org_for_domain', { p_domain: domain });
    setCheckingDomain(false);

    const match = matches?.[0];
    if (match) {
      setJoiningOrg(match);
      setStep('join');
    } else {
      setStep(2);
    }
  };

  // The "join" path: just create the account. The database already knows
  // (from the domain match) to add them as an employee of that org — no
  // plan choice or payment needed, since the org already has one.
  const handleJoinSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      await createAccount();
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong creating your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 -> 3: just move on, the plan is already chosen via setPlanId.
  const handleStep2Submit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  // Step 3 -> 4: this is a demo, so no real payment is processed — we just
  // pretend it succeeded and show the confirmation step.
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setStep(4);
  };

  // The final "Go to Dashboard" click: this is where the account and the
  // company actually get created for real. Signing up logs you straight
  // in (Supabase's trigger gives you the org_admin role automatically,
  // since your email isn't @clickwise.io) — the RPC below then attaches a
  // brand new organization to that account.
  const handleGoToDashboard = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const name = await createAccount();
      const orgName = `${name.split(' ')[0]}'s Organization`;
      const { error: rpcError } = await supabase.rpc('create_organization', {
        p_plan_id: planId,
        p_org_name: orgName,
      });
      if (rpcError) throw rpcError;

      await refreshProfile();
      navigate('/admin', { replace: true });
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong creating your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-32 pb-20 px-6">
      <div className="w-full max-w-md animate-fade-up">
        {step !== 'join' && (
          <div className="mb-10">
            <div className="flex justify-between mb-4">
              <span className="text-xs font-bold font-manrope uppercase tracking-[0.2em] text-[#ef233c]">Step {step} of 4</span>
              <span className="text-xs font-medium text-zinc-500">{STEP_LABELS[step - 1]}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ef233c] shadow-[0_0_10px_#ef233c] step-transition"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="glass-card rounded-[2.5rem] p-10">
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold font-manrope tracking-tight mb-2">Create your account</h1>
                <p className="text-zinc-400 text-sm">Deploy ClickWise and transform your security culture.</p>
              </div>

              <form className="space-y-6" onSubmit={handleStep1Submit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                      Work Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      placeholder="name@yourcompany.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] transition-all"
                    />
                    {emailError && (
                      <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                        <iconify-icon icon="material-symbols:error"></iconify-icon> {emailError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] transition-all"
                    />
                    <ul className="mt-3 space-y-1.5">
                      <li className={`text-xs flex items-center gap-1.5 ${checks.length ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        <iconify-icon icon={checks.length ? 'material-symbols:check-circle' : 'material-symbols:radio-button-unchecked'}></iconify-icon>
                        At least 8 characters
                      </li>
                      <li className={`text-xs flex items-center gap-1.5 ${checks.letterAndNumber ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        <iconify-icon icon={checks.letterAndNumber ? 'material-symbols:check-circle' : 'material-symbols:radio-button-unchecked'}></iconify-icon>
                        A mix of letters and numbers
                      </li>
                      <li className={`text-xs flex items-center gap-1.5 ${checks.special ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        <iconify-icon icon={checks.special ? 'material-symbols:check-circle' : 'material-symbols:radio-button-unchecked'}></iconify-icon>
                        At least one special character
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!email || !passwordValid || checkingDomain}
                    className="w-full bg-[#ef233c] hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-[#ef233c] disabled:cursor-not-allowed text-white font-bold rounded-2xl py-4 transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2 group"
                  >
                    {checkingDomain ? 'Checking…' : 'Continue'}
                    {!checkingDomain && (
                      <iconify-icon icon="material-symbols:arrow-forward" className="group-hover:translate-x-1 transition-transform"></iconify-icon>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-10 text-center">
                <p className="text-zinc-500 text-sm">
                  Already have an account?{' '}
                  <Link to="/sign-in" className="text-white font-semibold hover:text-[#ef233c] transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* The "join" screen: shown instead of the plan/payment steps when
              this email's domain already belongs to an existing org. */}
          {step === 'join' && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-6">
                <iconify-icon icon="material-symbols:domain" className="text-emerald-400 text-3xl"></iconify-icon>
              </div>
              <h1 className="text-3xl font-bold font-manrope tracking-tight mb-2">Join {joiningOrg?.name}</h1>
              <p className="text-zinc-400 text-sm mb-8">
                Your company is already on ClickWise. Continue to finish creating your account and join their team —
                no plan or payment needed.
              </p>
              {submitError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3 mb-6 flex items-center gap-2 text-left">
                  <iconify-icon icon="material-symbols:error"></iconify-icon> {submitError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setJoiningOrg(null);
                    setStep(1);
                  }}
                  className="px-6 py-4 rounded-2xl text-zinc-400 font-medium hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleJoinSubmit}
                  disabled={submitting}
                  className="flex-1 bg-[#ef233c] hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl py-4 transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2 group"
                >
                  {submitting ? 'Joining…' : `Join ${joiningOrg?.name}`}
                  {!submitting && (
                    <iconify-icon icon="material-symbols:arrow-forward" className="group-hover:translate-x-1 transition-transform"></iconify-icon>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: pick a plan (Starter/Professional/Enterprise) */}
          {step === 2 && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold font-manrope tracking-tight mb-2">Choose your plan</h1>
                <p className="text-zinc-400 text-sm">You can change or cancel this at any time.</p>
              </div>

              <form className="space-y-4" onSubmit={handleStep2Submit}>
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setPlanId(plan.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      planId === plan.id ? 'border-[#ef233c] bg-[#ef233c]/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold font-manrope">{plan.name}</span>
                        {plan.recommended && (
                          <span className="px-2 py-0.5 bg-[#ef233c] text-white text-[9px] font-bold uppercase tracking-widest rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{plan.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold font-manrope">KSh {formatKsh(plan.priceKsh)}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">/mo</div>
                    </div>
                  </button>
                ))}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-4 rounded-2xl text-zinc-400 font-medium hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#ef233c] hover:bg-red-700 text-white font-bold rounded-2xl py-4 transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2 group"
                  >
                    Continue <iconify-icon icon="material-symbols:arrow-forward" className="group-hover:translate-x-1 transition-transform"></iconify-icon>
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: payment method — M-Pesa or card. Nothing is really
              charged here; it's a UI-only demo of the flow. */}
          {step === 3 && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold font-manrope tracking-tight mb-2">Payment details</h1>
                <p className="text-zinc-400 text-sm">
                  {selectedPlan.name} plan — <span className="text-white font-semibold">KSh {formatKsh(selectedPlan.priceKsh)}/mo</span>
                </p>
              </div>

              <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'mpesa' ? 'bg-[#ef233c] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <iconify-icon icon="material-symbols:smartphone"></iconify-icon> M-Pesa
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'card' ? 'bg-[#ef233c] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <iconify-icon icon="material-symbols:credit-card"></iconify-icon> Bank Card
                </button>
              </div>

              <form className="space-y-6" onSubmit={handlePaymentSubmit}>
                {paymentMethod === 'mpesa' ? (
                  <div>
                    <label htmlFor="mpesa-phone" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                      M-Pesa Phone Number
                    </label>
                    <input
                      type="tel"
                      id="mpesa-phone"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="07XX XXX XXX"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] transition-all"
                    />
                    <p className="text-xs text-zinc-500 mt-2">You'll receive an STK push prompt on your phone to complete payment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Card Number</label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">CVC</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-4 rounded-2xl text-zinc-400 font-medium hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#ef233c] hover:bg-red-700 text-white font-bold rounded-2xl py-4 transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2 group"
                  >
                    Complete Payment <iconify-icon icon="material-symbols:lock" className="text-sm"></iconify-icon>
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 4: confirmation — clicking the button here is what
              actually creates the company (see handleGoToDashboard above) */}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-6">
                <iconify-icon icon="material-symbols:check-circle" className="text-emerald-400 text-3xl"></iconify-icon>
              </div>
              <h1 className="text-3xl font-bold font-manrope tracking-tight mb-2">You're all set!</h1>
              <p className="text-zinc-400 text-sm mb-8">
                Your {selectedPlan.name} plan is active — KSh {formatKsh(selectedPlan.priceKsh)}/mo, paid via{' '}
                {paymentMethod === 'mpesa' ? 'M-Pesa' : 'Bank Card'}.
              </p>
              {submitError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-4 py-3 mb-6 flex items-center gap-2 text-left">
                  <iconify-icon icon="material-symbols:error"></iconify-icon> {submitError}
                </div>
              )}
              <button
                onClick={handleGoToDashboard}
                disabled={submitting}
                className="w-full bg-[#ef233c] hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl py-4 transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2 group"
              >
                {submitting ? 'Creating your account…' : 'Go to Dashboard'}
                {!submitting && (
                  <iconify-icon icon="material-symbols:arrow-forward" className="group-hover:translate-x-1 transition-transform"></iconify-icon>
                )}
              </button>
            </div>
          )}
        </div>

        {/* trust badges — illustrative marketing copy, not actual certifications */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-medium">
            SOC2 Type II Compliant • GDPR Ready • ISO 27001
          </p>
        </div>
      </div>
    </main>
  );
}
