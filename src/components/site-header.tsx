import Link from "next/link";
import { User } from "@/components/icons";
import { CartLink } from "@/components/cart-link";
import { MobileMenu } from "@/components/mobile-menu";
import { SearchButton } from "@/components/search-button";
import { leftNav, rightNav } from "@/utils/nav";
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
            {leftNav.map(([label, href]) => (
                <Link key={label} href={href} className={navLink}>
                  {label}
                </Link>
              ))}
          </nav>
          <MobileMenu className="hidden justify-self-start md:block lg:hidden" />

          <Logo />

          <div className="flex items-center justify-end gap-3 sm:gap-5">
            <nav className="mr-3 hidden gap-8 lg:flex">
              {rightNav.map(([label, href]) => (
                <Link key={label} href={href} className={navLink}>
                  {label}
                </Link>
              ))}
            </nav>
            <SearchButton />
            <Link href="/conta" aria-label="Minha conta" className="hidden sm:block">
              <User className="h-[18px] w-[18px]" strokeWidth={1.25} />
            </Link>
            <CartLink />
            <MobileMenu className="md:hidden" />
          </div>
        </div>
      </header>
    </>
  );
}
