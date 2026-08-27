// Supabase's REST API (PostgREST) caps a single response at 1,000 rows by
// default — a plain `.select()` on a table that can grow large per query
// (training_progress, sim_results) doesn't error past that limit, it just
// silently returns the first 1,000 and drops the rest. That quietly
// produces wrong stats (undercounted training completion, wrong risk
// scores) instead of an obvious bug, which is exactly what happened for a
// large organization here.
//
// This fetches every row of a query, one 1,000-row page at a time.
// `buildQuery(from, to)` is called once per page and must return a fresh
// Supabase query with `.range(from, to)` applied — e.g.:
//   const rows = await fetchAllPages((from, to) =>
//     supabase.from('sim_results').select('*').in('user_id', ids).range(from, to)
//   );
const PAGE_SIZE = 1000;

export async function fetchAllPages(buildQuery) {
  let rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows = rows.concat(data ?? []);
    if (!data || data.length < PAGE_SIZE) break; // fewer than a full page means this was the last one
    from += PAGE_SIZE;
  }
  return rows;
}
