import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth-forms";
import { getCurrentUser, safeNext } from "@/utils/auth";

export const metadata = { title: "Criar conta | Flor Oficial", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CadastroPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next);

  if (await getCurrentUser()) redirect(next);

  return (
    <main className="mx-auto w-full max-w-md px-5 py-14 sm:px-6 lg:py-20">
      <p className="eyebrow text-muted-foreground">Minha conta</p>
      <h1 className="mt-3 text-4xl text-primary sm:text-5xl">Criar conta</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Acompanhe seus pedidos e mantenha sua sacola salva.
      </p>

      <div className="mt-10">
        <SignupForm next={next} />
      </div>

      <p className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href={`/entrar?next=${encodeURIComponent(next)}`} className="link-underline pb-0.5 text-primary">
          Entrar
        </Link>
      </p>
    </main>
  );
}
