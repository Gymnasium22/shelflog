# ShelfLog — Database Schema (Stage 2)

> **Status:** Draft for review  
> **Depends on:** [01-architecture.md](./01-architecture.md)  
> **Engine:** Supabase PostgreSQL 15+  
> **Security model:** Row Level Security (RLS) on every tenant table  
> **Boxes:** separate entity (`boxes.location_id`)  
> **Locale note:** UI is RU; DB identifiers stay English (standard for code/SQL)

---

## 1. Design principles

1. **Tenancy root = `households`.** Almost all domain rows have `household_id`.
2. **RLS is the API security layer.** Clients use the anon key + user JWT; no trusting the UI.
3. **Soft delete optional later.** MVP: hard delete with `ON DELETE` rules; activity log keeps audit trail of important actions.
4. **UUIDs** (`gen_random_uuid()`) for all PKs — safe for client-side generation if needed.
5. **Timestamps:** `created_at`, `updated_at` (trigger) on mutable tables.
6. **QR:** stable `qr_token` (unique, opaque) per scannable entity → deep link `/q/{token}`.
7. **Money:** `numeric(12,2)` + `currency char(3)` default `BYN` (ISO 4217, белорусский рубль).
8. **Search:** `tsvector` + `pg_trgm` (Stage 7 wires UI; columns/indexes prepared here).
9. **Location tree:** adjacency list (`parent_id`) + materialized `path` for breadcrumbs and search.
10. **No free-text “role” strings** without CHECK/enum.

---

## 2. Extensions

```sql
create extension if not exists "pgcrypto";   -- gen_random_uuid
create extension if not exists "pg_trgm";    -- fuzzy search
-- optional later: create extension if not exists "ltree";
```

MVP path storage: **`text` materialized path** like `root_id.child_id.grandchild_id` (UUID segments), not `ltree` (simpler on free Supabase, fewer extension friction). Rebuild via trigger/RPC on reparent.

---

## 3. ER diagram (logical)

```
auth.users
    │ 1:1
    ▼
profiles ──────────────┐
    │                  │
    │                  │ created_by / user_id
    ▼                  │
household_members ◄────┤
    │                  │
    │ N:1              │
    ▼                  │
households ◄───────────┘
    │
    ├── storage_locations (tree, parent_id)
    ├── boxes ──────────────► storage_locations (where the box sits)
    ├── items ──┬──────────► storage_locations (where the item is)
    │           ├──────────► boxes (optional container)
    │           └──────────► storage_locations originals (docs originals place)
    ├── documents ──► items? boxes? storage_locations (original)
    ├── item_photos
    ├── item_events (repair / maintenance history)
    ├── reminders
    ├── invitations
    └── activity_log
```

---

## 4. Enums

```sql
create type public.member_role as enum (
  'owner',
  'admin',
  'editor',
  'viewer'
);

create type public.location_type as enum (
  'home',       -- root of a household tree (usually one)
  'room',
  'zone',       -- e.g. balcony, pantry area
  'cabinet',    -- wardrobe / cupboard
  'shelf',
  'drawer',
  'folder',     -- physical folder / envelope
  'other'
);

create type public.item_status as enum (
  'in_use',
  'sold',
  'in_repair',
  'lent',
  'gifted',
  'discarded',
  'lost',
  'in_box',
  'in_storage'
);

create type public.document_type as enum (
  'receipt',
  'manual',
  'warranty',
  'contract',
  'device_passport',
  'certificate',
  'other'
);

create type public.item_event_type as enum (
  'repair',
  'maintenance',
  'note',
  'status_change',
  'move',
  'purchase'
);

create type public.reminder_type as enum (
  'warranty_end',
  'filter_replace',
  'battery_check',
  'maintenance',
  'custom'
);

create type public.reminder_recurrence as enum (
  'none',
  'monthly',
  'semiannual',
  'annual',
  'on_date'      -- single concrete date (same as none + due_at; kept for product wording)
);

create type public.invitation_status as enum (
  'pending',
  'accepted',
  'revoked',
  'expired'
);

create type public.activity_action as enum (
  'created',
  'updated',
  'deleted',
  'moved',
  'uploaded',
  'invited',
  'joined',
  'role_changed'
);
```

---

## 5. Tables

### 5.1 `profiles`

Extends `auth.users`. Created on signup (trigger).

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | `= auth.users.id` |
| `email` | `text` | denormalized for display |
| `display_name` | `text` | |
| `avatar_url` | `text` | nullable |
| `telegram_id` | `bigint` | unique, nullable — TMA link |
| `locale` | `text` | default `'ru'` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  telegram_id bigint unique,
  locale text not null default 'ru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

### 5.2 `households`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `name` | `text` | e.g. «Наша квартира» |
| `currency` | `char(3)` | default `BYN` (белорусский рубль) |
| `created_by` | `uuid` | → profiles |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

```sql
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency char(3) not null default 'BYN',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

### 5.3 `household_members`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK | |
| `user_id` | `uuid` FK | → profiles |
| `role` | `member_role` | |
| `created_at` | `timestamptz` | |
| UNIQUE | `(household_id, user_id)` | |

```sql
create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create index household_members_user_id_idx on public.household_members (user_id);
create index household_members_household_id_idx on public.household_members (household_id);
```

**Invariant:** at least one `owner` per household (enforced in app + optional constraint/trigger).

---

### 5.4 `invitations`

Family invite links/emails.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK | |
| `email` | `text` | nullable if link-only |
| `role` | `member_role` | not `owner` |
| `token` | `text` unique | invite token |
| `status` | `invitation_status` | |
| `invited_by` | `uuid` | |
| `expires_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

```sql
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  email text,
  role public.member_role not null default 'editor',
  token text not null unique,
  status public.invitation_status not null default 'pending',
  invited_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (role <> 'owner')
);
```

---

### 5.5 `storage_locations`

Tree of places. **Boxes are not rows here.**

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK | |
| `parent_id` | `uuid` FK self | null = root |
| `name` | `text` | «Спальня», «Верхняя полка» |
| `type` | `location_type` | |
| `description` | `text` | |
| `color` | `text` | optional UI accent |
| `icon` | `text` | lucide key optional |
| `path` | `text` | materialized `id1.id2.id3` |
| `depth` | `int` | 0 = root |
| `sort_order` | `int` | siblings order |
| `qr_token` | `text` unique | scannable folders etc. |
| `created_at` / `updated_at` | | |

```sql
create table public.storage_locations (
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
  qr_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index storage_locations_household_id_idx
  on public.storage_locations (household_id);
create index storage_locations_parent_id_idx
  on public.storage_locations (parent_id);
create index storage_locations_path_idx
  on public.storage_locations (household_id, path);
-- prevent cycles: enforced in RPC move_location, not only FK
```

**Rules:**

- On insert as root: `parent_id is null`, `path = id::text`, `depth = 0`.
- On insert as child: `path = parent.path || '.' || id`, `depth = parent.depth + 1`.
- Reparent: recursive update of `path`/`depth` for subtree (RPC `move_storage_location`).
- `parent.household_id` must equal child `household_id` (trigger).

**Example path labels (UI join):**

```
Дом → Спальня → Шкаф → Верхняя полка → Белая папка → Документы техники
```

---

### 5.6 `boxes`

Separate entity; physically sits at a location.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK | |
| `location_id` | `uuid` FK | where the box is now (nullable if unknown) |
| `code` | `text` | «№8», human label |
| `name` | `text` | optional friendly name |
| `description` | `text` | |
| `photo_path` | `text` | Storage path |
| `qr_token` | `text` unique | |
| `notes` | `text` | |
| `created_at` / `updated_at` | | |
| UNIQUE | `(household_id, code)` optional | if codes unique per home |

```sql
create table public.boxes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  location_id uuid references public.storage_locations (id) on delete set null,
  code text not null,
  name text,
  description text,
  photo_path text,
  qr_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, code)
);

create index boxes_household_id_idx on public.boxes (household_id);
create index boxes_location_id_idx on public.boxes (location_id);
```

Contents of a box = **items with `box_id = boxes.id`**, not a join table (simpler MVP).  
If an item is in a box, `items.location_id` should match the box’s location (app rule; optional trigger).

---

### 5.7 `items` (digital passport)

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK | |
| `name` | `text` not null | |
| `category` | `text` | free or later taxonomy |
| `brand` | `text` | |
| `model` | `text` | |
| `serial_number` | `text` | |
| `purchase_price` | `numeric(12,2)` | |
| `currency` | `char(3)` | null → household default |
| `purchased_at` | `date` | |
| `store_name` | `text` | |
| `warranty_months` | `int` | optional |
| `warranty_until` | `date` | denormalized end date for queries |
| `location_id` | `uuid` FK | current place |
| `box_id` | `uuid` FK | if inside a box |
| `documents_original_location_id` | `uuid` FK | where paper originals live |
| `status` | `item_status` | default `in_use` |
| `notes` | `text` | |
| `qr_token` | `text` unique | |
| `search_vector` | `tsvector` | generated/maintained |
| `created_by` | `uuid` | |
| `created_at` / `updated_at` | | |

```sql
create table public.items (
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
  qr_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  search_vector tsvector,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_household_id_idx on public.items (household_id);
create index items_location_id_idx on public.items (location_id);
create index items_box_id_idx on public.items (box_id);
create index items_status_idx on public.items (household_id, status);
create index items_warranty_until_idx on public.items (household_id, warranty_until);
create index items_purchased_at_idx on public.items (household_id, purchased_at);
create index items_search_vector_idx on public.items using gin (search_vector);
create index items_name_trgm_idx on public.items using gin (name gin_trgm_ops);
create index items_brand_trgm_idx on public.items using gin (brand gin_trgm_ops);
create index items_serial_trgm_idx on public.items using gin (serial_number gin_trgm_ops);
```

**Search vector maintenance** (trigger on insert/update):

```text
name, brand, model, serial_number, category, notes, store_name
+ location path names (optional refresh job / trigger via join)
+ document titles (via trigger on documents)
```

---

### 5.8 `item_photos`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK | denormalized for RLS |
| `item_id` | `uuid` FK | cascade |
| `storage_path` | `text` | Supabase Storage |
| `sort_order` | `int` | |
| `created_at` | | |

```sql
create table public.item_photos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index item_photos_item_id_idx on public.item_photos (item_id);
```

---

### 5.9 `documents`

Digital files + **where the original paper lives**.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK | |
| `item_id` | `uuid` FK | nullable |
| `box_id` | `uuid` FK | nullable (e.g. packing list) |
| `title` | `text` | |
| `type` | `document_type` | |
| `mime_type` | `text` | application/pdf, image/* |
| `storage_path` | `text` | |
| `file_size` | `bigint` | bytes |
| `original_location_id` | `uuid` FK | **paper original place** |
| `issued_at` | `date` | |
| `notes` | `text` | |
| `qr_token` | `text` unique | optional for doc cards |
| `created_by` | `uuid` | |
| `created_at` / `updated_at` | | |

Allowed MIME (app validation):  
`application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`.

```sql
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  item_id uuid references public.items (id) on delete set null,
  box_id uuid references public.boxes (id) on delete set null,
  title text not null,
  type public.document_type not null default 'other',
  mime_type text not null,
  storage_path text not null,
  file_size bigint,
  original_location_id uuid
    references public.storage_locations (id) on delete set null,
  issued_at date,
  notes text,
  qr_token text unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_household_id_idx on public.documents (household_id);
create index documents_item_id_idx on public.documents (item_id);
create index documents_type_idx on public.documents (household_id, type);
create index documents_title_trgm_idx on public.documents using gin (title gin_trgm_ops);
```

---

### 5.10 `item_events` (repairs, maintenance, history)

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK | |
| `item_id` | `uuid` FK | |
| `type` | `item_event_type` | |
| `title` | `text` | |
| `description` | `text` | |
| `cost` | `numeric(12,2)` | |
| `occurred_at` | `date` | |
| `created_by` | `uuid` | |
| `created_at` | | |

```sql
create table public.item_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  type public.item_event_type not null,
  title text not null,
  description text,
  cost numeric(12, 2),
  occurred_at date not null default (timezone('utc', now()))::date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index item_events_item_id_idx on public.item_events (item_id);
create index item_events_household_occurred_idx
  on public.item_events (household_id, occurred_at desc);
```

---

### 5.11 `reminders`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK | |
| `item_id` | `uuid` FK | nullable |
| `type` | `reminder_type` | |
| `title` | `text` | |
| `notes` | `text` | |
| `due_at` | `date` | next due |
| `recurrence` | `reminder_recurrence` | |
| `is_completed` | `boolean` | default false |
| `completed_at` | `timestamptz` | |
| `created_by` | `uuid` | |
| `created_at` / `updated_at` | | |

```sql
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  item_id uuid references public.items (id) on delete cascade,
  type public.reminder_type not null default 'custom',
  title text not null,
  notes text,
  due_at date not null,
  recurrence public.reminder_recurrence not null default 'none',
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reminders_household_due_idx
  on public.reminders (household_id, due_at)
  where is_completed = false;
```

On complete + recurrence ≠ none: app/RPC creates next occurrence or advances `due_at`.

---

### 5.12 `activity_log`

Dashboard “последние изменения”.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `household_id` | `uuid` FK | |
| `actor_id` | `uuid` | who |
| `action` | `activity_action` | |
| `entity_type` | `text` | `item`, `box`, `document`, … |
| `entity_id` | `uuid` | |
| `summary` | `text` | human-readable RU can be built client-side; store EN key + payload |
| `payload` | `jsonb` | diff / meta |
| `created_at` | | |

```sql
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action public.activity_action not null,
  entity_type text not null,
  entity_id uuid,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_household_created_idx
  on public.activity_log (household_id, created_at desc);
```

---

### 5.13 `qr_lookup` (optional view)

Unified resolve for `/q/[token]`:

```sql
create or replace view public.qr_lookup as
  select qr_token, household_id, 'item'::text as entity_type, id as entity_id
  from public.items
  union all
  select qr_token, household_id, 'box', id from public.boxes
  union all
  select qr_token, household_id, 'location', id from public.storage_locations
  union all
  select qr_token, household_id, 'document', id from public.documents
  where qr_token is not null;
```

(View still subject to underlying RLS.)

---

## 6. Relationships summary

| From | To | Cardinality | On delete |
|------|-----|-------------|-----------|
| profiles | auth.users | 1:1 | cascade |
| household_members | households | N:1 | cascade |
| household_members | profiles | N:1 | cascade |
| storage_locations | households | N:1 | cascade |
| storage_locations | storage_locations (parent) | N:1 | cascade subtree |
| boxes | households | N:1 | cascade |
| boxes | storage_locations | N:1 | set null |
| items | households | N:1 | cascade |
| items | storage_locations (place) | N:1 | set null |
| items | storage_locations (doc originals) | N:1 | set null |
| items | boxes | N:1 | set null |
| item_photos | items | N:1 | cascade |
| documents | items / boxes / locations | N:0..1 | set null |
| item_events | items | N:1 | cascade |
| reminders | items | N:0..1 | cascade |
| invitations | households | N:1 | cascade |
| activity_log | households | N:1 | cascade |

---

## 7. RLS strategy

### 7.1 Helper functions (security definer, stable)

```sql
-- true if current user is member of household
create function public.is_household_member(hid uuid)
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

create function public.household_role(hid uuid)
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

create function public.can_edit_household(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.household_role(hid) in ('owner', 'admin', 'editor');
$$;

create function public.can_admin_household(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.household_role(hid) in ('owner', 'admin');
$$;
```

### 7.2 Policy matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | self; or same-household members (limited cols via view later) | self (trigger) | self | — |
| households | member | authenticated (then add self as owner in same txn/RPC) | admin+ | owner only |
| household_members | member | admin+ / accept invite RPC | admin+ (not demote last owner) | admin+ |
| invitations | admin+ | admin+ | admin+ | admin+ |
| storage_locations | member | editor+ | editor+ | editor+ |
| boxes | member | editor+ | editor+ | editor+ |
| items | member | editor+ | editor+ | editor+ |
| item_photos | member | editor+ | editor+ | editor+ |
| documents | member | editor+ | editor+ | editor+ |
| item_events | member | editor+ | editor+ | editor+ |
| reminders | member | editor+ | editor+ | editor+ |
| activity_log | member | editor+ or system | — | — |

**Pattern for domain tables:**

```sql
alter table public.items enable row level security;

create policy items_select on public.items for select
  using (public.is_household_member(household_id));

create policy items_insert on public.items for insert
  with check (public.can_edit_household(household_id));

create policy items_update on public.items for update
  using (public.can_edit_household(household_id));

create policy items_delete on public.items for delete
  using (public.can_edit_household(household_id));
```

### 7.3 Bootstrap household

Prefer **RPC** `create_household(name text)` security definer:

1. Insert household  
2. Insert member owner = `auth.uid()`  
3. Insert root `storage_locations` type `home` name = name  
4. Return household id  

Avoids RLS chicken-and-egg on first insert.

---

## 8. Storage buckets

| Bucket | Public | Path convention | Policies |
|--------|--------|-----------------|----------|
| `item-photos` | private | `{household_id}/{item_id}/{uuid}.ext` | member read; editor+ write |
| `box-photos` | private | `{household_id}/{box_id}/{uuid}.ext` | same |
| `documents` | private | `{household_id}/{document_id}/{uuid}.ext` | same |

Serve via **signed URLs** (short TTL).  
Storage RLS uses path prefix + `is_household_member`.

HEIC: accept upload; optionally convert client-side to JPEG/WebP before store.

---

## 9. Search (schema prep)

**RPC** `search_household(p_household_id uuid, p_query text, p_limit int default 20)`:

```sql
-- conceptual
select entity_type, entity_id, title, subtitle, rank
from (
  -- items by search_vector / trgm
  -- boxes by code, name, notes
  -- documents by title, type
  -- locations by name
) q
where household membership ok
order by rank desc
limit p_limit;
```

Dashboard aggregates (views or RPC):

- `count(items)`, `count(boxes)`, `count(documents)`
- `sum(purchase_price)` filter active statuses
- warranties expiring in N days
- reminders due soon
- recent `activity_log`
- recent items/documents

---

## 10. Realtime

Enable Realtime publication for:

- `activity_log` (dashboard feed)
- `reminders` (optional)
- `items` (optional collaborative)

Only within household filters client-side after RLS.

---

## 11. Indexes for product questions

| User question | Query support |
|---------------|----------------|
| Where is X? | `items` + join `storage_locations.path` + names |
| What’s in box №15? | `items where box_id = …` / boxes.code |
| What’s in pantry? | `items.location_id` in subtree (`path like prefix%`) |
| Warranty ending? | `warranty_until` between today and +30d |
| Total home value? | `sum(purchase_price)` where status in active set |
| Bought last year? | `purchased_at` range |
| In repair? | `status = 'in_repair'` |
| Original of contract? | `documents.original_location_id` / item field |

**Active value statuses (app constant):**  
`in_use`, `in_box`, `in_storage`, `in_repair`, `lent` — exclude sold/gifted/discarded/lost from “имущество”.

---

## 12. Triggers (MVP set)

| Trigger | Purpose |
|---------|---------|
| `set_updated_at` | all mutable tables |
| `on_auth_user_created` | insert `profiles` |
| `storage_locations_set_path` | compute path/depth on insert |
| `items_search_vector_update` | maintain `search_vector` |
| `prevent_last_owner_removal` | household_members |

---

## 13. Migration file plan (Stage 3+)

```
supabase/migrations/
  20260328000001_extensions.sql
  20260328000002_enums.sql
  20260328000003_profiles_households.sql
  20260328000004_locations_boxes_items.sql
  20260328000005_documents_events_reminders.sql
  20260328000006_activity_invitations.sql
  20260328000007_rls_helpers_policies.sql
  20260328000008_functions_rpc.sql
  20260328000009_storage_buckets.sql
  20260328000010_search.sql
```

Not applied until Stage 3 (project bootstrap). This stage is design-only.

---

## 14. TypeScript domain types (mirror, not codegen yet)

```ts
// conceptual — later: supabase gen types
type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer'
type ItemStatus =
  | 'in_use' | 'sold' | 'in_repair' | 'lent' | 'gifted'
  | 'discarded' | 'lost' | 'in_box' | 'in_storage'
// ...
```

Generated from DB after migrations: `supabase gen types typescript`.

---

## 15. Example: mapping product scenarios to rows

### «Где лежит оригинал договора»

`documents` where type=`contract` → `original_location_id` → walk `storage_locations` path to labels.

### «Что в коробке №15»

`boxes` where `code = '15'` → `items` where `box_id = box.id`.

### «Гарантия на телевизор»

`items` name/brand match → `warranty_until` + linked `documents` type `warranty` + `documents_original_location_id`.

### «Стоимость имущества»

```sql
select coalesce(sum(purchase_price), 0)
from items
where household_id = $1
  and status in ('in_use','in_box','in_storage','in_repair','lent');
```

---

## 16. Open schema choices (minor)

| Topic | Default for Stage 2 | Alternative |
|-------|---------------------|-------------|
| Category taxonomy | free `text` | later `categories` table |
| Multiple homes per user | yes (N members rows) | UI household switcher Stage 10 |
| Document without file | disallow MVP | allow metadata-only later |
| Soft deletes | no | `deleted_at` if users fear mistakes |
| Currency per item | optional override | always household currency |

Recommend accepting defaults unless you need soft delete from day one.

---

## 17. Acceptance criteria — Stage 2

- [x] All product entities covered as tables
- [x] Location tree + separate boxes
- [x] Item passport fields + statuses
- [x] Documents with original location + MIME intent
- [x] QR tokens on item/box/location/(document)
- [x] Family roles + invitations
- [x] Reminders + events + activity for dashboard
- [x] RLS matrix and helper functions
- [x] Storage path conventions
- [x] Search/index preparation
- [ ] Owner approval → **Stage 3: Next.js project + Supabase connect**

---

## 18. Visual cardinality sketch

```
                    ┌──────────┐
                    │ profiles │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         members    invitations  activity
              │
              ▼
         households
              │
     ┌────────┼─────────┬──────────┬──────────┐
     ▼        ▼         ▼          ▼          ▼
 locations  boxes     items    documents  reminders
     ▲        │         │          │
     │        └────┬────┘          │
     │             │               │
     └─────────────┴───────────────┘
           (location FKs / originals)
                    │
                    ▼
              item_photos
              item_events
```

---

*End of Stage 2 database schema document.*
