import { mockCategories } from "@/data/categories";
import { mockProducts } from "@/data/products";
import type { Category, Product } from "@/types";
import { ensureSeeded, simulateLatency, writeStorage, STORAGE_KEYS } from "./storage";

export type ProductInput = Omit<Product, "id">;

export const productService = {
  async getProducts(): Promise<Product[]> {
    await simulateLatency();
    return ensureSeeded<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
  },

  async getProductById(id: string): Promise<Product | undefined> {
    await simulateLatency(200, 350);
    const list = ensureSeeded<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    return list.find((item) => item.id === id);
  },

  async getCategories(): Promise<Category[]> {
    await simulateLatency(200, 350);
    return ensureSeeded<Category[]>(STORAGE_KEYS.CATEGORIES, mockCategories);
  },

  async createProduct(input: ProductInput): Promise<Product> {
    await simulateLatency();
    const list = ensureSeeded<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    const created: Product = {
      ...input,
      id: `prod-${Date.now()}`,
    };
    const next = [created, ...list];
    writeStorage(STORAGE_KEYS.PRODUCTS, next);
    return created;
  },

  async updateProduct(id: string, updates: Partial<ProductInput>): Promise<Product> {
    await simulateLatency();
    const list = ensureSeeded<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("Produk tidak ditemukan.");
    }
    const updated: Product = { ...list[index], ...updates };
    const next = [...list];
    next[index] = updated;
    writeStorage(STORAGE_KEYS.PRODUCTS, next);
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    await simulateLatency();
    const list = ensureSeeded<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    const next = list.filter((item) => item.id !== id);
    writeStorage(STORAGE_KEYS.PRODUCTS, next);
  },

  async deleteProducts(ids: string[]): Promise<void> {
    await simulateLatency();
    const idSet = new Set(ids);
    const list = ensureSeeded<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    const next = list.filter((item) => !idSet.has(item.id));
    writeStorage(STORAGE_KEYS.PRODUCTS, next);
  },

  async decrementStock(items: { productId: string; qty: number }[]): Promise<Product[]> {
    await simulateLatency(150, 250);
    const qtyMap = new Map(items.map((i) => [i.productId, i.qty]));
    const list = ensureSeeded<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    const next = list.map((p) => {
      const dec = qtyMap.get(p.id);
      if (!dec) return p;
      return { ...p, stock: Math.max(0, p.stock - dec) };
    });
    writeStorage(STORAGE_KEYS.PRODUCTS, next);
    return next;
  },

  async incrementStock(items: { productId: string; qty: number }[]): Promise<Product[]> {
    await simulateLatency(150, 250);
    const qtyMap = new Map(items.map((i) => [i.productId, i.qty]));
    const list = ensureSeeded<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    const next = list.map((p) => {
      const inc = qtyMap.get(p.id);
      if (!inc) return p;
      return { ...p, stock: p.stock + inc };
    });
    writeStorage(STORAGE_KEYS.PRODUCTS, next);
    return next;
  },
};
