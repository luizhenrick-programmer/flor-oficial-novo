"use server";

import { getCurrentUser } from "@/utils/auth";
import type { CartItem } from "@/utils/cart";
import { cleanLines, priceLines, type CartLine } from "@/utils/orders";
import { getAdminClient } from "@/utils/supabase/supabase";

// Sacola salva na conta. Acesso só pelo servidor (a tabela cart_items não tem política pública).

// Devolve a sacola da conta com preço e estoque atuais, ou null se não houver login.
export async function loadCart(): Promise<CartItem[] | null> {
  const user = await getCurrentUser();
  const db = getAdminClient();
  if (!user || !db) return null;

  const { data } = await db
    .from("cart_items")
    .select("variant_id, quantity")
    .eq("user_id", user.id);

  const lines = cleanLines(
    ((data ?? []) as { variant_id: string; quantity: number }[]).map((r) => ({
      variantId: r.variant_id,
      quantity: r.quantity,
    })),
  );
  if (lines.length === 0) return [];

  const priced = await priceLines(lines);
  return priced
    .filter((p) => p.active && p.stock > 0)
    .map((p) => ({
      variantId: p.variantId,
      slug: p.slug,
      name: p.name,
      color: p.color,
      size: p.size,
      price: p.price,
      imageUrl: p.imageUrl,
      quantity: Math.min(p.quantity, p.stock),
      maxStock: p.stock,
    }));
}

// Grava a sacola atual na conta (substitui o que estava salvo).
export async function saveCart(input: CartLine[]): Promise<void> {
  const user = await getCurrentUser();
  const db = getAdminClient();
  if (!user || !db) return;

  const lines = cleanLines(input);

  if (lines.length > 0) {
    const now = new Date().toISOString();
    const { error } = await db.from("cart_items").upsert(
      lines.map((l) => ({
        user_id: user.id,
        variant_id: l.variantId,
        quantity: l.quantity,
        updated_at: now,
      })),
      { onConflict: "user_id,variant_id" },
    );
    if (error) {
      console.error("[sacola] salvar:", error.message);
      return;
    }
  }

  // Remove o que a cliente tirou da sacola
  const keep = lines.map((l) => l.variantId);
  const del = db.from("cart_items").delete().eq("user_id", user.id);
  const { error } = keep.length > 0 ? await del.not("variant_id", "in", `(${keep.join(",")})`) : await del;
  if (error) console.error("[sacola] limpar:", error.message);
}
