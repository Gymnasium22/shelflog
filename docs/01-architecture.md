# ShelfLog — Architecture Design (Stage 1)

> **Status:** Decisions locked (Stage 1)  
> **Product:** Digital home operating system (not a catalog)  
> **Stack:** Next.js 15 · Supabase · Vercel · PWA · Telegram Mini App  
> **Tooling:** pnpm · single Next.js app · RU UI + i18n structure · default currency **BYN**

---

## 1. Product positioning

ShelfLog is an **operational system for the home**: locations, physical originals of documents, warranties, maintenance, boxes, family access, and fast answers to “where / when / what / how much”.

Design implications:

| Concern | Decision |
|--------|----------|
| Hierarchy of places | First-class tree (`storage_locations`) with path materialization for search & breadcrumbs |
| Physical vs digital docs | Documents store file blobs + optional `original_location_id` |
| Boxes vs generic places | **Separate entity** `boxes` with `location_id` (not a tree node type) |
| Multi-tenant | `households` as tenancy root; all domain rows scoped by `household_id` |
| Free-tier only | Supabase (DB, Auth, Storage, Realtime) + Vercel; no custom servers |

---

## 2. System context

```
┌─────────────┐   ┌──────────────┐   ┌─────────────────┐
│  Browser    │   │  PWA (iOS/   │   │ Telegram Mini   │
│  (desktop)  │   │  Android)    │   │ App WebView     │
└──────┬──────┘   └──────┬───────┘   └────────┬────────┘
       │                 │                    │
       └─────────────────┼────────────────────┘
                         │ HTTPS
                         ▼
              ┌──────────────────────┐
              │  Next.js 15 (Vercel) │
              │  App Router · RSC    │
              │  API Route Handlers  │
              │  (edge where useful) │
              └──────────┬───────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   Supabase Auth   PostgreSQL      Supabase Storage
                   + Realtime      (documents/photos)
                         │
                         ▼
                   GitHub Actions
                   (CI: lint, typecheck, test)
```

**No Docker, no VPS, no paid third-party SaaS.**  
Deploy: `git push` → Vercel production/preview.

---

## 3. Frontend architecture (Feature-Sliced Design)

```
src/
├── app/                          # Next.js App Router (composition only)
│   ├── (auth)/                   # login, signup, callback
│   ├── (app)/                    # authenticated shell
│   │   ├── layout.tsx
│   │   ├── page.tsx              # dashboard
│   │   ├── items/
│   │   ├── boxes/
│   │   ├── locations/
│   │   ├── documents/
│   │   ├── reminders/
│   │   ├── search/
│   │   ├── family/
│   │   └── settings/
│   ├── tma/                      # Telegram Mini App entry
│   ├── api/                      # Route Handlers (webhooks, rare server ops)
│   ├── manifest.webmanifest
│   └── layout.tsx
├── widgets/                      # page-level composites
│   ├── dashboard/
│   ├── command-palette/
│   ├── app-shell/
│   └── qr-scanner/
├── features/                     # user scenarios (actions)
│   ├── auth/
│   ├── household/
│   ├── item-crud/
│   ├── box-crud/
│   ├── location-tree/
│   ├── document-upload/
│   ├── search/
│   ├── reminders/
│   ├── qr/
│   ├── family-invite/
│   └── theme/
├── entities/                     # business entities (types, api, ui atoms)
│   ├── household/
│   ├── location/
│   ├── box/
│   ├── item/
│   ├── document/
│   ├── reminder/
│   ├── member/
│   └── activity/
├── shared/
│   ├── api/                      # supabase clients (browser/server/middleware)
│   ├── config/
│   ├── lib/                      # utils, dates, money, paths
│   ├── ui/                       # shadcn primitives
│   ├── hooks/
│   └── types/
└── processes/                    # optional cross-feature flows
    ├── onboarding/
    └── move-house/               # future: bulk reassign locations
```

### Layer rules

1. **`app`** — routing, layouts, data loading composition. No heavy business logic.
2. **`widgets`** — compose features + entities into UI blocks.
3. **`features`** — one user action / scenario (forms, mutations, side effects).
4. **`entities`** — domain model: Zod schemas, mappers, small presentational cards, query keys.
5. **`shared`** — tech utilities only; no domain rules.

**Import direction:** `app → widgets → features → entities → shared` (never reverse).

### State strategy

| Kind of state | Tool |
|---------------|------|
| Server/async data | TanStack Query (+ Supabase as transport) |
| Auth session | Supabase Auth + thin React context / hooks |
| UI ephemeral (modals, sidebar, command palette) | Zustand |
| Forms | React Hook Form + Zod |
| Theme | `next-themes` + CSS variables (shadcn) |
| Realtime invalidation | Supabase Realtime → QueryClient invalidation |

**No Redux.**

### Rendering strategy

- **RSC** for shells, SEO-irrelevant but fast first paint of static chrome, server-side session check.
- **Client components** for trees (DnD), command palette, QR scanner, interactive forms, infinite search.
- Prefer **Server Actions or Route Handlers** only when needed; default path is **Supabase client with RLS** from browser for CRUD (fewer round-trips, free-tier friendly). Sensitive ops (invites, role changes) go through validated server layer.

---

## 4. Backend & data access

### 4.1 Supabase as BaaS

| Service | Usage |
|---------|--------|
| PostgreSQL | Source of truth, RLS multi-tenant |
| Auth | MVP: email + password + magic link (OTP); later optional Google OAuth; TMA via initData |
| Storage | Buckets: `item-photos`, `documents`, `box-photos` — private, signed URLs |
| Realtime | Activity feed, collaborative edits on household |

### 4.2 Access patterns

```
Browser ──(JWT)──► Supabase PostgREST / Storage / Realtime
                         ▲
Next.js Server ──────────┘  (service role ONLY for admin jobs / webhooks;
                             never expose service key to client)
```

**RLS is the security boundary.** Every table with household data:

```sql
household_id UUID NOT NULL REFERENCES households(id)
-- policies: user is member of household with required role
```

### 4.3 Roles (enforced in RLS)

| Role | Capabilities |
|------|----------------|
| `owner` | Full control, delete household, transfer ownership |
| `admin` | Manage members (except owner), all CRUD |
| `editor` | CRUD items, boxes, locations, documents, reminders |
| `viewer` | Read-only |

---

## 5. Domain model (high-level)

Detailed SQL/ERD is **Stage 2**. Here: logical aggregates.

### 5.1 Aggregates

```
Household
├── Members (User × Role)
├── StorageLocation (tree: room → furniture → shelf → folder …)
├── Box (linked to a location; has contents = Items)
├── Item (passport + status + optional box/location)
│   ├── Documents (files + original_location)
│   ├── Maintenance / Repair history
│   └── Reminders
├── Standalone Documents (optional link to item)
├── Reminders (global or item-scoped)
└── ActivityLog
```

### 5.2 Storage location tree

- Adjacency list: `parent_id` + `household_id`
- Materialized `path` (ltree or `text[]` / materialized path string) for:
  - breadcrumbs
  - “search by place”
  - cascade moves
- Types (enum or free tag): `home`, `room`, `zone`, `cabinet`, `shelf`, `drawer`, `folder`, `other`
- Boxes may appear *as* nodes or as separate entity with `location_id` — **decision: Box is separate entity with `location_id`**, so QR/content semantics stay clean; optionally also create a location node of type `box` if we need tree embedding (Stage 2 will pick one; recommendation: **entity-only + location pointer**, show boxes under location in UI tree).

### 5.3 Item passport

Core fields (from product brief): name, category, brand, model, serial, price, purchase date/store, warranty end, photos, documents, instructions/receipts, storage location, originals location, repair/service history, QR token, notes, status.

**Statuses:** `in_use` | `sold` | `in_repair` | `lent` | `gifted` | `discarded` | `lost` | `in_box` | `in_storage`  
(`in_box` / `in_storage` can be derived from relations, but product lists them as statuses — store explicitly + keep location/box FKs consistent in application rules).

### 5.4 Documents

- Storage path in Supabase Storage
- MIME: PDF, JPEG, PNG, WEBP, HEIC (client convert HEIC→JPEG if browser lacks support)
- `type`: receipt | manual | warranty | contract | device_passport | certificate | other
- `original_location_id` — where the paper lives
- Optional `item_id`, `box_id`

### 5.5 QR

- Stable public token: `qr_code` UUID/nanoid on `items`, `boxes`, `locations` (folders)
- Deep link: `/q/[token]` → auth gate → redirect to entity
- Generation: client-side library (`qrcode`) for display/print; value is the URL

### 5.6 Search

**v1 (Stage 7):** PostgreSQL `tsvector` + `pg_trgm` on key columns, single RPC `search_household(query)`.  
**v1.1:** optional typesense-like later — **not** on free stack; stick to Postgres FTS.

Search fields: name, brand, model, serial, notes, document titles/types, location path labels.

### 5.7 Reminders

- Types: warranty_end, filter_replace, battery_check, maintenance, custom
- Recurrence: none | monthly | semiannual | annual | date
- Delivery: in-app + Web Push (when available); email via Supabase optional later

### 5.8 Family

- Invites by email/link with role
- One active household context in UI (switcher if multi-household later)

---

## 6. Key UX modules

| Module | Notes |
|--------|--------|
| Dashboard | Today, expiring warranties, upcoming maintenance, recent items/docs, counts, total value, activity |
| Command Palette | `Ctrl/⌘+K` — navigation + search + quick actions |
| Location tree | Expandable tree, DnD reorder/reparent (editor+) |
| Item / Box cards | Passport layout, tabs: overview · docs · history · QR |
| Document viewer | PDF/image preview, download, original location chip |
| QR scanner | `BarcodeDetector` / `html5-qrcode` fallback |
| Empty / skeleton | Every list has empty state + skeleton |
| Theme | Light/dark, system default |
| Motion | Framer Motion for page transitions & list layout (respect `prefers-reduced-motion`) |

Mobile-first layouts + desktop density (sidebar navigation, multi-column detail).

---

## 7. PWA & Telegram

### PWA

- `@ducanh2912/next-pwa` or Serwist (modern Workbox wrapper for App Router)
- Manifest, icons, splash (via manifest + theme-color)
- Cache strategies:
  - App shell: precache
  - API/Supabase GET: network-first with short cache for last household snapshot (IndexedDB via TanStack Persist optional)
- Offline: read last cached dashboard + recently opened entities; mutations queue later (v2) — **v1: offline read, online write**

### Telegram Mini App

- Same Next.js app under `/tma` or root with `Telegram.WebApp` detection
- Auth: `initData` validation on server → map/create user → issue Supabase session (custom) or link Telegram user id in `profiles`
- Features subset: search, cards, QR scan, quick add item
- No separate codebase — feature flags / compact layouts

---

## 8. Auth flows

### What is a magic link?

A **magic link** (email OTP / passwordless) is a one-time sign-in without a password:

1. User enters email.
2. Supabase sends an email with a secure link (or a 6-digit code).
3. User opens the link / enters the code → session cookie/JWT is created.
4. Link expires quickly and is single-use.

**Pros:** no forgotten passwords, fewer support cases, good UX on mobile.  
**Cons:** depends on email delivery; slower on first login if inbox is slow; bad if user has no email access in the moment.

### MVP recommendation (locked)

| Channel | Method |
|---------|--------|
| Web / PWA | **Email + password** as primary + **magic link** as alternative on the same screen |
| Telegram Mini App | `initData` validation → link/create `profiles` → Supabase session (no password in TMA) |
| OAuth (Google) | **Not in MVP** — add when free OAuth setup is worth the config time |

**Why this mix for MVP**

- Password: reliable offline-of-inbox, familiar for family members, works when email is delayed.
- Magic link: lower friction for return visits and people who hate passwords; first-class in Supabase Auth.
- Both free on Supabase; no extra services.
- Google OAuth is free but adds consent screen, redirect URLs, and Apple/Android deep-link edge cases — defer until core product works.

### Flows

1. **Web/PWA:** sign-up / sign-in with email+password **or** request magic link; middleware protects `(app)/*`
2. **Telegram:** validate `initData` HMAC → upsert `profiles.telegram_id` → create session
3. **Onboarding:** create household → name home root location → invite family (optional)
4. **i18n:** default locale `ru`; message catalogs structured for future locales (`en`, etc.)

---

## 9. CI/CD & environments

```
GitHub repo
  ├── main     → Vercel Production
  ├── preview  → Vercel Preview (PRs)
  └── Actions  → pnpm lint · tsc · vitest (unit) · optional playwright smoke
```

Env vars (Vercel + local `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server only
NEXT_PUBLIC_APP_URL=
TELEGRAM_BOT_TOKEN=          # TMA validation
```

Supabase migrations: SQL in `supabase/migrations/` applied via Supabase CLI locally / GitHub Action with free CLI.

---

## 10. Non-functional requirements

| NFR | Target |
|-----|--------|
| LCP (dashboard) | &lt; 2.5s on mid mobile (3G/4G) |
| Search | &lt; 300ms for typical household size (&lt; 10k items) free tier |
| Type safety | TypeScript strict, generated DB types from Supabase |
| Accessibility | Keyboard command palette, focus rings, contrast AA |
| Security | RLS on all tables, storage policies, no service role in client |
| Bundle | Code-split heavy features (QR scanner, PDF viewer) |

---

## 11. Technology versions (pinned intent)

| Package | Role |
|---------|------|
| Next.js 15 (App Router) | Framework |
| React 19 | UI |
| TypeScript 5.x strict | Types |
| Tailwind CSS 4.x / 3.x | Styling (prefer stable with shadcn) |
| shadcn/ui + Radix | Components |
| Lucide | Icons |
| Framer Motion | Animation |
| RHF + Zod | Forms |
| TanStack Query v5 | Server state |
| Zustand | Client UI state |
| @supabase/ssr + supabase-js | Backend client |
| date-fns or dayjs | Dates |
| qrcode.react / html5-qrcode | QR |
| Vitest + Testing Library | Unit/UI tests |
| Playwright | E2E later |

---

## 12. Module dependency diagram

```
                    ┌──────────── widgets ────────────┐
                    │ dashboard · shell · cmdk · qr   │
                    └───────────────┬─────────────────┘
                                    │
        ┌───────────┬───────────┬───┴────┬────────────┬──────────┐
        ▼           ▼           ▼        ▼            ▼          ▼
   item-crud   location-tree  search  document-   reminders  family
                                      upload
        │           │           │        │            │          │
        └───────────┴─────┬─────┴────────┴────────────┴──────────┘
                          ▼
                     entities/*
                          │
                          ▼
              shared (ui, api/supabase, lib)
```

---

## 13. Staged delivery (aligned with product plan)

| # | Stage | Outcome |
|---|--------|---------|
| 1 | **Architecture** (this doc) | Agreed structure & stack |
| 2 | Database schema & relations | ERD + migrations draft |
| 3 | Next.js + Supabase bootstrap | Runnable empty app |
| 4 | Auth | Login, session, middleware |
| 5 | Core entities UI/CRUD | Home, rooms, locations, boxes, items |
| 6 | Files & documents | Storage upload + original location |
| 7 | Search & filters | FTS RPC + UI |
| 8 | QR codes | Generate + scan + deep links |
| 9 | Dashboard | Widgets + aggregates |
| 10 | Family access | Invites + RLS roles |
| 11 | PWA | Manifest, SW, offline read |
| 12 | Telegram Mini App | Auth + subset UX |
| 13 | Vercel deploy | CI + env docs |
| 14 | README | Run, develop, publish |

Each stage must be **demoable and complete** before the next.

---

## 14. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Free Supabase limits | Efficient indexes, storage lifecycle, no heavy realtime fan-out |
| HEIC on web | Convert on upload (client or edge) to JPEG/WebP |
| Complex location moves | Transactional RPC for reparent + path rebuild |
| TMA auth security | Server-only `initData` validation, short-lived sessions |
| Over-fetching trees | Lazy load children; cached path labels on items |

---

## 15. Locked product decisions (Stage 1)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Auth MVP | Email + password **and** magic link; Google OAuth later; TMA via `initData` |
| 2 | Locale | **Russian UI first**, codebase structured for i18n (`next-intl` or equivalent) |
| 3 | Boxes | **Separate entity** with `location_id` + contents; not a storage_location type |
| 4 | Package manager | **pnpm** — faster installs, strict deps, good CI cache on GitHub Actions |
| 5 | Repo layout | **Single Next.js app** (no monorepo until a second deployable package exists) |

### Why pnpm

- Disk-efficient store, reproducible locks, works well with Vercel.
- Stricter than npm with phantom dependencies (fewer “works on my machine” issues).
- Standard for modern Next.js production apps.

### Why not monorepo yet

- One frontend + Supabase SQL is enough; turborepo/pnpm-workspace adds CI and path complexity without benefit.
- Extract `packages/ui` or `packages/domain` only if a second consumer appears (e.g. native app).

### i18n structure (intent)

```
src/shared/i18n/
  locales/ru.json
  locales/en.json   # optional stub
  request.ts / config
```

All user-visible strings via message keys; default `ru`.

---

## 16. Acceptance criteria for Stage 1

- [x] Stack locked: Next 15, FSD-like layers, Supabase, Vercel, free-only
- [x] Multi-tenant model: household + roles + RLS
- [x] Domain aggregates listed
- [x] State, rendering, PWA, TMA strategies defined
- [x] Stage roadmap matches product plan
- [x] Auth, i18n, boxes, pnpm, single-app decisions locked
- [ ] Product owner approval to start **Stage 2: DB schema**

---

*End of Stage 1 architecture document.*

