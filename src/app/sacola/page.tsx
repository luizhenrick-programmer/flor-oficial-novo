import { CartView } from "@/components/cart-view";

export const metadata = { title: "Sacola | Flor Oficial", robots: { index: false } };

const wrap = "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10";

export default function SacolaPage() {
  return (
    <main className="overflow-x-clip">
      <section className={`${wrap} py-12 lg:py-16`}>
        <h1 className="mb-10 text-4xl text-primary sm:text-5xl">Sacola</h1>
        <CartView />
      </section>
    </main>
  );
}
