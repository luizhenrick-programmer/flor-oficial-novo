import Link from "next/link";
import { PageHeader } from "@/components/admin-ui";
import { ProductForm } from "@/components/admin-product-form";

export default function NovoProduto() {
  return (
    <>
      <PageHeader eyebrow="Catálogo" title="Novo produto">
        <Link href="/admin/produtos" className="text-sm text-muted-foreground transition hover:text-foreground">
          Voltar
        </Link>
      </PageHeader>
      <p className="mb-8 text-sm text-muted-foreground">
        Preencha os dados e as variações. As fotos você envia logo depois de criar o produto.
      </p>
      <ProductForm initial={null} />
    </>
  );
}
