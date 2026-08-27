-- Replaces the admin-invite-by-email flow with domain-based self-service
-- joining: once an org exists, ANYONE who signs up with a matching email
-- domain is automatically added as an employee — no invite email, no
-- admin action required. Run this once in the SQL Editor after 0001/0002.

alter table organizations add column domain text unique;

-- Backfill the domain each existing demo org was created with.
update organizations set domain = 'cloudshield.io' where name = 'CloudShield Ltd.';
update organizations set domain = 'novabank.co.ke' where name = 'Nova Bank';
update organizations set domain = 'defense.io' where name = 'Defense.io';

-- Public, pre-auth lookup so the Sign Up page can tell (before creating
-- an account) whether this email's domain already belongs to an org.
create function public.org_for_domain(p_domain text)
returns table(id uuid, name text)
language sql security definer stable set search_path = public as $$
  select id, name from organizations where domain = lower(p_domain)
$$;
-- Lets even a signed-out visitor ("anon") call this — needed since it
-- runs before the person has an account yet.
grant execute on function public.org_for_domain(text) to anon, authenticated;

-- Replaces the old version: no longer trusts any client-supplied metadata
-- for role assignment (that was a real privilege-escalation hole — a
-- signUp() call could previously pass its own "invited_role":
-- "platform_admin" and grant itself admin). Role now comes ONLY from
-- either the @clickwise.io domain check or a real domain match below.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_domain text := lower(split_part(new.email, '@', 2));
  v_role app_role;
  v_org_id uuid;
begin
  if v_domain = 'clickwise.io' then
    v_role := 'platform_admin';
  else
    select id into v_org_id from organizations where domain = v_domain;
    if v_org_id is not null then
      v_role := 'employee'; -- this domain is already claimed by an org — auto-join it
    else
      v_role := 'org_admin'; -- first signup from this domain — they'll create the org via create_organization()
    end if;
  end if;

  insert into public.profiles (id, email, name, role, org_id, status)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), v_role, v_org_id, 'active');
  return new;
end;
$$;

-- Replaces the old version: also claims the admin's own email domain for
-- the new org, and blocks creating a second org for an already-claimed domain.
create or replace function public.create_organization(p_plan_id text, p_org_name text)
returns organizations
language plpgsql security definer set search_path = public as $$
declare
  v_org organizations;
  v_seat_limit int;
  v_domain text;
begin
  if public.my_role() <> 'org_admin' then
    raise exception 'Only a new org admin can create an organization';
  end if;
  if exists (select 1 from profiles where id = auth.uid() and org_id is not null) then
    raise exception 'This account already belongs to an organization';
  end if;

  -- The caller's own email domain becomes this new org's claimed domain.
  select lower(split_part(email, '@', 2)) into v_domain from profiles where id = auth.uid();
  if exists (select 1 from organizations where domain = v_domain) then
    raise exception 'An organization for % already exists — sign in instead.', v_domain;
  end if;

  select seat_limit into v_seat_limit from plans where id = p_plan_id;
  insert into organizations (name, plan_id, seat_limit, domain)
    values (p_org_name, p_plan_id, v_seat_limit, v_domain)
    returning * into v_org;

  update profiles set org_id = v_org.id where id = auth.uid();
  return v_org;
end;
$$;
