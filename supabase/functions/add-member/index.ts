// Runs on Supabase's servers, not in the browser — this is the ONLY place
// allowed to touch the service-role key (needed to create a real Supabase
// Auth account directly, with a password we choose, rather than the org
// admin's own browser session getting swapped out — which is what would
// happen if we called supabase.auth.signUp() from the client instead).
//
// No email gets sent at all: the new account is created with the shared
// default password "123456" and a `must_change_password` flag, and the
// app shows a warning banner until they set their own password.
//
// What it checks, in order:
//   1. The caller is a real, logged-in org_admin of the org they claim.
//   2. The new email's domain matches the org_admin's own domain (same
//      rule as domain-based self-service joining).
//   3. The org still has a free seat on its current plan.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Every new member starts with this same password and is forced to
// change it on first login (see the must_change_password flag below).
const DEFAULT_PASSWORD = '123456';

// Lets the browser call this function at all — without these headers the
// browser blocks the request before it even reaches this code.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Small helper so every response below is valid JSON with the right headers.
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// The actual function entry point — runs once per request.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS }); // browser's CORS preflight check
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const { name, email, department, orgId } = await req.json();
    if (!name || !email || !orgId) return json({ error: 'Missing required fields' }, 400);

    // A client using the CALLER's own token — just to find out who's asking.
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
      error: callerErr,
    } = await callerClient.auth.getUser();
    if (callerErr || !caller) return json({ error: 'Not authenticated' }, 401);

    // A second client using the powerful service-role key — only ever used
    // server-side, never sent to the browser.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Check 1: is the caller actually this org's admin?
    const { data: callerProfile } = await adminClient.from('profiles').select('*').eq('id', caller.id).single();
    if (!callerProfile || callerProfile.role !== 'org_admin' || callerProfile.org_id !== orgId) {
      return json({ error: 'Not authorized to add members to this organization' }, 403);
    }

    // Check 2: does the new member's email match the org's own domain?
    const adminDomain = callerProfile.email.split('@')[1]?.toLowerCase();
    const newDomain = email.split('@')[1]?.toLowerCase();
    if (!adminDomain || adminDomain !== newDomain) {
      return json({ error: `New members must use an @${adminDomain} email address.` }, 400);
    }

    // Check 3: is there still room on the org's plan?
    const { data: org } = await adminClient.from('organizations').select('seat_limit').eq('id', orgId).single();
    if (org?.seat_limit != null) {
      const { count } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);
      if ((count ?? 0) >= org.seat_limit) {
        return json({ error: "Seat limit reached for your plan. Upgrade to add more members." }, 400);
      }
    }

    // Creating the user (rather than calling signUp from the browser) is
    // exactly what keeps the org admin's own session untouched — signUp()
    // would otherwise log the browser in as this new account instead.
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (createErr) return json({ error: createErr.message }, 400);

    // The domain-matching trigger already assigned role='employee' and
    // org_id (since this org's domain was already claimed) — just fill in
    // what it doesn't know: department, and the "please change this" flag.
    const { error: updateErr } = await adminClient
      .from('profiles')
      .update({ department: department ?? null, must_change_password: true })
      .eq('id', created.user.id);
    if (updateErr) return json({ error: updateErr.message }, 400);

    return json({
      member: { id: created.user.id, name, email, department, status: 'active' },
      defaultPassword: DEFAULT_PASSWORD,
    });
  } catch (err) {
    return json({ error: err.message ?? 'Unexpected error' }, 500);
  }
});
