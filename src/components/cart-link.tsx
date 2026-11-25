"use client";

import Link from "next/link";
import { ShoppingBag } from "@/components/icons";
import { cartCount, useCart } from "@/utils/cart";

// Ícone da sacola no header, com a quantidade de peças.
export function CartLink() {
  const count = cartCount(useCart());

  return (
    <Link
      href="/sacola"
      aria-label={count > 0 ? `Sacola, ${count} peças` : "Sacola"}
      className="relative"
    >
      <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.25} />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
