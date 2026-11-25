"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  X,
} from "@/components/icons";
import { Logo } from "@/components/logo";
import { createClient } from "@/utils/supabase/client";

const items = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: Package, exact: false },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, exact: false },
];

// A logo é clara no site; aqui ela vira branca para aparecer no fundo escuro.
const logoClass = "[&_img]:brightness-0 [&_img]:invert [&_img]:opacity-80";

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // fecha o menu do celular ao trocar de tela
  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await createClient().auth.signOut();
    window.location.assign("/");
  }

  return (
    <>
      {/* Barra superior (celular) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background px-5 py-3 lg:hidden">
        <div className={logoClass}>
          <Logo small />
        </div>
        <button type="button" aria-label="Abrir menu" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" strokeWidth={1.25} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card px-5 py-7 transition-transform lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 lg:hidden"
        >
          <X className="h-5 w-5" strokeWidth={1.25} />
        </button>

        <div className={`flex flex-col items-center border-b border-border pb-7 ${logoClass}`}>
          <Logo small />
          <p className="eyebrow mt-4 text-[0.55rem] text-muted-foreground">Painel administrativo</p>
        </div>

        <nav className="mt-7 flex-1 space-y-1">
          {items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 border-l-2 px-3 py-3 text-sm transition ${
                  active
                    ? "border-primary bg-secondary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.25} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-border pt-5 text-sm">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 text-muted-foreground transition hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.25} />
            Ver a loja
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 text-muted-foreground transition hover:text-foreground"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.25} />
            Sair
          </button>
          <p className="truncate pt-2 text-xs text-muted-foreground/70">{email}</p>
        </div>
      </aside>
    </>
  );
}
