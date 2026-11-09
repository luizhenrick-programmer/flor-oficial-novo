"use client";

import { useState } from "react";
import Image from "next/image";
import { formatBRL, installmentLabel } from "@/utils/format";
import type { ProductDetail } from "@/utils/products";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");

const unique = <T,>(list: T[]) => [...new Set(list)];

const chipBase = "h-10 min-w-10 border px-4 text-sm transition";
const chipOn = "border-primary bg-primary text-primary-foreground";
const chipOff = "border-border hover:border-primary";

export function ProductView({ product }: { product: ProductDetail }) {
  const { images, variants } = product;

  const colors = unique(
    variants.map((v) => v.color).filter((c): c is string => !!c),
  );

  const [color, setColor] = useState<string | null>(
    colors.length === 1 ? colors[0] : null,
  );
  const [size, setSize] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  // Variações da cor escolhida (ou todas, enquanto nenhuma cor foi escolhida)
  const pool = variants.filter((v) => !color || v.color === color);
  const sizes = unique(
    pool.map((v) => v.size).filter((s): s is string => !!s),
  ).map((s) => ({
    size: s,
    available: pool.some((v) => v.size === s && v.stock > 0),
  }));
  const hasSizes = sizes.length > 0;

  // Se o tamanho escolhido não existe na cor nova, ele é descartado
  const chosenSize = sizes.find((s) => s.size === size && s.available)
    ? size
    : null;

  const needsColor = colors.length > 1 && !color;
  const variant =
    needsColor || (hasSizes && !chosenSize)
      ? null
      : (pool.find((v) => !hasSizes || v.size === chosenSize) ?? null);

  const price = variant?.price ?? product.price;
  const compare =
    product.compareAtPrice && product.compareAtPrice > price
      ? product.compareAtPrice
      : null;
  const soldOutAll = variants.length > 0 && variants.every((v) => v.stock <= 0);

  // Fotos: se a cor escolhida tem fotos próprias, elas vêm primeiro
  const colorOf = new Map(variants.map((v) => [v.id, v.color]));
  const linked = color
    ? images.filter((i) => i.variantId && colorOf.get(i.variantId) === color)
    : [];
  const visible =
    linked.length > 0
      ? [...linked, ...images.filter((i) => !i.variantId)]
      : images;
  const current = visible[Math.min(index, visible.length - 1)];

  // Aviso de estoque (sempre baseado no estoque real)
  let note: string | null = null;
  if (soldOutAll) note = "Produto esgotado";
  else if (variant && variant.stock === 1) note = "Última unidade";
  else if (variant && variant.stock <= 3) note = `Últimas ${variant.stock} unidades`;

  // Mensagem pronta para o WhatsApp
  let text: string;
  if (soldOutAll) {
    text = `Olá! A peça ${product.name} está esgotada. Podem me avisar quando chegar?`;
  } else {
    const parts = [`Olá! Tenho interesse na peça ${product.name}`];
    if (color) parts.push(`cor ${color}`);
    if (chosenSize) parts.push(`tamanho ${chosenSize}`);
    text = parts.join(", ") + ".";
  }
  const whatsappHref = WHATSAPP
    ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
    : null;

  return (
    <div className="grid gap-10 md:grid-cols-2 lg:gap-20">
      {/* Galeria */}
      <div>
        <div className="relative aspect-[4/5] overflow-hidden bg-sand shadow-soft">
          {current && (
            <Image
              src={current.url}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          )}
        </div>

        {visible.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-3">
            {visible.map((img, i) => (
              <button
                key={img.url + i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={`relative aspect-[3/4] overflow-hidden border bg-sand ${
                  i === Math.min(index, visible.length - 1)
                    ? "border-primary"
                    : "border-transparent"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="10vw" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="md:pt-2">
        <h1 className="text-4xl leading-tight text-primary lg:text-5xl">
          {product.name}
        </h1>

        <p className="mt-5 text-2xl">
          {compare && (
            <span className="mr-3 text-base text-muted-foreground line-through">
              {formatBRL(compare)}
            </span>
          )}
          <span>{formatBRL(price)}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {installmentLabel(price)} · ou 10% off no PIX
        </p>

        {colors.length > 0 && (
          <div className="mt-8">
            <p className="eyebrow text-[0.62rem] text-primary">
              Cor{color ? `: ${color}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={color === c}
                  onClick={() => {
                    setColor(c);
                    setIndex(0);
                  }}
                  className={`${chipBase} ${color === c ? chipOn : chipOff}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasSizes && (
          <div className="mt-8">
            <p className="eyebrow text-[0.62rem] text-primary">
              Tamanho{chosenSize ? `: ${chosenSize}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map(({ size: s, available }) => (
                <button
                  key={s}
                  type="button"
                  disabled={!available}
                  aria-pressed={chosenSize === s}
                  onClick={() => setSize(s)}
                  className={`${chipBase} ${chosenSize === s ? chipOn : chipOff} disabled:cursor-not-allowed disabled:opacity-50 disabled:line-through disabled:hover:border-border`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {note && <p className="mt-5 text-sm text-primary">{note}</p>}

        {whatsappHref && (
          <div className="mt-8">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full"
            >
              {soldOutAll ? "Avise-me quando chegar" : "Chamar no WhatsApp"}
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Tire dúvidas ou faça seu pedido com a nossa equipe.
            </p>
          </div>
        )}

        {/* TODO: botão "Adicionar à sacola" entra aqui quando a sacola existir (usar variant.id) */}

        {product.description && (
          <div className="mt-10 border-t border-border pt-8">
            <h2 className="eyebrow text-[0.62rem] text-primary">Detalhes</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
        )}

        <ul className="mt-8 space-y-2 border-t border-border pt-6 text-xs text-muted-foreground">
          <li>Frete grátis acima de R$ 299</li>
          <li>Primeira troca grátis</li>
          <li>6x sem juros ou 10% off no PIX</li>
        </ul>
      </div>
    </div>
  );
}
