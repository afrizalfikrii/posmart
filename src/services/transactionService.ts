import { mockTransactions } from "@/data/transactions";
import type { Transaction, TransactionStatus } from "@/types";
import { generateInvoiceNumber } from "@/utils/invoice";
import { ensureSeeded, simulateLatency, writeStorage, STORAGE_KEYS } from "./storage";

export type CreateTransactionInput = Omit<Transaction, "id" | "invoiceNumber" | "createdAt">;

export const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    await simulateLatency();
    return ensureSeeded<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, mockTransactions);
  },

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    await simulateLatency();
    const list = ensureSeeded<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, mockTransactions);
    const invoiceNumber = generateInvoiceNumber(list);
    const created: Transaction = {
      ...input,
      id: `trx-${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };
    const next = [created, ...list];
    writeStorage(STORAGE_KEYS.TRANSACTIONS, next);
    return created;
  },

  async updateTransactionStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    await simulateLatency();
    const list = ensureSeeded<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, mockTransactions);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("Transaksi tidak ditemukan.");
    }
    const updated: Transaction = { ...list[index], status };
    const next = [...list];
    next[index] = updated;
    writeStorage(STORAGE_KEYS.TRANSACTIONS, next);
    return updated;
  },
};
