// Runs on Supabase's servers, not in the browser — deleting a real Auth
// account requires the service-role key (the same reason add-member is
// its own Edge Function instead of a plain client-side call).
//
// Deleting the auth.users row cascades automatically (see the `on delete
// cascade` foreign keys in 0001_init.sql) to that person's profiles row,
// training_progress, sim_results, and training_quiz_attempts — removing a
// member erases their account and all their history in one step.
//
// What it checks, in order:
//   1. The caller is a real, logged-in org_admin of the org they claim.
//   2. The member being removed actually belongs to that same org.
//   3. The target isn't an org_admin (including the caller themselves) —
//      this action only ever removes employees, never an admin account.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

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

    const { memberId, orgId } = await req.json();
    if (!memberId || !orgId) return json({ error: 'Missing required fields' }, 400);

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
      return json({ error: 'Not authorized to remove members from this organization' }, 403);
    }

    // Check 2: does the target member actually belong to this org?
    const { data: target } = await adminClient.from('profiles').select('*').eq('id', memberId).single();
    if (!target || target.org_id !== orgId) {
      return json({ error: 'That member was not found in this organization' }, 404);
    }

    // Check 3: never allow removing an admin (including yourself) this way.
    if (target.role === 'org_admin') {
      return json({ error: 'Org admins cannot be removed from here' }, 400);
    }

    // Deleting the auth user cascades to their profile + all their
    // training/simulation/quiz history automatically.
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(memberId);
    if (deleteErr) return json({ error: deleteErr.message }, 400);

    return json({ removed: memberId });
  } catch (err) {
    return json({ error: err.message ?? 'Unexpected error' }, 500);
  }
});
