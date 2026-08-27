// The one shared connection to our Supabase project (database + auth + API).
// Every Context/page that needs real data imports `supabase` from here
// instead of touching localStorage directly.
import { createClient } from '@supabase/supabase-js';

// These come from the .env file (see .env.example) — Vite makes any
// variable starting with VITE_ available here via import.meta.env.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail loudly and immediately if the .env file is missing/incomplete,
// instead of letting every Supabase call fail later with a confusing error.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project values.'
  );
}

// The anon key is safe to expose in client code — Row Level Security
// policies on each table are what actually decide who can read/write what.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
