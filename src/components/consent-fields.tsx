import Link from "next/link";

// Checklist de aceite: termos (obrigatório) e novidades por e-mail (opcional).
// Funciona dentro de <form> comum (usa "name") e também com estado controlado.
export function ConsentFields({
  terms,
  onTerms,
  marketing,
  onMarketing,
}: {
  terms?: boolean;
  onTerms?: (v: boolean) => void;
  marketing?: boolean;
  onMarketing?: (v: boolean) => void;
}) {
  const box = "mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]";

  return (
    <div className="mt-6 space-y-3 text-sm">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="terms"
          required
          className={box}
          {...(onTerms
            ? { checked: !!terms, onChange: (e) => onTerms(e.target.checked) }
            : {})}
        />
        <span className="text-muted-foreground">
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="link-underline pb-0.5 text-primary">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="link-underline pb-0.5 text-primary">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="marketing"
          className={box}
          {...(onMarketing
            ? { checked: !!marketing, onChange: (e) => onMarketing(e.target.checked) }
            : {})}
        />
        <span className="text-muted-foreground">
          Quero receber novidades e ofertas por e-mail (opcional).
        </span>
      </label>
    </div>
  );
}
