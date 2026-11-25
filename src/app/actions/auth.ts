"use server";

import { redirect } from "next/navigation";
import { createAccount, safeNext, siteUrl } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";

export type FormState = {
  status: "idle" | "error" | "success";
  message: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const fail = (message: string): FormState => ({ status: "error", message });

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData.get("email"), 254).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!EMAIL.test(email) || !password) return fail("Informe e-mail e senha.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return fail("Confirme seu e-mail antes de entrar. Procure a mensagem que enviamos.");
    }
    if (error.status === 429) return fail("Muitas tentativas. Aguarde alguns minutos.");
    return fail("E-mail ou senha incorretos.");
  }

  redirect(next);
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData.get("name"), 120);
  const email = text(formData.get("email"), 254).toLowerCase();
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const password = String(formData.get("password") ?? "");

  if (name.split(" ").length < 2) return fail("Informe nome e sobrenome.");
  if (!EMAIL.test(email)) return fail("Informe um e-mail válido.");
  if (phone.length < 10 || phone.length > 11) return fail("Informe um telefone com DDD.");
  if (password.length < 8) return fail("A senha precisa ter pelo menos 8 caracteres.");
  if (formData.get("terms") !== "on") {
    return fail("Aceite os Termos de Uso e a Política de Privacidade para continuar.");
  }

  const result = await createAccount({
    name,
    email,
    phone,
    password,
    marketing: formData.get("marketing") === "on",
  });
  if ("error" in result) return fail(result.error);

  // Se o projeto não exige confirmar o e-mail, a pessoa já entra.
  if (result.loggedIn) redirect(safeNext(formData.get("next")));

  return {
    status: "success",
    message: "Conta criada! Enviamos um e-mail para confirmar seu cadastro. Depois é só entrar.",
  };
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = text(formData.get("email"), 254).toLowerCase();
  if (!EMAIL.test(email)) return fail("Informe um e-mail válido.");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/conta/nova-senha`,
  });

  if (error) {
    if (error.status === 429) return fail("Muitas tentativas. Aguarde alguns minutos.");
    console.error("[auth] recuperar senha:", error.code, error.message);
  }

  // Mesma resposta sempre: não revela quais e-mails têm conta.
  return {
    status: "success",
    message: "Se esse e-mail tiver conta, enviamos um link para criar uma nova senha.",
  };
}

export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return fail("A senha precisa ter pelo menos 8 caracteres.");
  if (password !== confirm) return fail("As senhas não são iguais.");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return fail("Este link expirou. Peça um novo em “Esqueci minha senha”.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return fail("Escolha uma senha diferente da atual.");
    if (error.code === "weak_password") return fail("Escolha uma senha mais forte.");
    console.error("[auth] nova senha:", error.code, error.message);
    return fail("Não foi possível atualizar a senha agora.");
  }

  redirect("/conta?senha=atualizada");
}
