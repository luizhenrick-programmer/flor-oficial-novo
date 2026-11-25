// Mercado Pago, Checkout Pro via Orders API (somente servidor).
// Doc: POST /v1/orders  |  GET /v1/orders/{id}  |  webhook "Order (Mercado Pago)"
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const API = "https://api.mercadopago.com";

const money = (n: number) => n.toFixed(2);

export type MpOrder = {
  id: string;
  status: string; // created | processed | action_required | canceled | refunded | failed | expired
  external_reference?: string;
  total_amount?: string;
  total_paid_amount?: string;
};

type CreateInput = {
  orderId: string; // nosso pedido; vai como external_reference
  email: string;
  firstName: string;
  lastName: string;
  phone?: { areaCode: string; number: string };
  items: { title: string; unitPrice: number; quantity: number }[];
  siteUrl: string;
};

function accessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN ausente");
  return token;
}

// Cria a Order do Checkout Pro e devolve a URL para onde a cliente é enviada.
export async function createCheckoutOrder(input: CreateInput) {
  const maxInstallments = Number(process.env.MERCADOPAGO_MAX_INSTALLMENTS ?? 6);
  // true = a LOJA paga os juros do parcelamento ("sem juros" para a cliente).
  const interestFree = process.env.MERCADOPAGO_INTEREST_FREE === "true";
  const https = input.siteUrl.startsWith("https://");
  const returnUrl = `${input.siteUrl}/pedido/${input.orderId}`;

  const cents = input.items.reduce(
    (sum, i) => sum + Math.round(i.unitPrice * 100) * i.quantity,
    0,
  );

  const body = {
    type: "online",
    processing_mode: "manual",
    total_amount: money(cents / 100),
    external_reference: input.orderId,
    expiration_time: process.env.MERCADOPAGO_ORDER_EXPIRATION ?? "P3D",
    payer: {
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      ...(input.phone
        ? { phone: { area_code: input.phone.areaCode, number: input.phone.number } }
        : {}),
    },
    items: input.items.map((i) => ({
      title: i.title.slice(0, 150),
      unit_price: money(i.unitPrice),
      quantity: i.quantity,
    })),
    config: {
      // As URLs de retorno só funcionam com https (em produção ou com um túnel como o ngrok).
      ...(https
        ? {
            online: {
              success_url: returnUrl,
              failure_url: returnUrl,
              pending_url: returnUrl,
              auto_return: "approved",
            },
          }
        : {}),
      payment_method: {
        max_installments: maxInstallments,
        ...(interestFree
          ? {
              installments: {
                interest_free: { type: "range", values: [1, maxInstallments] },
              },
            }
          : {}),
      },
    },
  };

  const res = await fetch(`${API}/v1/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Mercado Pago ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { id: string; checkout_url: string };
  return { id: data.id, checkoutUrl: data.checkout_url };
}

export async function getCheckoutOrder(id: string): Promise<MpOrder> {
  const res = await fetch(`${API}/v1/orders/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}`);
  return (await res.json()) as MpOrder;
}

// Confere se a notificação veio mesmo do Mercado Pago (cabeçalho x-signature, HMAC SHA-256).
export function verifyWebhookSignature(args: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const { signature, requestId, dataId } = args;
  if (!secret || !signature || !dataId) return false;

  let ts = "";
  let v1 = "";
  for (const part of signature.split(",")) {
    const [key, value] = part.split("=").map((s) => s.trim());
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return false;

  // O id alfanumérico é validado em minúsculas; aceitamos também o valor original.
  return [dataId.toLowerCase(), dataId].some((id) => {
    const manifest = `id:${id};${requestId ? `request-id:${requestId};` : ""}ts:${ts};`;
    const expected = createHmac("sha256", secret).update(manifest).digest("hex");
    return (
      expected.length === v1.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
    );
  });
}