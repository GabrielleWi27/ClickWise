// A printable/downloadable statistics report for an Org Admin — reached
// from the "Export Data" button on AdminDashboard.jsx. Rather than pull in
// a PDF-generation library, this is a plain, print-friendly page: clicking
// "Print / Save as PDF" calls the browser's own print dialog, which every
// browser already lets you save straight to a PDF file — no new dependency,
// same "use what the browser already gives you" approach as the
// canvas-drawn certificate in utils/certificate.js.
//
// Every number here comes from the exact same real data AdminDashboard
// shows on screen (org.members/activeCampaigns + fetchOrgIntelligence) —
// this is a formatted printout of that data, not a separate calculation.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrg, seatUsageFor } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';
import { getPlan, formatKsh } from '../data/plans';
import { ROLES, ROLE_LABELS } from '../data/roles';
import { fetchOrgIntelligence } from '../utils/orgActivity';
import { fetchLessons } from '../data/lessons';

export default function OrgReport() {
  const { user } = useAuth();
  const { getOrgById } = useOrg();
  const [org, setOrg] = useState(null);
  const [intel, setIntel] = useState({ overallRiskScore: null, riskScoreByMember: {}, recentActivity: [], trainingCompletionRate: null });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const fresh = await getOrgById(user.orgId);
    setOrg(fresh);
    const lessons = await fetchLessons();
    setIntel(await fetchOrgIntelligence(user.orgId, { lessonCount: lessons.length }));
    setLoading(false);
  }, [user.orgId, getOrgById]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return null;
  }

  const members = org?.members ?? [];
  const activeCampaigns = org?.activeCampaigns ?? [];
  const plan = getPlan(org?.planId);
  const seatUsage = seatUsageFor(org);
  const seatLimit = org?.seatLimit ?? Infinity;
  const generatedOn = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

  return (
    // This whole page is designed to look right on actual paper: a white
    // background with dark text, regardless of screen or print — unlike
    // the rest of the app's dark theme, which would waste ink if printed.
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-4xl mx-auto bg-white text-zinc-900 print:pt-0 min-h-screen">
      {/* toolbar — hidden on the actual printout, only for on-screen use */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link to="/admin" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800 flex items-center gap-1.5">
          <iconify-icon icon="material-symbols:arrow-back"></iconify-icon> Back to Dashboard
        </Link>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-[#ef233c] hover:bg-red-700 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(239,35,60,0.3)]"
        >
          <iconify-icon icon="material-symbols:print"></iconify-icon>
          Print / Save as PDF
        </button>
      </div>

      {/* report header */}
      <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center bg-[#ef233c] rounded-lg">
            <iconify-icon icon="material-symbols:shield" className="text-white text-sm"></iconify-icon>
          </div>
          <span className="text-xl font-bold font-manrope tracking-tighter">CLICKWISE</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Generated</p>
          <p className="text-sm font-medium">{generatedOn}</p>
        </div>
      </div>

      <h1 className="text-3xl font-bold font-manrope tracking-tight mb-1">{org?.name ?? 'Organization'} — Statistics Report</h1>
      <p className="text-zinc-500 mb-10">
        {plan.name} plan (KSh {formatKsh(plan.priceKsh)}/mo) · {seatUsage} of {seatLimit === Infinity ? 'unlimited' : seatLimit} seats used
      </p>

      {/* key stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="border border-zinc-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Risk Score</p>
          <p className="text-3xl font-bold font-manrope">{intel.overallRiskScore === null ? '—' : intel.overallRiskScore}<span className="text-zinc-400 text-base">/100</span></p>
        </div>
        <div className="border border-zinc-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Members</p>
          <p className="text-3xl font-bold font-manrope">{seatUsage}</p>
        </div>
        <div className="border border-zinc-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Training Completion</p>
          <p className="text-3xl font-bold font-manrope">{intel.trainingCompletionRate === null ? '—' : `${intel.trainingCompletionRate}%`}</p>
        </div>
        <div className="border border-zinc-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Active Campaigns</p>
          <p className="text-3xl font-bold font-manrope">{activeCampaigns.length}</p>
        </div>
      </div>

      {/* team directory */}
      <h2 className="text-lg font-bold font-manrope mb-4">Team Directory ({members.length})</h2>
      <table className="w-full text-left border-collapse mb-10 text-sm">
        <thead>
          <tr className="border-b-2 border-zinc-900 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2 pr-4">Department</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 text-right">Risk Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="py-2 pr-4 font-medium">{member.name}</td>
              <td className="py-2 pr-4 text-zinc-500">{member.email}</td>
              <td className="py-2 pr-4">{ROLE_LABELS[member.role]}</td>
              <td className="py-2 pr-4 text-zinc-500">{member.department ?? '—'}</td>
              <td className="py-2 pr-4 capitalize">{member.status}</td>
              <td className="py-2 text-right font-mono">
                {member.role === ROLES.ORG_ADMIN || intel.riskScoreByMember[member.id] === undefined
                  ? '—'
                  : `${intel.riskScoreByMember[member.id]}/100`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* active campaigns */}
      <h2 className="text-lg font-bold font-manrope mb-4">Active Campaigns ({activeCampaigns.length})</h2>
      {activeCampaigns.length === 0 ? (
        <p className="text-sm text-zinc-500 mb-10">No campaigns launched yet.</p>
      ) : (
        <table className="w-full text-left border-collapse mb-10 text-sm">
          <thead>
            <tr className="border-b-2 border-zinc-900 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Difficulty</th>
              <th className="py-2 text-right">Launched</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {activeCampaigns.map((c) => (
              <tr key={c.id}>
                <td className="py-2 pr-4 font-medium">{c.name}</td>
                <td className="py-2 pr-4 text-zinc-500">{c.category}</td>
                <td className="py-2 pr-4">{c.difficulty}</td>
                <td className="py-2 text-right text-zinc-500">{new Date(c.launchedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* recent activity */}
      <h2 className="text-lg font-bold font-manrope mb-4">Recent Activity</h2>
      {intel.recentActivity.length === 0 ? (
        <p className="text-sm text-zinc-500">No activity recorded yet.</p>
      ) : (
        <ul className="space-y-2 mb-10 text-sm">
          {intel.recentActivity.map((item) => (
            <li key={item.id} className="flex justify-between border-b border-zinc-100 pb-2">
              <span>{item.text}</span>
              <span className="text-zinc-400 shrink-0 ml-4">{new Date(item.timestamp).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-zinc-400 uppercase tracking-widest border-t border-zinc-200 pt-6">
        ClickWise · Phishing Defense &amp; Security Awareness Platform — Confidential organizational report
      </p>
    </main>
  );
}
