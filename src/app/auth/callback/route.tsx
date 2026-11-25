import { NextResponse } from "next/server";
import { safeNext } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";

// Destino dos links enviados por e-mail (confirmar cadastro e recuperar senha).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}