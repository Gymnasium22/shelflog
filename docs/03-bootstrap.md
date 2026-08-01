# Stage 3 — Next.js + Supabase bootstrap

## Done in repo

- Next.js 15 (App Router) + React 19 + TypeScript strict
- Tailwind CSS 4
- pnpm
- FSD folders: `app`, `widgets`, `features`, `entities`, `shared`, `processes`
- Supabase clients: browser / server / middleware session refresh
- `.env.example`, health page `/health`
- Default currency **BYN**, locale **ru** + i18n stub
- `supabase/config.toml` + starter migrations (extensions only)

## Your local setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy env:

```bash
cp .env.example .env.local
```

3. Paste **Project URL** and **anon public** key from  
   Supabase → Project Settings → API.
4. Install & run:

```bash
pnpm install
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) and `/health`.

### Optional CLI

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref YOUR_REF
pnpm exec supabase db push
```

Domain tables are **not** applied yet — full schema from Stage 2 lands with entity stages.

## Acceptance

- [x] App builds and runs without Supabase keys (degraded health status)
- [x] With keys, `/health` reports Supabase Auth health OK
- [x] Default currency BYN documented in code + SQL comment migration
- [ ] Stage 4: authentication UI + session gates
