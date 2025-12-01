import { create } from "zustand";

export interface Producto {
  id_producto: string;
  nombre: string;
  precio: number;
  imagenes?: string[];
  quantity: number;
}

interface CartState {
  cart: Producto[];
  addToCart: (product: Producto) => void;
  removeFromCart: (id_producto: string) => void;
  decreaseQuantity: (id_producto: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  addToCart: (product) => {
    const cart = get().cart;

    const existing = cart.find(
      (p) => p.id_producto === product.id_producto
    );

    if (existing) {
      const updated = cart.map((p) =>
        p.id_producto === product.id_producto
          ? { ...p, quantity: p.quantity + 1 }
          : p
      );
      return set({ cart: updated });
    }

    // quantity SIEMPRE existe ahora
    set({ cart: [...cart, { ...product, quantity: 1 }] });
  },


  removeFromCart: (id_producto) => {
    set({
      cart: get().cart.filter((p) => p.id_producto !== id_producto),
    });
  },

  decreaseQuantity: (id_producto) => {
    const cart = get().cart;

    const updated = cart
      .map((p) =>
        p.id_producto === id_producto
          ? { ...p, quantity: (p.quantity ?? 1) - 1 }
          : p
      )
      .filter((p) => (p.quantity ?? 1) > 0);

    set({ cart: updated });
  },

  clearCart: () => set({ cart: [] }),
}));
