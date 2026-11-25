import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Next.js 16: este arquivo substitui o antigo middleware.ts.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // tudo, menos arquivos estáticos e imagens
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};