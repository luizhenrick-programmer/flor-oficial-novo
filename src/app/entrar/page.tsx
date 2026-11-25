import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser, safeNext } from "@/utils/auth";

export const metadata = { title: "Entrar | Flor Oficial", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function EntrarPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next);

  if (await getCurrentUser()) redirect(next);

  return (
    <main className="mx-auto w-full max-w-md px-5 py-14 sm:px-6 lg:py-20">
      <p className="eyebrow text-muted-foreground">Minha conta</p>
      <h1 className="mt-3 text-4xl text-primary sm:text-5xl">Entrar</h1>

      {sp.erro === "link" && (
        <p role="alert" className="mt-6 text-sm text-destructive">
          Este link é inválido ou expirou. Entre com sua senha ou peça um novo link.
        </p>
      )}

      <div className="mt-10">
        <LoginForm next={next} />
      </div>

      <p className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href={`/cadastro?next=${encodeURIComponent(next)}`} className="link-underline pb-0.5 text-primary">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
