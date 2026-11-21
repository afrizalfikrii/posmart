import type { PaymentMethod, Transaction } from "@/types";
import { formatDate } from "./format";

export interface PeriodMetrics {
  revenue: number;
  grossProfit: number;
  transactionCount: number;
  itemsSold: number;
}

export interface TrendInfo {
  text: string;
  isPositive: boolean;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function filterCompletedInRange(
  transactions: Transaction[],
  start: Date,
  end: Date,
): Transaction[] {
  return transactions.filter((t) => {
    if (t.status !== "Selesai") return false;
    const d = new Date(t.createdAt);
    return d >= start && d <= end;
  });
}

export function computeMetrics(transactions: Transaction[]): PeriodMetrics {
  let revenue = 0;
  let grossProfit = 0;
  let itemsSold = 0;

  for (const trx of transactions) {
    if (trx.status !== "Selesai") continue;
    revenue += trx.total;
    for (const item of trx.items) {
      itemsSold += item.qty;
      grossProfit += (item.price - item.costPrice) * item.qty;
    }
  }

  return {
    revenue,
    grossProfit,
    transactionCount: transactions.filter((t) => t.status === "Selesai").length,
    itemsSold,
  };
}

export function computeTrend(current: number, previous: number, suffix = ""): TrendInfo {
  if (previous === 0) {
    if (current === 0) return { text: `0%${suffix}`, isPositive: true };
    return { text: `+100%${suffix}`, isPositive: true };
  }
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.abs(pct).toFixed(1).replace(".", ",");
  const isPositive = pct >= 0;
  return {
    text: `${isPositive ? "+" : "-"}${rounded}%${suffix}`,
    isPositive,
  };
}

export function computeTopProducts(
  transactions: Transaction[],
  limit = 5,
): { name: string; units: number; revenue: number }[] {
  const map = new Map<string, { name: string; units: number; revenue: number }>();

  for (const trx of transactions) {
    if (trx.status !== "Selesai") continue;
    for (const item of trx.items) {
      const existing = map.get(item.name);
      if (existing) {
        existing.units += item.qty;
        existing.revenue += item.subtotal;
      } else {
        map.set(item.name, {
          name: item.name,
          units: item.qty,
          revenue: item.subtotal,
        });
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, limit);
}

const METHOD_COLORS: Record<PaymentMethod, string> = {
  Tunai: "#DC2626",
  QRIS: "#F87171",
  Transfer: "#D1D5DB",
};

export function computePaymentBreakdown(transactions: Transaction[]) {
  const counts: Record<PaymentMethod, number> = {
    Tunai: 0,
    QRIS: 0,
    Transfer: 0,
  };

  let total = 0;
  for (const trx of transactions) {
    if (trx.status !== "Selesai") continue;
    counts[trx.paymentMethod] += 1;
    total += 1;
  }

  return (["Tunai", "QRIS", "Transfer"] as const).map((method) => ({
    name: method,
    value: counts[method],
    percent: total > 0 ? Math.round((counts[method] / total) * 100) : 0,
    color: METHOD_COLORS[method],
  }));
}

export function computeHourlySeries(transactions: Transaction[]) {
  const hours = Array.from({ length: 16 }, (_, idx) => idx + 7); // 07:00 - 22:00
  const buckets = new Map<number, { revenue: number; count: number }>(
    hours.map((h) => [h, { revenue: 0, count: 0 }]),
  );

  for (const trx of transactions) {
    if (trx.status !== "Selesai") continue;
    const h = new Date(trx.createdAt).getHours();
    const bucket = buckets.get(h);
    if (bucket) {
      bucket.revenue += trx.total;
      bucket.count += 1;
    }
  }

  return hours.map((h) => ({
    label: `${String(h).padStart(2, "0")}:00`,
    revenue: buckets.get(h)?.revenue ?? 0,
    count: buckets.get(h)?.count ?? 0,
  }));
}

export function computeDailySeries(transactions: Transaction[], start: Date, days: number) {
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const result: { label: string; fullDate: string; revenue: number }[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const s = startOfDay(d);
    const e = endOfDay(d);
    const dayTrx = filterCompletedInRange(transactions, s, e);
    const revenue = dayTrx.reduce((sum, t) => sum + t.total, 0);

    const label = days <= 7 ? dayNames[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`;

    result.push({
      label,
      fullDate: formatDate(d),
      revenue,
    });
  }

  return result;
}
