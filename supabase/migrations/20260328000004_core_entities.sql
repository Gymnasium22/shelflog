-- Stage 5: households, storage tree, boxes, items + RLS
-- gen_random_bytes lives in extensions schema on Supabase

-- ─── Enums ───────────────────────────────────────────────────────────
do $$ begin
  create type public.member_role as enum ('owner', 'admin', 'editor', 'viewer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.location_type as enum (
    'home', 'room', 'zone', 'cabinet', 'shelf', 'drawer', 'folder', 'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.item_status as enum (
    'in_use', 'sold', 'in_repair', 'lent', 'gifted',
    'discarded', 'lost', 'in_box', 'in_storage'
  );
exception when duplicate_object then null;
end $$;

-- ─── Households ──────────────────────────────────────────────────────
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency char(3) not null default 'BYN',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists households_set_updated_at on public.households;
create trigger households_set_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create index if not exists household_members_user_id_idx
  on public.household_members (user_id);
create index if not exists household_members_household_id_idx
  on public.household_members (household_id);

-- ─── RLS helpers ─────────────────────────────────────────────────────
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  );
$$;

create or replace function public.household_role(hid uuid)
returns public.member_role
language sql
stable
security definer
set search_path = public
as $$
  select m.role from public.household_members m
  where m.household_id = hid and m.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_edit_household(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.household_role(hid) in ('owner', 'admin', 'editor');
$$;

create or replace function public.can_admin_household(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.household_role(hid) in ('owner', 'admin');
$$;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.household_role(uuid) to authenticated;
grant execute on function public.can_edit_household(uuid) to authenticated;
grant execute on function public.can_admin_household(uuid) to authenticated;

-- ─── Storage locations (before create_household body uses it) ────────
create table if not exists public.storage_locations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  parent_id uuid references public.storage_locations (id) on delete cascade,
  name text not null,
  type public.location_type not null default 'other',
  description text,
  color text,
  icon text,
  path text not null default '',
  depth int not null default 0,
  sort_order int not null default 0,
  qr_token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists storage_locations_household_id_idx
  on public.storage_locations (household_id);
create index if not exists storage_locations_parent_id_idx
  on public.storage_locations (parent_id);
create index if not exists storage_locations_path_idx
  on public.storage_locations (household_id, path);

drop trigger if exists storage_locations_set_updated_at on public.storage_locations;
create trigger storage_locations_set_updated_at
  before update on public.storage_locations
  for each row execute function public.set_updated_at();

create or replace function public.storage_locations_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent public.storage_locations%rowtype;
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  if new.parent_id is null then
    new.depth := 0;
    new.path := new.id::text;
  else
    select * into v_parent from public.storage_locations where id = new.parent_id;
    if not found then
      raise exception 'Parent location not found';
    end if;
    if v_parent.household_id <> new.household_id then
      raise exception 'Parent must belong to same household';
    end if;
    new.depth := v_parent.depth + 1;
    new.path := v_parent.path || '.' || new.id::text;
  end if;

  return new;
end;
$$;

drop trigger if exists storage_locations_before_insert on public.storage_locations;
create trigger storage_locations_before_insert
  before insert on public.storage_locations
  for each row execute function public.storage_locations_before_insert();

-- ─── create_household RPC ────────────────────────────────────────────
create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hid uuid;
  v_root uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Name is required';
  end if;

  insert into public.households (name, currency, created_by)
  values (trim(p_name), 'BYN', v_uid)
  returning id into v_hid;

  insert into public.household_members (household_id, user_id, role)
  values (v_hid, v_uid, 'owner');

  insert into public.storage_locations (
    household_id, parent_id, name, type, path, depth, sort_order
  ) values (
    v_hid, null, trim(p_name), 'home', '', 0, 0
  ) returning id into v_root;

  return v_hid;
end;
$$;

grant execute on function public.create_household(text) to authenticated;

-- ─── Boxes ───────────────────────────────────────────────────────────
create table if not exists public.boxes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  location_id uuid references public.storage_locations (id) on delete set null,
  code text not null,
  name text,
  description text,
  photo_path text,
  qr_token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, code)
);

create index if not exists boxes_household_id_idx on public.boxes (household_id);
create index if not exists boxes_location_id_idx on public.boxes (location_id);

drop trigger if exists boxes_set_updated_at on public.boxes;
create trigger boxes_set_updated_at
  before update on public.boxes
  for each row execute function public.set_updated_at();

-- ─── Items ───────────────────────────────────────────────────────────
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  category text,
  brand text,
  model text,
  serial_number text,
  purchase_price numeric(12, 2),
  currency char(3),
  purchased_at date,
  store_name text,
  warranty_months int,
  warranty_until date,
  location_id uuid references public.storage_locations (id) on delete set null,
  box_id uuid references public.boxes (id) on delete set null,
  documents_original_location_id uuid
    references public.storage_locations (id) on delete set null,
  status public.item_status not null default 'in_use',
  notes text,
  qr_token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  search_vector tsvector,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_household_id_idx on public.items (household_id);
create index if not exists items_location_id_idx on public.items (location_id);
create index if not exists items_box_id_idx on public.items (box_id);
create index if not exists items_status_idx on public.items (household_id, status);
create index if not exists items_warranty_until_idx on public.items (household_id, warranty_until);
create index if not exists items_search_vector_idx on public.items using gin (search_vector);

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

create or replace function public.items_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.brand, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.model, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.serial_number, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.category, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.notes, '')), 'D') ||
    setweight(to_tsvector('simple', coalesce(new.store_name, '')), 'D');
  return new;
end;
$$;

drop trigger if exists items_search_vector_update on public.items;
create trigger items_search_vector_update
  before insert or update of name, brand, model, serial_number, category, notes, store_name
  on public.items
  for each row execute function public.items_search_vector_update();

-- ─── RLS policies ────────────────────────────────────────────────────
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.storage_locations enable row level security;
alter table public.boxes enable row level security;
alter table public.items enable row level security;

drop policy if exists households_select on public.households;
create policy households_select on public.households for select to authenticated
  using (public.is_household_member(id));

drop policy if exists households_update on public.households;
create policy households_update on public.households for update to authenticated
  using (public.can_admin_household(id));

drop policy if exists households_delete on public.households;
create policy households_delete on public.households for delete to authenticated
  using (public.household_role(id) = 'owner');

drop policy if exists members_select on public.household_members;
create policy members_select on public.household_members for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists members_insert on public.household_members;
create policy members_insert on public.household_members for insert to authenticated
  with check (public.can_admin_household(household_id));

drop policy if exists members_update on public.household_members;
create policy members_update on public.household_members for update to authenticated
  using (public.can_admin_household(household_id));

drop policy if exists members_delete on public.household_members;
create policy members_delete on public.household_members for delete to authenticated
  using (public.can_admin_household(household_id));

drop policy if exists locations_select on public.storage_locations;
create policy locations_select on public.storage_locations for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists locations_insert on public.storage_locations;
create policy locations_insert on public.storage_locations for insert to authenticated
  with check (public.can_edit_household(household_id));

drop policy if exists locations_update on public.storage_locations;
create policy locations_update on public.storage_locations for update to authenticated
  using (public.can_edit_household(household_id));

drop policy if exists locations_delete on public.storage_locations;
create policy locations_delete on public.storage_locations for delete to authenticated
  using (public.can_edit_household(household_id));

drop policy if exists boxes_select on public.boxes;
create policy boxes_select on public.boxes for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists boxes_insert on public.boxes;
create policy boxes_insert on public.boxes for insert to authenticated
  with check (public.can_edit_household(household_id));

drop policy if exists boxes_update on public.boxes;
create policy boxes_update on public.boxes for update to authenticated
  using (public.can_edit_household(household_id));

drop policy if exists boxes_delete on public.boxes;
create policy boxes_delete on public.boxes for delete to authenticated
  using (public.can_edit_household(household_id));

drop policy if exists items_select on public.items;
create policy items_select on public.items for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists items_insert on public.items;
create policy items_insert on public.items for insert to authenticated
  with check (public.can_edit_household(household_id));

drop policy if exists items_update on public.items;
create policy items_update on public.items for update to authenticated
  using (public.can_edit_household(household_id));

drop policy if exists items_delete on public.items;
create policy items_delete on public.items for delete to authenticated
  using (public.can_edit_household(household_id));
