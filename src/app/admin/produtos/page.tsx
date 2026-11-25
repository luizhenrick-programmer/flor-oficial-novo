import Image from "next/image";
import Link from "next/link";
import { PageHeader, ui } from "@/components/admin-ui";
import { adminDb } from "@/utils/admin";
import { formatBRL } from "@/utils/format";

type Row = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  is_active: boolean;
  product_images: { image_url: string; display_order: number }[] | null;
  product_variants: { stock_quantity: number }[] | null;
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminProdutos({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().replace(/[%_,()"\\]/g, " ") ?? "";

  let query = adminDb()
    .from("products")
    .select(
      "id, name, slug, base_price, compare_at_price, is_active, product_images(image_url, display_order), product_variants(stock_quantity)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data } = await query;
  const products = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader eyebrow="Catálogo" title="Produtos">
        <Link href="/admin/produtos/novo" className={ui.btn}>
          Novo produto
        </Link>
      </PageHeader>

      <form className="mb-6 flex gap-3">
        <input name="q" defaultValue={q} placeholder="Buscar pelo nome" className="h-11 w-full max-w-sm border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring" />
        <button className={ui.btnOutline}>Buscar</button>
      </form>

      {products.length === 0 ? (
        <div className={`${ui.card} p-12 text-center`}>
          <p className="text-sm text-muted-foreground">
            {q ? "Nenhum produto encontrado." : "Você ainda não cadastrou nenhum produto."}
          </p>
          {!q && (
            <Link href="/admin/produtos/novo" className={`${ui.btn} mt-6`}>
              Cadastrar o primeiro
            </Link>
          )}
        </div>
      ) : (
        <ul className={`${ui.card} divide-y divide-border`}>
          {products.map((p) => {
            const image = [...(p.product_images ?? [])].sort((a, b) => a.display_order - b.display_order)[0];
            const stock = (p.product_variants ?? []).reduce((s, v) => s + v.stock_quantity, 0);
            return (
              <li key={p.id}>
                <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-4 p-4 transition hover:bg-secondary">
                  <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
                    {image && <Image src={image.image_url} alt="" fill sizes="64px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-xl">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">/colecoes/{p.slug}</span>
                  </span>
                  <span className="hidden text-right text-sm sm:block">
                    {p.compare_at_price && (
                      <span className="mr-2 text-xs text-muted-foreground line-through">{formatBRL(Number(p.compare_at_price))}</span>
                    )}
                    {formatBRL(Number(p.base_price))}
                    <span className={`block text-xs ${stock === 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {stock === 0 ? "Sem estoque" : `${stock} em estoque`}
                    </span>
                  </span>
                  <span className={`px-2.5 py-1 text-[0.65rem] ${p.is_active ? "bg-emerald-400/15 text-emerald-300" : "bg-zinc-400/15 text-zinc-300"}`}>
                    {p.is_active ? "Ativo" : "Inativo"}
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
