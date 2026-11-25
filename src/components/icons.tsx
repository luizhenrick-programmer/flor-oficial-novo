"use client";

// Re-exporta todos os ícones usados no projeto a partir de um Client Component.
// Isso impede que o lucide-react (que usa useContext internamente) seja
// incluído no bundle SSR — evitando o bug do Turbopack no prerender de /_global-error.
export {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  ExternalLink,
  ImagePlus,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react";
