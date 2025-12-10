// services/cartStore.ts
import { create } from "zustand";
import { Producto } from "../lib/types";

interface CartState {
  cart: Producto[];
  addToCart: (product: Producto) => void;
  removeFromCart: (id_producto: string) => void;
  decreaseQuantity: (id_producto: string) => void;
  incrementQuantity: (id_producto: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  addToCart: (item) =>
    set((state) => {
      const qty = item.quantity ?? 1;
      const existing = state.cart.find(
        (p) => p.id_producto === item.id_producto
      );

      // 🔥 Normalizamos el ID de la ferretería del item entrante
      const productoConFerreteria = {
        ...item,
        id_ferreteria:
          item.id_ferreteria ??
          item.ferreteria?.id_ferreteria ??
          null,
      };

      if (existing) {
        return {
          cart: state.cart.map((p) =>
            p.id_producto === item.id_producto
              ? { 
                  ...p, 
                  quantity: (p.quantity ?? 1) + qty,
                  // ✅ CORRECCIÓN CRÍTICA AQUÍ:
                  // Actualizamos el precio al nuevo valor que viene de la cotización seleccionada
                  precio: item.precio, 
                  // Actualizamos la ferretería por si el usuario cambió de proveedor
                  id_ferreteria: productoConFerreteria.id_ferreteria 
                }
              : p
          ),
        };
      }

      return {
        cart: [
          ...state.cart,
          { ...productoConFerreteria, quantity: qty },
        ],
      };
    }),

  removeFromCart: (id_producto) =>
    set((state) => ({
      cart: state.cart.filter((p) => p.id_producto !== id_producto),
    })),

  incrementQuantity: (id_producto) =>
    set((state) => ({
      cart: state.cart.map((p) =>
        p.id_producto === id_producto
          ? { ...p, quantity: (p.quantity ?? 1) + 1 }
          : p
      ),
    })),

  decreaseQuantity: (id_producto) =>
    set((state) => {
      const item = state.cart.find((p) => p.id_producto === id_producto);

      if (item && item.quantity! > 1) {
        return {
          cart: state.cart.map((p) =>
            p.id_producto === id_producto
              ? { ...p, quantity: p.quantity! - 1 }
              : p
          ),
        };
      }

      return {
        cart: state.cart.filter((p) => p.id_producto !== id_producto),
      };
    }),

  clearCart: () => set({ cart: [] }),
}));