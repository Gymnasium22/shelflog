-- Stage 8: resolve QR token to entity (membership-aware)

create or replace function public.resolve_qr_token(p_token text)
returns table (
  entity_type text,
  entity_id uuid,
  household_id uuid,
  title text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_token text := trim(coalesce(p_token, ''));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if length(v_token) = 0 then
    return;
  end if;

  return query
  select * from (
    select
      'item'::text,
      i.id,
      i.household_id,
      i.name
    from public.items i
    where i.qr_token = v_token

    union all

    select
      'box'::text,
      b.id,
      b.household_id,
      coalesce(nullif(b.name, ''), 'Коробка ' || b.code)
    from public.boxes b
    where b.qr_token = v_token

    union all

    select
      'location'::text,
      l.id,
      l.household_id,
      l.name
    from public.storage_locations l
    where l.qr_token = v_token

    union all

    select
      'document'::text,
      d.id,
      d.household_id,
      d.title
    from public.documents d
    where d.qr_token = v_token
  ) found
  where public.is_household_member(found.household_id)
  limit 1;
end;
$$;

grant execute on function public.resolve_qr_token(text) to authenticated;

-- Optional unified view (RLS via underlying tables)
create or replace view public.qr_lookup
with (security_invoker = true)
as
  select qr_token, household_id, 'item'::text as entity_type, id as entity_id
  from public.items
  union all
  select qr_token, household_id, 'box', id from public.boxes
  union all
  select qr_token, household_id, 'location', id from public.storage_locations
  union all
  select qr_token, household_id, 'document', id
  from public.documents
  where qr_token is not null;
