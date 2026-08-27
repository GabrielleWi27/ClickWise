-- A compulsory final quiz, taken once every training lesson is complete.
-- Every attempt is logged (not just the latest) — same "attempts log"
-- pattern used elsewhere, and useful for a live demo of real activity
-- data. A user has "passed" if any of their attempts passed; the app
-- lets them retake it as many times as needed.
create table training_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score int not null,
  total int not null,
  passed boolean not null,
  completed_at timestamptz not null default now()
);

alter table training_quiz_attempts enable row level security;
create policy quiz_attempts_select on training_quiz_attempts for select using (
  user_id = auth.uid()
  or public.my_role() = 'platform_admin'
  or (public.my_role() = 'org_admin' and exists (
        select 1 from profiles p where p.id = training_quiz_attempts.user_id and p.org_id = public.my_org_id()))
);
create policy quiz_attempts_insert_self on training_quiz_attempts for insert with check (user_id = auth.uid());
