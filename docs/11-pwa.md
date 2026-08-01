# Stage 11 — PWA

## Done

| Feature | Implementation |
|---------|----------------|
| Installable (Android / desktop Chrome) | `manifest` + `beforeinstallprompt` banner |
| iPhone Home Screen | `appleWebApp` meta + icon-180 + «Поделиться» hint |
| Standalone shell | `display: standalone`, theme/background colors |
| Splash | OS uses manifest icons + theme-color |
| Service Worker | **Serwist** (`@serwist/next`) → `/sw.js` |
| Offline | precache shell + `/offline` document fallback |
| Runtime cache | Serwist `defaultCache` (navigation + assets) |
| Push (receive stub) | SW `push` / `notificationclick`; opt-in on `/app/settings` |

## Files

```
src/app/sw.ts
src/app/manifest.ts
src/app/offline/page.tsx
src/app/(app)/app/settings/page.tsx
src/features/pwa/ui/*
public/icons/*
next.config.ts  (withSerwist)
scripts/generate-pwa-icons.mjs
```

## Dev vs production

- **Development:** SW **disabled** (Serwist `disable: NODE_ENV === "development"`) — faster HMR.
- **Production / `next start` / Vercel:** SW active, installable over **HTTPS** (or localhost).

```bash
pnpm build
pnpm start
# open http://localhost:3000 → DevTools → Application → Manifest / SW
```

## Offline policy (v1)

- **Read:** last cached pages / assets via SW  
- **Write:** online only (mutations need network)  
- Offline queue of writes → later

## Push (free, incomplete sender)

1. User grants permission on **Ещё / Настройки**  
2. Full Web Push needs VAPID keys (free, generate with `web-push`) and a send path (Supabase Edge Function free tier or Vercel cron later)  
3. No paid FCM required for basic Web Push

## Icons

```bash
pnpm icons:pwa
```

## iOS note

Safari does not fully support all SW features like Chrome; Home Screen app still works with splash/icon.
