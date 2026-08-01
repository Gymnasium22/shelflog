"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import {
  signInWithMagicLink,
  signInWithPassword,
  type AuthActionState,
} from "@/features/auth/api/actions";

const emptyOk: AuthActionState = { ok: true, message: null };
import { AuthMessage } from "@/features/auth/ui/auth-message";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/cn";

type Mode = "password" | "magic";

export function LoginForm({ next = "/app" }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("password");
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPassword,
    emptyOk,
  );
  const [magicState, magicAction, magicPending] = useActionState(
    signInWithMagicLink,
    emptyOk,
  );

  const state: AuthActionState = mode === "password" ? passwordState : magicState;
  const pending = mode === "password" ? passwordPending : magicPending;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          className={cn(
            "h-9 rounded-lg text-sm font-medium transition",
            mode === "password" ? "bg-accent text-accent-foreground" : "text-muted",
          )}
          onClick={() => setMode("password")}
        >
          Пароль
        </button>
        <button
          type="button"
          className={cn(
            "h-9 rounded-lg text-sm font-medium transition",
            mode === "magic" ? "bg-accent text-accent-foreground" : "text-muted",
          )}
          onClick={() => setMode("magic")}
        >
          Magic link
        </button>
      </div>

      <AuthMessage ok={state.ok} message={state.message} />

      {mode === "password" ? (
        <form action={passwordAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
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
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
            <FieldError errors={state.fieldErrors?.password} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Входим…" : "Войти"}
          </Button>
        </form>
      ) : (
        <form action={magicAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <Label htmlFor="magic-email">Email</Label>
            <Input
              id="magic-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
            <FieldError errors={state.fieldErrors?.email} />
          </div>
          <p className="text-sm text-muted">
            Пришлём одноразовую ссылку — пароль не нужен.
          </p>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Отправляем…" : "Отправить ссылку"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted">
        Нет аккаунта?{" "}
        <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">{errors[0]}</p>;
}
