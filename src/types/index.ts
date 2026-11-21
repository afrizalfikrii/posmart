export type PaymentMethod = "Tunai" | "QRIS" | "Transfer";
export type TransactionStatus = "Selesai" | "Dibatalkan" | "Diretur";
export type UserRole = "Admin" | "Kasir";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  barcode: string;
  active: boolean;
  pos: string;
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface TransactionItem {
  productId: string;
  name: string;
  price: number;
  costPrice: number;
  qty: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  cashier: string;
  amountPaid: number;
  change: number;
  note?: string;
  customerId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalTransactions: number;
  totalSpent: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  pin: string;
  role: UserRole;
  initials: string;
  active: boolean;
}

export type AuthUser = Omit<User, "pin">;

export interface AuthSession {
  user: AuthUser;
  token: string;
  rememberMe: boolean;
  loggedInAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  pin?: string;
  active: boolean;
}

export interface StoreSettings {
  storeName: string;
  phone: string;
  address: string;
  operationalHours: string;
  logoUrl?: string;
  taxEnabled: boolean;
  taxRate: number;
  showTaxOnReceipt: boolean;
  receiptFooter: string;
  lowStockThreshold: number;
  paymentMethods: {
    tunai: boolean;
    qris: boolean;
    transfer: boolean;
    qrisMerchantName: string;
    bankAccount: string;
  };
  printer: {
    autoPrint: boolean;
    paperSize: "58mm" | "80mm";
    copies: number;
    printerName: string;
  };
  employees: Employee[];
}

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}
