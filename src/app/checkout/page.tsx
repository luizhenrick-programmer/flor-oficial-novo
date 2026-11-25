import { CheckoutForm } from "@/components/checkout-form";
import { getCurrentUser } from "@/utils/auth";
import { getCheckoutPrefill } from "@/utils/orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finalizar compra | Flor Oficial", robots: { index: false } };

const wrap = "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10";

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const cut = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, cut)}-${d.slice(cut)}`;
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  // Quem já comprou antes volta com nome, telefone e endereço preenchidos.
  let prefill = null;
  if (user) {
    const last = await getCheckoutPrefill(user.id);
    const meta = user.user_metadata ?? {};
    prefill = {
      ...last,
      name: last?.name || String(meta.name ?? ""),
      phone: maskPhone(last?.phone || String(meta.phone ?? "")),
    };
  }

  return (
    <main className="overflow-x-clip">
      <section className={`${wrap} py-12 lg:py-16`}>
        <h1 className="mb-10 text-4xl text-primary sm:text-5xl">Finalizar compra</h1>
        <CheckoutForm user={user ? { email: user.email ?? "" } : null} prefill={prefill} />
      </section>
    </main>
  );
}