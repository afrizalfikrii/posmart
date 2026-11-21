import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { useToastStore } from "@/store/useToastStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import {
  computeDailySeries,
  computeHourlySeries,
  computeMetrics,
  computePaymentBreakdown,
  computeTopProducts,
  computeTrend,
  endOfDay,
  filterCompletedInRange,
  startOfDay,
} from "@/utils/analytics";
import { formatDate, formatRupiah, formatTime } from "@/utils/format";

type ReportPeriod = "Harian" | "Mingguan" | "Bulanan";

function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function LaporanPage() {
  const [period, setPeriod] = useState<ReportPeriod>("Mingguan");
  const [selectedDate, setSelectedDate] = useState(() => toInputDate(new Date()));

  const { transactions, loading, fetchTransactions } = useTransactionStore();
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (transactions.length === 0) {
      void fetchTransactions();
    }
  }, [transactions.length, fetchTransactions]);

  const {
    currentTrx,
    metrics,
    trends,
    seriesData,
    topProducts,
    paymentBreakdown,
    busiestHours,
    periodLabel,
  } = useMemo(() => {
    const anchor = new Date(`${selectedDate}T12:00:00`);
    const validAnchor = Number.isNaN(anchor.getTime()) ? new Date() : anchor;

    let curStart: Date;
    let curEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;
    let label = "";

    if (period === "Harian") {
      curStart = startOfDay(validAnchor);
      curEnd = endOfDay(validAnchor);
      const prevDay = new Date(validAnchor);
      prevDay.setDate(prevDay.getDate() - 1);
      prevStart = startOfDay(prevDay);
      prevEnd = endOfDay(prevDay);
      label = formatDate(validAnchor);
    } else if (period === "Mingguan") {
      curEnd = endOfDay(validAnchor);
      const s = new Date(validAnchor);
      s.setDate(validAnchor.getDate() - 6);
      curStart = startOfDay(s);

      const pEnd = new Date(curStart);
      pEnd.setDate(curStart.getDate() - 1);
      prevEnd = endOfDay(pEnd);
      const pStart = new Date(pEnd);
      pStart.setDate(pEnd.getDate() - 6);
      prevStart = startOfDay(pStart);
      label = `${formatDate(curStart)} – ${formatDate(curEnd)}`;
    } else {
      curStart = startOfDay(new Date(validAnchor.getFullYear(), validAnchor.getMonth(), 1));
      curEnd = endOfDay(new Date(validAnchor.getFullYear(), validAnchor.getMonth() + 1, 0));
      prevStart = startOfDay(new Date(validAnchor.getFullYear(), validAnchor.getMonth() - 1, 1));
      prevEnd = endOfDay(new Date(validAnchor.getFullYear(), validAnchor.getMonth(), 0));
      label = `${formatDate(curStart)} – ${formatDate(curEnd)}`;
    }

    const cur = filterCompletedInRange(transactions, curStart, curEnd);
    const prev = filterCompletedInRange(transactions, prevStart, prevEnd);

    const curM = computeMetrics(cur);
    const prevM = computeMetrics(prev);

    const daysCount =
      period === "Mingguan"
        ? 7
        : new Date(validAnchor.getFullYear(), validAnchor.getMonth() + 1, 0).getDate();

    const series =
      period === "Harian"
        ? computeHourlySeries(cur).map((h) => ({
            label: h.label,
            revenue: h.revenue,
          }))
        : computeDailySeries(transactions, curStart, daysCount).map((d) => ({
            label: d.label,
            revenue: d.revenue,
          }));

    const hours = computeHourlySeries(cur).filter((_, idx) => idx % 2 === 0);

    return {
      currentTrx: cur,
      metrics: curM,
      trends: {
        revenue: computeTrend(curM.revenue, prevM.revenue),
        profit: computeTrend(curM.grossProfit, prevM.grossProfit),
        count: computeTrend(curM.transactionCount, prevM.transactionCount),
        items: computeTrend(curM.itemsSold, prevM.itemsSold),
      },
      seriesData: series,
      topProducts: computeTopProducts(cur, 5),
      paymentBreakdown: computePaymentBreakdown(cur),
      busiestHours: hours,
      periodLabel: label,
    };
  }, [transactions, period, selectedDate]);

  const maxTopUnits = topProducts[0]?.units || 1;

  const handleExportCsv = () => {
    if (currentTrx.length === 0) {
      showToast("Tidak ada data laporan pada periode ini.", "warning");
      return;
    }

    const headers = [
      "No. Transaksi",
      "Tanggal",
      "Waktu",
      "Kasir",
      "Metode",
      "Subtotal",
      "PPN",
      "Total",
      "Laba Kotor",
    ];

    const rows = currentTrx.map((t) => {
      const profit = t.items.reduce(
        (sum, item) => sum + (item.price - item.costPrice) * item.qty,
        0,
      );
      return [
        t.invoiceNumber,
        formatDate(t.createdAt),
        formatTime(t.createdAt),
        t.cashier,
        t.paymentMethod,
        t.subtotal,
        t.tax,
        t.total,
        profit,
      ];
    });

    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `posymart-laporan-${period.toLowerCase()}-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Laporan Excel (CSV) berhasil diunduh.", "success");
  };

  const handlePrintPdf = () => {
    document.body.classList.add("printing-report");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printing-report");
    }, 300);
  };

  return (
    <div className="print-report-area">
      <PageHeader
        title="Laporan Penjualan"
        subtitle={`Ringkasan performa bisnis (${periodLabel})`}
        actions={
          <div className="no-print flex gap-2">
            <Button icon="download" onClick={handlePrintPdf}>
              Unduh PDF
            </Button>
            <Button icon="download" onClick={handleExportCsv}>
              Unduh Excel
            </Button>
          </div>
        }
      />

      <div className="no-print mb-4 flex items-center justify-between">
        <div className="flex rounded-xl border border-[#E5E7EB] bg-white p-1">
          {(["Harian", "Mingguan", "Bulanan"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-[10px] font-semibold transition-colors ${
                period === p ? "bg-[#DC2626] text-white" : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <label className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[10px]">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent outline-none"
          />
        </label>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[92px]" />
            ))}
          </div>
          <Skeleton className="h-[250px]" />
        </div>
      ) : currentTrx.length === 0 ? (
        <div className="card p-12">
          <EmptyState
            icon="report"
            tone="neutral"
            title="Belum ada data pada periode ini"
            description="Pilih tanggal atau periode lain untuk melihat ringkasan penjualan."
          />
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-4 gap-4 max-lg:grid-cols-2">
            {[
              {
                label: "Total Penjualan",
                value: formatRupiah(metrics.revenue),
                trend: trends.revenue,
              },
              {
                label: "Laba Kotor",
                value: formatRupiah(metrics.grossProfit),
                trend: trends.profit,
              },
              {
                label: "Jumlah Transaksi",
                value: String(metrics.transactionCount),
                trend: trends.count,
              },
              {
                label: "Produk Terjual",
                value: String(metrics.itemsSold),
                trend: trends.items,
              },
            ].map((card) => (
              <div className="card p-4" key={card.label}>
                <p className="text-[10px] text-[#6B7280]">{card.label}</p>
                <div className="mt-1 flex items-end justify-between">
                  <b className="text-[18px]">{card.value}</b>
                  <span
                    className={`text-[9px] font-semibold ${
                      card.trend.isPositive ? "text-[#16A34A]" : "text-[#DC2626]"
                    }`}
                  >
                    {card.trend.isPositive ? "↗" : "↘"} {card.trend.text}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="card mb-4 p-5">
            <div className="mb-3 flex justify-between">
              <div>
                <h2 className="text-[14px] font-bold">Grafik Penjualan ({period})</h2>
                <p className="mt-1 text-[9px] text-[#9CA3AF]">Total pendapatan transaksi selesai</p>
              </div>
              <b className="text-[16px] text-[#DC2626]">{formatRupiah(metrics.revenue)}</b>
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seriesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="laporanArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#DC2626" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    width={58}
                    tickFormatter={(v: number) =>
                      v >= 1000000
                        ? `Rp ${(v / 1000000).toFixed(1)} jt`
                        : v >= 1000
                          ? `Rp ${Math.round(v / 1000)} rb`
                          : `Rp ${v}`
                    }
                  />
                  <Tooltip
                    formatter={(val) => [formatRupiah(Number(val ?? 0)), "Penjualan"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#DC2626"
                    strokeWidth={2.5}
                    fill="url(#laporanArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
            <div className="card p-5">
              <h3 className="mb-4 text-[13px] font-bold">Produk Terlaris</h3>
              {topProducts.map((item, i) => (
                <div
                  key={item.name}
                  className="mb-3 grid grid-cols-[18px_1fr_45px] items-center gap-2 text-[9px]"
                >
                  <b>{i + 1}</b>
                  <div>
                    <div className="mb-1 flex justify-between">
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#FEE2E2]">
                      <div
                        className="h-full rounded-full bg-[#DC2626]"
                        style={{
                          width: `${Math.round((item.units / maxTopUnits) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-right text-[#6B7280]">{item.units} unit</span>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <h3 className="mb-4 text-[13px] font-bold">Metode Pembayaran</h3>
              <div className="flex h-[155px] items-center justify-around">
                <div className="relative h-[120px] w-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={36}
                        outerRadius={54}
                        paddingAngle={2}
                      >
                        {paymentBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => [`${Number(val ?? 0)} transaksi`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-[13px] font-bold">
                    {metrics.transactionCount}
                  </div>
                </div>
                <div className="space-y-3 text-[10px]">
                  {paymentBreakdown.map((x) => (
                    <div className="flex items-center gap-2" key={x.name}>
                      <i className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />
                      <span>{x.name}</span>
                      <b>{x.percent}%</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="mb-4 text-[13px] font-bold">Jam Tersibuk</h3>
              <div className="h-[155px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={busiestHours} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 8, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 8, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(val) => [`${Number(val ?? 0)} transaksi`, "Jumlah"]}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #E5E7EB",
                        fontSize: "10px",
                      }}
                    />
                    <Bar dataKey="count" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
