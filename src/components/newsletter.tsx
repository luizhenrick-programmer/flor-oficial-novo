"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: integrar com seu serviço de e-mail (Mailchimp, Supabase, etc.)
    setSent(true);
  }

  return (
    <section className="bg-secondary py-20">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl text-primary lg:text-4xl">
          Ganhe 10% na primeira compra
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Cadastre-se e receba lançamentos e ofertas exclusivas.
        </p>

        {sent ? (
          <p className="mt-8 font-display text-xl italic text-primary">
            Obrigada! Seu cupom chega por e-mail.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              className="h-12 flex-1 border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
            <button type="submit" className="btn-primary">
              Quero
            </button>
          </form>
        )}
      </div>
    </section>
  );
}