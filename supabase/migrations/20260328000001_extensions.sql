-- ShelfLog Stage 3 bootstrap: extensions only.
-- Full domain schema lands with entity stages (see docs/02-database-schema.md).

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;
