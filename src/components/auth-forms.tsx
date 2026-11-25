"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  login,
  requestPasswordReset,
  signup,
  updatePassword,
  type FormState,
} from "@/app/actions/auth";
import { ConsentFields } from "@/components/consent-fields";
import { createClient } from "@/utils/supabase/client";

const initial: FormState = { status: "idle", message: "" };

const label = "eyebrow text-[0.62rem] text-primary";
const field =
  "mt-2 h-12 w-full border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring";

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const cut = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, cut)}-${d.slice(cut)}`;
};

function Message({ state }: { state: FormState }) {
  if (state.status === "idle") return null;
  return (
    <p
      role="status"
      className={`text-sm ${state.status === "success" ? "text-primary" : "text-destructive"}`}
    >
      {state.message}
    </p>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className={label}>E-mail</span>
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="block">
        <span className={label}>Senha</span>
        <input name="password" type="password" required autoComplete="current-password" className={field} />
      </label>
      <Message state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-sm">
        <Link href="/recuperar-senha" className="link-underline pb-0.5 text-muted-foreground">
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signup, initial);

  if (state.status === "success") {
    return (
      <div role="status" className="border border-border bg-card p-6 text-sm leading-relaxed">
        <p className="font-display text-2xl text-primary">Quase lá!</p>
        <p className="mt-3 text-muted-foreground">{state.message}</p>
        <Link href={`/entrar?next=${encodeURIComponent(next)}`} className="btn-outline mt-6">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className={label}>Nome completo</span>
        <input name="name" required autoComplete="name" className={field} />
      </label>
      <label className="block">
        <span className={label}>E-mail</span>
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="block">
        <span className={label}>Telefone (com DDD)</span>
        <input
          name="phone"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          onChange={(e) => (e.target.value = maskPhone(e.target.value))}
          className={field}
        />
      </label>
      <label className="block">
        <span className={label}>Senha (mínimo de 8 caracteres)</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
      </label>
      <ConsentFields />
      <Message state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);

  return (
    <form action={action} className="space-y-6">
      <label className="block">
        <span className={label}>E-mail da sua conta</span>
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <Message state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Enviando…" : "Enviar link"}
      </button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial);

  return (
    <form action={action} className="space-y-6">
      <label className="block">
        <span className={label}>Nova senha (mínimo de 8 caracteres)</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
      </label>
      <label className="block">
        <span className={label}>Repita a nova senha</span>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={field} />
      </label>
      <Message state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}

// Sair: roda no navegador para o CartSync limpar a sacola local (computador compartilhado).
export function LogoutButton() {
  async function logout() {
    await createClient().auth.signOut();
    window.location.assign("/");
  }
  return (
    <button type="button" onClick={logout} className="btn-outline">
      Sair
    </button>
  );
}
