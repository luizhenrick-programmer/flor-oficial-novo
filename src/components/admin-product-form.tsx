"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "@/components/icons";
import { deleteProduct, saveProduct } from "@/app/actions/admin-products";
import { ui } from "@/components/admin-ui";
import { slugify, type ProductInput } from "@/utils/admin-shared";

type Row = { id?: string; color: string; size: string; sku: string; stock: string; priceOverride: string };

const blankRow: Row = { color: "", size: "", sku: "", stock: "0", priceOverride: "" };
const num = (v: string) => Number(v.replace(",", "."));

export function ProductForm({ initial }: { initial: ProductInput | null }) {
  const router = useRouter();
  const isNew = !initial?.id;
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [comparePrice, setComparePrice] = useState(
    initial?.comparePrice != null ? String(initial.comparePrice) : "",
  );
  const [active, setActive] = useState(initial?.active ?? false);
  const [rows, setRows] = useState<Row[]>(
    initial?.variants.length
      ? initial.variants.map((v) => ({
          id: v.id,
          color: v.color,
          size: v.size,
          sku: v.sku,
          stock: String(v.stock),
          priceOverride: v.priceOverride != null ? String(v.priceOverride) : "",
        }))
      : [{ ...blankRow }],
  );
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  function onName(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v)); // o endereço acompanha o nome até você editar à mão
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const res = await saveProduct({
        id: initial?.id,
        name,
        slug,
        description,
        price: num(price),
        comparePrice: comparePrice.trim() ? num(comparePrice) : null,
        active,
        variants: rows.map((r) => ({
          id: r.id,
          color: r.color,
          size: r.size,
          sku: r.sku,
          stock: Number(r.stock || 0),
          priceOverride: r.priceOverride.trim() ? num(r.priceOverride) : null,
        })),
      });

      if ("error" in res) {
        setMessage({ ok: false, text: res.error });
        return;
      }
      if (isNew) {
        router.push(`/admin/produtos/${res.id}`); // abre a edição, onde dá para enviar as fotos
        return;
      }
      setMessage({ ok: true, text: "Produto salvo." });
      router.refresh();
    });
  }

  function onDelete() {
    if (!initial?.id) return;
    if (!window.confirm("Excluir este produto, as variações e as fotos? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const res = await deleteProduct(initial.id!);
      if ("error" in res) setMessage({ ok: false, text: res.error });
      else router.push("/admin/produtos");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <section className={`${ui.card} p-6`}>
        <h2 className="font-display text-2xl">Informações</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={ui.label}>Nome</span>
            <input required value={name} onChange={(e) => onName(e.target.value)} className={ui.input} />
          </label>
          <label className="sm:col-span-2">
            <span className={ui.label}>Endereço na loja (slug)</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className={ui.input}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              /colecoes/{slugify(slug || name) || "nome-do-produto"} — evite mudar depois de publicado.
            </span>
          </label>
          <label className="sm:col-span-2">
            <span className={ui.label}>Descrição</span>
            <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className={ui.textarea} />
          </label>
          <label>
            <span className={ui.label}>Preço (R$)</span>
            <input required inputMode="decimal" placeholder="349,90" value={price} onChange={(e) => setPrice(e.target.value)} className={ui.input} />
          </label>
          <label>
            <span className={ui.label}>Preço “de” (R$) — opcional</span>
            <input inputMode="decimal" placeholder="429,90" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} className={ui.input} />
            <span className="mt-1 block text-xs text-muted-foreground">
              Aparece riscado. Use só para promoções reais.
            </span>
          </label>
        </div>

        <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
          <span>
            Produto ativo <span className="text-muted-foreground">(visível na loja)</span>
          </span>
        </label>
      </section>

      <section className={`${ui.card} p-6`}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl">Variações e estoque</h2>
          <button type="button" onClick={() => setRows((r) => [...r, { ...blankRow }])} className={ui.btnOutline}>
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Uma linha para cada combinação de cor e tamanho. Preço específico é opcional (deixe vazio para usar o preço do produto).
        </p>

        <div className="mt-6 space-y-4">
          {rows.map((r, i) => (
            <div key={r.id ?? `novo-${i}`} className="grid grid-cols-2 gap-3 border border-border p-4 sm:grid-cols-[1fr_6rem_1fr_6rem_8rem_auto] sm:items-end sm:border-0 sm:p-0">
              <label>
                <span className={ui.label}>Cor</span>
                <input value={r.color} onChange={(e) => setRow(i, { color: e.target.value })} className={ui.input} />
              </label>
              <label>
                <span className={ui.label}>Tamanho</span>
                <input value={r.size} onChange={(e) => setRow(i, { size: e.target.value })} className={ui.input} />
              </label>
              <label>
                <span className={ui.label}>SKU</span>
                <input value={r.sku} onChange={(e) => setRow(i, { sku: e.target.value })} className={ui.input} />
              </label>
              <label>
                <span className={ui.label}>Estoque</span>
                <input type="number" min={0} value={r.stock} onChange={(e) => setRow(i, { stock: e.target.value })} className={ui.input} />
              </label>
              <label>
                <span className={ui.label}>Preço específico</span>
                <input inputMode="decimal" value={r.priceOverride} onChange={(e) => setRow(i, { priceOverride: e.target.value })} className={ui.input} />
              </label>
              <button
                type="button"
                aria-label="Remover variação"
                onClick={() => setRows((all) => all.filter((_, idx) => idx !== i))}
                className="col-span-2 flex h-11 items-center justify-center text-muted-foreground transition hover:text-destructive sm:col-span-1"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={ui.btn}>
          {pending ? "Salvando…" : isNew ? "Criar produto" : "Salvar alterações"}
        </button>
        {!isNew && (
          <button type="button" onClick={onDelete} disabled={pending} className={ui.btnDanger}>
            Excluir produto
          </button>
        )}
        {message && (
          <p role="status" className={`text-sm ${message.ok ? "text-emerald-300" : "text-destructive"}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
