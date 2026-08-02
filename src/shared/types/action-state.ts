export type ActionState = {
  ok: boolean;
  message: string | null;
  redirectTo?: string;
};

export const emptyActionState: ActionState = { ok: true, message: null };
