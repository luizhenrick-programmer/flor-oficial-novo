"use client";

import { useEffect } from "react";
import { clearCart } from "@/utils/cart";

// Esvazia a sacola quando a cliente chega na confirmação do pedido.
export function ClearCart() {
  useEffect(() => clearCart(), []);
  return null;
}