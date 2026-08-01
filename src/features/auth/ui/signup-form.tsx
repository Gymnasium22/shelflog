"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  signUpWithPassword,
  type AuthActionState,
} from "@/features/auth/api/actions";

const emptyOk: AuthActionState = { ok: true, message: null };
import { AuthMessage } from "@/features/auth/ui/auth-message";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUpWithPassword, emptyOk);

  return (
    <div className="space-y-6">
      <AuthMessage ok={state.ok} message={state.message} />

      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="displayName">Имя</Label>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="name"
            required
            placeholder="Как к вам обращаться"
          />
          <FieldError errors={state.fieldErrors?.displayName} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
          <FieldError errors={state.fieldErrors?.email} />
        </div>
        <div>
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Минимум 8 символов"
          />
          <FieldError errors={state.fieldErrors?.password} />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Повтор пароля</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Ещё раз"
          />
          <FieldError errors={state.fieldErrors?.confirmPassword} />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Создаём…" : "Создать аккаунт"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Войти
        </Link>
      </p>
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">{errors[0]}</p>
  );
}
