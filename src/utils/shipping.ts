// Cálculo de frete pelo Melhor Envio (somente servidor).
// Doc: POST /api/v2/me/shipment/calculate

const env = process.env;

const BASE =
  env.MELHORENVIO_ENV === "production"
    ? "https://melhorenvio.com.br"
    : "https://sandbox.melhorenvio.com.br";

// Frete grátis a partir deste valor (o mesmo anunciado no site). Vale para a opção mais barata.
export const FREE_SHIPPING_MIN = Number(env.NEXT_PUBLIC_FREE_SHIPPING_MIN ?? 299);

export type ShippingOption = {
  id: number;
  name: string; // ex.: PAC, SEDEX
  company: string; // ex.: Correios
  price: number;
  days: number | null; // prazo em dias úteis, depois da postagem
  free: boolean;
};

type Line = { unitPrice: number; quantity: number };

type ApiService = {
  id: number;
  name: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  company?: { name?: string };
  error?: string;
};

const positive = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export async function quoteShippingOptions(
  zip: string,
  lines: Line[],
  subtotal: number,
): Promise<ShippingOption[]> {
  const token = env.MELHORENVIO_TOKEN;
  const origin = (env.SHIPPING_ORIGIN_ZIP ?? "").replace(/\D/g, "");
  const destination = zip.replace(/\D/g, "");

  if (!token || origin.length !== 8) {
    throw new Error("Frete não configurado (MELHORENVIO_TOKEN / SHIPPING_ORIGIN_ZIP)");
  }
  if (destination.length !== 8) throw new Error("CEP inválido");

  // Tamanho padrão de cada peça embalada (a tabela de produtos ainda não tem peso/medidas).
  const weight = positive(env.SHIPPING_DEFAULT_WEIGHT_KG, 0.6);
  const height = positive(env.SHIPPING_DEFAULT_HEIGHT_CM, 8);
  const width = positive(env.SHIPPING_DEFAULT_WIDTH_CM, 25);
  const length = positive(env.SHIPPING_DEFAULT_LENGTH_CM, 35);

  const res = await fetch(`${BASE}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      // A API exige o nome da aplicação e um e-mail técnico de contato.
      "User-Agent": `Flor Oficial (${env.MELHORENVIO_CONTACT_EMAIL ?? "contato@example.com"})`,
    },
    body: JSON.stringify({
      from: { postal_code: origin },
      to: { postal_code: destination },
      products: lines.map((l, i) => ({
        id: String(i + 1),
        width,
        height,
        length,
        weight,
        insurance_value: l.unitPrice,
        quantity: l.quantity,
      })),
      ...(env.MELHORENVIO_SERVICES ? { services: env.MELHORENVIO_SERVICES } : {}),
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Melhor Envio respondeu ${res.status}`);

  const data = (await res.json()) as ApiService[];
  if (!Array.isArray(data)) throw new Error("Resposta inesperada do Melhor Envio");

  const options: ShippingOption[] = data
    .filter((s) => !s.error)
    .map((s) => ({
      id: s.id,
      name: s.name,
      company: s.company?.name ?? "",
      price: Number(s.custom_price ?? s.price),
      days: s.custom_delivery_time ?? s.delivery_time ?? null,
      free: false,
    }))
    .filter((o) => Number.isFinite(o.price) && o.price >= 0)
    .sort((a, b) => a.price - b.price);

  // Frete grátis: a opção mais barata sai de graça acima do valor mínimo.
  if (options.length > 0 && subtotal >= FREE_SHIPPING_MIN) {
    options[0] = { ...options[0], price: 0, free: true };
  }

  return options;
}