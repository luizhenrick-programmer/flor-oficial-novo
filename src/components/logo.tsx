import Link from "next/link";
import Image from "next/image";
import lotus from "@/assets/lotus.png";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link 
      href="/" 
      className="flex flex-row md:flex-col items-center gap-3 md:gap-0 leading-none group" 
      aria-label="Flor Oficial — início"
    >
      <Image 
        src={lotus} 
        alt="Logo Flor Oficial" 
        width={1024} 
        height={1024} 
        // A tag Image do Next usa className normalmente para estilização do Tailwind
        className={`transition-transform duration-500 group-hover:scale-105 ${small ? "h-12 w-12" : "h-15 w-15 md:h-11 md:w-11"}`} 
      />
      
      <div className="flex flex-col items-start md:items-center mt-0">
        <span className={`font-display tracking-[0.12em] text-primary ${small ? "text-3xl" : "text-xl sm:text-2xl md:text-3xl"}`}>
          FLOR OFICIAL
        </span>
        <span className="mt-1 md:mt-1.5 text-[0.55rem] md:text-[0.58rem] tracking-[0.3em] text-muted-foreground">
          MIDSIZE | PLUS SIZE
        </span>
      </div>
    </Link>
  );
}