import type { StoreSettings } from "@/types";

export const mockSettings: StoreSettings = {
  storeName: "POS Mart",
  phone: "0812 3456 7890",
  address: "Jl. Melati No. 24, Jakarta",
  operationalHours: "07.00 – 22.00",
  taxEnabled: true,
  taxRate: 11,
  showTaxOnReceipt: true,
  receiptFooter: "Terima kasih telah berbelanja",
  lowStockThreshold: 5,
  paymentMethods: {
    tunai: true,
    qris: true,
    transfer: true,
    qrisMerchantName: "POS MART WARUNG & KOPI",
    bankAccount: "BCA 1234567890 a.n. POS Mart UMKM",
  },
  printer: {
    autoPrint: false,
    paperSize: "58mm",
    copies: 1,
    printerName: "Thermal Printer 58mm (USB)",
  },
  employees: [
    {
      id: "user-01",
      name: "John Doe",
      role: "Admin",
      phone: "081234567890",
      email: "admin@posymart.id",
      pin: "123456",
      active: true,
    },
    {
      id: "user-02",
      name: "Siti Aminah",
      role: "Kasir",
      phone: "081298765432",
      email: "kasir@posymart.id",
      pin: "123456",
      active: true,
    },
  ],
};
