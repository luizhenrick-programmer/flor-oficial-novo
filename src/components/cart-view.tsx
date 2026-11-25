"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "@/components/icons";
import { syncCart } from "@/app/actions/checkout";
import {
  cartSubtotal,
  removeFromCart,
  replaceCart,
  setQuantity,
  useCart,
} from "@/utils/cart";
import { formatBRL } from "@/utils/format";

const FREE_MIN = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_MIN ?? 299);

export function CartView() {
  const items = useCart();
  const synced = useRef(false);

  // Atualiza preços e estoque com o que está no banco (uma vez ao abrir a sacola).
  useEffect(() => {
    if (synced.current || items.length === 0) return;
    synced.current = true;
    syncCart(items.map(({ variantId, quantity }) => ({ variantId, quantity })))
      .then(replaceCart)
      .catch(() => {});
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-3xl text-primary">Sua sacola está vazia</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Que tal conhecer as peças da coleção?
        </p>
        <Link href="/colecoes" className="btn-primary mt-8">
          Ver coleções
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const remaining = Math.max(0, FREE_MIN - subtotal);
  const progress = Math.min(100, (subtotal / FREE_MIN) * 100);

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <ul className="divide-y divide-border border-y border-border">
        {items.map((item) => (
          <li key={item.variantId} className="flex gap-4 py-6">
            <Link
              href={`/colecoes/${item.slug}`}
              className="relative h-32 w-24 shrink-0 overflow-hidden bg-sand"
            >
              {item.imageUrl && (
                <Image src={item.imageUrl} alt={item.name} fill sizes="96px" className="object-cover" />
              )}
            </Link>

            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/colecoes/${item.slug}`} className="font-display text-xl text-primary">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[item.color, item.size && `Tamanho ${item.size}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remover ${item.name}`}
                  onClick={() => removeFromCart(item.variantId)}
                  className="text-muted-foreground transition hover:text-primary"
                >
                  <X className="h-4 w-4" strokeWidth={1.25} />
                </button>
              </div>

              <div className="mt-auto flex items-end justify-between pt-4">
                <div className="flex items-center border border-border">
                  <button
                    type="button"
                    aria-label="Diminuir quantidade"
                    disabled={item.quantity <= 1}
                    onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                    className="flex h-9 w-9 items-center justify-center disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    disabled={item.quantity >= item.maxStock}
                    onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                    className="flex h-9 w-9 items-center justify-center disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm">{formatBRL(item.price * item.quantity)}</p>
              </div>
              {item.quantity >= item.maxStock && (
                <p className="mt-2 text-xs text-primary">Quantidade máxima disponível</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit border border-border bg-card p-6 lg:sticky lg:top-32">
        <h2 className="eyebrow text-[0.65rem] text-primary">Resumo</h2>

        <div className="mt-6 flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatBRL(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">O frete é calculado no checkout.</p>

        <div className="mt-6">
          <div className="h-1 w-full bg-secondary">
            <div className="h-1 bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {remaining > 0
              ? `Faltam ${formatBRL(remaining)} para o frete grátis`
              : "Você ganhou frete grátis!"}
          </p>
        </div>

        <Link href="/checkout" className="btn-primary mt-8 w-full">
          Finalizar compra
        </Link>
        <Link href="/colecoes" className="eyebrow link-underline mt-5 block pb-1 text-center text-[0.62rem] text-muted-foreground">
          Continuar comprando
        </Link>
      </aside>
    </div>
  );
}