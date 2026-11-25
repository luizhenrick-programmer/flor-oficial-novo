import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { isAdmin } from "@/utils/admin";
import { getCurrentUser } from "@/utils/auth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Painel | Flor Oficial",
  robots: { index: false, follow: false },
};

// Tema escuro do painel: preto quente com o blush da marca.
// As cores entram como variáveis só nesta área, então a loja não muda.
const theme = {
  "--background": "oklch(0.155 0.006 40)",
  "--foreground": "oklch(0.93 0.01 60)",
  "--card": "oklch(0.2 0.008 40)",
  "--card-foreground": "oklch(0.93 0.01 60)",
  "--popover": "oklch(0.2 0.008 40)",
  "--popover-foreground": "oklch(0.93 0.01 60)",
  "--primary": "oklch(0.86 0.035 40)",
  "--primary-foreground": "oklch(0.18 0.01 40)",
  "--secondary": "oklch(0.25 0.01 40)",
  "--secondary-foreground": "oklch(0.93 0.01 60)",
  "--muted": "oklch(0.24 0.01 40)",
  "--muted-foreground": "oklch(0.7 0.02 50)",
  "--accent": "oklch(0.3 0.02 40)",
  "--accent-foreground": "oklch(0.93 0.01 60)",
  "--blush": "oklch(0.86 0.035 40)",
  "--sand": "oklch(0.25 0.01 40)",
  "--border": "oklch(0.3 0.01 40)",
  "--input": "oklch(0.3 0.01 40)",
  "--ring": "oklch(0.75 0.04 40)",
  "--destructive": "oklch(0.7 0.19 25)",
  "--destructive-foreground": "oklch(0.98 0 0)",
} as CSSProperties;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/admin");

  if (!(await isAdmin(user))) {
    return (
      <main
        style={theme}
        className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground"
      >
        <p className="eyebrow text-[0.62rem] text-muted-foreground">Acesso restrito</p>
        <h1 className="mt-3 text-3xl">Você não tem permissão para esta área</h1>
        <Link href="/" className="mt-8 border border-border px-6 py-3 text-xs uppercase tracking-[0.2em] transition hover:border-primary hover:text-primary">
          Voltar para a loja
        </Link>
      </main>
    );
  }

  return (
    <div style={theme} className="min-h-screen bg-background text-foreground lg:flex">
      <AdminSidebar email={user.email ?? ""} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
