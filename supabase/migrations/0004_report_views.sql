-- Two views backing the real Reports.jsx analytics — also handy to run
-- directly in the SQL Editor as a demo of real aggregate queries.
--
-- `security_invoker = true` is the important part: without it, a view
-- runs with the VIEW OWNER's permissions against the underlying tables,
-- bypassing RLS entirely. With it, the view respects the RLS policies of
-- whoever is actually querying it — so an org_admin querying these views
-- automatically only ever sees their own organization's rows, with zero
-- extra filtering logic needed here.

-- One row per department per org: how many people, how many simulation
-- attempts, and a 0-100 risk score (higher = more failed attempts).
create view public.org_department_risk
with (security_invoker = true) as
select
  p.org_id,
  p.department,
  count(distinct p.id) as member_count,
  count(sr.id) as completed_count,
  count(sr.id) filter (where sr.status = 'failed') as failed_count,
  case when count(sr.id) = 0 then null
       else round((count(sr.id) filter (where sr.status = 'failed')::numeric / count(sr.id)) * 100 * 0.8)
  end as risk_score
from profiles p
left join sim_results sr on sr.user_id = p.id
where p.department is not null
group by p.org_id, p.department;

-- One row per simulation category per org: how often it's been attempted
-- and what percentage of those attempts ended in a click (the "top attack
-- vectors" ranking shown on Reports.jsx).
create view public.org_attack_vectors
with (security_invoker = true) as
select
  p.org_id,
  s.category,
  count(sr.id) as attempt_count,
  count(sr.id) filter (where sr.action = 'click') as click_count,
  case when count(sr.id) = 0 then 0
       else round((count(sr.id) filter (where sr.action = 'click')::numeric / count(sr.id)) * 100)
  end as click_rate
from sim_results sr
join profiles p on p.id = sr.user_id
join simulations s on s.id = sr.sim_id
group by p.org_id, s.category;
