// The public marketing homepage. Most of it is static — but the pricing
// section near the bottom is "smart": its buttons change depending on
// whether you're logged in, and if so, which plan your company is
// already on (Subscribe / Upgrade Plan / Change Plan / Current Plan).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PLANS, formatKsh } from '../data/plans';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import catherinePhoto from '../assets/catherine.jpg'; // testimonial headshot, used with permission

// Plans are listed in order (Starter, Professional, Enterprise), so
// their position in the list (0, 1, 2) doubles as a "which is bigger"
// ranking — used to decide whether a button should say "Upgrade" or
// "Change" plan.
function planRank(planId) {
  return PLANS.findIndex((p) => p.id === planId);
}

export default function Home() {
  const { user } = useAuth();
  const { getOrgById, changePlan } = useOrg();
  const [planError, setPlanError] = useState(''); // shown if a plan switch is blocked (e.g. seat limit)
  const [planFlash, setPlanFlash] = useState(''); // brief "Switched to X plan" success message
  const [myOrg, setMyOrg] = useState(null); // null if logged out, or logged in but no company (e.g. Platform Admin)

  const refreshMyOrg = useCallback(async () => {
    setMyOrg(user ? await getOrgById(user.orgId) : null);
  }, [user, getOrgById]);

  useEffect(() => {
    refreshMyOrg();
  }, [refreshMyOrg]);

  const currentPlanId = myOrg?.planId ?? null;

  // Runs when a pricing card's button is clicked, for someone who's
  // logged in and belongs to a company. Tries to switch plans; if
  // changePlan() throws (e.g. too many members for the new plan), we
  // catch it and show the error message instead of crashing.
  const handlePlanClick = async (planId) => {
    if (!myOrg) return;
    try {
      await changePlan(myOrg.id, planId);
      await refreshMyOrg();
      setPlanError('');
      setPlanFlash(`Switched to the ${PLANS.find((p) => p.id === planId).name} plan`);
      setTimeout(() => setPlanFlash(''), 3000);
    } catch (err) {
      setPlanFlash('');
      setPlanError(err.message);
      setTimeout(() => setPlanError(''), 4000);
    }
  };

  return (
    <main className="relative z-10">
      {/* HERO — the big headline + two main call-to-action buttons */}
      <section className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
        <div className="text-center max-w-5xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-up"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef233c]" />
            </span>
            <span className="text-xs font-medium text-red-100/90 tracking-wide font-manrope uppercase">
              Advanced Phishing Defense Engine
            </span>
            <iconify-icon icon="material-symbols:auto-awesome" className="w-3 h-3 text-red-400"></iconify-icon>
          </div>

          <h1
            className="text-6xl md:text-8xl font-bold tracking-tighter font-manrope leading-[1.05] mb-8 animate-fade-up"
            style={{ animationDelay: '0.2s' }}
          >
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">Empowering</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
              Human Intelligence{' '}
              <span className="text-[#ef233c] inline-block relative">
                Click Wisely
                <svg
                  className="absolute w-full h-3 -bottom-2 left-0 text-[#ef233c] opacity-60"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up" style={{ animationDelay: '0.3s' }}>
            Simulate, educate, and eradicate human-centric cyber risks with automated phishing campaigns and risk-adaptive security training.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/simulations" className="shiny-cta group">
              <span className="relative z-10 flex items-center gap-2 text-white font-bold uppercase tracking-wide text-sm">
                Launch Simulation <iconify-icon icon="material-symbols:gpp-maybe" className="transition-transform group-hover:scale-110"></iconify-icon>
              </span>
            </Link>

            <Link
              to="/demo"
              className="group px-8 py-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
            >
              <iconify-icon icon="material-symbols:play-circle" className="w-5 h-5"></iconify-icon>
              Try Demo
            </Link>
          </div>
        </div>

        {/* "trusted by" logo strip — these are fictional example companies, purely decorative */}
        <div className="w-full mt-32 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm py-10 opacity-60">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <p className="text-sm font-bold tracking-widest text-zinc-500 uppercase shrink-0">Trusted by Security Teams at:</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center w-full grayscale opacity-70">
              <div className="flex items-center gap-2 font-manrope font-semibold">SECURECORP</div>
              <div className="flex items-center gap-2 font-manrope font-semibold">CLOUDSHIELD</div>
              <div className="flex items-center gap-2 font-manrope font-semibold">DEFENSE.IO</div>
              <div className="flex items-center gap-2 font-manrope font-semibold">NOVA BANK</div>
              <div className="flex items-center gap-2 font-manrope font-semibold">QUANTUM SYS</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES — the grid of cards explaining what the product does */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center max-w-3xl mx-auto animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-6">
              Transform Vulnerability into <br />
              <span className="text-[#ef233c]">Active Defense</span>
            </h2>
            <p className="text-lg text-zinc-400 font-light">
              Our platform measures your staff's susceptibility to social engineering and automatically reinforces security best practices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden p-8 border border-white/10 bg-gradient-to-b from-zinc-900/50 to-black hover:border-white/20 transition-all rounded-3xl">
              <div className="relative z-10 h-full flex flex-col">
                <div className="mb-6 inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 text-[#ef233c] shadow-[0_0_20px_rgba(239,35,60,0.2)]">
                  <iconify-icon icon="material-symbols:mail" className="w-8 h-8"></iconify-icon>
                </div>
                <h3 className="text-3xl font-semibold text-white font-manrope mb-4 tracking-tight">Intelligent Campaigns</h3>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Launch sophisticated, multi-stage phishing simulations using real-world threat intelligence. Track clicks, data entry, and
                  report rates in real-time across your entire workforce.
                </p>
              </div>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, #ef233c, transparent 70%)' }}
              />
            </div>

            <div className="lg:col-span-2 group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/20 transition-all rounded-3xl">
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 border border-white/10 text-red-400">
                  <iconify-icon icon="material-symbols:bar-chart" className="w-6 h-6"></iconify-icon>
                </div>
                <h3 className="text-2xl font-semibold text-white font-manrope mb-2">Risk Scoring Algorithm</h3>
                <p className="text-zinc-400">
                  Quantify individual and departmental risk using our proprietary scoring engine based on interaction history and behavior
                  patterns.
                </p>
              </div>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, #ef233c, transparent 70%)' }}
              />
            </div>

            <div className="group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/20 transition-all rounded-3xl">
              <div className="relative z-10">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 border border-white/10 text-emerald-400">
                  <iconify-icon icon="material-symbols:school" className="w-6 h-6"></iconify-icon>
                </div>
                <h3 className="text-xl font-semibold text-white font-manrope mb-2">Auto-Training</h3>
                <p className="text-sm text-zinc-400">Instant educational delivery when a user clicks a simulated phishing link, ensuring high retention.</p>
              </div>
            </div>

            <div className="group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/20 transition-all rounded-3xl">
              <div className="relative z-10">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 border border-white/10 text-blue-400">
                  <iconify-icon icon="material-symbols:travel-explore" className="w-6 h-6"></iconify-icon>
                </div>
                <h3 className="text-xl font-semibold text-white font-manrope mb-2">Live Threat Intel</h3>
                <p className="text-sm text-zinc-400">Real, live phishing and malware data streamed from public threat feeds — see what's actually happening right now.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL — a single illustrative customer quote (not a real customer) */}
      <section className="w-full bg-[#ef233c] py-24 px-6 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-black/20" />
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1 text-black mb-8">
            <iconify-icon icon="material-symbols:shield" className="w-8 h-8"></iconify-icon>
          </div>
          <h3 className="text-3xl md:text-5xl font-extrabold text-black font-manrope leading-tight mb-10">
            "ClickWise reduced our employee phishing click rate from 24% to less than 2% in just six months. The ROI was immediate."
          </h3>
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-black rounded-full overflow-hidden flex items-center justify-center border-2 border-white/20 shrink-0">
              <img src={catherinePhoto} alt="Catherine Okoth" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <div className="text-black font-bold text-xl leading-tight">Catherine Okoth</div>
              <div className="text-black/80 font-medium">Head of Cyber Security at Global Logistics</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING — the 3 plan cards, with "smart" buttons handled by handlePlanClick above */}
      <section id="pricing" className="py-32 px-6 bg-black relative border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-semibold text-white font-manrope mb-4">Scalable Protection Tiers</h2>
            <p className="text-zinc-400">Choose the level of intelligence your organization needs.</p>
          </div>

          {(planFlash || planError) && (
            <div className="max-w-md mx-auto mb-10 text-center">
              {planFlash && (
                <p className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl inline-flex items-center gap-2">
                  <iconify-icon icon="material-symbols:check-circle"></iconify-icon> {planFlash}
                </p>
              )}
              {planError && (
                <p className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl inline-flex items-center gap-2">
                  <iconify-icon icon="material-symbols:error"></iconify-icon> {planError}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={
                  plan.recommended
                    ? 'relative p-8 border border-[#ef233c] bg-zinc-900/40 shadow-[0_0_40px_rgba(239,35,60,0.15)] rounded-3xl flex flex-col scale-105 z-10'
                    : 'p-8 border border-zinc-800 bg-black hover:border-zinc-700 transition-all rounded-3xl flex flex-col'
                }
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ef233c] text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                    Recommended
                  </div>
                )}
                <h3 className="text-xl font-bold font-manrope mb-2">{plan.name}</h3>
                <p className={`text-sm mb-8 h-10 ${plan.recommended ? 'text-zinc-400' : 'text-zinc-500'}`}>{plan.description}</p>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-zinc-500 text-lg">KSh</span>
                  <span className="text-5xl font-bold text-white">{formatKsh(plan.priceKsh)}</span>
                  <span className="text-zinc-500 text-sm">/mo</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                      <iconify-icon icon="material-symbols:check" className="text-[#ef233c]"></iconify-icon> {feature}
                    </li>
                  ))}
                </ul>
                {/* Which button/label to show for THIS pricing card:
                    - not logged in (no company)     -> "Subscribe", links to sign up
                    - this IS their current plan      -> "Current Plan", disabled
                    - otherwise, compare plan ranking  -> "Upgrade Plan" or "Change Plan" */}
                {!myOrg ? (
                  <Link
                    to="/sign-up"
                    className={
                      plan.recommended
                        ? 'w-full py-4 px-4 bg-[#ef233c] hover:bg-red-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-[0_5px_15px_rgba(239,35,60,0.3)] transition-all inline-flex items-center justify-center'
                        : 'w-full py-4 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all inline-flex items-center justify-center'
                    }
                  >
                    Subscribe
                  </Link>
                ) : plan.id === currentPlanId ? (
                  <button
                    disabled
                    className="w-full py-4 px-4 bg-transparent text-zinc-500 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlanClick(plan.id)}
                    className={
                      plan.recommended
                        ? 'w-full py-4 px-4 bg-[#ef233c] hover:bg-red-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-[0_5px_15px_rgba(239,35,60,0.3)] transition-all'
                        : 'w-full py-4 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all'
                    }
                  >
                    {planRank(plan.id) > planRank(currentPlanId) ? 'Upgrade Plan' : 'Change Plan'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA — closing pitch + a decorative email signup form (not wired up to anything yet) */}
      <section className="py-32 px-6 text-center bg-zinc-950/40 border-y border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold font-manrope mb-8 tracking-tighter">
            Ready to <span className="text-[#ef233c]">Secure Your Team?</span>
          </h2>
          <p className="text-xl text-zinc-400 mb-12">Start your first simulated campaign in under 5 minutes. No credit card required for trial.</p>

          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Work email address"
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#ef233c] transition-all"
            />
            <button className="bg-[#ef233c] hover:bg-red-700 text-white font-bold rounded-2xl px-8 py-4 transition-all shadow-[0_0_20px_rgba(239,35,60,0.2)]">
              Get Started
            </button>
          </form>
          <p className="mt-6 text-xs text-zinc-600 uppercase tracking-widest">Join 2,500+ security-first organizations</p>
        </div>
      </section>
    </main>
  );
}
