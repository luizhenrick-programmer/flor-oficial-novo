"use server";

import { getAdminClient } from "@/utils/supabase/supabase";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUCCESS = "Cadastro feito! Você vai receber novidades e ofertas por e-mail.";
const FAILURE = "Não foi possível cadastrar agora. Tente novamente mais tarde.";

export async function subscribe(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  // Campo escondido: robôs preenchem, pessoas não. Finge sucesso e descarta.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success", message: SUCCESS };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return { status: "error", message: "Informe um e-mail válido." };
  }

  // Gravação com a chave de servidor: a tabela não tem política pública (RLS).
  const admin = getAdminClient();
  if (!admin) {
    console.error("[newsletter] SUPABASE_SERVICE_ROLE_KEY ausente");
    return { status: "error", message: FAILURE };
  }

  const { error } = await admin
    .from("newsletter_subscribers")
    .insert({ email, source: "home" });

  // 23505 = e-mail já cadastrado. Para a pessoa, conta como sucesso.
  if (error && error.code !== "23505") {
    console.error("[newsletter]", error.message);
    return { status: "error", message: FAILURE };
  }

  return { status: "success", message: SUCCESS };
}
