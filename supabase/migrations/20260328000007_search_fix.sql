-- Fix search_household: remove invalid helper call

create or replace function public.search_household(
  p_household_id uuid,
  p_query text,
  p_limit int default 40,
  p_types text[] default null,
  p_item_status text default null,
  p_document_type text default null
)
returns table (
  entity_type text,
  entity_id uuid,
  title text,
  subtitle text,
  rank real,
  meta jsonb
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_q text := trim(coalesce(p_query, ''));
  v_limit int := least(greatest(coalesce(p_limit, 40), 1), 100);
  v_want_items boolean := p_types is null or 'item' = any(p_types);
  v_want_boxes boolean := p_types is null or 'box' = any(p_types);
  v_want_docs boolean := p_types is null or 'document' = any(p_types);
  v_want_locs boolean := p_types is null or 'location' = any(p_types);
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  if length(v_q) = 0 and p_item_status is null and p_document_type is null then
    return;
  end if;

  return query
  with
  item_hits as (
    select
      'item'::text as entity_type,
      i.id as entity_id,
      i.name as title,
      concat_ws(
        ' · ',
        nullif(i.brand, ''),
        nullif(i.model, ''),
        nullif(i.serial_number, ''),
        i.status::text
      ) as subtitle,
      (
        case
          when length(v_q) = 0 then 0.5::real
          else greatest(
            coalesce(ts_rank_cd(i.search_vector, plainto_tsquery('simple', v_q)), 0),
            similarity(coalesce(i.name, ''), v_q),
            similarity(coalesce(i.brand, ''), v_q),
            similarity(coalesce(i.model, ''), v_q),
            similarity(coalesce(i.serial_number, ''), v_q),
            similarity(coalesce(i.notes, ''), v_q) * 0.7
          )::real
        end
      ) as rank,
      jsonb_build_object(
        'status', i.status,
        'category', i.category,
        'location_id', i.location_id,
        'box_id', i.box_id
      ) as meta
    from public.items i
    where v_want_items
      and i.household_id = p_household_id
      and (p_item_status is null or i.status::text = p_item_status)
      and (
        length(v_q) = 0
        or i.search_vector @@ plainto_tsquery('simple', v_q)
        or coalesce(i.name, '') ilike '%' || v_q || '%'
        or coalesce(i.brand, '') ilike '%' || v_q || '%'
        or coalesce(i.model, '') ilike '%' || v_q || '%'
        or coalesce(i.serial_number, '') ilike '%' || v_q || '%'
        or coalesce(i.notes, '') ilike '%' || v_q || '%'
        or coalesce(i.category, '') ilike '%' || v_q || '%'
        or coalesce(i.store_name, '') ilike '%' || v_q || '%'
        or similarity(coalesce(i.name, ''), v_q) > 0.15
        or similarity(coalesce(i.serial_number, ''), v_q) > 0.2
      )
  ),
  box_hits as (
    select
      'box'::text,
      b.id,
      coalesce(nullif(b.name, ''), 'Коробка ' || b.code) as title,
      concat_ws(' · ', 'Код ' || b.code, nullif(b.description, '')) as subtitle,
      (
        case
          when length(v_q) = 0 then 0.4::real
          else greatest(
            similarity(coalesce(b.code, ''), v_q),
            similarity(coalesce(b.name, ''), v_q),
            similarity(coalesce(b.notes, ''), v_q) * 0.7,
            similarity(coalesce(b.description, ''), v_q) * 0.6
          )::real
        end
      ) as rank,
      jsonb_build_object('code', b.code, 'location_id', b.location_id) as meta
    from public.boxes b
    where v_want_boxes
      and b.household_id = p_household_id
      and length(v_q) > 0
      and (
        coalesce(b.code, '') ilike '%' || v_q || '%'
        or coalesce(b.name, '') ilike '%' || v_q || '%'
        or coalesce(b.description, '') ilike '%' || v_q || '%'
        or coalesce(b.notes, '') ilike '%' || v_q || '%'
        or similarity(coalesce(b.code, ''), v_q) > 0.15
      )
  ),
  doc_hits as (
    select
      'document'::text,
      d.id,
      d.title,
      concat_ws(' · ', d.type::text, d.mime_type) as subtitle,
      (
        case
          when length(v_q) = 0 then 0.45::real
          else greatest(
            similarity(coalesce(d.title, ''), v_q),
            similarity(coalesce(d.notes, ''), v_q) * 0.7,
            case when d.type::text ilike '%' || v_q || '%' then 0.9 else 0 end
          )::real
        end
      ) as rank,
      jsonb_build_object(
        'type', d.type,
        'item_id', d.item_id,
        'original_location_id', d.original_location_id
      ) as meta
    from public.documents d
    where v_want_docs
      and d.household_id = p_household_id
      and (p_document_type is null or d.type::text = p_document_type)
      and (
        length(v_q) = 0
        or coalesce(d.title, '') ilike '%' || v_q || '%'
        or coalesce(d.notes, '') ilike '%' || v_q || '%'
        or d.type::text ilike '%' || v_q || '%'
        or similarity(coalesce(d.title, ''), v_q) > 0.15
      )
  ),
  loc_hits as (
    select
      'location'::text,
      l.id,
      l.name,
      concat_ws(' · ', l.type::text, 'глубина ' || l.depth::text) as subtitle,
      (
        case
          when length(v_q) = 0 then 0.3::real
          else greatest(
            similarity(coalesce(l.name, ''), v_q),
            similarity(coalesce(l.description, ''), v_q) * 0.6
          )::real
        end
      ) as rank,
      jsonb_build_object(
        'type', l.type,
        'parent_id', l.parent_id,
        'depth', l.depth
      ) as meta
    from public.storage_locations l
    where v_want_locs
      and l.household_id = p_household_id
      and length(v_q) > 0
      and (
        coalesce(l.name, '') ilike '%' || v_q || '%'
        or coalesce(l.description, '') ilike '%' || v_q || '%'
        or l.type::text ilike '%' || v_q || '%'
        or similarity(coalesce(l.name, ''), v_q) > 0.15
      )
  )
  select * from (
    select * from item_hits
    union all
    select * from box_hits
    union all
    select * from doc_hits
    union all
    select * from loc_hits
  ) hits
  order by hits.rank desc, hits.title asc
  limit v_limit;
end;
$$;

grant execute on function public.search_household(uuid, text, int, text[], text, text)
  to authenticated;
