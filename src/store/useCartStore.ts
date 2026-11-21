import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/services/storage";
import type { CartItem, PaymentMethod, Product } from "@/types";

interface CartState {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  note: string;
  addItem: (product: Product) => void;
  updateQty: (productId: string, delta: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setNote: (note: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      paymentMethod: "Tunai",
      note: "",

      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i,
              ),
            };
          }
          return { items: [...state.items, { product, qty: 1 }] };
        }),

      updateQty: (productId, delta) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.product.id === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i,
            )
            .filter((i) => i.qty > 0),
        })),

      setQty: (productId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.product.id !== productId)
              : state.items.map((i) => (i.product.id === productId ? { ...i, qty } : i)),
        })),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        })),

      clearCart: () => set({ items: [], note: "" }),

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

      setNote: (note) => set({ note }),
    }),
    {
      name: STORAGE_KEYS.CART,
    },
  ),
);
