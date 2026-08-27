-- ClickWise Supabase schema — Phase 0 of the localStorage-to-Supabase migration.
-- Run this once against a fresh Supabase project (SQL Editor, or `supabase db push`).

-- ===== enums =====
create type app_role         as enum ('platform_admin','org_admin','employee');
create type member_status    as enum ('active','invited');
create type content_type     as enum ('campaign','demo','training');
create type difficulty_level as enum ('Low','Medium','High');
create type result_status    as enum ('passed','failed');
create type sim_action       as enum ('report','click','ignore');

-- ===== reference data (shared, not per-org) =====
create table plans (
  id text primary key,                 -- 'starter' | 'professional' | 'enterprise'
  name text not null,
  description text not null,
  price_ksh int not null,
  recommended boolean not null default false,
  seat_limit int,                      -- NULL = unlimited (replaces the old JS `Infinity` seat limit)
  features text[] not null
);

create table content_library (
  id uuid primary key default gen_random_uuid(),
  type content_type not null,
  name text not null,
  category text not null,
  difficulty difficulty_level not null default 'Medium',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table simulations (
  id text primary key,                 -- readable slug, e.g. 'sim_password_reset'
  name text not null,
  category text not null,
  difficulty difficulty_level not null,
  sender text not null,
  subject text not null,
  body text[] not null,
  cta_label text not null,
  red_flags text[] not null,
  created_at timestamptz not null default now()
);

create table lessons (
  id text primary key,
  order_index int not null unique,     -- lessons must be completed in this order
  title text not null,
  summary text not null,
  minutes int not null,
  sections jsonb not null,             -- [{heading, body:[...]}]
  key_takeaways text[] not null,
  created_at timestamptz not null default now()
);

-- ===== organizations and membership =====
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan_id text not null references plans(id),
  seat_limit int,                      -- copied from plans.seat_limit at create/change time
  created_at timestamptz not null default now()
);

-- one row per authenticated user, linking auth.users -> role + org
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role app_role not null,
  org_id uuid references organizations(id) on delete set null,  -- null for platform_admin
  department text,
  status member_status not null default 'active',
  risk_score numeric,
  created_at timestamptz not null default now()
);

-- ===== org-scoped content assignments =====
create table org_assigned_content (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  content_id uuid references content_library(id) on delete set null,
  type content_type not null,
  name text not null,
  category text not null,
  difficulty difficulty_level not null,
  assigned_at timestamptz not null default now()
);

create table org_campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  content_id uuid references content_library(id) on delete set null,
  name text not null,
  category text not null,
  difficulty difficulty_level not null,
  status text not null default 'active',
  launched_at timestamptz not null default now()
);

-- ===== per-user simulation/training results =====
create table sim_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sim_id text not null references simulations(id) on delete cascade,
  status result_status not null,
  action sim_action not null,
  completed_at timestamptz not null default now(),
  unique (user_id, sim_id)
);

create table training_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- ===== helper functions (SECURITY DEFINER avoids recursive RLS on profiles) =====
create function public.my_role() returns text
language sql security definer stable set search_path = public as $$
  select role::text from profiles where id = auth.uid()
$$;

create function public.my_org_id() returns uuid
language sql security definer stable set search_path = public as $$
  select org_id from profiles where id = auth.uid()
$$;

-- ===== auth.users -> profiles wiring =====
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_domain text := split_part(new.email, '@', 2);
  v_role app_role;
  v_org_id uuid;
  v_department text;
  v_status member_status := 'active';
begin
  if lower(v_domain) = 'clickwise.io' then
    v_role := 'platform_admin';
  elsif new.raw_user_meta_data ? 'invited_role' then
    -- only ever set by the service-role "invite-member" Edge Function
    v_role := (new.raw_user_meta_data->>'invited_role')::app_role;
    v_org_id := (new.raw_user_meta_data->>'org_id')::uuid;
    v_department := new.raw_user_meta_data->>'department';
    v_status := 'invited';
  else
    v_role := 'org_admin'; -- self-serve Sign Up wizard; org attached moments later via create_organization()
  end if;

  insert into public.profiles (id, email, name, role, org_id, department, status)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
          v_role, v_org_id, v_department, v_status);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- an invited member's status flips from 'invited' to 'active' the moment they actually sign in
create function public.handle_user_first_login() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.last_sign_in_at is null and new.last_sign_in_at is not null then
    update public.profiles set status = 'active' where id = new.id and status = 'invited';
  end if;
  return new;
end;
$$;
create trigger on_auth_user_login after update of last_sign_in_at on auth.users
  for each row execute procedure public.handle_user_first_login();

-- DB-level seat-limit enforcement (defense in depth on top of the invite-member Edge Function check)
create function public.enforce_seat_limit() returns trigger
language plpgsql as $$
declare
  v_seat_limit int;
  v_count int;
begin
  if new.org_id is null then
    return new;
  end if;
  select seat_limit into v_seat_limit from organizations where id = new.org_id;
  if v_seat_limit is null then
    return new; -- unlimited plan
  end if;
  select count(*) into v_count from profiles where org_id = new.org_id;
  if v_count >= v_seat_limit then
    raise exception 'Seat limit reached for this organization''s plan';
  end if;
  return new;
end;
$$;
create trigger trg_enforce_seat_limit before insert on profiles
  for each row execute procedure public.enforce_seat_limit();

-- RPC: finishes org creation for a brand-new org_admin, called right after supabase.auth.signUp()
create function public.create_organization(p_plan_id text, p_org_name text)
returns organizations
language plpgsql security definer set search_path = public as $$
declare
  v_org organizations;
  v_seat_limit int;
begin
  if public.my_role() <> 'org_admin' then
    raise exception 'Only a new org admin can create an organization';
  end if;
  if exists (select 1 from profiles where id = auth.uid() and org_id is not null) then
    raise exception 'This account already belongs to an organization';
  end if;

  select seat_limit into v_seat_limit from plans where id = p_plan_id;
  insert into organizations (name, plan_id, seat_limit)
    values (p_org_name, p_plan_id, v_seat_limit)
    returning * into v_org;

  update profiles set org_id = v_org.id where id = auth.uid();
  return v_org;
end;
$$;

-- RPC: enforces "can't downgrade below current member count" server-side
create function public.change_org_plan(p_org_id uuid, p_plan_id text)
returns organizations
language plpgsql security definer set search_path = public as $$
declare
  v_org organizations;
  v_new_seat_limit int;
  v_member_count int;
begin
  if not (
    (public.my_role() = 'org_admin' and public.my_org_id() = p_org_id)
    or public.my_role() = 'platform_admin'
  ) then
    raise exception 'Not authorized to change this organization''s plan';
  end if;

  select seat_limit into v_new_seat_limit from plans where id = p_plan_id;
  select count(*) into v_member_count from profiles where org_id = p_org_id;

  if v_new_seat_limit is not null and v_member_count > v_new_seat_limit then
    raise exception 'Cannot switch plans: % members exceeds the %-seat limit', v_member_count, v_new_seat_limit;
  end if;

  update organizations set plan_id = p_plan_id, seat_limit = v_new_seat_limit
    where id = p_org_id
    returning * into v_org;
  return v_org;
end;
$$;

-- ===== Row Level Security =====
alter table profiles enable row level security;
create policy profiles_select on profiles for select using (
  id = auth.uid()
  or public.my_role() = 'platform_admin'
  or (public.my_role() = 'org_admin' and org_id = public.my_org_id())
);
create policy profiles_update_self on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_platform_admin_all on profiles for all
  using (public.my_role() = 'platform_admin');

alter table organizations enable row level security;
create policy org_select on organizations for select
  using (public.my_role() = 'platform_admin' or id = public.my_org_id());
create policy org_admin_update_own on organizations for update
  using (public.my_role() = 'org_admin' and id = public.my_org_id());
create policy org_platform_admin_all on organizations for all
  using (public.my_role() = 'platform_admin');

alter table plans enable row level security;
create policy plans_read_all on plans for select using (true);
create policy plans_write_platform_admin on plans for all
  using (public.my_role() = 'platform_admin');

alter table content_library enable row level security;
create policy content_read_all on content_library for select using (true);
create policy content_write_platform_admin on content_library for all
  using (public.my_role() = 'platform_admin');

alter table org_assigned_content enable row level security;
create policy assigned_content_select on org_assigned_content for select
  using (public.my_role() = 'platform_admin' or org_id = public.my_org_id());
create policy assigned_content_write_platform_admin on org_assigned_content for all
  using (public.my_role() = 'platform_admin');

alter table org_campaigns enable row level security;
create policy campaigns_select on org_campaigns for select
  using (public.my_role() = 'platform_admin' or org_id = public.my_org_id());
create policy campaigns_insert_org_admin on org_campaigns for insert
  with check (public.my_role() = 'org_admin' and org_id = public.my_org_id());
create policy campaigns_platform_admin_all on org_campaigns for all
  using (public.my_role() = 'platform_admin');

alter table simulations enable row level security;
create policy sims_read_all on simulations for select using (true);
create policy sims_write_platform_admin on simulations for all
  using (public.my_role() = 'platform_admin');

alter table lessons enable row level security;
create policy lessons_read_all on lessons for select using (true);
create policy lessons_write_platform_admin on lessons for all
  using (public.my_role() = 'platform_admin');

alter table sim_results enable row level security;
create policy sim_results_select on sim_results for select using (
  user_id = auth.uid()
  or public.my_role() = 'platform_admin'
  or (public.my_role() = 'org_admin' and exists (
        select 1 from profiles p where p.id = sim_results.user_id and p.org_id = public.my_org_id()))
);
create policy sim_results_insert_self on sim_results for insert with check (user_id = auth.uid());
create policy sim_results_update_self on sim_results for update using (user_id = auth.uid());

alter table training_progress enable row level security;
create policy training_progress_select on training_progress for select using (
  user_id = auth.uid()
  or public.my_role() = 'platform_admin'
  or (public.my_role() = 'org_admin' and exists (
        select 1 from profiles p where p.id = training_progress.user_id and p.org_id = public.my_org_id()))
);
create policy training_progress_insert_self on training_progress for insert with check (user_id = auth.uid());
create policy training_progress_update_self on training_progress for update using (user_id = auth.uid());
