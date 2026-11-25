import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartSync } from "@/components/cart-sync";
import { ShopOnly } from "@/components/shop-only";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Flor Oficial | Moda feminina midsize e plus size",
  description:
    "Linho, tons de terra e caimentos pensados para as curvas reais. Coleção Terra, Verão 2027, do 46 ao 56.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <head>
        {/* O globals.css usa os nomes literais das fontes, então carregamos via Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap"
        />
      </head>
      <body>
        <ShopOnly>
          <SiteHeader />
        </ShopOnly>
        {children}
        <ShopOnly>
          <SiteFooter />
          <CartSync />
        </ShopOnly>
        <Analytics />
      </body>
    </html>
  );
}
