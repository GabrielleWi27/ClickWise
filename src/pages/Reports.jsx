// An org-wide analytics page for Org Admins — real numbers now, computed
// from this org's actual sim_results (joined to profiles/simulations),
// plus two database views (org_department_risk, org_attack_vectors) that
// do the department/category aggregation directly in Postgres.
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

// Turns a plain list of numbers into an SVG "path" string, so they can be
// drawn as a connected line chart. Each number becomes one point; `M` means
// "move to this point" (the start) and `L` means "draw a line to this point".
function trendPath(points, width, height) {
  const max = Math.max(...points, 1);
  const step = width / (points.length - 1 || 1);
  return points
    .map((p, i) => {
      const x = i * step;
      const y = height - (p / max) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

const DEPT_COLOR = (score) => (score >= 50 ? 'bg-[#ef233c]' : score >= 25 ? 'bg-yellow-500' : 'bg-emerald-500');

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]); // every sim_results row for this org, with month bucket
  const [campaignCount, setCampaignCount] = useState(0);
  const [departments, setDepartments] = useState([]); // from org_department_risk
  const [vectors, setVectors] = useState([]); // from org_attack_vectors

  useEffect(() => {
    const orgId = user.orgId;
    // sim_results.user_id and profiles.id both reference auth.users, but
    // not each other directly, so PostgREST can't embed one inside the
    // other — look up this org's member ids first, then fetch their results.
    supabase
      .from('profiles')
      .select('id')
      .eq('org_id', orgId)
      .then(({ data: members }) => {
        const memberIds = (members ?? []).map((m) => m.id);
        return Promise.all([
          memberIds.length ? supabase.from('sim_results').select('*').in('user_id', memberIds) : Promise.resolve({ data: [] }),
          supabase.from('org_campaigns').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
          supabase.from('org_department_risk').select('*').eq('org_id', orgId),
          supabase.from('org_attack_vectors').select('*').eq('org_id', orgId).order('click_rate', { ascending: false }).limit(4),
        ]);
      })
      .then(([resultsRes, campaignsRes, deptRes, vectorRes]) => {
        setResults(resultsRes.data ?? []);
        setCampaignCount(campaignsRes.count ?? 0);
        setDepartments((deptRes.data ?? []).filter((d) => d.completed_count > 0).sort((a, b) => b.risk_score - a.risk_score));
        setVectors(vectorRes.data ?? []);
        setLoading(false);
      });
  }, [user.orgId]);

  if (loading) {
    return null;
  }

  // The 4 top-line numbers, all computed from this org's real sim_results rows.
  const totalCompleted = results.length;
  const totalFailed = results.filter((r) => r.status === 'failed').length;
  const overallRiskScore = totalCompleted === 0 ? 0 : Math.round((totalFailed / totalCompleted) * 100 * 0.8);
  const clickRate = totalCompleted === 0 ? 0 : Math.round((results.filter((r) => r.action === 'click').length / totalCompleted) * 1000) / 10;
  const reportRate = totalCompleted === 0 ? 0 : Math.round((results.filter((r) => r.action === 'report').length / totalCompleted) * 1000) / 10;

  // Real simulation activity for the last 6 months, bucketed by completion date.
  const now = new Date();
  const monthBuckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleDateString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() };
  });
  const activityCounts = monthBuckets.map(
    (b) => results.filter((r) => { const d = new Date(r.completed_at); return d.getFullYear() === b.year && d.getMonth() === b.month; }).length
  );
  const linePath = trendPath(activityCounts, 560, 160); // the chart's line
  const areaPath = `${linePath} L560,160 L0,160 Z`; // same line, closed into a shape so it can be filled

  const topVector = vectors[0]; // the riskiest attack category (highest click rate)
  const topDept = departments[0]; // the lowest-scoring department (sorted highest-risk-first above)

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 animate-fade-up">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold font-manrope tracking-tighter">Security Reports</h1>
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[#ef233c] text-[10px] font-bold uppercase tracking-wider border border-white/5">
              Superuser Access
            </span>
          </div>
          <p className="text-zinc-500">Risk trends and analytics across your organization, computed live from Supabase.</p>
        </div>
      </div>

      {/* 4 top-level stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-red-600/10 rounded-xl text-[#ef233c]">
              <iconify-icon icon="material-symbols:monitor-heart" className="text-xl"></iconify-icon>
            </div>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Overall Risk Score</div>
          <div className="text-4xl font-bold font-manrope tracking-tight mb-2">
            {overallRiskScore}
            <span className="text-zinc-600 text-xl font-medium">/100</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-[#ef233c] shadow-[0_0_10px_rgba(239,35,60,0.5)]" style={{ width: `${overallRiskScore}%` }} />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-purple-600/10 rounded-xl text-purple-400">
              <iconify-icon icon="material-symbols:track-changes" className="text-xl"></iconify-icon>
            </div>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Campaigns Run</div>
          <div className="text-4xl font-bold font-manrope tracking-tight mb-2">{campaignCount}</div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-400">
              <iconify-icon icon="material-symbols:ads-click" className="text-xl"></iconify-icon>
            </div>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Org-wide Click Rate</div>
          <div className="text-4xl font-bold font-manrope tracking-tight mb-2">{clickRate}%</div>
          <p className="text-zinc-500 text-xs">{totalCompleted} simulation attempts recorded</p>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-600/10 rounded-xl text-emerald-400">
              <iconify-icon icon="material-symbols:flag" className="text-xl"></iconify-icon>
            </div>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Org-wide Report Rate</div>
          <div className="text-4xl font-bold font-manrope tracking-tight mb-2">{reportRate}%</div>
          <p className="text-zinc-500 text-xs">{totalFailed} risky interactions found</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="lg:col-span-2 glass-card rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold font-manrope tracking-tight">Simulation Activity</h2>
              <p className="text-xs text-zinc-500 mt-1">Attempts completed per month, last 6 months.</p>
            </div>
          </div>

          {/* the line chart: a filled area under a stroked line, both drawn from the same path */}
          <svg viewBox="0 0 560 160" className="w-full h-48" preserveAspectRatio="none">
            <defs>
              <linearGradient id="riskTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef233c" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ef233c" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#riskTrendFill)" />
            <path d={linePath} fill="none" stroke="#ef233c" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 6px rgba(239,35,60,0.5))' }} />
          </svg>
          <div className="flex justify-between mt-2 text-[10px] text-zinc-500 uppercase font-mono">
            {monthBuckets.map((b) => (
              <span key={`${b.year}-${b.month}`}>{b.label}</span>
            ))}
          </div>
        </div>

        {/* ranked list from the org_department_risk database view — highest risk first */}
        <div className="glass-card rounded-[2rem] p-8">
          <h2 className="text-lg font-bold font-manrope mb-6 flex items-center gap-2">
            <iconify-icon icon="material-symbols:group" className="text-[#ef233c]"></iconify-icon>
            Department Leaderboard
          </h2>
          {departments.length === 0 ? (
            <p className="text-sm text-zinc-500">No completed simulations yet — scores will appear here once your team starts.</p>
          ) : (
            <div className="space-y-5">
              {departments.slice(0, 5).map((dept, i) => (
                <div key={dept.department}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span className="text-zinc-600 text-xs font-mono">#{i + 1}</span>
                      {dept.department}
                    </span>
                    <span className="text-xs font-bold text-zinc-400">{dept.risk_score}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className={`h-full ${DEPT_COLOR(dept.risk_score)} rounded-full`} style={{ width: `${dept.risk_score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="lg:col-span-2 glass-card rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold font-manrope tracking-tight">Top Attack Vectors</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-8">Phishing template categories that most successfully trick your team, ranked by click-through rate.</p>
          {vectors.length === 0 ? (
            <p className="text-sm text-zinc-500">No completed simulations yet.</p>
          ) : (
            <div className="space-y-5">
              {vectors.map((vector) => (
                <div key={vector.category}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium">{vector.category}</span>
                    <span className="text-xs font-bold text-[#ef233c]">{vector.click_rate}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-[#ef233c] rounded-full" style={{ width: `${vector.click_rate}%`, opacity: 0.3 + vector.click_rate / 100 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6 rounded-3xl border-l-4 border-l-[#ef233c]">
          <div className="flex items-center gap-3 mb-4">
            <iconify-icon icon="material-symbols:warning" className="text-[#ef233c] text-xl"></iconify-icon>
            <h4 className="font-bold font-manrope">Key Takeaway</h4>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {topVector ? (
              <>
                "{topVector.category}" lures remain your org's biggest weak point at {topVector.click_rate}% click-through.
                {topDept && ` ${topDept.department} currently trails all departments on risk score.`}
              </>
            ) : (
              'Once your team completes a few simulations, this card will highlight your biggest weak point automatically.'
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
