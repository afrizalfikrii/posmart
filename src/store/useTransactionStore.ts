import { create } from "zustand";
import { transactionService, type CreateTransactionInput } from "@/services/transactionService";
import type { Transaction, TransactionStatus } from "@/types";

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  createTransaction: (input: CreateTransactionInput) => Promise<Transaction>;
  updateTransactionStatus: (id: string, status: TransactionStatus) => Promise<Transaction>;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const transactions = await transactionService.getTransactions();
      set({ transactions, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Gagal memuat transaksi.",
      });
    }
  },

  createTransaction: async (input) => {
    const created = await transactionService.createTransaction(input);
    set((state) => ({ transactions: [created, ...state.transactions] }));
    return created;
  },

  updateTransactionStatus: async (id, status) => {
    const updated = await transactionService.updateTransactionStatus(id, status);
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
    }));
    return updated;
  },
}));
