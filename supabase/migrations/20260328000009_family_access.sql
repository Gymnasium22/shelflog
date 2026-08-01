-- Stage 10: family invites + membership management RPCs

do $$ begin
  create type public.invitation_status as enum (
    'pending', 'accepted', 'revoked', 'expired'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  email text,
  role public.member_role not null default 'editor',
  token text not null unique,
  status public.invitation_status not null default 'pending',
  invited_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (role in ('admin', 'editor', 'viewer'))
);

create index if not exists invitations_household_id_idx
  on public.invitations (household_id);
create index if not exists invitations_token_idx
  on public.invitations (token);

alter table public.invitations enable row level security;

drop policy if exists invitations_select on public.invitations;
create policy invitations_select on public.invitations
  for select to authenticated
  using (public.can_admin_household(household_id));

drop policy if exists invitations_insert on public.invitations;
create policy invitations_insert on public.invitations
  for insert to authenticated
  with check (public.can_admin_household(household_id));

drop policy if exists invitations_update on public.invitations;
create policy invitations_update on public.invitations
  for update to authenticated
  using (public.can_admin_household(household_id));

drop policy if exists invitations_delete on public.invitations;
create policy invitations_delete on public.invitations
  for delete to authenticated
  using (public.can_admin_household(household_id));

-- Peers can see each other's basic profile in the same household
drop policy if exists profiles_select_peers on public.profiles;
create policy profiles_select_peers on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.household_members me
      join public.household_members them
        on them.household_id = me.household_id
      where me.user_id = auth.uid()
        and them.user_id = profiles.id
    )
  );

-- ─── create_invitation ───────────────────────────────────────────────
create or replace function public.create_invitation(
  p_household_id uuid,
  p_role public.member_role default 'editor',
  p_email text default null,
  p_expires_days int default 14
)
returns table (
  id uuid,
  token text,
  role public.member_role,
  email text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_token text;
  v_expires timestamptz;
  v_email text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.can_admin_household(p_household_id) then
    raise exception 'Forbidden';
  end if;

  if p_role not in ('admin', 'editor', 'viewer') then
    raise exception 'Invalid role for invite';
  end if;

  -- Only owner can invite admins
  if p_role = 'admin' and public.household_role(p_household_id) <> 'owner' then
    raise exception 'Only owner can invite admins';
  end if;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  v_expires := now() + make_interval(days => greatest(coalesce(p_expires_days, 14), 1));
  v_email := nullif(trim(coalesce(p_email, '')), '');

  return query
  insert into public.invitations (
    household_id, email, role, token, status, invited_by, expires_at
  ) values (
    p_household_id, v_email, p_role, v_token, 'pending', v_uid, v_expires
  )
  returning
    invitations.id,
    invitations.token,
    invitations.role,
    invitations.email,
    invitations.expires_at;
end;
$$;

grant execute on function public.create_invitation(uuid, public.member_role, text, int)
  to authenticated;

-- ─── preview_invitation (anyone authenticated, by token) ─────────────
create or replace function public.preview_invitation(p_token text)
returns table (
  household_id uuid,
  household_name text,
  role public.member_role,
  email text,
  expires_at timestamptz,
  status public.invitation_status,
  is_expired boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    i.household_id,
    h.name,
    i.role,
    i.email,
    i.expires_at,
    i.status,
    (i.expires_at < now()) as is_expired
  from public.invitations i
  join public.households h on h.id = i.household_id
  where i.token = trim(p_token)
  limit 1;
end;
$$;

grant execute on function public.preview_invitation(text) to authenticated;

-- ─── accept_invitation ───────────────────────────────────────────────
create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.invitations%rowtype;
  v_email text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_inv
  from public.invitations
  where token = trim(p_token)
  for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_inv.status <> 'pending' then
    raise exception 'Invite is not active';
  end if;

  if v_inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_inv.id;
    raise exception 'Invite expired';
  end if;

  select email into v_email from public.profiles where id = v_uid;

  if v_inv.email is not null
     and v_email is not null
     and lower(v_inv.email) <> lower(v_email) then
    raise exception 'Invite email does not match your account';
  end if;

  if exists (
    select 1 from public.household_members
    where household_id = v_inv.household_id and user_id = v_uid
  ) then
    update public.invitations
    set status = 'accepted'
    where id = v_inv.id and status = 'pending';
    return v_inv.household_id;
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (v_inv.household_id, v_uid, v_inv.role);

  update public.invitations
  set status = 'accepted'
  where id = v_inv.id;

  return v_inv.household_id;
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;

-- ─── revoke_invitation ───────────────────────────────────────────────
create or replace function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hid uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into v_hid
  from public.invitations
  where id = p_invitation_id;

  if v_hid is null then
    raise exception 'Invite not found';
  end if;

  if not public.can_admin_household(v_hid) then
    raise exception 'Forbidden';
  end if;

  update public.invitations
  set status = 'revoked'
  where id = p_invitation_id
    and status = 'pending';
end;
$$;

grant execute on function public.revoke_invitation(uuid) to authenticated;

-- ─── update_member_role ──────────────────────────────────────────────
create or replace function public.update_member_role(
  p_member_id uuid,
  p_role public.member_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_member public.household_members%rowtype;
  v_my_role public.member_role;
  v_owner_count int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_member
  from public.household_members
  where id = p_member_id;

  if not found then
    raise exception 'Member not found';
  end if;

  v_my_role := public.household_role(v_member.household_id);

  if v_my_role is null or v_my_role not in ('owner', 'admin') then
    raise exception 'Forbidden';
  end if;

  -- Only owner can assign owner or change owners
  if p_role = 'owner' and v_my_role <> 'owner' then
    raise exception 'Only owner can transfer ownership';
  end if;

  if v_member.role = 'owner' and v_my_role <> 'owner' then
    raise exception 'Cannot change owner';
  end if;

  if v_member.user_id = v_uid and v_member.role = 'owner' and p_role <> 'owner' then
    select count(*) into v_owner_count
    from public.household_members
    where household_id = v_member.household_id and role = 'owner';

    if v_owner_count <= 1 then
      raise exception 'Cannot demote the only owner';
    end if;
  end if;

  if p_role = 'owner' then
    -- Transfer: promote target, demote current owner to admin
    update public.household_members
    set role = 'admin'
    where household_id = v_member.household_id
      and user_id = v_uid
      and role = 'owner';

    update public.household_members
    set role = 'owner'
    where id = p_member_id;
    return;
  end if;

  if v_my_role = 'admin' and p_role = 'admin' then
    raise exception 'Only owner can assign admin';
  end if;

  if v_member.role = 'owner' then
    raise exception 'Use ownership transfer to change owner';
  end if;

  update public.household_members
  set role = p_role
  where id = p_member_id;
end;
$$;

grant execute on function public.update_member_role(uuid, public.member_role)
  to authenticated;

-- ─── remove_member ───────────────────────────────────────────────────
create or replace function public.remove_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_member public.household_members%rowtype;
  v_my_role public.member_role;
  v_owner_count int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_member
  from public.household_members
  where id = p_member_id;

  if not found then
    raise exception 'Member not found';
  end if;

  v_my_role := public.household_role(v_member.household_id);

  -- Self-leave
  if v_member.user_id = v_uid then
    if v_member.role = 'owner' then
      select count(*) into v_owner_count
      from public.household_members
      where household_id = v_member.household_id and role = 'owner';
      if v_owner_count <= 1 then
        raise exception 'Owner must transfer ownership before leaving';
      end if;
    end if;

    delete from public.household_members where id = p_member_id;
    return;
  end if;

  if v_my_role is null or v_my_role not in ('owner', 'admin') then
    raise exception 'Forbidden';
  end if;

  if v_member.role = 'owner' then
    raise exception 'Cannot remove owner';
  end if;

  if v_member.role = 'admin' and v_my_role <> 'owner' then
    raise exception 'Only owner can remove admins';
  end if;

  delete from public.household_members where id = p_member_id;
end;
$$;

grant execute on function public.remove_member(uuid) to authenticated;
