// Acesso ao painel (somente servidor).
import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "@/utils/auth";
import { getAdminClient } from "@/utils/supabase/supabase";

// É administrador quem tem o e-mail confirmado E:
//  - está na lista ADMIN_EMAILS do .env.local, ou
//  - tem role = 'admin' na tabela users.
export async function isAdmin(user: User): Promise<boolean> {
  if (!user.email_confirmed_at) return false;

  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (user.email && emails.includes(user.email.toLowerCase())) return true;

  const db = getAdminClient();
  if (!db) return false;
  const { data } = await db.from("users").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
}

// Toda ação do painel começa por aqui: o layout protege as telas, mas as ações
// podem ser chamadas diretamente, então elas conferem o acesso de novo.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin(user))) throw new Error("Acesso negado");
  return user;
}

export function adminDb() {
  const db = getAdminClient();
  if (!db) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente");
  return db;
}
