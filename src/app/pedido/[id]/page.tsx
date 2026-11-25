import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/clear-cart";
import { formatBRL } from "@/utils/format";
import { syncPayment } from "@/utils/orders";
import { getAdminClient } from "@/utils/supabase/supabase";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seu pedido | Flor Oficial", robots: { index: false } };

const wrap = "mx-auto w-full max-w-3xl px-5 sm:px-6";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Order = {
  id: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  shipping_address: {
    city?: string;
    state?: string;
    customer?: { name?: string };
    shipping?: { service?: string; company?: string; days?: number | null; tracking_code?: string | null };
    payment?: { checkout_url?: string };
  } | null;
  order_items: {
    product_name_at_time: string;
    color_at_time: string | null;
    size_at_time: string | null;
    quantity: number;
    unit_price_at_time: number;
  }[];
};

const STATUS: Record<string, { title: string; text: string }> = {
  paid: {
    title: "Pagamento confirmado",
    text: "Recebemos o seu pagamento. Em breve você recebe as informações de envio.",
  },
  pending: {
    title: "Aguardando pagamento",
    text: "Assim que o pagamento for confirmado, atualizamos esta página. Pix e boleto podem levar alguns minutos ou dias para compensar.",
  },
  shipped: {
    title: "Pedido enviado",
    text: "Seu pedido já está a caminho. Use o código de rastreio abaixo para acompanhar.",
  },
  delivered: {
    title: "Pedido entregue",
    text: "Seu pedido foi entregue. Esperamos que você ame as peças!",
  },
  cancelled: {
    title: "Pedido cancelado",
    text: "O pagamento não foi concluído e o pedido foi cancelado. As peças voltaram ao estoque.",
  },
};

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  // Confere com o Mercado Pago antes de mostrar (garante o status mesmo se o aviso atrasar).
  await syncPayment(id);

  const db = getAdminClient();
  if (!db) notFound();

  const { data } = await db
    .from("orders")
    .select(
      `id, status, subtotal, shipping_cost, total_amount, shipping_address,
       order_items ( product_name_at_time, color_at_time, size_at_time, quantity, unit_price_at_time )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as unknown as Order;
  const info = STATUS[order.status] ?? STATUS.pending;
  const addr = order.shipping_address;
  const firstName = addr?.customer?.name?.split(" ")[0];

  return (
    <main className="overflow-x-clip">
      {order.status !== "cancelled" && <ClearCart />}

      <section className={`${wrap} py-14 lg:py-20`}>
        <p className="eyebrow text-muted-foreground">
          Pedido #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <h1 className="mt-3 text-4xl text-primary sm:text-5xl">{info.title}</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {firstName ? `${firstName}, ` : ""}
          {info.text}
        </p>

        {order.status === "pending" && addr?.payment?.checkout_url && (
          <a href={addr.payment.checkout_url} className="btn-primary mt-8">
            Ir para o pagamento
          </a>
        )}

        <div className="mt-12 border border-border bg-card p-6">
          <ul className="divide-y divide-border text-sm">
            {order.order_items.map((i, n) => (
              <li key={n} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <span>
                  {i.quantity}× {i.product_name_at_time}
                  <span className="block text-xs text-muted-foreground">
                    {[i.color_at_time, i.size_at_time && `Tam. ${i.size_at_time}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span>{formatBRL(Number(i.unit_price_at_time) * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2 border-t border-border pt-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Frete{addr?.shipping?.service ? ` (${[addr.shipping.company, addr.shipping.service].filter(Boolean).join(" ")})` : ""}
              </span>
              <span>{Number(order.shipping_cost) === 0 ? "Grátis" : formatBRL(Number(order.shipping_cost))}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-4 text-base">
              <span>Total</span>
              <span>{formatBRL(Number(order.total_amount))}</span>
            </div>
          </div>

          {addr?.city && (
            <p className="mt-6 text-xs text-muted-foreground">
              Entrega para {addr.city}/{addr.state}
              {addr.shipping?.days != null && ` · ${addr.shipping.days} dias úteis após a postagem`}
            </p>
          )}
        </div>

        {addr?.shipping?.tracking_code && (
          <p className="mt-6 text-sm">
            Código de rastreio: <span className="text-primary">{addr.shipping.tracking_code}</span>
          </p>
        )}

        <Link href="/colecoes" className="btn-outline mt-10">
          Continuar comprando
        </Link>
      </section>
    </main>
  );
}
