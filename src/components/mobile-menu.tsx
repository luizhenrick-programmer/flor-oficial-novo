"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "@/components/icons";
import { leftNav, rightNav } from "@/utils/nav";

// O painel é renderizado direto no <body> (portal). Dentro do header, o
// backdrop-blur criaria um "container" que quebraria o position: fixed.
export function MobileMenu({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className={`cursor-pointer ${className}`}
      >
        <Menu className="h-5 w-5" strokeWidth={1.25} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={close} />
            <nav
              aria-label="Menu"
              className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-background p-6 shadow-soft"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="eyebrow text-[0.65rem] text-primary">Menu</span>
                <button type="button" aria-label="Fechar menu" onClick={close}>
                  <X className="h-5 w-5" strokeWidth={1.25} />
                </button>
              </div>

              <form action="/colecoes" className="mb-8">
                <input
                  name="busca"
                  placeholder="Buscar peças"
                  aria-label="Buscar peças"
                  className="h-11 w-full border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
                />
              </form>

              <ul className="space-y-5">
                {[...leftNav, ...rightNav].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      onClick={close}
                      className="font-display text-2xl text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/conta" onClick={close} className="font-display text-2xl text-primary">
                    Minha conta
                  </Link>
                </li>
              </ul>
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}
