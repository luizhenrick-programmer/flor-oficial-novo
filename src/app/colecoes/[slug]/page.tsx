import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/product-view";
import { getProductBySlug } from "@/utils/products";

// Preço e estoque se atualizam sozinhos em até 60 segundos.
export const revalidate = 60;

const wrap = "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Peça não encontrada | Flor Oficial" };

  return {
    title: `${product.name} | Flor Oficial`,
    description: product.description?.slice(0, 160) ?? undefined,
    openGraph: product.images[0]
      ? { images: [product.images[0].url] }
      : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className="overflow-x-clip">
      <section className={`${wrap} py-8 lg:py-12`}>
        <nav
          aria-label="Você está em"
          className="eyebrow mb-8 flex flex-wrap items-center gap-2 text-[0.6rem] text-muted-foreground"
        >
          <Link href="/" className="link-underline pb-0.5">
            Home
          </Link>
          <span>/</span>
          <Link href="/colecoes" className="link-underline pb-0.5">
            Coleções
          </Link>
          <span>/</span>
          <span className="text-primary">{product.name}</span>
        </nav>

        <ProductView product={product} />
      </section>
    </main>
  );
}
