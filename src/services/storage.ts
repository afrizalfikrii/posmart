export const STORAGE_KEYS = {
  PRODUCTS: "posymart_products_v1",
  CATEGORIES: "posymart_categories_v1",
  TRANSACTIONS: "posymart_transactions_v1",
  CUSTOMERS: "posymart_customers_v1",
  SETTINGS: "posymart_settings_v1",
  AUTH_SESSION: "posymart_auth_session_v1",
  CART: "posymart_cart_v1",
} as const;

export function simulateLatency(minMs = 300, maxMs = 500): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in frontend-only mode
  }
}

export function ensureSeeded<T>(key: string, seedData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
    localStorage.setItem(key, JSON.stringify(seedData));
    return seedData;
  } catch {
    return seedData;
  }
}
