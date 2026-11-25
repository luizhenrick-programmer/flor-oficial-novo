"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { adminDb, requireAdmin } from "@/utils/admin";
import {
  BUCKET,
  IMAGE_TYPES,
  validateProduct,
  type ProductInput,
} from "@/utils/admin-shared";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Result<T = object> = ({ ok: true } & T) | { error: string };

async function guard(): Promise<string | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return "Acesso negado.";
  }
}

function dbError(error: { code?: string; message: string }): { error: string } {
  if (error.code === "23505") {
    if (/slug/i.test(error.message)) return { error: "Já existe um produto com esse endereço (slug)." };
    if (/sku/i.test(error.message)) return { error: "Já existe uma variação com esse SKU." };
    return { error: "Já existe um registro com esses dados." };
  }
  console.error("[admin] banco:", error.code, error.message);
  return { error: "Não foi possível salvar. Tente novamente." };
}

// A loja guarda cache das páginas: avisa que o produto mudou.
function refreshStore(slug?: string) {
  revalidatePath("/");
  revalidatePath("/colecoes");
  if (slug) revalidatePath(`/colecoes/${slug}`);
}

// Cria ou atualiza o produto e suas variações.
export async function saveProduct(input: ProductInput): Promise<Result<{ id: string }>> {
  const denied = await guard();
  if (denied) return { error: denied };

  const checked = validateProduct(input);
  if ("error" in checked) return checked;
  const p = checked.value;
  const db = adminDb();

  // SKU precisa ser único na loja: confere antes de gravar para não deixar nada pela metade.
  const skus = p.variants.map((v) => v.sku).filter(Boolean);
  if (skus.length > 0) {
    const { data: used } = await db.from("product_variants").select("sku, product_id").in("sku", skus);
    const clash = ((used ?? []) as { sku: string; product_id: string }[]).find((r) => r.product_id !== p.id);
    if (clash) return { error: `O SKU ${clash.sku} já é usado em outro produto.` };
  }

  const row = {
    name: p.name,
    slug: p.slug,
    description: p.description || null,
    base_price: p.price,
    compare_at_price: p.comparePrice,
    is_active: p.active,
  };

  let id = p.id;
  if (id) {
    if (!UUID.test(id)) return { error: "Produto inválido." };
    const { error } = await db.from("products").update(row).eq("id", id);
    if (error) return dbError(error);
  } else {
    const { data, error } = await db.from("products").insert(row).select("id").single();
    if (error || !data) return dbError(error ?? { message: "sem retorno" });
    id = data.id as string;
  }

  // Produto novo que falha no meio do caminho é desfeito (as variações saem junto).
  const created = !p.id;
  const fail = async (error: { code?: string; message: string }) => {
    if (created) await db.from("products").delete().eq("id", id as string);
    return dbError(error);
  };

  // Variações: remove as que saíram da lista, atualiza as existentes e cria as novas.
  const { data: current } = await db.from("product_variants").select("id").eq("product_id", id);
  const keep = new Set(p.variants.map((v) => v.id).filter(Boolean));
  const removed = ((current ?? []) as { id: string }[]).map((r) => r.id).filter((x) => !keep.has(x));
  if (removed.length > 0) {
    const { error } = await db.from("product_variants").delete().in("id", removed);
    if (error) return fail(error);
  }

  for (const v of p.variants) {
    const vr = {
      product_id: id,
      color: v.color || null,
      size: v.size || null,
      sku: v.sku || null,
      stock_quantity: v.stock,
      price_override: v.priceOverride,
    };
    const { error } = v.id
      ? await db.from("product_variants").update(vr).eq("id", v.id).eq("product_id", id)
      : await db.from("product_variants").insert(vr);
    if (error) return fail(error);
  }

  refreshStore(p.slug);
  revalidatePath("/admin/produtos");
  return { ok: true, id: id as string };
}

function storagePath(url: string) {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
}

// Exclui o produto (variações e fotos saem junto; os pedidos antigos continuam guardados).
export async function deleteProduct(id: string): Promise<Result> {
  const denied = await guard();
  if (denied) return { error: denied };
  if (!UUID.test(id)) return { error: "Produto inválido." };
  const db = adminDb();

  const { data: images } = await db.from("product_images").select("image_url").eq("product_id", id);
  const paths = ((images ?? []) as { image_url: string }[])
    .map((i) => storagePath(i.image_url))
    .filter((x): x is string => !!x);

  const { error } = await db.from("products").delete().eq("id", id);
  if (error) return dbError(error);

  if (paths.length > 0) await db.storage.from(BUCKET).remove(paths);
  refreshStore();
  revalidatePath("/admin/produtos");
  return { ok: true };
}

// 1º passo do envio de foto: gera um endereço de upload válido por pouco tempo.
// O arquivo vai direto do navegador para o Storage (sem passar pelo servidor do site).
export async function createImageUpload(
  productId: string,
  fileName: string,
  contentType: string,
): Promise<Result<{ path: string; token: string }>> {
  const denied = await guard();
  if (denied) return { error: denied };
  if (!UUID.test(productId)) return { error: "Produto inválido." };

  const ext = IMAGE_TYPES[contentType];
  if (!ext) return { error: `“${fileName}”: use JPG, PNG ou WebP.` };

  const path = `${productId}/${randomUUID()}.${ext}`;
  const { data, error } = await adminDb().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[admin] upload:", error?.message);
    return { error: "Não foi possível preparar o envio. O bucket “produtos” existe e é público?" };
  }
  return { ok: true, path, token: data.token };
}

// 2º passo: depois do envio, registra a foto no produto (por último na ordem).
export async function registerImage(productId: string, path: string): Promise<Result> {
  const denied = await guard();
  if (denied) return { error: denied };
  if (!UUID.test(productId) || !path.startsWith(`${productId}/`)) return { error: "Foto inválida." };
  const db = adminDb();

  const { data: last } = await db
    .from("product_images")
    .select("display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: false })
    .limit(1);
  const next = ((last?.[0]?.display_order as number | undefined) ?? -1) + 1;

  const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await db
    .from("product_images")
    .insert({ product_id: productId, image_url: url, display_order: next });
  if (error) return dbError(error);

  refreshStore();
  return { ok: true };
}

// Nova ordem das fotos (a primeira é a principal).
export async function reorderImages(productId: string, orderedIds: string[]): Promise<Result> {
  const denied = await guard();
  if (denied) return { error: denied };
  if (!UUID.test(productId) || !orderedIds.every((i) => UUID.test(i))) return { error: "Fotos inválidas." };
  const db = adminDb();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await db
      .from("product_images")
      .update({ display_order: i })
      .eq("id", orderedIds[i])
      .eq("product_id", productId);
    if (error) return dbError(error);
  }
  refreshStore();
  return { ok: true };
}

// Liga a foto a uma cor (a página do produto mostra essas fotos primeiro ao escolher a cor).
export async function setImageColor(
  productId: string,
  imageId: string,
  color: string | null,
): Promise<Result> {
  const denied = await guard();
  if (denied) return { error: denied };
  if (!UUID.test(productId) || !UUID.test(imageId)) return { error: "Foto inválida." };
  const db = adminDb();

  let variantId: string | null = null;
  if (color) {
    const { data } = await db
      .from("product_variants")
      .select("id")
      .eq("product_id", productId)
      .eq("color", color)
      .limit(1);
    variantId = (data?.[0]?.id as string | undefined) ?? null;
    if (!variantId) return { error: "Essa cor não existe nas variações do produto." };
  }

  const { error } = await db
    .from("product_images")
    .update({ variant_id: variantId })
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) return dbError(error);
  refreshStore();
  return { ok: true };
}

export async function deleteImage(productId: string, imageId: string): Promise<Result> {
  const denied = await guard();
  if (denied) return { error: denied };
  if (!UUID.test(productId) || !UUID.test(imageId)) return { error: "Foto inválida." };
  const db = adminDb();

  const { data } = await db
    .from("product_images")
    .select("image_url")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();
  if (!data) return { error: "Foto não encontrada." };

  const { error } = await db.from("product_images").delete().eq("id", imageId);
  if (error) return dbError(error);

  const path = storagePath(data.image_url as string);
  if (path) await db.storage.from(BUCKET).remove([path]);
  refreshStore();
  return { ok: true };
}
