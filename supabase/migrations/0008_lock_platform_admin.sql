-- Closes a real gap: previously ANY signup with an @clickwise.io email
-- automatically became a platform_admin (full access to every org's
-- data). Now only the one permanent staff account can use that domain at
-- all — anyone else attempting to sign up with @clickwise.io is rejected
-- outright, not just denied the admin role.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_domain text := lower(split_part(new.email, '@', 2));
  v_role app_role;
  v_org_id uuid;
begin
  if v_domain = 'clickwise.io' then
    -- Hardcoded to the one real ClickWise staff account — anyone else
    -- trying to sign up on this domain is blocked outright below.
    if lower(new.email) <> 'gabriellehawi@clickwise.io' then
      raise exception 'Sign-up is not available for this email address.';
    end if;
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
