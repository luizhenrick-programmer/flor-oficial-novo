"use client";

import Link from "next/link";

// Tela exibida quando algo dá errado ao carregar uma página.
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center">
      <p className="eyebrow text-muted-foreground">Algo deu errado</p>
      <h1 className="mt-3 text-4xl text-primary sm:text-5xl">
        Não conseguimos carregar esta página
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Tente novamente em instantes. Se o problema continuar, fale com a gente.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button type="button" onClick={reset} className="btn-primary">
          Tentar novamente
        </button>
        <Link href="/" className="btn-outline">
          Voltar para a home
        </Link>
      </div>
    </main>
  );
}
