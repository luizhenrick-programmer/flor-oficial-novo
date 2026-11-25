// Peças visuais compartilhadas do painel (classes e componentes simples, sem estado).
import type { ReactNode } from "react";

export const ui = {
  label: "eyebrow block text-[0.6rem] text-muted-foreground",
  input:
    "mt-2 h-11 w-full border border-border bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring",
  textarea:
    "mt-2 w-full border border-border bg-card px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring",
  btn: "inline-flex h-10 items-center justify-center gap-2 bg-primary px-5 text-[0.68rem] uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
  btnOutline:
    "inline-flex h-10 items-center justify-center gap-2 border border-border px-5 text-[0.68rem] uppercase tracking-[0.2em] text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50",
  btnDanger:
    "inline-flex h-10 items-center justify-center gap-2 border border-destructive/50 px-5 text-[0.68rem] uppercase tracking-[0.2em] text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50",
  card: "border border-border bg-card",
} as const;

export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Aguardando pagamento", tone: "bg-amber-400/15 text-amber-300" },
  paid: { label: "Pago · a enviar", tone: "bg-emerald-400/15 text-emerald-300" },
  shipped: { label: "Enviado", tone: "bg-sky-400/15 text-sky-300" },
  delivered: { label: "Entregue", tone: "bg-zinc-400/15 text-zinc-300" },
  cancelled: { label: "Cancelado", tone: "bg-red-400/15 text-red-300" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = ORDER_STATUS[status] ?? { label: status, tone: "bg-zinc-400/15 text-zinc-300" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[0.65rem] tracking-wide ${s.tone}`}>
      {s.label}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        <p className="eyebrow text-[0.62rem] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-2 text-3xl text-foreground sm:text-4xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
