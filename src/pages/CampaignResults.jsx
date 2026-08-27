// A detailed "results" view for one specific past campaign (this demo
// always shows the same example: "Quarterly Compliance Check Q3"). Every
// number and name on this page is hardcoded sample data — it's here to
// show what a real results page would look like, not connected to the
// real simulations/org data used elsewhere in the app.
export default function CampaignResults() {
  return (
    <main className="relative z-10 pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      {/* page header: campaign name, dates, and export/rerun buttons */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 animate-fade-up">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
              Completed
            </span>
            <span className="text-zinc-500 text-sm font-medium">Campaign ID: #CW-2024-09-Q3</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-manrope tracking-tighter">Quarterly Compliance Check Q3</h1>
          <p className="text-zinc-400 mt-2 flex items-center gap-2">
            <iconify-icon icon="material-symbols:calendar-today" className="text-[#ef233c]"></iconify-icon>
            July 01, 2024 — September 30, 2024
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <iconify-icon icon="material-symbols:download" className="text-zinc-400"></iconify-icon>
            Export Report
          </button>
          <a href="#rerun" className="shiny-cta !py-3 !px-8 text-sm font-bold uppercase tracking-widest inline-flex items-center gap-2">
            Rerun Campaign <iconify-icon icon="material-symbols:refresh"></iconify-icon>
          </a>
        </div>
      </div>

      {/* the 4 top-level stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card p-6 rounded-3xl">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Click Rate</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold font-manrope">
              2.4<span className="text-lg text-zinc-500">%</span>
            </h3>
            <span className="text-emerald-400 text-xs font-medium flex items-center gap-1 mb-1">
              <iconify-icon icon="material-symbols:trending-down"></iconify-icon> -12%
            </span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Report Rate</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold font-manrope">
              91.2<span className="text-lg text-zinc-500">%</span>
            </h3>
            <span className="text-emerald-400 text-xs font-medium flex items-center gap-1 mb-1">
              <iconify-icon icon="material-symbols:trending-up"></iconify-icon> +5.4%
            </span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Identified Risk</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold font-manrope">
              12<span className="text-lg text-zinc-500 uppercase">/450</span>
            </h3>
            <span className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-tighter">Users Vulnerable</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Avg. Risk Score</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold font-manrope">
              14<span className="text-lg text-zinc-500">/100</span>
            </h3>
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mb-3 overflow-hidden">
              <div className="h-full bg-emerald-500 w-[14%]" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* left sidebar: jump-links to the sections below (plain #anchor links) */}
        <aside className="w-full lg:w-64 shrink-0 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <nav className="glass-card p-2 rounded-[2rem] sticky top-32">
            <ul className="space-y-1">
              <li>
                <a href="#overview" className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#ef233c] text-white text-sm font-bold transition-all">
                  <iconify-icon icon="material-symbols:dashboard"></iconify-icon> Overview
                </a>
              </li>
              <li>
                <a href="#results" className="flex items-center gap-3 px-5 py-3 rounded-2xl hover:bg-white/5 text-zinc-400 hover:text-white text-sm font-medium transition-all">
                  <iconify-icon icon="material-symbols:checklist"></iconify-icon> Detailed Results
                </a>
              </li>
              <li>
                <a href="#insights" className="flex items-center gap-3 px-5 py-3 rounded-2xl hover:bg-white/5 text-zinc-400 hover:text-white text-sm font-medium transition-all">
                  <iconify-icon icon="material-symbols:lightbulb"></iconify-icon> Insights
                </a>
              </li>
              <li>
                <a href="#departments" className="flex items-center gap-3 px-5 py-3 rounded-2xl hover:bg-white/5 text-zinc-400 hover:text-white text-sm font-medium transition-all">
                  <iconify-icon icon="material-symbols:group"></iconify-icon> Departments
                </a>
              </li>
              <li>
                <a href="#export" className="flex items-center gap-3 px-5 py-3 rounded-2xl hover:bg-white/5 text-zinc-400 hover:text-white text-sm font-medium transition-all">
                  <iconify-icon icon="material-symbols:share"></iconify-icon> Export Data
                </a>
              </li>
            </ul>
          </nav>

          <div className="mt-8 glass-card p-6 rounded-3xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#ef233c] mb-4">Key Vulnerability</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              The 'Office 365 Password Reset' template accounted for 80% of all successful phishing attempts.
            </p>
          </div>
        </aside>

        <div className="flex-1 space-y-8">
          {/* two side-by-side charts: a fake bar chart + a fake donut chart (both hand-drawn with divs, not a charting library) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="glass-card p-8 rounded-[2.5rem] relative group">
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, #ef233c, transparent 70%)' }}
              />
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold font-manrope">Interaction Timeline</h3>
                <iconify-icon icon="material-symbols:more-horiz" className="text-zinc-600 hover:text-white cursor-pointer"></iconify-icon>
              </div>

              {/* each bar's height is just a fixed Tailwind class — not driven by real numbers */}
              <div className="h-48 w-full flex items-end justify-between px-2 pt-4 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10" />
                <div className="h-[40%] w-2 bg-[#ef233c]/20 rounded-t-sm" />
                <div className="h-[65%] w-2 bg-[#ef233c]/30 rounded-t-sm" />
                <div className="h-[85%] w-2 bg-[#ef233c]/50 rounded-t-sm animate-pulse" />
                <div className="h-[60%] w-2 bg-[#ef233c]/40 rounded-t-sm" />
                <div className="h-[30%] w-2 bg-[#ef233c]/20 rounded-t-sm" />
                <div className="h-[20%] w-2 bg-[#ef233c]/10 rounded-t-sm" />
                <div className="h-[45%] w-2 bg-[#ef233c]/30 rounded-t-sm" />
                <div className="h-[90%] w-2 bg-[#ef233c] rounded-t-sm shadow-[0_0_15px_rgba(239,35,60,0.4)]" />
                <div className="h-[55%] w-2 bg-[#ef233c]/40 rounded-t-sm" />
              </div>
              <div className="flex justify-between mt-4 text-[10px] text-zinc-500 uppercase font-mono">
                <span>Day 1</span>
                <span>Day 15</span>
                <span>Day 30</span>
              </div>
            </div>

            <div className="glass-card p-8 rounded-[2.5rem] relative">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold font-manrope">Risk Distribution</h3>
                <iconify-icon icon="material-symbols:info" className="text-zinc-600"></iconify-icon>
              </div>
              {/* the "donut" is just two rotated circular borders layered on top of each other */}
              <div className="flex items-center justify-center h-48">
                <div className="relative w-36 h-36 rounded-full border-8 border-emerald-500/20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-8 border-emerald-500 border-t-transparent border-r-transparent" style={{ transform: 'rotate(45deg)' }} />
                  <div className="absolute inset-0 rounded-full border-8 border-[#ef233c] border-b-transparent border-l-transparent" style={{ transform: 'rotate(-10deg)' }} />
                  <div className="text-center">
                    <span className="text-2xl font-bold font-manrope">82%</span>
                    <p className="text-[8px] uppercase tracking-widest text-zinc-500">Low Risk</p>
                  </div>
                </div>
                <div className="ml-8 space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-zinc-400">Safe (82%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-zinc-400">Vulnerable (15%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#ef233c]" />
                    <span className="text-zinc-400">High Risk (3%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* sample staff results table — search/filter/pagination controls are decorative (not wired up) */}
          <div className="glass-card rounded-[2.5rem] overflow-hidden animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-bold font-manrope">Individual Performance</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <iconify-icon icon="material-symbols:search" className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"></iconify-icon>
                  <input
                    type="text"
                    placeholder="Search staff..."
                    className="bg-black/40 border border-white/10 rounded-xl px-10 py-2 text-sm focus:outline-none focus:border-[#ef233c]"
                  />
                </div>
                <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                  <iconify-icon icon="material-symbols:filter-alt"></iconify-icon>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-white/[0.02]">
                    <th className="px-8 py-5">Employee</th>
                    <th className="px-8 py-5">Department</th>
                    <th className="px-8 py-5">Risk Score</th>
                    <th className="px-8 py-5">Action Taken</th>
                    <th className="px-8 py-5 text-right">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6 flex items-center gap-3 font-medium">
                      <div className="w-8 h-8 rounded-full bg-[#ef233c]/10 text-[#ef233c] flex items-center justify-center text-xs font-bold">JD</div>
                      Jane Doe
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-400">Finance</td>
                    <td className="px-8 py-6">
                      <span className="px-2.5 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-lg">89 / 100</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs text-red-400">
                        <iconify-icon icon="material-symbols:cancel"></iconify-icon> Link Clicked
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-500 text-right">2h ago</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6 flex items-center gap-3 font-medium">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">BM</div>
                      Bill Miller
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-400">Engineering</td>
                    <td className="px-8 py-6">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-lg">05 / 100</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <iconify-icon icon="material-symbols:check-circle"></iconify-icon> Reported
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-500 text-right">4h ago</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6 flex items-center gap-3 font-medium">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-xs font-bold">SK</div>
                      Sarah Kim
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-400">Sales</td>
                    <td className="px-8 py-6">
                      <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold rounded-lg">42 / 100</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <iconify-icon icon="material-symbols:remove-circle"></iconify-icon> No Action
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-zinc-500 text-right">1d ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Showing 1-10 of 450 staff members</span>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/5 rounded-lg text-xs hover:bg-white/10">Previous</button>
                <button className="px-4 py-2 bg-white/5 rounded-lg text-xs hover:bg-white/10">Next</button>
              </div>
            </div>
          </div>

          {/* 3 sample "insight" callout cards at the bottom */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <div className="glass-card p-6 rounded-3xl border-l-4 border-l-[#ef233c]">
              <div className="flex items-center gap-3 mb-4">
                <iconify-icon icon="material-symbols:warning" className="text-[#ef233c] text-xl"></iconify-icon>
                <h4 className="font-bold font-manrope">Immediate Action Required</h4>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                12 users in Finance entered credentials into the phishing landing page. Auto-training modules have been assigned.
              </p>
              <button className="text-[10px] font-bold text-[#ef233c] uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                Assign Training <iconify-icon icon="material-symbols:chevron-right"></iconify-icon>
              </button>
            </div>

            <div className="glass-card p-6 rounded-3xl border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-3 mb-4">
                <iconify-icon icon="material-symbols:trending-up" className="text-emerald-500 text-xl"></iconify-icon>
                <h4 className="font-bold font-manrope">Security Trend Improving</h4>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                The overall report rate has increased by 5.4% compared to the previous quarter. The "Reporting Reward" program is working.
              </p>
              <button className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                View Full Trends <iconify-icon icon="material-symbols:chevron-right"></iconify-icon>
              </button>
            </div>

            <div className="glass-card p-6 rounded-3xl border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3 mb-4">
                <iconify-icon icon="material-symbols:lightbulb" className="text-blue-500 text-xl"></iconify-icon>
                <h4 className="font-bold font-manrope">Suggested Next Campaign</h4>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Based on Finance risk levels, a spear-phishing attack simulating an Internal HR request is recommended for Q4.
              </p>
              <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                View Templates <iconify-icon icon="material-symbols:chevron-right"></iconify-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
