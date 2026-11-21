import type { PaymentMethod, Transaction, TransactionItem, TransactionStatus } from "@/types";
import { mockProducts } from "./products";

const METHODS: PaymentMethod[] = ["Tunai", "QRIS", "Transfer"];
const CASHIERS = ["John Doe", "Siti Aminah"];

function buildMockTransactions(): Transaction[] {
  const now = new Date();
  const list: Transaction[] = [];
  const totalCount = 64;

  for (let i = 0; i < totalCount; i++) {
    // Spread across last 30 days, newest first (#INV-0128 down to #INV-0065)
    const invNum = 128 - i;
    const daysAgo = Math.floor((i / totalCount) * 30);
    const date = new Date(now);
    date.setDate(now.getDate() - daysAgo);
    const hour = 8 + ((i * 3) % 13); // 08:00 - 20:00
    const minute = (i * 17) % 60;
    date.setHours(hour, minute, 0, 0);

    const itemCount = 1 + (i % 4);
    const items: TransactionItem[] = [];
    for (let j = 0; j < itemCount; j++) {
      const prod = mockProducts[(i * 3 + j * 5) % mockProducts.length];
      const qty = 1 + ((i + j) % 3);
      items.push({
        productId: prod.id,
        name: prod.name,
        price: prod.price,
        costPrice: prod.costPrice,
        qty,
        subtotal: prod.price * qty,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = Math.round(subtotal * 0.11);
    const total = subtotal + tax;
    const paymentMethod = METHODS[i % 10 < 5 ? 0 : i % 10 < 8 ? 1 : 2];

    let status: TransactionStatus = "Selesai";
    if (i === 2 || i === 19 || i === 41) status = "Diretur";
    else if (i === 4 || i === 27 || i === 52) status = "Dibatalkan";

    const amountPaid = paymentMethod === "Tunai" ? Math.ceil(total / 5000) * 5000 : total;
    const change = Math.max(0, amountPaid - total);

    list.push({
      id: `trx-${String(invNum).padStart(4, "0")}`,
      invoiceNumber: `#INV-${String(invNum).padStart(4, "0")}`,
      createdAt: date.toISOString(),
      items,
      subtotal,
      tax,
      total,
      paymentMethod,
      status,
      cashier: CASHIERS[i % 2],
      amountPaid,
      change,
    });
  }

  return list;
}

export const mockTransactions: Transaction[] = buildMockTransactions();
