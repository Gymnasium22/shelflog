# Stage 12 — Telegram Mini App

## Idea

Same Next.js app, compact UI under **`/tma`**, auth via Telegram `initData` → Supabase session.

## What works

| Feature | Path |
|---------|------|
| Auth (HMAC initData) | `POST /api/tma/auth` |
| Home + counts | `/tma` |
| Search | `/tma/search` |
| Quick add item | `/tma/items/new` |
| Item card | `/tma/items/[id]` |
| Box card | `/tma/boxes/[id]` |
| QR scan | `/tma/scan` |

## Free stack

- No paid Telegram gateway  
- Validation: local HMAC with `TELEGRAM_BOT_TOKEN`  
- Session: Supabase Admin `createUser` + `generateLink` + `verifyOtp`  
- Synthetic email: `tg_{telegramId}@telegram.shelflog.local`

## Setup (you do this once)

1. [@BotFather](https://t.me/BotFather) → create bot → copy token  
2. Add to `.env.local` / Vercel:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC...
   SUPABASE_SERVICE_ROLE_KEY=...   # already used server-side
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```
3. BotFather → **/newapp** (or Bot Settings → Menu Button / Mini App)  
   URL: `https://your-domain.vercel.app/tma`  
4. Open Mini App from Telegram (not plain mobile browser).

### Local testing

Telegram requires **HTTPS** public URL for Mini Apps. Options:

- Deploy preview on Vercel and point Mini App there  
- Or use a tunnel (ngrok / cloudflared) to localhost and set that HTTPS URL  

`pnpm dev` alone is not enough for real `initData` from Telegram.

## Security

- `initData` verified with bot token (timing-safe HMAC)  
- `auth_date` max age 24h  
- Service role only on server  
- RLS still applies after session is set  

## First-time user

1. Opens Mini App → account created  
2. If no household yet → prompt to create home in **web** `/app`  
3. Invites (family) work for linking multiple people to one home  

## Files

```
src/app/tma/**
src/app/api/tma/auth/route.ts
src/features/tma/**
src/shared/lib/telegram/validate-init-data.ts
src/shared/api/supabase/admin.ts
```
