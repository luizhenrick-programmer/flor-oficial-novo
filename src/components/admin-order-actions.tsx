"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/actions/admin-orders";
import { ui } from "@/components/admin-ui";

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tracking, setTracking] = useState("");
  const [error, setError] = useState<string | null>(null);

  function change(next: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, next, tracking);
      if ("error" in res) setError(res.error);
      router.refresh();
    });
  }

  if (status === "delivered" || status === "cancelled") {
    return <p className="text-sm text-muted-foreground">Este pedido está finalizado.</p>;
  }

  return (
    <div className="space-y-4">
      {status === "pending" && (
        <button type="button" disabled={pending} onClick={() => change("paid", "Marcar como pago manualmente? Use só se você já conferiu o recebimento.")} className={`${ui.btn} w-full`}>
          Marcar como pago
        </button>
      )}

      {status === "paid" && (
        <div className="space-y-3">
          <label className="block">
            <span className={ui.label}>Código de rastreio (opcional)</span>
            <input value={tracking} onChange={(e) => setTracking(e.target.value)} className={ui.input} />
          </label>
          <button type="button" disabled={pending} onClick={() => change("shipped")} className={`${ui.btn} w-full`}>
            Marcar como enviado
          </button>
        </div>
      )}

      {status === "shipped" && (
        <button type="button" disabled={pending} onClick={() => change("delivered")} className={`${ui.btn} w-full`}>
          Marcar como entregue
        </button>
      )}

      {(status === "pending" || status === "paid") && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            change(
              "cancelled",
              status === "paid"
                ? "Cancelar este pedido PAGO? As peças voltam ao estoque, mas o reembolso precisa ser feito no Mercado Pago."
                : "Cancelar este pedido? As peças voltam ao estoque.",
            )
          }
          className={`${ui.btnDanger} w-full`}
        >
          Cancelar pedido
        </button>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
