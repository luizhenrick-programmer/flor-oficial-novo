// Regras de pedido e estoque (somente servidor). Usa a chave de servidor do Supabase.
import { getAdminClient } from "@/utils/supabase/supabase";
import { getCheckoutOrder, type MpOrder } from "@/utils/mercadopago";

type Admin = NonNullable<ReturnType<typeof getAdminClient>>;

function admin(): Admin {
  const client = getAdminClient();
  if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente");
  return client;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export type CartLine = { variantId: string; quantity: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Aceita só variações e quantidades válidas (o navegador não é confiável).
export function cleanLines(input: CartLine[]): CartLine[] {
  const merged = new Map<string, number>();
  for (const l of Array.isArray(input) ? input.slice(0, 50) : []) {
    if (!l || typeof l.variantId !== "string" || !UUID.test(l.variantId)) continue;
    const qty = Math.floor(Number(l.quantity));
    if (!Number.isFinite(qty) || qty < 1) continue;
    merged.set(l.variantId, Math.min((merged.get(l.variantId) ?? 0) + qty, 20));
  }
  return [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));
}

export type PricedLine = {
  variantId: string;
  slug: string;
  name: string;
  color: string | null;
  size: string | null;
  price: number; // price_override da variação ou base_price
  stock: number;
  quantity: number;
  active: boolean;
  imageUrl: string | null;
};

type VariantRow = {
  id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
  price_override: number | string | null;
  products:
    | ProductRel
    | ProductRel[]
    | null;
};
type ProductRel = {
  name: string;
  slug: string;
  base_price: number | string;
  is_active: boolean;
  product_images: { image_url: string; display_order: number }[] | null;
};

// Preço e estoque REAIS de cada item da sacola (nunca confiar no que vem do navegador).
export async function priceLines(lines: CartLine[]): Promise<PricedLine[]> {
  const { data, error } = await admin()
    .from("product_variants")
    .select(
      `id, size, color, stock_quantity, price_override,
       products!inner ( name, slug, base_price, is_active, product_images ( image_url, display_order ) )`,
    )
    .in("id", lines.map((l) => l.variantId));

  if (error) throw new Error(error.message);

  const byId = new Map((data as unknown as VariantRow[]).map((v) => [v.id, v]));
  const priced: PricedLine[] = [];

  for (const line of lines) {
    const v = byId.get(line.variantId);
    if (!v) continue;
    const p = Array.isArray(v.products) ? v.products[0] : v.products;
    if (!p) continue;
    const image = [...(p.product_images ?? [])].sort(
      (a, b) => a.display_order - b.display_order,
    )[0];

    priced.push({
      variantId: v.id,
      slug: p.slug,
      name: p.name,
      color: v.color,
      size: v.size,
      price: Number(v.price_override ?? p.base_price),
      stock: v.stock_quantity,
      quantity: line.quantity,
      active: p.is_active,
      imageUrl: image?.image_url ?? null,
    });
  }
  return priced;
}

// Soma/subtrai estoque sem deixar duas compras simultâneas passarem da quantidade real:
// a atualização só vale se o estoque ainda for o mesmo que acabamos de ler.
async function adjustStock(db: Admin, variantId: string, delta: number) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data } = await db
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", variantId)
      .maybeSingle();
    if (!data) return false;

    const current = data.stock_quantity as number;
    const next = current + delta;
    if (next < 0) return false;

    const { data: updated } = await db
      .from("product_variants")
      .update({ stock_quantity: next })
      .eq("id", variantId)
      .eq("stock_quantity", current)
      .select("id");

    if (updated && updated.length > 0) return true;
  }
  return false;
}

// Cria o pedido (pendente) com os itens e já separa o estoque.
// Se faltar estoque em qualquer item, desfaz tudo.
export async function createStoreOrder(input: {
  userId: string | null;
  lines: PricedLine[];
  shippingCost: number;
  address: Record<string, unknown>;
}): Promise<{ id: string } | { error: string }> {
  const db = admin();
  const subtotal = round2(input.lines.reduce((s, l) => s + l.price * l.quantity, 0));
  const total = round2(subtotal + input.shippingCost);

  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: input.userId,
      status: "pending",
      subtotal,
      shipping_cost: input.shippingCost,
      discount_amount: 0,
      coupon_code: null,
      total_amount: total,
      shipping_address: input.address,
    })
    .select("id")
    .single();

  if (error || !order) {
    console.error("[pedido] criar:", error?.message);
    return { error: "Não foi possível registrar o pedido." };
  }

  const orderId = order.id as string;

  const { error: itemsError } = await db.from("order_items").insert(
    input.lines.map((l) => ({
      order_id: orderId,
      variant_id: l.variantId,
      product_name_at_time: l.name,
      color_at_time: l.color,
      size_at_time: l.size,
      quantity: l.quantity,
      unit_price_at_time: l.price,
    })),
  );

  if (itemsError) {
    console.error("[pedido] itens:", itemsError.message);
    await db.from("orders").delete().eq("id", orderId);
    return { error: "Não foi possível registrar o pedido." };
  }

  const taken: { variantId: string; quantity: number }[] = [];
  for (const l of input.lines) {
    if (!(await adjustStock(db, l.variantId, -l.quantity))) {
      for (const t of taken) await adjustStock(db, t.variantId, t.quantity);
      await db.from("orders").delete().eq("id", orderId);
      return { error: `Estoque insuficiente para ${l.name}.` };
    }
    taken.push({ variantId: l.variantId, quantity: l.quantity });
  }

  return { id: orderId };
}

// Guarda no pedido os dados do pagamento (dentro do JSON, já que a tabela não tem colunas para isso).
export async function attachPayment(
  orderId: string,
  address: Record<string, unknown>,
  payment: { mp_order_id: string; checkout_url: string },
) {
  await admin()
    .from("orders")
    .update({ shipping_address: { ...address, payment: { provider: "mercadopago", ...payment } } })
    .eq("id", orderId);
}

// Cancela um pedido pendente e devolve as peças ao estoque (uma única vez).
export async function cancelAndRestore(orderId: string) {
  const db = admin();

  const { data: flipped } = await db
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id");

  if (!flipped || flipped.length === 0) return false;

  const { data: items } = await db
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);

  for (const item of (items ?? []) as { variant_id: string | null; quantity: number }[]) {
    if (item.variant_id) await adjustStock(db, item.variant_id, item.quantity);
  }
  return true;
}

// Alinha nosso pedido com o que o Mercado Pago informa:
// pago -> "paid"; expirado/cancelado -> "cancelled" (e o estoque volta).
export async function syncPayment(orderId: string, preloaded?: MpOrder) {
  const db = admin();
  const { data: order } = await db
    .from("orders")
    .select("id, status, total_amount, shipping_address")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;
  if (order.status !== "pending") return order.status as string;

  const mpId = (order.shipping_address as { payment?: { mp_order_id?: string } } | null)
    ?.payment?.mp_order_id;
  if (!preloaded && !mpId) return "pending";

  let mp: MpOrder;
  try {
    mp = preloaded ?? (await getCheckoutOrder(mpId as string));
  } catch (err) {
    console.error("[pagamento] consulta:", err);
    return "pending";
  }

  if (mp.external_reference !== order.id) return "pending";

  if (mp.status === "processed") {
    // Pode ser maior que o total quando a cliente paga juros do parcelamento.
    if (Number(mp.total_paid_amount) + 0.009 >= Number(order.total_amount)) {
      await db.from("orders").update({ status: "paid" }).eq("id", orderId).eq("status", "pending");
      return "paid";
    }
  } else if (mp.status === "expired" || mp.status === "canceled") {
    await cancelAndRestore(orderId);
    return "cancelled";
  }

  return "pending";
}

// Esvazia a sacola salva na conta (depois que o pedido é criado).
export async function clearServerCart(userId: string) {
  await admin().from("cart_items").delete().eq("user_id", userId);
}

// Dados do último pedido da cliente, para preencher o checkout da próxima vez.
export async function getCheckoutPrefill(userId: string) {
  const { data } = await admin()
    .from("orders")
    .select("shipping_address")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const a = (data?.shipping_address ?? null) as {
    zip?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    customer?: { name?: string; phone?: string };
  } | null;
  if (!a) return null;

  const d = String(a.zip ?? "").replace(/\D/g, "");
  return {
    name: a.customer?.name ?? "",
    phone: a.customer?.phone ?? "",
    zip: d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : d,
    street: a.street ?? "",
    number: a.number ?? "",
    complement: a.complement ?? "",
    neighborhood: a.neighborhood ?? "",
    city: a.city ?? "",
    state: a.state ?? "",
  };
}

// Cancelamento feito pelo administrador (pedido pendente ou pago): devolve as peças ao estoque.
// Se o pedido já estava pago, o reembolso é feito à parte, no Mercado Pago.
export async function cancelOrderByAdmin(orderId: string) {
  const db = admin();

  const { data: flipped } = await db
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .in("status", ["pending", "paid"])
    .select("id");

  if (!flipped || flipped.length === 0) return false;

  const { data: items } = await db
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);

  for (const item of (items ?? []) as { variant_id: string | null; quantity: number }[]) {
    if (item.variant_id) await adjustStock(db, item.variant_id, item.quantity);
  }
  return true;
}
