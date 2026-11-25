import Link from "next/link";
import { ORDER_STATUS, PageHeader, StatusBadge, ui } from "@/components/admin-ui";
import { adminDb } from "@/utils/admin";
import { formatBRL } from "@/utils/format";

type Row = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: { customer?: { name?: string }; city?: string; state?: string } | null;
  order_items: { quantity: number }[];
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminPedidos({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const status = raw && ORDER_STATUS[raw] ? raw : "";

  let query = adminDb()
    .from("orders")
    .select("id, status, total_amount, created_at, shipping_address, order_items(quantity)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);

  const { data } = await query;
  const orders = (data ?? []) as unknown as Row[];

  const tabs = [{ key: "", label: "Todos" }, ...Object.entries(ORDER_STATUS).map(([key, v]) => ({ key, label: v.label }))];

  return (
    <>
      <PageHeader eyebrow="Vendas" title="Pedidos" />

      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/pedidos?status=${t.key}` : "/admin/pedidos"}
            className={`border px-4 py-2 text-xs transition ${
              status === t.key ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <div className={`${ui.card} p-12 text-center text-sm text-muted-foreground`}>Nenhum pedido encontrado.</div>
      ) : (
        <ul className={`${ui.card} divide-y divide-border`}>
          {orders.map((o) => {
            const count = o.order_items.reduce((s, i) => s + i.quantity, 0);
            return (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-secondary">
                  <span>
                    <span className="block text-sm">#{o.id.slice(0, 8).toUpperCase()}</span>
                    <span className="block text-xs text-muted-foreground">
                      {o.shipping_address?.customer?.name ?? "Cliente"} · {o.shipping_address?.city}/{o.shipping_address?.state}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {count} {count === 1 ? "peça" : "peças"}
                  </span>
                  <span className="flex items-center gap-4">
                    <span className="text-sm">{formatBRL(Number(o.total_amount))}</span>
                    <StatusBadge status={o.status} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
