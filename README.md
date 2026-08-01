# ShelfLog

Цифровой паспорт дома — операционная система квартиры: вещи, места хранения, коробки, документы (включая **где лежит оригинал**), гарантии, напоминания и семейный доступ.

> Стек: **Next.js 15** · TypeScript · Tailwind · Supabase · Vercel · PWA · Telegram Mini App  
> Валюта по умолчанию: **BYN** (белорусский рубль) · UI: **ru** (i18n-ready)

## Документация

| Этап | Документ |
|------|----------|
| 1 Архитектура | [docs/01-architecture.md](docs/01-architecture.md) |
| 2 Схема БД | [docs/02-database-schema.md](docs/02-database-schema.md) |
| 3 Bootstrap | [docs/03-bootstrap.md](docs/03-bootstrap.md) |
| 4 Auth | [docs/04-auth.md](docs/04-auth.md) |
| 5 Core entities | [docs/05-core-entities.md](docs/05-core-entities.md) |
| 6 Documents | [docs/06-documents.md](docs/06-documents.md) |
| 7 Search | [docs/07-search.md](docs/07-search.md) |
| 8 QR | [docs/08-qr.md](docs/08-qr.md) |
| 9 Dashboard | [docs/09-dashboard.md](docs/09-dashboard.md) |
| 10 Family | [docs/10-family.md](docs/10-family.md) |
| 11 PWA | [docs/11-pwa.md](docs/11-pwa.md) |
| 12 Telegram Mini App | [docs/12-telegram-mini-app.md](docs/12-telegram-mini-app.md) |

## Быстрый старт

```bash
pnpm install
cp .env.example .env.local
# заполните NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm dev
```

- Главная: http://localhost:3000  
- Проверка Supabase: http://localhost:3000/health  

## Скрипты

| Команда | Описание |
|---------|----------|
| `pnpm dev` | Dev-сервер (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Запуск production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript |

## Структура (FSD)

```
src/
  app/           # Next.js App Router
  widgets/
  features/
  entities/
  processes/
  shared/        # ui, api/supabase, config, i18n
supabase/
  migrations/
  config.toml
```

## Лицензия

Private — all rights reserved.
