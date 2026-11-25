// Conta de cliente (somente servidor). Usa o Supabase Auth.
import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/supabase";

// Mude esta data sempre que os Termos ou a Política de Privacidade mudarem de verdade.
// Ela fica registrada junto com o aceite de cada cliente.
export const TERMS_VERSION = "2026-11";

export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Cliente logado (validado no servidor do Supabase) ou null.
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

// Só aceita caminhos internos do próprio site (evita redirecionar para outro endereço).
export function safeNext(value: unknown, fallback = "/conta") {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? next
    : fallback;
}

// Inscreve na newsletter (e-mail repetido não é erro).
export async function addToNewsletter(email: string, source: string) {
  const admin = getAdminClient();
  if (!admin) return;
  const { error } = await admin
    .from("newsletter_subscribers")
    .insert({ email: email.toLowerCase(), source });
  if (error && error.code !== "23505") console.error("[newsletter]", error.message);
}

export type AccountInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  marketing: boolean;
};

// Cria a conta no Supabase Auth, guardando o aceite dos termos (data e versão).
export async function createAccount(
  input: AccountInput,
): Promise<{ userId: string; loggedIn: boolean } | { error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/conta`,
      data: {
        name: input.name,
        phone: input.phone,
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
        marketing_opt_in: input.marketing,
      },
    },
  });

  const exists = "Este e-mail já tem conta. Entre para continuar.";

  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return { error: exists };
    }
    if (error.code === "weak_password") {
      return { error: "Escolha uma senha mais forte (mínimo de 8 caracteres)." };
    }
    if (error.status === 429 || error.code?.startsWith("over_")) {
      return { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
    }
    console.error("[auth] cadastro:", error.code, error.message);
    return { error: "Não foi possível criar a conta agora. Tente novamente em instantes." };
  }

  const user = data.user;
  if (!user) return { error: "Não foi possível criar a conta agora." };

  // E-mail já cadastrado: o Supabase devolve um usuário "de mentira", sem identidades.
  if (user.identities && user.identities.length === 0) return { error: exists };

  if (input.marketing) await addToNewsletter(input.email, "cadastro");

  return { userId: user.id, loggedIn: Boolean(data.session) };
}
