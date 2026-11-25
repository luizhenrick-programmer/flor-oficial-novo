import { useSyncExternalStore } from "react";

// Sacola guardada no navegador (localStorage). Os preços aqui são só para exibição:
// o servidor sempre recalcula tudo a partir do banco na hora de fechar o pedido.

export type CartItem = {
  variantId: string;
  slug: string;
  name: string;
  color: string | null;
  size: string | null;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
};

const KEY = "flor-oficial:sacola:v1";
const EMPTY: CartItem[] = [];

let cache: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

// Quando há alguém logado, cada mudança também é enviada para a conta (ver CartSync).
let persist: ((items: CartItem[]) => void) | null = null;
export function setCartPersistence(fn: ((items: CartItem[]) => void) | null) {
  persist = fn;
}
export const getCart = () => getSnapshot();

function read(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return EMPTY;
    const valid = (parsed as CartItem[]).filter(
      (i) => i && typeof i.variantId === "string" && i.quantity > 0,
    );
    return valid.length ? valid : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot() {
  if (!loaded) {
    cache = read();
    loaded = true;
  }
  return cache;
}

function write(items: CartItem[]) {
  cache = items.length ? items : EMPTY;
  loaded = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // armazenamento indisponível: a sacola continua valendo nesta aba
  }
  listeners.forEach((l) => l());
  persist?.(cache);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // mantém várias abas sincronizadas
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read();
      loaded = true;
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function addToCart(item: CartItem) {
  const items = getSnapshot();
  const exists = items.some((i) => i.variantId === item.variantId);
  write(
    exists
      ? items.map((i) =>
          i.variantId === item.variantId
            ? { ...item, quantity: Math.min(i.quantity + item.quantity, item.maxStock) }
            : i,
        )
      : [...items, { ...item, quantity: Math.min(item.quantity, item.maxStock) }],
  );
}

export function setQuantity(variantId: string, quantity: number) {
  write(
    getSnapshot().map((i) =>
      i.variantId === variantId
        ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
        : i,
    ),
  );
}

export const removeFromCart = (variantId: string) =>
  write(getSnapshot().filter((i) => i.variantId !== variantId));

export const replaceCart = (items: CartItem[]) => write(items);
export const clearCart = () => write(EMPTY);

export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0);

export const cartSubtotal = (items: CartItem[]) =>
  Math.round(items.reduce((sum, i) => sum + i.price * i.quantity * 100, 0)) / 100;
