import Link from "next/link";
import { Menu, Search, ShoppingBag, User } from "@/components/icons";
import { Logo } from "@/components/logo";

const wrap = "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10";
const navLink = "eyebrow link-underline pb-1 text-[0.65rem] ";

const marquee = [
  "Primeira troca grátis",
  "Até 6x sem juros",
  "Do 46 ao 56",
  "Nova coleção Terra",
  "Frete grátis acima de R$ 299,00",
  "10% off no PIX",
];

export function SiteHeader() {
  return (
    <>
      {/* Barra de avisos */}
      <div className="overflow-hidden bg-primary py-2.5 text-primary-foreground">
        <div className="flex w-max animate-marquee whitespace-nowrap">
          {Array.from({ length: 4 })
            .flatMap(() => marquee)
            .map((text, i) => (
              <span key={i} className="eyebrow mx-8 text-[0.6rem]">
                {text}
              </span>
            ))}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div
          className={`${wrap} flex items-center justify-between py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:py-4`}
        >
          <nav className="hidden gap-8 lg:flex">
            {[["Home", "/"], ["Coleções", "/colecoes"]].map(([label, href]) => (
                <Link key={label} href={href} className={navLink}>
                  {label}
                </Link>
              ))}
          </nav>
          <button
            aria-label="Abrir menu"
            className="hidden justify-self-start md:block lg:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={1.25} />
          </button>

          <Logo />

          <div className="flex items-center justify-end gap-3 sm:gap-5">
            <nav className="mr-3 hidden gap-8 lg:flex">
              {[["Sobre", "/sobre"], ["Contato", "/contato"]].map(([label, href]) => (
                <Link key={label} href={href} className={navLink}>
                  {label}
                </Link>
              ))}
            </nav>
            <button className="cursor-pointer" aria-label="Buscar">
              <Search className="h-[18px] w-[18px]" strokeWidth={1.25} />
            </button>
            <button className="hidden sm:block cursor-pointer" aria-label="Minha conta">
              <User className="h-[18px] w-[18px]" strokeWidth={1.25} />
            </button>
            <button className="cursor-pointer" aria-label="Sacola">
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.25} />
            </button>
            <button className="md:hidden cursor-pointer" aria-label="Abrir menu">
              <Menu className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
