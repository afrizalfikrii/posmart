import type { Customer } from "@/types";

export const mockCustomers: Customer[] = [
  {
    id: "cust-01",
    name: "Pelanggan Umum",
    phone: "-",
    totalTransactions: 42,
    totalSpent: 1850000,
    createdAt: "2026-01-10T08:00:00+07:00",
  },
  {
    id: "cust-02",
    name: "Budi Santoso",
    phone: "081345678901",
    email: "budi@mail.com",
    totalTransactions: 12,
    totalSpent: 465000,
    createdAt: "2026-03-14T10:20:00+07:00",
  },
  {
    id: "cust-03",
    name: "Rina Marlina",
    phone: "085612349876",
    totalTransactions: 9,
    totalSpent: 312000,
    createdAt: "2026-05-02T14:15:00+07:00",
  },
  {
    id: "cust-04",
    name: "Agus Pratama",
    phone: "082198765432",
    totalTransactions: 7,
    totalSpent: 289000,
    createdAt: "2026-06-18T09:40:00+07:00",
  },
  {
    id: "cust-05",
    name: "Dewi Lestari",
    phone: "087811223344",
    email: "dewi.l@mail.com",
    totalTransactions: 15,
    totalSpent: 540000,
    createdAt: "2026-08-09T16:30:00+07:00",
  },
];
