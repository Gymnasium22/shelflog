# Stage 6 — Documents & file upload

## Done

- Table `documents` + RLS
- Storage buckets (private): `documents`, `item-photos`, `box-photos`
- Path: `{household_id}/{uuid}_{filename}` — RLS via first folder
- MIME: PDF, JPEG, PNG, WEBP, HEIC (≤ 20 MB)
- Fields: type, title, **original_location_id**, item/box link, notes
- UI: `/app/documents`, `/new`, `/[id]` (preview + signed URL + delete)
- Item passport: list of linked documents + «Прикрепить»
- Nav: **Документы**
- Server Actions body limit 25mb

## Try

1. Open **Документы → Загрузить**
2. Pick PDF or photo
3. Set type (чек / гарантия / …)
4. Set **where the paper original lives**
5. Optionally link to an item
6. Open card → preview / download

## Note on HEIC

Some browsers cannot preview HEIC in-page; file still stores and downloads correctly.
