import Link from "next/link";
import { PageHeader, StatusBadge, ui } from "@/components/admin-ui";
import { adminDb } from "@/utils/admin";
import { formatBRL } from "@/utils/format";

type Recent = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: { customer?: { name?: string } } | null;
};
type Low = {
  id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
  products: { id: string; name: string } | { id: string; name: string }[];
};

export default async function AdminHome() {
  const db = adminDb();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const count = async (status: string) =>
    (await db.from("orders").select("id", { count: "exact", head: true }).eq("status", status)).count ?? 0;

  const [pending, toShip, products, month, low, recent] = await Promise.all([
    count("pending"),
    count("paid"),
    db.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    db
      .from("orders")
      .select("total_amount")
      .in("status", ["paid", "shipped", "delivered"])
      .gte("created_at", monthStart.toISOString()),
    db
      .from("product_variants")
      .select("id, size, color, stock_quantity, products!inner(id, name, is_active)")
      .lte("stock_quantity", 2)
      .eq("products.is_active", true)
      .order("stock_quantity")
      .limit(8),
    db
      .from("orders")
      .select("id, status, total_amount, created_at, shipping_address")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const revenue = ((month.data ?? []) as { total_amount: number }[]).reduce(
    (s, o) => s + Number(o.total_amount),
    0,
  );

  const cards = [
    { label: "Aguardando pagamento", value: String(pending), href: "/admin/pedidos?status=pending" },
    { label: "Pagos, a enviar", value: String(toShip), href: "/admin/pedidos?status=paid" },
    { label: "Faturamento do mês", value: formatBRL(revenue), href: "/admin/pedidos" },
    { label: "Produtos ativos", value: String(products.count ?? 0), href: "/admin/produtos" },
  ];

  return (
    <>
      <PageHeader eyebrow="Visão geral" title="Painel">
        <Link href="/admin/produtos/novo" className={ui.btn}>
          Novo produto
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`${ui.card} p-5 transition hover:border-primary`}>
            <p className="eyebrow text-[0.58rem] text-muted-foreground">{c.label}</p>
            <p className="mt-3 font-display text-3xl">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className={`${ui.card} p-6`}>
          <h2 className="font-display text-2xl">Pedidos recentes</h2>
          {((recent.data ?? []) as unknown as Recent[]).length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Nenhum pedido ainda.</p>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {((recent.data ?? []) as unknown as Recent[]).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="flex items-center justify-between gap-3 py-3 text-sm transition hover:text-primary">
                    <span>
                      <span className="block">#{o.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">
                        {o.shipping_address?.customer?.name ?? "Cliente"} · {new Date(o.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span>{formatBRL(Number(o.total_amount))}</span>
                      <StatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${ui.card} p-6`}>
          <h2 className="font-display text-2xl">Estoque baixo</h2>
          <p className="mt-1 text-xs text-muted-foreground">Variações de produtos ativos com 2 peças ou menos.</p>
          {((low.data ?? []) as unknown as Low[]).length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Tudo certo por aqui.</p>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {((low.data ?? []) as unknown as Low[]).map((v) => {
                const p = Array.isArray(v.products) ? v.products[0] : v.products;
                return (
                  <li key={v.id}>
                    <Link href={`/admin/produtos/${p.id}`} className="flex items-center justify-between gap-3 py-3 text-sm transition hover:text-primary">
                      <span>
                        {p.name}
                        <span className="block text-xs text-muted-foreground">
                          {[v.color, v.size && `Tam. ${v.size}`].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className={v.stock_quantity === 0 ? "text-destructive" : "text-amber-300"}>
                        {v.stock_quantity === 0 ? "Sem estoque" : `${v.stock_quantity} un.`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
