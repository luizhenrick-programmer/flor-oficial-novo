"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "@/components/icons";

// Abre uma barra de busca por cima da página. Ao dar Enter, vai para
// /colecoes?busca=... (o catálogo já sabe filtrar por esse parâmetro).
export function SearchButton() {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Buscar"
        onClick={() => setOpen(true)}
        className="cursor-pointer"
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={1.25} />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setOpen(false)}
          >
            <form
              action="/colecoes"
              onClick={(e) => e.stopPropagation()}
              className="bg-background px-5 py-6 shadow-soft sm:px-6 lg:px-10"
            >
              <div className="mx-auto flex max-w-3xl items-center gap-4 border-b border-primary pb-3">
                <Search className="h-5 w-5 text-primary" strokeWidth={1.25} />
                <input
                  ref={input}
                  name="busca"
                  placeholder="O que você procura?"
                  aria-label="Buscar peças"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  aria-label="Fechar busca"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" strokeWidth={1.25} />
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}
    </>
  );
}
