// A Platform Admin's read-only "peek" into one specific company — its
// plan, its team, its active campaigns, and what content has been
// assigned to it. Reached by clicking "View Dashboard" next to a company
// on the Platform Admin page. Every number here is real and computed
// live from Supabase, same as the org_admin's own AdminDashboard — a
// platform admin sees the exact same underlying data, just read-only.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrg, seatUsageFor } from '../context/OrgContext';
import { getPlan, formatKsh } from '../data/plans';
import { ROLES, ROLE_LABELS } from '../data/roles';
import { difficultyStyle } from '../data/content';
import { fetchOrgIntelligence } from '../utils/orgActivity';
import { fetchLessons } from '../data/lessons';

// Turns "Jane Doe" into "JD" for the little round avatar badges.
function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function OrgDetail() {
  const { orgId } = useParams(); // the company id from the URL, e.g. /platform-admin/orgs/org_123
  const { getOrgById } = useOrg();
  const [org, setOrg] = useState(null);
  const [intel, setIntel] = useState({ overallRiskScore: null, riskScoreByMember: {}, trainingCompletionRate: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrgById(orgId), fetchLessons()]).then(async ([orgResult, lessons]) => {
      setOrg(orgResult);
      setIntel(await fetchOrgIntelligence(orgId, { lessonCount: lessons.length }));
      setLoading(false);
    });
  }, [orgId, getOrgById]);

  if (loading) {
    return null;
  }

  // If someone visits a made-up or deleted company id, show a friendly
  // message instead of crashing.
  if (!org) {
    return (
      <main className="relative z-10 pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto text-center">
        <h1 className="text-3xl font-bold font-manrope mb-4">Organization not found</h1>
        <Link to="/platform-admin" className="text-[#ef233c] hover:underline text-sm font-bold uppercase tracking-widest">
          Back to Platform Admin
        </Link>
      </main>
    );
  }

  const plan = getPlan(org.planId); // this org's plan details (price, seat limit, features)
  const seatUsage = seatUsageFor(org); // how many members currently fill those seats

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 animate-fade-up">
        <div>
          <Link to="/platform-admin" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1.5 mb-3">
            <iconify-icon icon="material-symbols:arrow-back"></iconify-icon> Platform Admin
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold font-manrope tracking-tighter">{org.name}</h1>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/20">
              Viewing as Platform Admin
            </span>
          </div>
          <p className="text-zinc-500">Read-only view of this organization's members, campaigns, and assigned content.</p>
        </div>
      </div>

      {/* 4 top-level stat cards: plan, member count, risk score, training completion */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-2.5 bg-purple-600/10 rounded-xl text-purple-400 inline-flex mb-4">
            <iconify-icon icon="material-symbols:bolt" className="text-xl"></iconify-icon>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Plan</div>
          <div className="text-2xl font-bold font-manrope tracking-tight">{plan.name}</div>
          <p className="text-zinc-500 text-xs mt-1">KSh {formatKsh(plan.priceKsh)}/mo</p>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-400 inline-flex mb-4">
            <iconify-icon icon="material-symbols:group" className="text-xl"></iconify-icon>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Members</div>
          <div className="text-4xl font-bold font-manrope tracking-tight">
            {seatUsage}
            <span className="text-zinc-600 text-xl font-medium">/{org.seatLimit === Infinity ? '∞' : org.seatLimit}</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-2.5 bg-red-600/10 rounded-xl text-[#ef233c] inline-flex mb-4">
            <iconify-icon icon="material-symbols:monitor-heart" className="text-xl"></iconify-icon>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Org Risk Score</div>
          <div className="text-4xl font-bold font-manrope tracking-tight">
            {intel.overallRiskScore === null ? '—' : `${intel.overallRiskScore}/100`}
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-2.5 bg-emerald-600/10 rounded-xl text-emerald-400 inline-flex mb-4">
            <iconify-icon icon="material-symbols:school" className="text-xl"></iconify-icon>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Training Completion</div>
          <div className="text-4xl font-bold font-manrope tracking-tight">
            {intel.trainingCompletionRate === null ? '—' : `${intel.trainingCompletionRate}%`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* full member list, with each person's own risk score on the right */}
          <div className="glass-card rounded-[2rem] overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="p-8 border-b border-white/10">
              <h2 className="text-xl font-bold font-manrope tracking-tight">Team Directory</h2>
              <p className="text-xs text-zinc-500 mt-1">{org.members.length} members in this organization.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <th className="px-8 py-4">Name</th>
                    <th className="px-4 py-4">Role</th>
                    <th className="px-4 py-4">Department</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-white/5">
                  {org.members.map((member) => (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[10px]">
                            {initials(member.name)}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-[10px] text-zinc-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span
                          className={
                            member.role === ROLES.ORG_ADMIN
                              ? 'px-2 py-0.5 bg-red-500/10 text-[#ef233c] text-[10px] font-bold uppercase rounded border border-red-500/20'
                              : 'px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase rounded'
                          }
                        >
                          {ROLE_LABELS[member.role]}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-zinc-400">{member.department}</td>
                      <td className="px-4 py-5">
                        {member.status === 'active' ? (
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Invited
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right font-mono text-zinc-400">
                        {intel.riskScoreByMember[member.id] === undefined ? '—' : `${intel.riskScoreByMember[member.id]}/100`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* every phishing campaign this org has launched */}
          <div className="glass-card rounded-[2rem] p-8 animate-fade-up" style={{ animationDelay: '0.25s' }}>
            <h2 className="text-xl font-bold font-manrope tracking-tight mb-8">Active Campaigns</h2>
            {org.activeCampaigns.length === 0 ? (
              <p className="text-sm text-zinc-500 py-6 text-center">This organization hasn't launched any campaigns yet.</p>
            ) : (
              <div className="space-y-4">
                {org.activeCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#ef233c]/10 rounded-xl flex items-center justify-center text-[#ef233c]">
                      <iconify-icon icon="material-symbols:mark-email-unread" className="text-2xl"></iconify-icon>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-xs text-zinc-500">
                        {campaign.category} • Launched {new Date(campaign.launchedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border shrink-0 ${difficultyStyle(campaign.difficulty)}`}>
                      {campaign.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* sidebar: content library items assigned to this org */}
        <div className="glass-card rounded-[2rem] p-8 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-lg font-bold font-manrope mb-6 flex items-center gap-2">
            <iconify-icon icon="material-symbols:space-dashboard" className="text-[#ef233c]"></iconify-icon>
            Assigned Content
          </h2>
          {org.assignedContent.length === 0 ? (
            <p className="text-sm text-zinc-500">Nothing assigned to this organization yet.</p>
          ) : (
            <div className="space-y-4">
              {org.assignedContent.map((item, i) => (
                <div key={`${item.id}_${i}`} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${difficultyStyle(item.difficulty)}`}>
                      {item.difficulty}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">{item.category}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
