// The Org Admin's main dashboard: their team, active campaigns, and
// company info. Every number here is real, computed live from Supabase —
// org.members / org.activeCampaigns come straight from the database, and
// Risk Score / Training Completion / Recent Activity come from
// utils/orgActivity.js, which aggregates real sim_results and
// training_progress rows instead of showing placeholder numbers.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrg, seatUsageFor } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';
import { getPlan, formatKsh } from '../data/plans';
import { ROLES, ROLE_LABELS } from '../data/roles';
import { difficultyStyle } from '../data/content';
import { fetchOrgIntelligence } from '../utils/orgActivity';
import { fetchLessons } from '../data/lessons';
import { formatRelativeTime } from '../utils/activityLog';
import AddMemberModal from '../components/AddMemberModal';
import AddCampaignModal from '../components/AddCampaignModal';

const ACTIVITY_COLOR_CLASSES = {
  emerald: 'bg-emerald-500',
  red: 'bg-[#ef233c]',
  blue: 'bg-blue-500',
};

// Turns "Jane Doe" into "JD" for the little round avatar badges.
function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { getOrgById, removeMember } = useOrg();
  const [showAddMember, setShowAddMember] = useState(false); // toggles the Add Member popup
  const [showAddCampaign, setShowAddCampaign] = useState(false); // toggles the Add Campaign popup
  const [org, setOrg] = useState(null); // this admin's own company, fetched from Supabase
  const [intel, setIntel] = useState({ overallRiskScore: null, riskScoreByMember: {}, recentActivity: [], trainingCompletionRate: null });
  const [confirmRemoveId, setConfirmRemoveId] = useState(null); // which member row is showing "Remove?" right now
  const [removingId, setRemovingId] = useState(null); // which member is actively being deleted (disables the buttons)
  const [removeError, setRemoveError] = useState('');

  // Re-fetches this company's data — called on first load, and again
  // after adding a member or launching a campaign so the page reflects it.
  const refreshOrg = useCallback(async () => {
    const fresh = await getOrgById(user.orgId);
    setOrg(fresh);
    const lessons = await fetchLessons();
    setIntel(await fetchOrgIntelligence(user.orgId, { lessonCount: lessons.length }));
  }, [user.orgId, getOrgById]);

  useEffect(() => {
    refreshOrg();
  }, [refreshOrg]);

  // Actually deletes the member (only called after they've confirmed via
  // the inline "Remove?" step below) — permanently erases their account
  // and all their training/simulation history.
  const handleRemoveMember = async (memberId) => {
    setRemoveError('');
    setRemovingId(memberId);
    try {
      await removeMember(user.orgId, memberId);
      await refreshOrg();
    } catch (err) {
      setRemoveError(err.message);
    } finally {
      setRemovingId(null);
      setConfirmRemoveId(null);
    }
  };

  const members = org?.members ?? [];
  const activeCampaigns = org?.activeCampaigns ?? [];
  const plan = getPlan(org?.planId);
  const seatUsage = seatUsageFor(org);
  const seatLimit = org?.seatLimit ?? Infinity;

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 animate-fade-up">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold font-manrope tracking-tighter">Admin Dashboard</h1>
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[#ef233c] text-[10px] font-bold uppercase tracking-wider border border-white/5">
              Superuser Access
            </span>
          </div>
          <p className="text-zinc-500">Real-time intelligence and organization controls.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Link
            to="/reports"
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <iconify-icon icon="material-symbols:bar-chart"></iconify-icon>
            View Reports
          </Link>
          <button
            onClick={() => setShowAddMember(true)}
            className="px-5 py-2.5 bg-[#ef233c] hover:bg-red-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(239,35,60,0.3)]"
          >
            <iconify-icon icon="material-symbols:add"></iconify-icon>
            Add Member
          </button>
        </div>
      </div>

      {/* People can also join on their own — anyone who signs up with an
          email at this org's claimed domain joins automatically too. */}
      {org?.domain && (
        <div className="mb-10 -mt-4 animate-fade-up px-1 flex items-center gap-2 text-xs text-zinc-500">
          <iconify-icon icon="material-symbols:domain" className="text-[#ef233c]"></iconify-icon>
          Anyone who signs up with an <span className="text-zinc-300 font-mono">@{org.domain}</span> email joins your team automatically too.
        </div>
      )}

      {/* 4 top-level stat cards: risk score, member count, training completion, campaign count */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-red-600/10 rounded-xl text-[#ef233c]">
              <iconify-icon icon="material-symbols:monitor-heart" className="text-xl"></iconify-icon>
            </div>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Risk Score</div>
          <div className="text-4xl font-bold font-manrope tracking-tight mb-2">
            {intel.overallRiskScore === null ? '—' : intel.overallRiskScore}
            <span className="text-zinc-600 text-xl font-medium">/100</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#ef233c] shadow-[0_0_10px_rgba(239,35,60,0.5)]"
              style={{ width: `${intel.overallRiskScore ?? 0}%` }}
            />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-400">
              <iconify-icon icon="material-symbols:group" className="text-xl"></iconify-icon>
            </div>
            <span className="text-zinc-500 text-xs font-bold">{ROLE_LABELS[ROLES.EMPLOYEE]}s: {members.filter((m) => m.role === ROLES.EMPLOYEE).length}</span>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Members</div>
          <div className="text-4xl font-bold font-manrope tracking-tight mb-2">
            {seatUsage}
            <span className="text-zinc-600 text-xl font-medium">/{seatLimit === Infinity ? '∞' : seatLimit}</span>
          </div>
          <p className="text-zinc-500 text-xs italic">Joins automatically by company domain</p>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-600/10 rounded-xl text-emerald-400">
              <iconify-icon icon="material-symbols:verified-user" className="text-xl"></iconify-icon>
            </div>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Training Completion</div>
          <div className="text-4xl font-bold font-manrope tracking-tight mb-2">
            {intel.trainingCompletionRate === null ? '—' : `${intel.trainingCompletionRate}%`}
          </div>
          <p className="text-zinc-500 text-xs">of your team has finished every lesson</p>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-purple-600/10 rounded-xl text-purple-400">
              <iconify-icon icon="material-symbols:bolt" className="text-xl"></iconify-icon>
            </div>
            <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-bold uppercase rounded">
              {plan.name}
            </span>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Active Campaigns</div>
          <div className="text-4xl font-bold font-manrope tracking-tight mb-2">{activeCampaigns.length}</div>
          <p className="text-zinc-500 text-xs">{activeCampaigns.length === 0 ? 'None launched yet' : `${activeCampaigns.length} running against your team`}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="lg:col-span-2 space-y-8">
          {/* Team Directory: lists every real member of this company (org.members) */}
          <div className="glass-card rounded-[2rem] overflow-hidden">
            <div className="p-8 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-manrope tracking-tight">Team Directory</h2>
                <p className="text-xs text-zinc-500 mt-1">Manage user access and assigned roles.</p>
              </div>
              <div className="flex gap-2">
                {/* search box + filter button are decorative — not wired up to any filtering logic yet */}
                <div className="relative">
                  <iconify-icon icon="material-symbols:search" className="absolute left-3 top-2.5 text-zinc-500"></iconify-icon>
                  <input
                    type="text"
                    placeholder="Search team..."
                    className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#ef233c] transition-all"
                  />
                </div>
                <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                  <iconify-icon icon="material-symbols:filter-alt"></iconify-icon>
                </button>
              </div>
            </div>
            {removeError && (
              <div className="mx-8 mt-4 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <iconify-icon icon="material-symbols:error"></iconify-icon> {removeError}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <th className="px-8 py-4 w-10">
                      <input type="checkbox" className="accent-[#ef233c]" />
                    </th>
                    <th className="px-4 py-4">Name</th>
                    <th className="px-4 py-4">Role</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Risk Score</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-white/5">
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-10 text-center text-zinc-500 text-sm">
                        No members yet. Click "Add Member" to invite your first teammate.
                      </td>
                    </tr>
                  )}
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <input type="checkbox" className="accent-[#ef233c]" />
                      </td>
                      <td className="px-4 py-5">
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
                      <td className="px-4 py-5 font-mono text-zinc-400">
                        {intel.riskScoreByMember[member.id] === undefined ? '—' : `${intel.riskScoreByMember[member.id]}/100`}
                      </td>
                      <td className="px-8 py-5 text-right">
                        {member.role === ROLES.ORG_ADMIN ? (
                          // Org admins can't be removed from this screen — see remove-member's checks.
                          <span className="text-zinc-700 text-xs">—</span>
                        ) : confirmRemoveId === member.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-zinc-400">Remove?</span>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={removingId === member.id}
                              className="px-3 py-1.5 rounded-lg bg-[#ef233c] hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all"
                            >
                              {removingId === member.id ? 'Removing…' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setConfirmRemoveId(null)}
                              disabled={removingId === member.id}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-zinc-300 text-xs font-bold transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRemoveId(member.id)}
                            title="Remove member"
                            aria-label="Remove member"
                            className="p-2 text-zinc-500 hover:text-[#ef233c] transition-colors"
                          >
                            <iconify-icon icon="material-symbols:person-remove"></iconify-icon>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-zinc-900/80 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-xs text-zinc-500">
                Showing {members.length} of {seatLimit === Infinity ? 'unlimited' : seatLimit} members
              </div>
              <div className="flex gap-3">
                {/* decorative — no per-member training assignment feature exists yet */}
                <button className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white px-4 py-2 border border-white/10 rounded-xl transition-all">
                  Assign Training
                </button>
                <Link
                  to="/admin/report"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white px-4 py-2 border border-white/10 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <iconify-icon icon="material-symbols:download"></iconify-icon>
                  Export Data
                </Link>
              </div>
            </div>
          </div>

          {/* Active Campaigns: real campaigns this company has launched (org.activeCampaigns) */}
          <div className="glass-card rounded-[2rem] p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold font-manrope tracking-tight">Active Campaigns</h2>
              <button
                onClick={() => setShowAddCampaign(true)}
                className="px-4 py-2 bg-[#ef233c] hover:bg-red-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <iconify-icon icon="material-symbols:add"></iconify-icon>
                Add Campaign
              </button>
            </div>
            {activeCampaigns.length === 0 ? (
              <p className="text-sm text-zinc-500 py-6 text-center">No campaigns launched yet. Click "Add Campaign" to run your first simulation.</p>
            ) : (
              <div className="space-y-4">
                {activeCampaigns.map((campaign) => (
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

        <div className="space-y-8">
          <div className="glass-card rounded-[2rem] p-8">
            <h2 className="text-lg font-bold font-manrope mb-6 flex items-center gap-2">
              <iconify-icon icon="material-symbols:domain" className="text-[#ef233c]"></iconify-icon>
              Org Intelligence
            </h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Members</span>
                <span className="text-sm font-medium">{seatUsage} Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Tier</span>
                <span className="px-2 py-0.5 bg-[#ef233c] text-white text-[10px] font-bold uppercase rounded shadow-[0_0_10px_rgba(239,35,60,0.3)]">
                  {plan.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Billing</span>
                <span className="text-sm font-medium">KSh {formatKsh(plan.priceKsh)}/mo</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-8">
            <h2 className="text-lg font-bold font-manrope mb-6 flex items-center gap-2">
              <iconify-icon icon="material-symbols:schedule" className="text-zinc-500"></iconify-icon>
              Recent Activity
            </h2>
            {intel.recentActivity.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">
                No activity yet — this fills in as your team completes simulations and lessons.
              </p>
            ) : (
              <div className="space-y-6">
                {intel.recentActivity.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className={`w-1 h-8 rounded-full ${ACTIVITY_COLOR_CLASSES[item.color]}`} />
                    <div>
                      <div className="text-xs font-bold">{item.text}</div>
                      <div className="text-[10px] text-zinc-500 mt-1">{formatRelativeTime(item.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* the two popups, only rendered while their "show" flag is true */}
      {showAddMember && (
        <AddMemberModal org={org} orgId={user.orgId} onClose={() => setShowAddMember(false)} onMemberAdded={refreshOrg} />
      )}
      {showAddCampaign && (
        <AddCampaignModal orgId={user.orgId} onClose={() => setShowAddCampaign(false)} onCampaignLaunched={refreshOrg} />
      )}
    </main>
  );
}
