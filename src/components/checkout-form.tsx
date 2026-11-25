"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { placeOrder, quoteShipping, syncCart } from "@/app/actions/checkout";
import { ConsentFields } from "@/components/consent-fields";
import { cartSubtotal, replaceCart, useCart } from "@/utils/cart";
import { formatBRL } from "@/utils/format";
import type { ShippingOption } from "@/utils/shipping";

const input =
  "mt-2 h-12 w-full border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring";
const label = "eyebrow text-[0.62rem] text-primary";

const maskZip = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const cut = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, cut)}-${d.slice(cut)}`;
};

const empty = {
  name: "", email: "", phone: "", zip: "", street: "", number: "",
  complement: "", neighborhood: "", city: "", state: "",
};

type Prefill = Partial<Record<keyof typeof empty, string>>;

export function CheckoutForm({
  user,
  prefill,
}: {
  user: { email: string } | null; // null = ainda não está logado (cria a conta na compra)
  prefill: Prefill | null;
}) {
  const items = useCart();
  const [form, setForm] = useState({ ...empty, ...prefill, email: user?.email ?? "" });
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [shippingId, setShippingId] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const synced = useRef(false);

  const set = (field: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const lines = useMemo(
    () => items.map(({ variantId, quantity }) => ({ variantId, quantity })),
    [items],
  );
  const linesKey = lines.map((l) => `${l.variantId}:${l.quantity}`).join(",");
  const zipDigits = form.zip.replace(/\D/g, "");

  // Atualiza preços e estoque com o banco ao abrir a página.
  useEffect(() => {
    if (synced.current || items.length === 0) return;
    synced.current = true;
    syncCart(lines).then(replaceCart).catch(() => {});
  }, [items, lines]);

  // Preenche o endereço pelo CEP (ViaCEP).
  useEffect(() => {
    if (zipDigits.length !== 8) return;
    let cancelled = false;
    fetch(`https://viacep.com.br/ws/${zipDigits}/json/`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || d.erro) return;
        setForm((f) => ({
          ...f,
          street: d.logradouro || f.street,
          neighborhood: d.bairro || f.neighborhood,
          city: d.localidade || f.city,
          state: d.uf || f.state,
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [zipDigits]);

  // Calcula o frete quando o CEP está completo ou a sacola muda.
  useEffect(() => {
    if (zipDigits.length !== 8 || lines.length === 0) {
      setOptions([]);
      setShippingId(null);
      setQuoteError(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    setQuoteError(null);
    quoteShipping(zipDigits, lines)
      .then((res) => {
        if (cancelled) return;
        if ("error" in res) {
          setOptions([]);
          setShippingId(null);
          setQuoteError(res.error);
        } else {
          setOptions(res.options);
          setShippingId((current) =>
            res.options.some((o) => o.id === current) ? current : null,
          );
        }
      })
      .catch(() => !cancelled && setQuoteError("Não foi possível calcular o frete agora."))
      .finally(() => !cancelled && setQuoting(false));
    return () => {
      cancelled = true;
    };
  }, [zipDigits, linesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-3xl text-primary">Sua sacola está vazia</p>
        <Link href="/colecoes" className="btn-primary mt-8">
          Ver coleções
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const shipping = options.find((o) => o.id === shippingId);
  const total = Math.round((subtotal + (shipping?.price ?? 0)) * 100) / 100;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!shippingId) {
      setError("Escolha uma opção de entrega.");
      return;
    }
    if (!user && !terms) {
      setError("Aceite os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }
    // Abre a aba de pagamento já no clique. Se abrisse só depois da resposta,
    // o navegador bloquearia como pop-up.
    const payTab = window.open("", "_blank");
    if (payTab) payTab.opener = null;

    startTransition(async () => {
      const res = await placeOrder({
        lines,
        customer: { name: form.name, email: form.email, phone: form.phone },
        address: {
          zip: form.zip, street: form.street, number: form.number,
          complement: form.complement, neighborhood: form.neighborhood,
          city: form.city, state: form.state,
        },
        shippingServiceId: shippingId,
        account: user ? undefined : { password, acceptTerms: terms, marketing },
      });
      if ("checkoutUrl" in res) {
        if (!payTab) {
          window.location.assign(res.checkoutUrl); // aba bloqueada: abre na mesma janela
          return;
        }
        payTab.location.href = res.checkoutUrl; // pagamento do Mercado Pago na nova aba
        window.location.assign(`/pedido/${res.orderId}`); // esta aba passa a mostrar o pedido
        return;
      }
      payTab?.close();
      setError(res.error);
      if (res.resync) syncCart(lines).then(replaceCart).catch(() => {});
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
      <div className="space-y-12">
        <fieldset>
          <legend className="font-display text-2xl text-primary">Seus dados</legend>
          {user && (
            <p className="mt-2 text-sm text-muted-foreground">Comprando como {user.email}.</p>
          )}
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={label}>Nome completo</span>
              <input required autoComplete="name" value={form.name} onChange={set("name")} className={input} />
            </label>
            <label>
              <span className={label}>E-mail</span>
              <input required type="email" autoComplete="email" readOnly={!!user} value={form.email} onChange={set("email")} className={`${input} ${user ? "opacity-70" : ""}`} />
            </label>
            <label>
              <span className={label}>Telefone (com DDD)</span>
              <input
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))}
                className={input}
              />
            </label>
          </div>
        </fieldset>

        {!user && (
          <fieldset>
            <legend className="font-display text-2xl text-primary">Sua conta</legend>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie uma senha para acompanhar seus pedidos e manter sua sacola salva. Já tem conta?{" "}
              <Link href="/entrar?next=/checkout" className="link-underline pb-0.5 text-primary">
                Entrar
              </Link>
            </p>
            <label className="mt-6 block">
              <span className={label}>Senha (mínimo de 8 caracteres)</span>
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={input}
              />
            </label>
            <ConsentFields terms={terms} onTerms={setTerms} marketing={marketing} onMarketing={setMarketing} />
            <p className="mt-4 text-xs text-muted-foreground">
              Vamos enviar um e-mail para confirmar o seu cadastro.
            </p>
          </fieldset>
        )}

        <fieldset>
          <legend className="font-display text-2xl text-primary">Entrega</legend>
          <div className="mt-6 grid gap-5 sm:grid-cols-6">
            <label className="sm:col-span-2">
              <span className={label}>CEP</span>
              <input
                required
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                value={form.zip}
                onChange={(e) => setForm((f) => ({ ...f, zip: maskZip(e.target.value) }))}
                className={input}
              />
            </label>
            <label className="sm:col-span-4">
              <span className={label}>Rua</span>
              <input required autoComplete="address-line1" value={form.street} onChange={set("street")} className={input} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Número</span>
              <input required value={form.number} onChange={set("number")} className={input} />
            </label>
            <label className="sm:col-span-4">
              <span className={label}>Complemento (opcional)</span>
              <input value={form.complement} onChange={set("complement")} className={input} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Bairro</span>
              <input required value={form.neighborhood} onChange={set("neighborhood")} className={input} />
            </label>
            <label className="sm:col-span-3">
              <span className={label}>Cidade</span>
              <input required autoComplete="address-level2" value={form.city} onChange={set("city")} className={input} />
            </label>
            <label className="sm:col-span-1">
              <span className={label}>UF</span>
              <input
                required
                maxLength={2}
                autoComplete="address-level1"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))}
                className={input}
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl text-primary">Frete</legend>
          <div className="mt-6 space-y-3">
            {zipDigits.length !== 8 && (
              <p className="text-sm text-muted-foreground">Informe o CEP para ver as opções de entrega.</p>
            )}
            {quoting && <p className="text-sm text-muted-foreground">Calculando frete…</p>}
            {quoteError && <p className="text-sm text-destructive">{quoteError}</p>}
            {!quoting &&
              options.map((o) => (
                <label key={o.id} className="block cursor-pointer">
                  <input
                    type="radio"
                    name="frete"
                    checked={shippingId === o.id}
                    onChange={() => setShippingId(o.id)}
                    className="peer sr-only"
                  />
                  <span className="flex items-center justify-between gap-4 border border-border bg-card px-4 py-4 text-sm transition peer-checked:border-primary peer-focus-visible:ring-1 peer-focus-visible:ring-ring">
                    <span>
                      <span className="text-primary">
                        {[o.company, o.name].filter(Boolean).join(" ")}
                      </span>
                      {o.days !== null && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {o.days} {o.days === 1 ? "dia útil" : "dias úteis"} após a postagem
                        </span>
                      )}
                    </span>
                    <span>{o.free ? "Grátis" : formatBRL(o.price)}</span>
                  </span>
                </label>
              ))}
          </div>
        </fieldset>
      </div>

      <aside className="h-fit border border-border bg-card p-6 lg:sticky lg:top-32">
        <h2 className="eyebrow text-[0.65rem] text-primary">Resumo do pedido</h2>

        <ul className="mt-6 space-y-4 text-sm">
          {items.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-4">
              <span>
                {i.quantity}× {i.name}
                <span className="block text-xs text-muted-foreground">
                  {[i.color, i.size && `Tam. ${i.size}`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span>{formatBRL(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-2 border-t border-border pt-6 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frete</span>
            <span>{shipping ? (shipping.free ? "Grátis" : formatBRL(shipping.price)) : "—"}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-4 text-base">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
        </div>

        {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
        {error?.includes("já tem conta") && (
          <Link href="/entrar?next=/checkout" className="link-underline mt-2 inline-block pb-0.5 text-sm text-primary">
            Entrar na minha conta
          </Link>
        )}

        <button type="submit" disabled={pending} className="btn-primary mt-6 w-full">
          {pending ? "Redirecionando…" : "Ir para o pagamento"}
        </button>
        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          Você paga no ambiente seguro do Mercado Pago, com Pix, cartão ou boleto.
        </p>
      </aside>
    </form>
  );
}