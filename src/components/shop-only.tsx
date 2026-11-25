"use client";

import { usePathname } from "next/navigation";

// Esconde o cabeçalho, o rodapé e a sacola da loja dentro do painel (/admin).
export function ShopOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
