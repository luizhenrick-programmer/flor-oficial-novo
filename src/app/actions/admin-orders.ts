"use server";

import { revalidatePath } from "next/cache";
import { adminDb, requireAdmin } from "@/utils/admin";
import { cancelOrderByAdmin } from "@/utils/orders";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Mudanças de status permitidas
const NEXT: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
};

export async function updateOrderStatus(
  orderId: string,
  next: string,
  tracking?: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Acesso negado." };
  }
  if (!UUID.test(orderId)) return { error: "Pedido inválido." };
  const db = adminDb();

  const { data: order } = await db
    .from("orders")
    .select("id, status, shipping_address")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: "Pedido não encontrado." };

  if (!NEXT[order.status as string]?.includes(next)) {
    return { error: "Essa mudança de status não é permitida." };
  }

  const changed = "O pedido já mudou de status. Recarregue a página.";

  if (next === "cancelled") {
    // devolve as peças ao estoque
    if (!(await cancelOrderByAdmin(orderId))) return { error: changed };
  } else {
    const patch: Record<string, unknown> = { status: next };

    if (next === "shipped") {
      // O código de rastreio fica dentro do JSON do pedido (a tabela não tem coluna para isso).
      const addr = (order.shipping_address ?? {}) as Record<string, unknown>;
      const shipping = (addr.shipping ?? {}) as Record<string, unknown>;
      patch.shipping_address = {
        ...addr,
        shipping: {
          ...shipping,
          tracking_code: String(tracking ?? "").trim().slice(0, 60) || null,
          shipped_at: new Date().toISOString(),
        },
      };
    }

    const { data: updated } = await db
      .from("orders")
      .update(patch)
      .eq("id", orderId)
      .eq("status", order.status)
      .select("id");
    if (!updated || updated.length === 0) return { error: changed };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath(`/pedido/${orderId}`);
  revalidatePath("/conta");
  return { ok: true };
}
