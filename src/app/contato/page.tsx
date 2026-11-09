import { ContactForm } from "@/components/contact-form";

export const metadata = {
  title: "Contato | Flor Oficial",
  description: "Fale com a Flor Oficial: dúvidas sobre tamanhos, pedidos e trocas.",
};

const wrap = "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10";
const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");

export default function ContatoPage() {
  return (
    <main className="overflow-x-clip">
      <section className={`${wrap} grid gap-14 py-14 md:grid-cols-2 md:gap-12 lg:gap-24 lg:py-20`}>
        <div>
          <p className="eyebrow text-muted-foreground">Fale com a gente</p>
          <h1 className="mt-3 text-4xl text-primary sm:text-5xl">Contato</h1>
          <p className="mt-6 max-w-sm leading-relaxed text-muted-foreground">
            Dúvidas sobre tamanhos, pedidos ou trocas? Escreva para nós e
            respondemos por e-mail.
          </p>

          <ul className="mt-10 space-y-4 text-sm">
            {whatsapp && (
              <li>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline pb-0.5"
                >
                  Conversar no WhatsApp
                </a>
              </li>
            )}
            <li>
              <a
                href="https://instagram.com/floroficial"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline pb-0.5"
              >
                @floroficial no Instagram
              </a>
            </li>
          </ul>
        </div>

        <ContactForm />
      </section>
    </main>
  );
}
