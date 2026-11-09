"use client";

import { useActionState } from "react";
import { sendContact, type ContactState } from "@/app/contato/actions";

const initial: ContactState = { status: "idle", message: "" };

const label = "eyebrow text-[0.62rem] text-primary";
const field =
  "mt-3 w-full border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContact, initial);

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="name" className={label}>
          Nome
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          defaultValue={state.values?.name}
          className={`${field} h-12`}
        />
      </div>

      <div>
        <label htmlFor="email" className={label}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          defaultValue={state.values?.email}
          className={`${field} h-12`}
        />
      </div>

      <div>
        <label htmlFor="message" className={label}>
          Mensagem
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={5000}
          defaultValue={state.values?.message}
          className={`${field} py-3`}
        />
      </div>

      {/* Armadilha para robôs: escondido de pessoas, não deve ser preenchido */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Não preencha este campo
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
        {pending ? "Enviando…" : "Enviar mensagem"}
      </button>

      {state.status !== "idle" && (
        <p
          role="status"
          className={`text-sm ${
            state.status === "success" ? "text-primary" : "text-destructive"
          }`}
        >
          {state.message}
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Usamos seus dados apenas para responder a esta mensagem.
      </p>
    </form>
  );
}
