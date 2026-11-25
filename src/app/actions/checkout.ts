"use server";

import type { CartItem } from "@/utils/cart";
import { createCheckoutOrder } from "@/utils/mercadopago";
import { createAccount, getCurrentUser } from "@/utils/auth";
import {
  attachPayment,
  cancelAndRestore,
  cleanLines,
  clearServerCart,
  createStoreOrder,
  priceLines,
  type CartLine,
} from "@/utils/orders";
import { quoteShippingOptions, type ShippingOption } from "@/utils/shipping";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");
const text = (v: unknown, max: number) =>
  String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// Devolve a sacola com preço e estoque atuais (tira o que ficou indisponível).
export async function syncCart(input: CartLine[]): Promise<CartItem[]> {
  const lines = cleanLines(input);
  if (lines.length === 0) return [];

  const priced = await priceLines(lines);
  return priced
    .filter((p) => p.active && p.stock > 0)
    .map((p) => ({
      variantId: p.variantId,
      slug: p.slug,
      name: p.name,
      color: p.color,
      size: p.size,
      price: p.price,
      imageUrl: p.imageUrl,
      quantity: Math.min(p.quantity, p.stock),
      maxStock: p.stock,
    }));
}

export async function quoteShipping(
  zip: string,
  input: CartLine[],
): Promise<{ options: ShippingOption[] } | { error: string }> {
  const lines = cleanLines(input);
  if (lines.length === 0) return { error: "Sua sacola está vazia." };

  try {
    const priced = (await priceLines(lines)).filter((p) => p.active);
    if (priced.length === 0) return { error: "Os itens da sacola não estão mais disponíveis." };

    const subtotal = priced.reduce((s, p) => s + p.price * p.quantity, 0);
    const options = await quoteShippingOptions(
      zip,
      priced.map((p) => ({ unitPrice: p.price, quantity: p.quantity })),
      subtotal,
    );

    if (options.length === 0) {
      return { error: "Nenhuma opção de entrega disponível para este CEP." };
    }
    return { options };
  } catch (err) {
    console.error("[frete]", err);
    return { error: "Não foi possível calcular o frete agora. Tente novamente." };
  }
}

export type PlaceOrderInput = {
  lines: CartLine[];
  customer: { name: string; email: string; phone: string };
  address: {
    zip: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  shippingServiceId: number;
  // Só para quem ainda não está logado: cria a conta junto com o pedido.
  account?: { password: string; acceptTerms: boolean; marketing: boolean };
};

// Valida tudo no servidor, cria a conta (se for a primeira compra), registra o pedido,
// separa o estoque e cria o pagamento no Mercado Pago.
export async function placeOrder(
  input: PlaceOrderInput,
): Promise<{ checkoutUrl: string; orderId: string } | { error: string; resync?: boolean }> {
  const current = await getCurrentUser();

  const name = text(input.customer?.name, 120);
  const email = (current?.email ?? text(input.customer?.email, 254)).toLowerCase();
  const phone = digits(input.customer?.phone);
  const a = input.address ?? ({} as PlaceOrderInput["address"]);
  const address = {
    zip: digits(a.zip),
    street: text(a.street, 150),
    number: text(a.number, 20),
    complement: text(a.complement, 80),
    neighborhood: text(a.neighborhood, 100),
    city: text(a.city, 100),
    state: text(a.state, 2).toUpperCase(),
  };

  if (name.split(" ").length < 2) return { error: "Informe nome e sobrenome." };
  if (!EMAIL.test(email)) return { error: "Informe um e-mail válido." };
  if (phone.length < 10 || phone.length > 11) return { error: "Informe um telefone com DDD." };
  if (address.zip.length !== 8) return { error: "Informe um CEP válido." };
  if (!address.street || !address.number || !address.neighborhood || !address.city) {
    return { error: "Preencha o endereço de entrega completo." };
  }
  if (!/^[A-Z]{2}$/.test(address.state)) return { error: "Informe o estado (UF)." };

  if (!current) {
    const acc = input.account;
    if (!acc) return { error: "Entre ou crie sua conta para finalizar a compra." };
    if (!acc.acceptTerms) {
      return { error: "Aceite os Termos de Uso e a Política de Privacidade para continuar." };
    }
    if (String(acc.password ?? "").length < 8) {
      return { error: "A senha precisa ter pelo menos 8 caracteres." };
    }
  }

  const lines = cleanLines(input.lines);
  if (lines.length === 0) return { error: "Sua sacola está vazia." };

  try {
    // 1) Preço e estoque reais
    const priced = await priceLines(lines);
    const unavailable =
      priced.length !== lines.length || priced.some((p) => !p.active || p.quantity > p.stock);
    if (unavailable) {
      return { error: "Alguns itens mudaram de preço ou ficaram sem estoque. Revise sua sacola.", resync: true };
    }
    const subtotal = priced.reduce((s, p) => s + p.price * p.quantity, 0);

    // 2) Frete recalculado no servidor
    const options = await quoteShippingOptions(
      address.zip,
      priced.map((p) => ({ unitPrice: p.price, quantity: p.quantity })),
      subtotal,
    );
    const shipping = options.find((o) => o.id === input.shippingServiceId);
    if (!shipping) return { error: "Essa opção de entrega não está mais disponível. Escolha novamente." };

    // 3) Conta: usa a de quem está logado ou cria a da primeira compra
    let userId: string;
    if (current) {
      userId = current.id;
    } else {
      const created = await createAccount({
        name,
        email,
        phone,
        password: input.account!.password,
        marketing: input.account!.marketing,
      });
      if ("error" in created) return { error: created.error };
      userId = created.userId;
    }

    // 4) Pedido pendente + baixa de estoque
    const fullAddress = {
      ...address,
      customer: { name, email, phone },
      shipping: {
        service_id: shipping.id,
        service: shipping.name,
        company: shipping.company,
        days: shipping.days,
        price: shipping.price,
      },
    };
    const created = await createStoreOrder({
      userId,
      lines: priced,
      shippingCost: shipping.price,
      address: fullAddress,
    });
    if ("error" in created) return { error: created.error, resync: true };

    await clearServerCart(userId);

    // 5) Pagamento no Mercado Pago
    try {
      const parts = name.split(" ");
      const payment = await createCheckoutOrder({
        orderId: created.id,
        email,
        firstName: parts[0],
        lastName: parts.slice(1).join(" "),
        phone: { areaCode: phone.slice(0, 2), number: phone.slice(2) },
        siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
        items: [
          ...priced.map((p) => ({
            title: [p.name, p.color, p.size ? `Tam. ${p.size}` : null].filter(Boolean).join(" - "),
            unitPrice: p.price,
            quantity: p.quantity,
          })),
          ...(shipping.price > 0
            ? [{ title: `Frete ${shipping.company} ${shipping.name}`.trim(), unitPrice: shipping.price, quantity: 1 }]
            : []),
        ],
      });

      await attachPayment(created.id, fullAddress, {
        mp_order_id: payment.id,
        checkout_url: payment.checkoutUrl,
      });
      return { checkoutUrl: payment.checkoutUrl, orderId: created.id };
    } catch (err) {
      console.error("[checkout] Mercado Pago:", err);
      await cancelAndRestore(created.id); // devolve o estoque
      return { error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." };
    }
  } catch (err) {
    console.error("[checkout]", err);
    return { error: "Não foi possível finalizar agora. Tente novamente em instantes." };
  }
}
