import Image from "next/image";
import Link from "next/link";
import p3 from "@/assets/p3.jpg";

export const metadata = {
  title: "Sobre | Flor Oficial",
  description:
    "A Flor Oficial nasceu para vestir corpos reais, com modelagens do 46 ao 56 e tecidos naturais.",
};

const wrap = "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10";

// Textos de apoio: ajuste para a voz da marca.
const values = [
  {
    title: "Corpos reais",
    text: "Modelagens testadas do 46 ao 56, pensadas para vestir bem em cada curva.",
  },
  {
    title: "Tecidos naturais",
    text: "Linho e fibras naturais, escolhidos pelo toque e pelo caimento.",
  },
  {
    title: "Pele brasileira",
    text: "Uma paleta de tons de terra que conversa com a pele brasileira.",
  },
];

export default function SobrePage() {
  return (
    <main className="overflow-x-clip">
      <section className={`${wrap} grid items-center gap-12 py-14 md:grid-cols-2 md:gap-12 lg:gap-24 lg:py-20`}>
        <div>
          <p className="eyebrow text-muted-foreground">Sobre a Flor Oficial</p>
          <h1 className="mt-6 text-4xl leading-tight text-primary sm:text-5xl lg:text-6xl">
            <em>Toda mulher</em> é uma flor em seu próprio tempo.
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
            A Flor Oficial nasceu para vestir corpos reais com o mesmo cuidado
            das grandes maisons. Modelagens testadas do 46 ao 56, tecidos
            naturais e uma paleta que conversa com a pele brasileira.
          </p>
          <Link href="/colecoes" className="btn-primary mt-10">
            Conheça a coleção
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-md md:max-w-none">
          <div className="absolute -bottom-3 -right-3 h-full w-full bg-blush/40 sm:-bottom-5 sm:-right-5" />
          <div className="relative aspect-[4/5] overflow-hidden shadow-soft">
            <Image
              src={p3}
              alt="Conjunto de tricô ferrugem"
              fill
              priority
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card py-16 lg:py-24">
        <div className={`${wrap} grid gap-10 md:grid-cols-3 md:gap-12`}>
          {values.map((v, i) => (
            <div key={v.title} className="border-t border-primary pt-6">
              <p className="eyebrow text-[0.62rem] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-2xl text-primary">{v.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {v.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-16 text-center lg:py-20">
        <div className={wrap}>
          <h2 className="text-3xl text-primary sm:text-4xl">
            Peças que florescem em você.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/colecoes" className="btn-primary">
              Ver coleções
            </Link>
            <Link href="/contato" className="btn-outline">
              Falar com a gente
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
