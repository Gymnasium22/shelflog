# Stage 7 — Search & filters

## Done

- RPC `search_household` (security definer + membership check)
- Indexes: `pg_trgm` on items/boxes/documents/locations + existing FTS `search_vector` on items
- UI `/app/search` — query + type checkboxes + item status + document type
- Header **SearchBar** (desktop) → `/app/search?q=…`
- Nav link **Поиск**
- `/app/items` local filter (text + status)

## Search covers

| Entity | Fields |
|--------|--------|
| Items | name, brand, model, serial, notes, category, store, FTS vector |
| Boxes | code, name, description, notes |
| Documents | title, notes, type |
| Locations | name, description, type |

## Try

1. Add a few items/boxes/docs if empty  
2. Open **Поиск** or type in header search  
3. Examples: brand, «№8», serial fragment, document type word  
4. Filter only «Вещи» + status «На ремонте»

## Free stack

PostgreSQL only — no paid search engine.
