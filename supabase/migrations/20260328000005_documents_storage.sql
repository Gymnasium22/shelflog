-- Stage 6: documents metadata + private Storage buckets

do $$ begin
  create type public.document_type as enum (
    'receipt',
    'manual',
    'warranty',
    'contract',
    'device_passport',
    'certificate',
    'other'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.documents (
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
  qr_token text unique default encode(extensions.gen_random_bytes(16), 'hex'),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_household_id_idx
  on public.documents (household_id);
create index if not exists documents_item_id_idx
  on public.documents (item_id);
create index if not exists documents_box_id_idx
  on public.documents (box_id);
create index if not exists documents_type_idx
  on public.documents (household_id, type);

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated
  using (public.is_household_member(household_id));

drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents for insert to authenticated
  with check (public.can_edit_household(household_id));

drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents for update to authenticated
  using (public.can_edit_household(household_id));

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents for delete to authenticated
  using (public.can_edit_household(household_id));

-- ─── Storage buckets (private) ───────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'documents',
    'documents',
    false,
    20971520, -- 20 MB
    array[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ]
  ),
  (
    'item-photos',
    'item-photos',
    false,
    10485760, -- 10 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'box-photos',
    'box-photos',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {household_id}/{uuid}_{filename}
-- First folder = household_id for RLS

create or replace function public.storage_household_id(object_name text)
returns uuid
language sql
immutable
as $$
  select nullif(split_part(object_name, '/', 1), '')::uuid;
$$;

-- documents bucket
drop policy if exists storage_documents_select on storage.objects;
create policy storage_documents_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and public.is_household_member(public.storage_household_id(name))
  );

drop policy if exists storage_documents_insert on storage.objects;
create policy storage_documents_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and public.can_edit_household(public.storage_household_id(name))
  );

drop policy if exists storage_documents_update on storage.objects;
create policy storage_documents_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'documents'
    and public.can_edit_household(public.storage_household_id(name))
  );

drop policy if exists storage_documents_delete on storage.objects;
create policy storage_documents_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and public.can_edit_household(public.storage_household_id(name))
  );

-- item-photos
drop policy if exists storage_item_photos_select on storage.objects;
create policy storage_item_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'item-photos'
    and public.is_household_member(public.storage_household_id(name))
  );

drop policy if exists storage_item_photos_insert on storage.objects;
create policy storage_item_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'item-photos'
    and public.can_edit_household(public.storage_household_id(name))
  );

drop policy if exists storage_item_photos_update on storage.objects;
create policy storage_item_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'item-photos'
    and public.can_edit_household(public.storage_household_id(name))
  );

drop policy if exists storage_item_photos_delete on storage.objects;
create policy storage_item_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'item-photos'
    and public.can_edit_household(public.storage_household_id(name))
  );

-- box-photos
drop policy if exists storage_box_photos_select on storage.objects;
create policy storage_box_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'box-photos'
    and public.is_household_member(public.storage_household_id(name))
  );

drop policy if exists storage_box_photos_insert on storage.objects;
create policy storage_box_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'box-photos'
    and public.can_edit_household(public.storage_household_id(name))
  );

drop policy if exists storage_box_photos_update on storage.objects;
create policy storage_box_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'box-photos'
    and public.can_edit_household(public.storage_household_id(name))
  );

drop policy if exists storage_box_photos_delete on storage.objects;
create policy storage_box_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'box-photos'
    and public.can_edit_household(public.storage_household_id(name))
  );
