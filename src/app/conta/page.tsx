import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth-forms";
import { getCurrentUser } from "@/utils/auth";
import { formatBRL } from "@/utils/format";
import { getAdminClient } from "@/utils/supabase/supabase";

export const dynamic = "force-dynamic";
export const metadata = { title: "Minha conta | Flor Oficial", robots: { index: false } };

const wrap = "mx-auto w-full max-w-3xl px-5 sm:px-6";

const STATUS: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

type OrderRow = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: { quantity: number }[];
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ContaPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/conta");

  const sp = await searchParams;
  const db = getAdminClient();

  // Busca pelo id confirmado da sessão (nunca por um valor vindo da URL).
  const { data } = db
    ? await db
        .from("orders")
        .select("id, status, total_amount, created_at, order_items ( quantity )")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: null };

  const orders = (data ?? []) as unknown as OrderRow[];
  const name = (user.user_metadata?.name as string | undefined) ?? "";

  return (
    <main className="overflow-x-clip">
      <section className={`${wrap} py-14 lg:py-20`}>
        <p className="eyebrow text-muted-foreground">Minha conta</p>
        <h1 className="mt-3 text-4xl text-primary sm:text-5xl">
          {name ? `Olá, ${name.split(" ")[0]}` : "Olá"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{user.email}</p>

        {sp.senha === "atualizada" && (
          <p role="status" className="mt-6 text-sm text-primary">
            Senha atualizada com sucesso.
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-6">
          <LogoutButton />
          <Link href="/recuperar-senha" className="link-underline pb-0.5 text-sm text-muted-foreground">
            Alterar senha
          </Link>
        </div>

        <h2 className="mt-16 text-3xl text-primary">Meus pedidos</h2>

        {orders.length === 0 ? (
          <div className="mt-6 border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Você ainda não fez nenhum pedido.</p>
            <Link href="/colecoes" className="btn-primary mt-6">
              Ver coleções
            </Link>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {orders.map((o) => {
              const count = o.order_items.reduce((s, i) => s + i.quantity, 0);
              return (
                <li key={o.id}>
                  <Link
                    href={`/pedido/${o.id}`}
                    className="flex flex-wrap items-center justify-between gap-4 py-5 transition hover:bg-card sm:px-3"
                  >
                    <span>
                      <span className="eyebrow block text-[0.6rem] text-muted-foreground">
                        Pedido #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="mt-1 block text-sm">
                        {new Date(o.created_at).toLocaleDateString("pt-BR")} · {count}{" "}
                        {count === 1 ? "peça" : "peças"}
                      </span>
                    </span>
                    <span className="text-right text-sm">
                      <span className="block">{formatBRL(Number(o.total_amount))}</span>
                      <span className="mt-1 block text-xs text-primary">
                        {STATUS[o.status] ?? o.status}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
