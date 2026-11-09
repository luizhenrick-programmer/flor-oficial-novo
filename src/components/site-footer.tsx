import Link from "next/link";
import { Logo } from "@/components/logo";

const wrap = "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10";

const footerLinks: Record<string, string> = {
  Novidades: "/colecoes?ordem=novidades",
  Vestidos: "/colecoes", // TODO: trocar pelo filtro de categoria
  Conjuntos: "/colecoes",
  Alfaiataria: "/colecoes",
  "Fale conosco": "/contato",
};

const footerCols = [
  { title: "Loja", links: ["Novidades", "Vestidos", "Conjuntos", "Alfaiataria"] },
  {
    title: "Ajuda",
    links: [
      "Trocas e devoluções",
      "Guia de medidas",
      "Prazos de entrega",
      "Fale conosco",
    ],
  },
];

export function SiteFooter() {
  return (
    <>
      {/* Rodapé */}
      <footer className="border-t border-border bg-secondary/50 pt-16">
        <div className={`${wrap} grid grid-cols-2 gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-12`}>
          <div className="col-span-2 md:col-span-1">
            <div className="w-fit">
              <Logo small />
            </div>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Moda feminina midsize e plus size feita para celebrar a mulher
              real.
            </p>
          </div>

          {footerCols.map((col) => (
            <div key={col.title}>
              <h4 className="eyebrow text-[0.65rem] text-primary">
                {col.title}
              </h4>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link href={footerLinks[l] ?? "#"} className="link-underline pb-0.5">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-1">
            <h4 className="eyebrow text-[0.65rem] text-primary">Siga a Flor</h4>
            <a
              href="https://instagram.com/floroficial"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
              </svg>
              @floroficial
            </a>
            <p className="mt-4 text-xs text-muted-foreground">
              Pix · Visa · Mastercard · Elo · Boleto
            </p>
          </div>
        </div>

        <div
          className={`${wrap} mt-14 border-t border-border py-6 text-center text-xs text-muted-foreground`}
        >
          © 2026 Flor Oficial. Todos os direitos reservados.
        </div>
      </footer>
    </>
  );
}
