import Image from "next/image";
import Link from "next/link";
import { formatBRL, installmentLabel } from "@/utils/format";
import type { ProductCard as Product } from "@/utils/products";

export function ProductCard({ product: p }: { product: Product }) {
  return (
    <Link href={`/colecoes/${p.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        {p.imageUrl && (
          <Image
            src={p.imageUrl}
            alt={p.name}
            fill
            sizes="(min-width: 768px) 33vw, 50vw"
            className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
              p.badge === "Esgotado" ? "opacity-70" : ""
            }`}
          />
        )}
        {p.badge && (
          <span className="eyebrow absolute left-3 top-3 bg-card px-2.5 py-1.5 text-[0.55rem]">
            {p.badge}
          </span>
        )}
      </div>
      <div className="mt-5 text-center">
        {p.category && (
          <p className="eyebrow text-[0.58rem] text-muted-foreground">
            {p.category}
          </p>
        )}
        <h3 className="mt-2 text-lg leading-snug text-primary sm:text-xl">
          {p.name}
        </h3>
        <p className="mt-2 text-sm">
          {p.compareAtPrice && (
            <span className="mr-2 text-muted-foreground line-through">
              {formatBRL(p.compareAtPrice)}
            </span>
          )}
          <span>{formatBRL(p.price)}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {installmentLabel(p.price)}
        </p>
      </div>
    </Link>
  );
}