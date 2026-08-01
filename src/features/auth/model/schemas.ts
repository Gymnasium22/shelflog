import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Введите email")
  .email("Некорректный email");

export const passwordSchema = z
  .string()
  .min(8, "Минимум 8 символов")
  .max(72, "Слишком длинный пароль");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Введите пароль"),
});

export const signupSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "Введите имя")
      .max(80, "Слишком длинное имя"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Повторите пароль"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type MagicLinkValues = z.infer<typeof magicLinkSchema>;
