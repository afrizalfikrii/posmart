import { create } from "zustand";
import { productService, type ProductInput } from "@/services/productService";
import type { Category, Product } from "@/types";

interface ProductState {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  createProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<ProductInput>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  deleteProducts: (ids: string[]) => Promise<void>;
  decrementStock: (items: { productId: string; qty: number }[]) => Promise<void>;
  incrementStock: (items: { productId: string; qty: number }[]) => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  categories: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const [products, categories] = await Promise.all([
        productService.getProducts(),
        productService.getCategories(),
      ]);
      set({ products, categories, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Gagal memuat produk.",
      });
    }
  },

  createProduct: async (input) => {
    const created = await productService.createProduct(input);
    set((state) => ({ products: [created, ...state.products] }));
    return created;
  },

  updateProduct: async (id, updates) => {
    const updated = await productService.updateProduct(id, updates);
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? updated : p)),
    }));
    return updated;
  },

  deleteProduct: async (id) => {
    await productService.deleteProduct(id);
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },

  deleteProducts: async (ids) => {
    await productService.deleteProducts(ids);
    const idSet = new Set(ids);
    set((state) => ({
      products: state.products.filter((p) => !idSet.has(p.id)),
    }));
  },

  decrementStock: async (items) => {
    const next = await productService.decrementStock(items);
    set({ products: next });
  },

  incrementStock: async (items) => {
    const next = await productService.incrementStock(items);
    set({ products: next });
  },
}));
