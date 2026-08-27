// This file is the "database" for every company (organization) using
// ClickWise — except now it's a real Supabase Postgres database instead
// of the browser's local storage. Every function here talks to Supabase
// and reshapes the response into the same org/member shape the pages
// already expect, so AdminDashboard/PlatformAdmin/OrgDetail barely had
// to change — only WHERE the data comes from changed, not its shape.
import { createContext, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const OrgContext = createContext(null);

// Turns the raw rows Supabase gives us back into the single "org" object
// every page reads: { id, name, planId, seatLimit, members, assignedContent, activeCampaigns }.
function shapeOrg(orgRow, members, assignedContent, campaigns) {
  return {
    id: orgRow.id,
    name: orgRow.name,
    planId: orgRow.plan_id,
    domain: orgRow.domain, // anyone signing up with an email at this domain auto-joins
    seatLimit: orgRow.seat_limit ?? Infinity, // NULL in the database means "unlimited"
    members: (members ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      department: m.department,
      status: m.status,
      riskScore: m.risk_score,
      addedAt: m.created_at,
    })),
    assignedContent: (assignedContent ?? []).map((a) => ({
      id: a.content_id ?? a.id,
      type: a.type,
      name: a.name,
      category: a.category,
      difficulty: a.difficulty,
      assignedAt: a.assigned_at,
    })),
    activeCampaigns: (campaigns ?? []).map((c) => ({
      id: c.id,
      contentId: c.content_id,
      name: c.name,
      category: c.category,
      difficulty: c.difficulty,
      status: c.status,
      launchedAt: c.launched_at,
    })),
  };
}

export function OrgProvider({ children }) {
  // Fetches one company's full picture — its own row, its members
  // (profiles rows), what's been assigned to it, and its campaigns.
  const getOrgById = async (orgId) => {
    if (!orgId) return null;
    const [{ data: orgRow, error: orgErr }, { data: members }, { data: assigned }, { data: campaigns }] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).single(),
      supabase.from('profiles').select('*').eq('org_id', orgId).order('created_at'),
      supabase.from('org_assigned_content').select('*').eq('org_id', orgId).order('assigned_at'),
      supabase.from('org_campaigns').select('*').eq('org_id', orgId).order('launched_at'),
    ]);
    if (orgErr || !orgRow) return null;
    return shapeOrg(orgRow, members, assigned, campaigns);
  };

  // Every company on the platform — Platform Admin only (RLS enforces
  // that; anyone else's query here would just come back empty).
  const getAllOrgs = async () => {
    const { data: orgRows } = await supabase.from('organizations').select('*').order('created_at');
    if (!orgRows) return [];
    const { data: allMembers } = await supabase.from('profiles').select('org_id').not('org_id', 'is', null);
    const { data: allAssigned } = await supabase.from('org_assigned_content').select('org_id');

    const memberCounts = {};
    for (const m of allMembers ?? []) memberCounts[m.org_id] = (memberCounts[m.org_id] ?? 0) + 1;
    const assignedCounts = {};
    for (const a of allAssigned ?? []) assignedCounts[a.org_id] = (assignedCounts[a.org_id] ?? 0) + 1;

    return orgRows.map((o) => ({
      id: o.id,
      name: o.name,
      planId: o.plan_id,
      seatLimit: o.seat_limit ?? Infinity,
      // Only the .length of these is ever read (seatUsageFor / "X assigned"),
      // so a same-length placeholder array is enough here — the full member
      // list for one company comes from getOrgById instead.
      members: Array.from({ length: memberCounts[o.id] ?? 0 }),
      assignedContent: Array.from({ length: assignedCounts[o.id] ?? 0 }),
    }));
  };

  // Adds a new team member directly (rather than waiting for them to
  // self-signup). This has to go through a server-side Edge Function, not
  // a direct table insert, because creating a real login for them with a
  // chosen password requires Supabase's admin API — calling that from the
  // browser would need the secret service-role key, which must never
  // reach client code.
  const addMember = async (orgId, { name, email, department }) => {
    const { data, error } = await supabase.functions.invoke('add-member', {
      body: { name, email, department, orgId },
    });
    if (error) {
      const detail = await error.context?.json?.().catch(() => null);
      throw new Error(detail?.error || error.message);
    }
    return data;
  };

  // Assigns one content-library item to a company. We copy the item's
  // details in alongside the reference (not just a bare foreign key), so
  // this stays true to what was assigned even if the catalog item is
  // edited or removed later.
  const assignContent = async (orgId, content) => {
    const { error } = await supabase.from('org_assigned_content').insert({
      org_id: orgId,
      content_id: content.id,
      type: content.type,
      name: content.name,
      category: content.category,
      difficulty: content.difficulty,
    });
    if (error) throw new Error(error.message);
  };

  // Switches a company to a different plan, via a database function that
  // blocks the switch server-side if they have more members than the new
  // plan allows (so this can't be bypassed by calling the API directly).
  const changePlan = async (orgId, planId) => {
    const { data, error } = await supabase.rpc('change_org_plan', { p_org_id: orgId, p_plan_id: planId });
    if (error) throw new Error(error.message);
    return data;
  };

  // Starts a new phishing simulation campaign for a company, based on one
  // of the templates from the Platform Admin's content library.
  const launchCampaign = async (orgId, content) => {
    const { data, error } = await supabase
      .from('org_campaigns')
      .insert({
        org_id: orgId,
        content_id: content.id,
        name: content.name,
        category: content.category,
        difficulty: content.difficulty,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { id: data.id, contentId: data.content_id, name: data.name, category: data.category, difficulty: data.difficulty, status: data.status, launchedAt: data.launched_at };
  };

  return (
    <OrgContext.Provider value={{ getOrgById, getAllOrgs, addMember, assignContent, changePlan, launchCampaign }}>
      {children}
    </OrgContext.Provider>
  );
}

// The hook pages use to read/change company data, e.g.
// `const { getOrgById, assignContent } = useOrg();`
export function useOrg() {
  return useContext(OrgContext);
}

// Small helper: how many members a company currently has (0 if the
// company doesn't exist, e.g. hasn't loaded yet).
export function seatUsageFor(org) {
  return org?.members.length ?? 0;
}

// Small helper: how many more members a company can still add before
// hitting its plan's seat limit.
export function seatsAvailableFor(org) {
  if (!org) return Infinity;
  return org.seatLimit === Infinity ? Infinity : Math.max(0, org.seatLimit - org.members.length);
}
