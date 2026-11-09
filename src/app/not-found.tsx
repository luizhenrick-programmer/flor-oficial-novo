import Image from "next/image";
import Link from "next/link";
import lotus from "@/assets/lotus.png";

export const metadata = { title: "Página não encontrada | Flor Oficial" };

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center">
      <Image src={lotus} alt="" className="h-12 w-12" />
      <p className="eyebrow mt-6 text-muted-foreground">Erro 404</p>
      <h1 className="mt-3 text-4xl text-primary sm:text-5xl">
        Página não encontrada
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        O endereço pode ter mudado ou a peça não está mais disponível. Que tal
        conhecer a coleção?
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-outline">
          Voltar para a home
        </Link>
        <Link href="/colecoes" className="btn-primary">
          Ver coleções
        </Link>
      </div>
    </main>
  );
}