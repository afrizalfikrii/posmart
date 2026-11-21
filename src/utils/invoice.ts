import type { Transaction } from "@/types";

/**
 * Menghasilkan nomor invoice berikutnya secara berurutan (contoh: #INV-0129).
 */
export function generateInvoiceNumber(transactions: Pick<Transaction, "invoiceNumber">[]): string {
  let maxNumber = 128;

  for (const trx of transactions) {
    const match = /#?INV-(\d+)/i.exec(trx.invoiceNumber);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (!Number.isNaN(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
      }
    }
  }

  const next = maxNumber + 1;
  return `#INV-${String(next).padStart(4, "0")}`;
}
