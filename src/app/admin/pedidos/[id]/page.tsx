import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin-order-actions";
import { PageHeader, StatusBadge, ui } from "@/components/admin-ui";
import { adminDb } from "@/utils/admin";
import { formatBRL } from "@/utils/format";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Order = {
  id: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  created_at: string;
  shipping_address: {
    zip?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    customer?: { name?: string; email?: string; phone?: string };
    shipping?: { service?: string; company?: string; days?: number | null; price?: number; tracking_code?: string | null };
    payment?: { provider?: string; mp_order_id?: string };
  } | null;
  order_items: {
    product_name_at_time: string;
    color_at_time: string | null;
    size_at_time: string | null;
    quantity: number;
    unit_price_at_time: number;
  }[];
};

const phone = (v?: string) => {
  const d = (v ?? "").replace(/\D/g, "");
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : v ?? "";
};

export default async function AdminPedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { data } = await adminDb()
    .from("orders")
    .select(
      `id, status, subtotal, shipping_cost, discount_amount, total_amount, created_at, shipping_address,
       order_items ( product_name_at_time, color_at_time, size_at_time, quantity, unit_price_at_time )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const o = data as unknown as Order;
  const a = o.shipping_address;
  const whats = (a?.customer?.phone ?? "").replace(/\D/g, "");

  return (
    <>
      <PageHeader eyebrow={new Date(o.created_at).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })} title={`Pedido #${o.id.slice(0, 8).toUpperCase()}`}>
        <StatusBadge status={o.status} />
        <Link href="/admin/pedidos" className="text-sm text-muted-foreground transition hover:text-foreground">
          Voltar
        </Link>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section className={`${ui.card} p-6`}>
          <h2 className="font-display text-2xl">Itens</h2>
          <ul className="mt-5 divide-y divide-border text-sm">
            {o.order_items.map((i, n) => (
              <li key={n} className="flex justify-between gap-4 py-3">
                <span>
                  {i.quantity}× {i.product_name_at_time}
                  <span className="block text-xs text-muted-foreground">
                    {[i.color_at_time, i.size_at_time && `Tam. ${i.size_at_time}`].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span>{formatBRL(Number(i.unit_price_at_time) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(Number(o.subtotal))}</span></div>
            {Number(o.discount_amount) > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span>− {formatBRL(Number(o.discount_amount))}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Frete{a?.shipping?.service ? ` (${[a.shipping.company, a.shipping.service].filter(Boolean).join(" ")})` : ""}</span><span>{Number(o.shipping_cost) === 0 ? "Grátis" : formatBRL(Number(o.shipping_cost))}</span></div>
            <div className="flex justify-between border-t border-border pt-4 text-base"><span>Total</span><span>{formatBRL(Number(o.total_amount))}</span></div>
          </div>
        </section>

        <div className="space-y-6">
          <section className={`${ui.card} p-6`}>
            <h2 className="font-display text-2xl">Ações</h2>
            <div className="mt-5">
              <OrderActions orderId={o.id} status={o.status} />
            </div>
          </section>

          <section className={`${ui.card} p-6 text-sm`}>
            <h2 className="font-display text-2xl">Cliente</h2>
            <p className="mt-4">{a?.customer?.name}</p>
            <p className="text-muted-foreground">{a?.customer?.email}</p>
            <p className="text-muted-foreground">{phone(a?.customer?.phone)}</p>
            {whats.length >= 10 && (
              <a href={`https://wa.me/55${whats}`} target="_blank" rel="noopener noreferrer" className="link-underline mt-3 inline-block pb-0.5 text-primary">
                Chamar no WhatsApp
              </a>
            )}
          </section>

          <section className={`${ui.card} p-6 text-sm`}>
            <h2 className="font-display text-2xl">Entrega</h2>
            <p className="mt-4">{a?.street}, {a?.number}{a?.complement ? ` — ${a.complement}` : ""}</p>
            <p className="text-muted-foreground">{a?.neighborhood}</p>
            <p className="text-muted-foreground">{a?.city}/{a?.state} · CEP {a?.zip}</p>
            {a?.shipping?.days != null && (
              <p className="mt-3 text-xs text-muted-foreground">Prazo: {a.shipping.days} dias úteis após a postagem</p>
            )}
            {a?.shipping?.tracking_code && (
              <p className="mt-3">Rastreio: <span className="text-primary">{a.shipping.tracking_code}</span></p>
            )}
          </section>

          {a?.payment?.mp_order_id && (
            <section className={`${ui.card} p-6 text-xs text-muted-foreground`}>
              <p className="eyebrow text-[0.58rem]">Pagamento</p>
              <p className="mt-2">Mercado Pago · {a.payment.mp_order_id}</p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
