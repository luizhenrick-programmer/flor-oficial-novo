import { NextResponse } from "next/server";
import { getCheckoutOrder, verifyWebhookSignature } from "@/utils/mercadopago";
import { syncPayment } from "@/utils/orders";

// URL a cadastrar no painel do Mercado Pago (Webhooks, evento "Order (Mercado Pago)"):
//   https://SEU-DOMINIO/api/mercadopago/webhook
export async function POST(req: Request) {
  const dataId = new URL(req.url).searchParams.get("data.id");

  const valid = verifyWebhookSignature({
    signature: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId,
  });
  if (!valid) return new NextResponse("assinatura inválida", { status: 401 });

  const body = (await req.json().catch(() => null)) as { type?: string } | null;
  if (body?.type !== "order" || !dataId) return NextResponse.json({ ok: true });

  try {
    // Confirma direto na API do Mercado Pago, sem confiar só no corpo da notificação.
    const mp = await getCheckoutOrder(dataId);
    if (mp.external_reference) await syncPayment(mp.external_reference, mp);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook]", err);
    return new NextResponse("erro", { status: 500 }); // o Mercado Pago tenta de novo
  }
}
