# Stage 5 — Core entities

## Done

- DB: `households`, `household_members`, `storage_locations`, `boxes`, `items`
- RLS + helpers (`is_household_member`, `can_edit_household`, …)
- RPC `create_household(name)` → house + owner + root location (`type=home`, currency **BYN**)
- UI (after login):
  - `/app` — create home or mini-dashboard
  - `/app/locations` — tree + add place
  - `/app/locations/[id]` — detail (children, boxes, items)
  - `/app/boxes`, `/new`, `/[id]`
  - `/app/items`, `/new`, `/[id]` (passport fields)

## Flow to try

1. Register / login  
2. Create home («Наша квартира»)  
3. Add room → cabinet → shelf under **Места**  
4. Create box **№8**  
5. Add item with place, box, warranty, originals location  

## Migration

`20260328000004_core_entities.sql` (applied to linked Supabase project)
