"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "@/components/icons";

// No desktop (lg+) os filtros ficam fixos na lateral.
// No celular aparece o botão "Filtrar" e o painel abre como uma gaveta.
export function FiltersDrawer({
  activeCount,
  children,
}: {
  activeCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-outline justify-self-start lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={1.25} />
        Filtrar{activeCount > 0 && ` (${activeCount})`}
      </button>

      <aside
        className={`${open ? "fixed inset-0 z-50" : "hidden"} lg:sticky lg:inset-auto lg:top-32 lg:z-auto lg:block lg:self-start`}
      >
        <div
          className="absolute inset-0 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
        <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-background p-6 lg:static lg:w-auto lg:max-w-none lg:overflow-visible lg:bg-transparent lg:p-0">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <span className="eyebrow text-[0.65rem] text-primary">Filtros</span>
            <button
              type="button"
              aria-label="Fechar filtros"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </div>
          {children}
        </div>
      </aside>
    </>
  );
}
