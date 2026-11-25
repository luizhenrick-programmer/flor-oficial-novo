import { redirect } from "next/navigation";
import { NewPasswordForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/utils/auth";

export const metadata = { title: "Nova senha | Flor Oficial", robots: { index: false } };

export default async function NovaSenhaPage() {
  // Só chega aqui quem abriu o link do e-mail (ou já está logado).
  if (!(await getCurrentUser())) redirect("/recuperar-senha");

  return (
    <main className="mx-auto w-full max-w-md px-5 py-14 sm:px-6 lg:py-20">
      <p className="eyebrow text-muted-foreground">Minha conta</p>
      <h1 className="mt-3 text-4xl text-primary sm:text-5xl">Nova senha</h1>
      <div className="mt-10">
        <NewPasswordForm />
      </div>
    </main>
  );
}
