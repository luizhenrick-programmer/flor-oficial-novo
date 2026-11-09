import { cache } from "react";
import { supabase, getAdminClient } from "@/utils/supabase/supabase";
import type { CatalogFilters } from "@/utils/catalog";

export type ProductBadge = "Mais vendido" | "Novo" | "Esgotado";

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  badge: ProductBadge | null;
  category?: string; // preenchido quando o category_id existir em products
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  base_price: number | string;
  compare_at_price: number | string | null;
  created_at: string;
  product_images: { image_url: string; display_order: number }[] | null;
  product_variants: { stock_quantity: number }[] | null;
};

type SalesRow = {
  quantity: number;
  product_variants:
    | { product_id: string }
    | { product_id: string }[]
    | null;
};

const DAY = 86_400_000;
const NEW_DAYS = 30; // produto criado nos últimos 30 dias = "Novo"
const SALES_DAYS = 90; // janela usada para calcular o mais vendido
const SOLD_STATUSES = ["paid", "shipped", "delivered"];

// Quantidade vendida por produto (pedidos pagos nos últimos 90 dias).
// Usa o cliente administrativo porque pedidos não são públicos.
// Se a chave não existir ou a consulta falhar, devolve vazio e a home segue sem o selo.
async function getSalesByProduct(): Promise<Map<string, number>> {
  const sales = new Map<string, number>();
  const admin = getAdminClient();
  if (!admin) return sales;

  const since = new Date(Date.now() - SALES_DAYS * DAY).toISOString();

  const { data, error } = await admin
    .from("order_items")
    .select("quantity, product_variants(product_id), orders!inner(status, created_at)")
    .in("orders.status", SOLD_STATUSES)
    .gte("orders.created_at", since);

  if (error || !data) {
    if (error) console.error("[home] vendas:", error.message);
    return sales;
  }

  for (const row of data as unknown as SalesRow[]) {
    const variant = Array.isArray(row.product_variants)
      ? row.product_variants[0]
      : row.product_variants;
    if (!variant) continue;
    sales.set(
      variant.product_id,
      (sales.get(variant.product_id) ?? 0) + row.quantity,
    );
  }

  return sales;
}

// Produtos da seção "Mais desejados" da home.
// Ordem: mais vendidos primeiro; sem vendas, os mais recentes.
export async function getHomeProducts(limit = 6): Promise<ProductCard[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, name, slug, base_price, compare_at_price, created_at,
       product_images ( image_url, display_order ),
       product_variants ( stock_quantity )`,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error || !data) {
    if (error) console.error("[home] produtos:", error.message);
    return [];
  }

  const rows = data as unknown as ProductRow[];
  const sales = await getSalesByProduct();

  // O sort é estável: empates continuam na ordem do mais recente.
  const ranked = [...rows].sort(
    (a, b) => (sales.get(b.id) ?? 0) - (sales.get(a.id) ?? 0),
  );

  // Selo "Mais vendido" só para o primeiro colocado, e só se houver venda.
  const topId =
    ranked.length > 0 && (sales.get(ranked[0].id) ?? 0) > 0
      ? ranked[0].id
      : null;

  return ranked.slice(0, limit).map((row) => toCard(row, topId));
}

function toCard(row: ProductRow, topId: string | null): ProductCard {
  const price = Number(row.base_price);
  const compare =
    row.compare_at_price != null ? Number(row.compare_at_price) : null;

  const variants = row.product_variants ?? [];
  const soldOut =
    variants.length > 0 && variants.every((v) => v.stock_quantity <= 0);
  const isNew = Date.now() - new Date(row.created_at).getTime() < NEW_DAYS * DAY;

  const firstImage = [...(row.product_images ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  )[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price,
    // O preço "de" só aparece se for maior que o preço atual.
    compareAtPrice: compare !== null && compare > price ? compare : null,
    imageUrl: firstImage?.image_url ?? null,
    badge: soldOut
      ? "Esgotado"
      : row.id === topId
        ? "Mais vendido"
        : isNew
          ? "Novo"
          : null,
  };
}

function topSellerId(sales: Map<string, number>): string | null {
  let best: string | null = null;
  let max = 0;
  for (const [id, qty] of sales) {
    if (qty > max) {
      best = id;
      max = qty;
    }
  }
  return best;
}

const byName = (a: string, b: string) =>
  a.localeCompare(b, "pt-BR", { numeric: true });

// Tamanhos e cores que existem de verdade nos produtos ativos (alimenta os filtros).
export async function getFilterOptions(): Promise<{ sizes: string[]; colors: string[] }> {
  const { data, error } = await supabase
    .from("product_variants")
    .select("size, color, products!inner(is_active)")
    .eq("products.is_active", true);

  if (error || !data) {
    if (error) console.error("[colecoes] filtros:", error.message);
    return { sizes: [], colors: [] };
  }

  const sizes = new Set<string>();
  const colors = new Set<string>();
  for (const v of data as unknown as { size: string | null; color: string | null }[]) {
    if (v.size) sizes.add(v.size);
    if (v.color) colors.add(v.color);
  }
  return { sizes: [...sizes].sort(byName), colors: [...colors].sort(byName) };
}

export const PAGE_SIZE = 12;

// Catálogo completo com pesquisa, filtros, ordenação e paginação.
export async function getCatalog(
  f: CatalogFilters,
): Promise<{ products: ProductCard[]; total: number }> {
  // Com filtro de tamanho/cor, só entram produtos que têm uma variação correspondente.
  const byVariant = f.tamanhos.length > 0 || f.cores.length > 0;

  let query = supabase
    .from("products")
    .select(
      `id, name, slug, base_price, compare_at_price, created_at,
       product_images ( image_url, display_order ),
       product_variants${byVariant ? "!inner" : ""} ( stock_quantity, size, color )`,
      { count: "exact" },
    )
    .eq("is_active", true);

  if (f.busca) {
    const term = f.busca.replace(/[%_,()"\\]/g, " ").trim();
    if (term) {
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
    }
  }
  if (f.tamanhos.length) query = query.in("product_variants.size", f.tamanhos);
  if (f.cores.length) query = query.in("product_variants.color", f.cores);
  if (f.min !== undefined) query = query.gte("base_price", f.min);
  if (f.max !== undefined) query = query.lte("base_price", f.max);

  if (f.ordem === "menor-preco") query = query.order("base_price", { ascending: true });
  if (f.ordem === "maior-preco") query = query.order("base_price", { ascending: false });
  query = query.order("created_at", { ascending: false });

  const from = (f.pagina - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);

  // Inclui o caso de página além do fim da lista.
  if (error || !data) {
    if (error) console.error("[colecoes] catálogo:", error.message);
    return { products: [], total: 0 };
  }

  const topId = topSellerId(await getSalesByProduct());
  const rows = data as unknown as ProductRow[];
  return { products: rows.map((row) => toCard(row, topId)), total: count ?? 0 };
}

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  images: { url: string; variantId: string | null }[];
  variants: {
    id: string;
    size: string | null;
    color: string | null;
    stock: number;
    price: number; // price_override da variação, ou base_price
  }[];
};

type DetailRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  base_price: number | string;
  compare_at_price: number | string | null;
  product_images:
    | { image_url: string; display_order: number; variant_id: string | null }[]
    | null;
  product_variants:
    | {
        id: string;
        size: string | null;
        color: string | null;
        stock_quantity: number;
        price_override: number | string | null;
      }[]
    | null;
};

// cache() evita buscar duas vezes na mesma requisição (página + metadata).
export const getProductBySlug = cache(
  async (slug: string): Promise<ProductDetail | null> => {
    const { data, error } = await supabase
      .from("products")
      .select(
        `id, slug, name, description, base_price, compare_at_price,
         product_images ( image_url, display_order, variant_id ),
         product_variants ( id, size, color, stock_quantity, price_override )`,
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("[produto]", error.message);
      return null;
    }

    const row = data as unknown as DetailRow;
    const base = Number(row.base_price);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      price: base,
      compareAtPrice:
        row.compare_at_price != null ? Number(row.compare_at_price) : null,
      images: [...(row.product_images ?? [])]
        .sort((a, b) => a.display_order - b.display_order)
        .map((i) => ({ url: i.image_url, variantId: i.variant_id })),
      variants: (row.product_variants ?? [])
        .map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          stock: v.stock_quantity,
          price: v.price_override != null ? Number(v.price_override) : base,
        }))
        .sort(
          (a, b) =>
            byName(a.color ?? "", b.color ?? "") ||
            byName(a.size ?? "", b.size ?? ""),
        ),
    };
  },
);
