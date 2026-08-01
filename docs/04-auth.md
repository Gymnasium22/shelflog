# Stage 4 — Auth

## Что сделано

- Таблица `profiles` + триггер «новый user → профиль»
- RLS: пользователь видит/меняет только свой профиль
- Вход: **email + пароль** и **magic link**
- Регистрация: email + пароль + имя
- Callback `/auth/callback` (обмен code → session)
- Защита `/app/*` (middleware + layout)
- Выход
- Валюта по умолчанию **BYN**, UI **ru**

## Миграции

Применены на remote:

- `20260328000001_extensions.sql`
- `20260328000002_currency_comment.sql`
- `20260328000003_profiles_auth.sql`

## Что настроить в Supabase Dashboard (1–2 минуты)

Без этого magic link / письма могут «не пускать» на localhost.

### 1. URL сайта

**Authentication → URL Configuration**

| Поле | Значение |
|------|----------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/**` и `http://localhost:3000/auth/callback` |

### 2. Подтверждение email (для удобства MVP)

**Authentication → Providers → Email**

- **Confirm email** — выключить, пока нет своего SMTP  
  Тогда после регистрации сразу вход, без письма.

Если Confirm email включён — после signup нужно открыть письмо (на free tier письмо от Supabase иногда попадает в «Спам»).

## Проверка руками

1. `pnpm dev`
2. Открыть http://localhost:3000/signup
3. Создать аккаунт
4. Попасть на `/app`, увидеть имя и email
5. Выйти → войти паролем
6. (Опционально) magic link — вкладка на `/login`

## Файлы

```
src/features/auth/
src/app/(auth)/login|signup
src/app/auth/callback
src/app/(app)/app
src/middleware.ts → shared/api/supabase/middleware.ts
```
