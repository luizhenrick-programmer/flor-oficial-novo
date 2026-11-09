import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Lock,
  RefreshCw,
  Truck,
} from "@/components/icons";
import { Newsletter } from "@/components/newsletter";
import { getHomeProducts } from "@/utils/products";
import { ProductCard } from "@/components/product-card";
import lotus from "@/assets/lotus.png";
import hero from "@/assets/hero.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";

// A home é regenerada no máximo a cada 60 segundos, então produto novo,
// preço e estoque aparecem sem precisar de novo deploy.
export const revalidate = 60;

const wrap = "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10";

const perks = [
  { icon: Truck, title: "Frete grátis", text: "Acima de R$ 299" },
  { icon: RefreshCw, title: "Troca fácil", text: "Primeira troca grátis" },
  { icon: CreditCard, title: "6x sem juros", text: "ou 10% off no PIX" },
  { icon: Lock, title: "Compra segura", text: "Site 100% protegido" },
];

const categories = [
  { name: "Vestidos", img: p4 },
  { name: "Conjuntos", img: p5 },
  { name: "Alfaiataria", img: p2 },
  { name: "Tricô", img: p3 },
];

const navLink = "eyebrow link-underline pb-1 text-[0.65rem] ";

export default async function Home() {
  const products = await getHomeProducts(6);

  return (
    <>
      

      <main className="overflow-x-clip">
        {/* Hero */}
        <section
          id="colecao"
          className={`${wrap} grid items-center gap-12 py-10 md:grid-cols-2 md:gap-10 md:py-16 lg:gap-20 lg:py-20`}
        >
          <div className="mx-auto w-full max-w-md animate-rise md:max-w-none">
            <p className="eyebrow text-muted-foreground">
              Coleção Terra · Verão 2027
            </p>
            <h1 className="mt-6 text-6xl leading-[0.95] text-primary lg:text-7xl xl:text-8xl">
              Flor
              <br />
              Oficial
            </h1>
            <p className="eyebrow mt-6 text-[0.65rem] text-muted-foreground">
              Midsize | Plus Size
            </p>
            <p className="mt-6 max-w-sm leading-relaxed text-muted-foreground">
              Linho, tons de terra e caimentos pensados para as curvas reais.
              Peças que florescem em você.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/colecoes" className="btn-blush">
                Comprar agora <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#categorias" className="btn-outline">
                Vestidos
              </Link>
            </div>
          </div>

          <div
            className="relative mx-auto w-full max-w-md animate-rise md:max-w-none"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="absolute -bottom-3 -right-3 h-full w-full bg-blush/40 sm:-bottom-5 sm:-right-5" />
            <div className="relative aspect-[4/5] overflow-hidden shadow-soft">
              <Image
                src={hero}
                alt="Vestido Maxi Areia em linho, coleção Terra"
                fill
                priority
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
              <span className="eyebrow absolute bottom-4 left-4 bg-card px-3 py-2 text-[0.58rem]">
                Vestido Maxi Areia
              </span>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="border-y border-border bg-secondary">
          <div className={`${wrap} grid grid-cols-2 gap-y-8 py-10 md:grid-cols-4`}>
            {perks.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex flex-col items-center text-center">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.25} />
                <p className="eyebrow mt-3 text-[0.65rem] text-primary">
                  {title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Categorias */}
        <section id="categorias" className={`${wrap} py-20 lg:py-28`}>
          <div className="text-center">
            <p className="eyebrow text-muted-foreground">Explore</p>
            <h2 className="mt-3 text-3xl text-primary sm:text-4xl">Compre por categoria</h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {categories.map((c) => (
              <Link
                key={c.name}
                href="/colecoes"
                className="group relative aspect-[3/4] overflow-hidden bg-sand"
              >
                <Image
                  src={c.img}
                  alt={c.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5">
                  <h3 className="text-2xl text-white lg:text-3xl">{c.name}</h3>
                  <span className="eyebrow mt-1 inline-flex items-center gap-2 text-[0.58rem] text-white/80">
                    Ver tudo <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Mais desejados (dados do Supabase) */}
        <section id="favoritos" className="bg-card py-20 lg:py-28">
          <div className={wrap}>
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow text-muted-foreground">Os favoritos</p>
                <h2 className="mt-3 text-3xl text-primary sm:text-4xl">Mais desejados</h2>
              </div>
              <Link href="/colecoes" className={navLink}>
                Ver todos
              </Link>
            </div>

            {products.length === 0 ? (
              <p className="mt-12 text-center text-sm text-muted-foreground">
                Novas peças chegando em breve.
              </p>
            ) : (
              <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 md:grid-cols-3 lg:gap-x-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Marca */}
        <section className="py-20 lg:py-28">
          <div className={`${wrap} grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-24`}>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden md:mx-0">
              <Image
                src={p3}
                alt="Conjunto de tricô ferrugem"
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
            <div>
              <Image src={lotus} alt="" className="h-10 w-10" />
              <h2 className="mt-6 text-3xl leading-tight text-primary sm:text-4xl lg:text-5xl">
                <em>Toda mulher</em> é uma flor em seu próprio tempo.
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
                A Flor Oficial nasceu para vestir corpos reais com o mesmo
                cuidado das grandes maisons. Modelagens testadas do 46 ao 56,
                tecidos naturais e uma paleta que conversa com a pele
                brasileira.
              </p>
              <Link href="/colecoes" className="btn-primary mt-10">
                Conheça a coleção
              </Link>
            </div>
          </div>
        </section>

        <Newsletter />
      </main>

      
    </>
  );
}