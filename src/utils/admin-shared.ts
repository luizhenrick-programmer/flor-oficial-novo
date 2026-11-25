// Tipos e regras compartilhados entre o painel (navegador) e as ações (servidor).
// Não importar nada de servidor aqui.

export const BUCKET = "produtos"; // bucket público do Supabase Storage com as fotos
export const MAX_IMAGE_MB = 8;
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type VariantInput = {
  id?: string;
  color: string;
  size: string;
  sku: string;
  stock: number;
  priceOverride: number | null;
};

export type ProductInput = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  active: boolean;
  variants: VariantInput[];
};

// "Vestido Terra Camadas" -> "vestido-terra-camadas"
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

const money = (n: number) => Math.round(n * 100) / 100;
const blank = (v: unknown) => v === null || v === undefined || v === "";

// Valida e limpa o produto antes de gravar (o servidor nunca confia no navegador).
export function validateProduct(
  input: ProductInput,
): { error: string } | { value: ProductInput } {
  const name = String(input.name ?? "").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 150) {
    return { error: "Informe o nome do produto (até 150 caracteres)." };
  }

  const slug = slugify(String(input.slug || name));
  if (!slug) return { error: "Não foi possível gerar o endereço (slug) do produto." };

  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0) return { error: "Informe um preço válido." };

  const compare = blank(input.comparePrice) ? null : Number(input.comparePrice);
  if (compare !== null && (!Number.isFinite(compare) || compare <= price)) {
    return { error: "O preço “de” precisa ser maior que o preço atual (ou deixe vazio)." };
  }

  const variants: VariantInput[] = [];
  const skus = new Set<string>();
  const combos = new Set<string>();

  const list = Array.isArray(input.variants) ? input.variants : [];
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    const label = `Variação ${i + 1}`;

    const stock = Math.floor(Number(v.stock));
    if (!Number.isFinite(stock) || stock < 0) {
      return { error: `${label}: informe um estoque válido (0 ou mais).` };
    }

    const override = blank(v.priceOverride) ? null : Number(v.priceOverride);
    if (override !== null && (!Number.isFinite(override) || override < 0)) {
      return { error: `${label}: preço específico inválido.` };
    }

    const sku = String(v.sku ?? "").trim().toUpperCase().slice(0, 60);
    if (sku) {
      if (skus.has(sku)) return { error: `SKU repetido: ${sku}.` };
      skus.add(sku);
    }

    const color = String(v.color ?? "").trim().slice(0, 40);
    const size = String(v.size ?? "").trim().slice(0, 20);
    const combo = `${color.toLowerCase()}|${size.toLowerCase()}`;
    if (combos.has(combo)) {
      return { error: `Variação repetida: ${[color, size].filter(Boolean).join(" / ") || "sem cor e tamanho"}.` };
    }
    combos.add(combo);

    variants.push({
      id: v.id,
      color,
      size,
      sku,
      stock,
      priceOverride: override === null ? null : money(override),
    });
  }

  if (input.active && variants.length === 0) {
    return { error: "Para ativar o produto, cadastre pelo menos uma variação." };
  }

  return {
    value: {
      id: input.id,
      name,
      slug,
      description: String(input.description ?? "").trim().slice(0, 5000),
      price: money(price),
      comparePrice: compare === null ? null : money(compare),
      active: Boolean(input.active),
      variants,
    },
  };
}
