"use client";

import { useActionState } from "react";
import { subscribe, type NewsletterState } from "@/app/actions/newsletter";

const initial: NewsletterState = { status: "idle", message: "" };

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribe, initial);

  return (
    <section className="bg-secondary py-20">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl text-primary lg:text-4xl">
          Ganhe 10% na primeira compra
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Cadastre-se e receba lançamentos e ofertas exclusivas.
        </p>

        {state.status === "success" ? (
          <p role="status" className="mt-8 font-display text-xl italic text-primary">
            {state.message}
          </p>
        ) : (
          <form action={action} className="mx-auto mt-8 max-w-md">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                name="email"
                required
                maxLength={254}
                autoComplete="email"
                placeholder="Seu melhor e-mail"
                aria-label="Seu melhor e-mail"
                className="h-12 flex-1 border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <button type="submit" disabled={pending} className="btn-primary">
                {pending ? "Enviando…" : "Quero"}
              </button>
            </div>

            {/* Armadilha para robôs: escondido de pessoas, não deve ser preenchido */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Não preencha este campo
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            {state.status === "error" && (
              <p role="status" className="mt-3 text-sm text-destructive">
                {state.message}
              </p>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              Ao se cadastrar, você aceita receber e-mails da Flor Oficial.
              Cancele quando quiser.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
