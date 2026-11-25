"use client";

import { useEffect } from "react";
import { loadCart, saveCart } from "@/app/actions/cart";
import {
  clearCart,
  getCart,
  replaceCart,
  setCartPersistence,
  type CartItem,
} from "@/utils/cart";
import { createClient } from "@/utils/supabase/client";

// Junta a sacola do navegador com a da conta. Se a mesma peça está nas duas, vale a maior quantidade.
function merge(local: CartItem[], remote: CartItem[]): CartItem[] {
  const byId = new Map(remote.map((i) => [i.variantId, i]));
  const merged = [...remote];
  for (const item of local) {
    const found = byId.get(item.variantId);
    if (found) {
      found.quantity = Math.min(Math.max(found.quantity, item.quantity), found.maxStock);
    } else {
      merged.push(item);
    }
  }
  return merged;
}

// Fica no layout. Com alguém logado, a sacola passa a ser salva na conta;
// ao sair, a sacola do navegador é limpa.
export function CartSync() {
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = false;

    function enable() {
      active = true;
      setCartPersistence((items) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          saveCart(items.map(({ variantId, quantity }) => ({ variantId, quantity }))).catch(() => {});
        }, 600);
      });

      loadCart()
        .then((remote) => {
          if (remote) replaceCart(merge(getCart(), remote)); // também grava na conta
        })
        .catch(() => {});
    }

    function disable() {
      active = false;
      clearTimeout(timer);
      setCartPersistence(null);
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        disable();
        clearCart();
      } else if (session && (event === "INITIAL_SESSION" || event === "SIGNED_IN") && !active) {
        enable();
      }
    });

    return () => {
      data.subscription.unsubscribe();
      disable();
    };
  }, []);

  return null;
}
