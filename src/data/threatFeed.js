// Live phishing + malware/botnet URLs, proxied through the `threat-feed`
// Edge Function (see supabase/functions/threat-feed/index.ts) since the
// upstream feeds either lack CORS headers for direct browser fetches or
// are too large to download client-side on every page view.
import { supabase } from '../lib/supabaseClient';

// Calls the Edge Function and hands back whatever it returns (a list of
// recent phishing/malware URLs).
export async function fetchThreatFeed() {
  const { data, error } = await supabase.functions.invoke('threat-feed', { method: 'GET' });
  if (error) throw new Error(error.message);
  return data;
}
