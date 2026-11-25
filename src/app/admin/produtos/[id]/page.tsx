import Link from "next/link";
import { notFound } from "next/navigation";
import { ImagesManager, type AdminImage } from "@/components/admin-images";
import { PageHeader } from "@/components/admin-ui";
import { ProductForm } from "@/components/admin-product-form";
import { adminDb } from "@/utils/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  is_active: boolean;
  product_variants:
    | {
        id: string;
        color: string | null;
        size: string | null;
        sku: string | null;
        stock_quantity: number;
        price_override: number | null;
      }[]
    | null;
  product_images:
    | { id: string; image_url: string; display_order: number; variant_id: string | null }[]
    | null;
};

export default async function EditarProduto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { data } = await adminDb()
    .from("products")
    .select(
      `id, name, slug, description, base_price, compare_at_price, is_active,
       product_variants ( id, color, size, sku, stock_quantity, price_override ),
       product_images ( id, image_url, display_order, variant_id )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const p = data as unknown as Row;
  const variants = [...(p.product_variants ?? [])].sort(
    (a, b) =>
      (a.color ?? "").localeCompare(b.color ?? "", "pt-BR") ||
      (a.size ?? "").localeCompare(b.size ?? "", "pt-BR", { numeric: true }),
  );
  const colorOf = new Map(variants.map((v) => [v.id, v.color]));
  const colors = [...new Set(variants.map((v) => v.color).filter((c): c is string => !!c))];

  const images: AdminImage[] = [...(p.product_images ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((i) => ({
      id: i.id,
      url: i.image_url,
      color: i.variant_id ? (colorOf.get(i.variant_id) ?? null) : null,
    }));

  return (
    <>
      <PageHeader eyebrow="Editar produto" title={p.name}>
        <Link href={`/colecoes/${p.slug}`} target="_blank" className="text-sm text-muted-foreground transition hover:text-foreground">
          Ver na loja ↗
        </Link>
        <Link href="/admin/produtos" className="text-sm text-muted-foreground transition hover:text-foreground">
          Voltar
        </Link>
      </PageHeader>

      <div className="space-y-10">
        <ProductForm
          initial={{
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description ?? "",
            price: Number(p.base_price),
            comparePrice: p.compare_at_price != null ? Number(p.compare_at_price) : null,
            active: p.is_active,
            variants: variants.map((v) => ({
              id: v.id,
              color: v.color ?? "",
              size: v.size ?? "",
              sku: v.sku ?? "",
              stock: v.stock_quantity,
              priceOverride: v.price_override != null ? Number(v.price_override) : null,
            })),
          }}
        />
        <ImagesManager productId={p.id} images={images} colors={colors} />
      </div>
    </>
  );
}
