import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente público: lê só o que o RLS libera para visitantes (produtos ativos, fotos, variações).
// Lazy singleton — evita inicialização no nível de módulo durante o prerender do Next.js.
let _supabase: SupabaseClient | null = null;
export function getPublicClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  }
  return _supabase;
}

/** @deprecated use getPublicClient() */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getPublicClient()[prop as keyof SupabaseClient];
  },
});

// Cliente administrativo: ignora o RLS. Usar APENAS em código de servidor
// (Server Components, Server Actions, Route Handlers). A chave nunca pode
// ter o prefixo NEXT_PUBLIC_.
export function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}