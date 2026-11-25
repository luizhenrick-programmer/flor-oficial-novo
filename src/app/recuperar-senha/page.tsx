import Link from "next/link";
import { ResetRequestForm } from "@/components/auth-forms";

export const metadata = { title: "Recuperar senha | Flor Oficial", robots: { index: false } };

export default function RecuperarSenhaPage() {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-14 sm:px-6 lg:py-20">
      <p className="eyebrow text-muted-foreground">Minha conta</p>
      <h1 className="mt-3 text-4xl text-primary sm:text-5xl">Recuperar senha</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Informe seu e-mail e enviaremos um link para criar uma nova senha.
      </p>

      <div className="mt-10">
        <ResetRequestForm />
      </div>

      <p className="mt-10 border-t border-border pt-6 text-center text-sm">
        <Link href="/entrar" className="link-underline pb-0.5 text-muted-foreground">
          Voltar para o login
        </Link>
      </p>
    </main>
  );
}
