import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartLine {
  id: string;
  qty: number;
}

interface ShopState {
  cart: CartLine[];
  wishlist: string[];
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
}

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      addToCart: (id) =>
        set((s) => (s.cart.some((l) => l.id === id) ? s : { cart: [...s.cart, { id, qty: 1 }] })),
      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((l) => l.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          cart: s.cart.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l)),
        })),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (id) =>
        set((s) => ({
          wishlist: s.wishlist.includes(id)
            ? s.wishlist.filter((w) => w !== id)
            : [...s.wishlist, id],
        })),
    }),
    {
      name: "bootyard-shop",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ cart, wishlist }) => ({ cart, wishlist }),
    },
  ),
);
