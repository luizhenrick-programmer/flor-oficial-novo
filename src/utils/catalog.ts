export const ORDERS = {
  novidades: "Novidades",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
} as const;

export type Order = keyof typeof ORDERS;

export type CatalogFilters = {
  busca?: string;
  tamanhos: string[];
  cores: string[];
  min?: number;
  max?: number;
  ordem: Order;
  pagina: number;
};

type Params = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const one = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const money = (v: string | undefined) => {
  if (!v) return undefined;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

// Lê os filtros da URL (?busca=...&tamanho=46&cor=Terra&ordem=menor-preco&pagina=2).
export function parseFilters(sp: Params): CatalogFilters {
  const ordem = one(sp.ordem) as Order;
  return {
    busca: one(sp.busca)?.trim().slice(0, 60) || undefined,
    tamanhos: list(sp.tamanho),
    cores: list(sp.cor),
    min: money(one(sp.min)),
    max: money(one(sp.max)),
    ordem: ordem in ORDERS ? ordem : "novidades",
    pagina: Math.max(1, parseInt(one(sp.pagina) ?? "", 10) || 1),
  };
}

// Monta o link do catálogo mantendo os filtros atuais e trocando só o que mudou.
export function buildHref(f: CatalogFilters, patch: Partial<CatalogFilters> = {}) {
  const n = { ...f, ...patch };
  const q = new URLSearchParams();
  if (n.busca) q.set("busca", n.busca);
  n.tamanhos.forEach((t) => q.append("tamanho", t));
  n.cores.forEach((c) => q.append("cor", c));
  if (n.min !== undefined) q.set("min", String(n.min));
  if (n.max !== undefined) q.set("max", String(n.max));
  if (n.ordem !== "novidades") q.set("ordem", n.ordem);
  if (n.pagina > 1) q.set("pagina", String(n.pagina));
  const s = q.toString();
  return s ? `/colecoes?${s}` : "/colecoes";
}
