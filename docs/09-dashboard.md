# Stage 9 — Dashboard

## Done

Main page `/app` is a full operational dashboard for the active household.

### Blocks

| Block | Source |
|-------|--------|
| Сегодня | date label + warranties ending today + items/docs added today |
| Stats | items, boxes, documents, locations, property value (BYN), in repair |
| Quick actions | add item/box/doc, scan QR, search |
| Warranties (30d) | `items.warranty_until` window |
| Attention | status `in_repair` + recently expired warranties |
| Recent items / documents | `created_at` |
| Activity feed | merge recent items + boxes + documents |
| Maintenance placeholder | honest empty until reminders stage |

### Architecture

```
widgets/dashboard/
  api/load-dashboard.ts
  model/types.ts
  ui/dashboard-view.tsx
  ui/stat-grid.tsx
  ui/section-card.tsx
```

### Notes

- Property value uses active statuses only (`in_use`, `in_box`, `in_storage`, `in_repair`, `lent`).
- No paid analytics; pure Supabase queries in parallel.
- Reminders/maintenance schedule arrives with later stages; warranty + repair cover “what needs attention” now.
