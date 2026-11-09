"use client";

// Re-exporta todos os ícones usados no projeto a partir de um Client Component.
// Isso impede que o lucide-react (que usa useContext internamente) seja
// incluído no bundle SSR — evitando o bug do Turbopack no prerender de /_global-error.
export {
  ArrowRight,
  CreditCard,
  Lock,
  Menu,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  User,
  X,
} from "lucide-react";

