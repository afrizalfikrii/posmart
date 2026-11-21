import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Icon, type IconName } from "@/components/Icon";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { ProductPhoto } from "@/components/ProductPhoto";
import { Skeleton } from "@/components/Skeleton";
import { useProductStore } from "@/store/useProductStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useToastStore } from "@/store/useToastStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import type { Product } from "@/types";
import {
  computeDailySeries,
  computeHourlySeries,
  computeMetrics,
  computeTopProducts,
  computeTrend,
  endOfDay,
  filterCompletedInRange,
  startOfDay,
} from "@/utils/analytics";
import { formatRupiah, formatTime } from "@/utils/format";

type ChartRange = "Hari Ini" | "7 Hari" | "30 Hari";

export function DasborPage() {
  const navigate = useNavigate();
  const [chartRange, setChartRange] = useState<ChartRange>("7 Hari");
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [addQty, setAddQty] = useState("10");
  const [savingStock, setSavingStock] = useState(false);

  const { transactions, loading: trxLoading, fetchTransactions } = useTransactionStore();
  const { products, loading: prodLoading, fetchProducts, updateProduct } = useProductStore();
  const { settings, fetchSettings } = useSettingsStore();
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (transactions.length === 0) void fetchTransactions();
    if (products.length === 0) void fetchProducts();
    if (!settings) void fetchSettings();
  }, [
    transactions.length,
    fetchTransactions,
    products.length,
    fetchProducts,
    settings,
    fetchSettings,
  ]);

  const lowStockThreshold = settings?.lowStockThreshold ?? 5;
  const isLoading =
    (trxLoading && transactions.length === 0) || (prodLoading && products.length === 0);

  const { todayMetrics, trends, lowStockProducts, recentTransactions, topProducts, chartData } =
    useMemo(() => {
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yStart = startOfDay(yesterday);
      const yEnd = endOfDay(yesterday);

      const todayTrx = filterCompletedInRange(transactions, todayStart, todayEnd);
      const yesterdayTrx = filterCompletedInRange(transactions, yStart, yEnd);

      const tMetrics = computeMetrics(todayTrx);
      const yMetrics = computeMetrics(yesterdayTrx);

      const revTrend = computeTrend(tMetrics.revenue, yMetrics.revenue, " dari kemarin");
      const trxTrend = computeTrend(
        tMetrics.transactionCount,
        yMetrics.transactionCount,
        " dari kemarin",
      );
      const itemTrend = computeTrend(tMetrics.itemsSold, yMetrics.itemsSold, " dari kemarin");

      const lowStock = products
        .filter((p) => p.stock <= lowStockThreshold)
        .sort((a, b) => a.stock - b.stock);

      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(todayStart.getDate() - 6);
      const weekTrx = filterCompletedInRange(transactions, sevenDaysAgo, todayEnd);

      const top = computeTopProducts(weekTrx, 5);

      let series: { label: string; revenue: number }[] = [];
      if (chartRange === "Hari Ini") {
        series = computeHourlySeries(todayTrx).map((h) => ({
          label: h.label,
          revenue: h.revenue,
        }));
      } else if (chartRange === "7 Hari") {
        series = computeDailySeries(transactions, sevenDaysAgo, 7).map((d) => ({
          label: d.label,
          revenue: d.revenue,
        }));
      } else {
        const thirtyDaysAgo = new Date(todayStart);
        thirtyDaysAgo.setDate(todayStart.getDate() - 29);
        series = computeDailySeries(transactions, thirtyDaysAgo, 30).map((d) => ({
          label: d.label,
          revenue: d.revenue,
        }));
      }

      return {
        todayMetrics: tMetrics,
        trends: { revTrend, trxTrend, itemTrend },
        lowStockProducts: lowStock,
        recentTransactions: transactions.slice(0, 5),
        topProducts: top,
        chartData: series,
      };
    }, [transactions, products, lowStockThreshold, chartRange]);

  const maxTopUnits = topProducts[0]?.units || 1;

  const handleRestockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    const qty = Number.parseInt(addQty, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      showToast("Jumlah tambahan stok harus lebih dari 0.", "warning");
      return;
    }
    setSavingStock(true);
    try {
      await updateProduct(restockProduct.id, {
        stock: restockProduct.stock + qty,
      });
      showToast(`Stok ${restockProduct.name} ditambah ${qty} unit.`, "success");
      setRestockProduct(null);
      setAddQty("10");
    } catch {
      showToast("Gagal memperbarui stok produk.", "error");
    } finally {
      setSavingStock(false);
    }
  };

  const statCards: {
    label: string;
    value: string;
    trend?: { text: string; isPositive: boolean };
    icon: IconName;
    isLowStock?: boolean;
  }[] = [
    {
      label: "Penjualan Hari Ini",
      value: formatRupiah(todayMetrics.revenue),
      trend: trends.revTrend,
      icon: "report",
    },
    {
      label: "Jumlah Transaksi",
      value: String(todayMetrics.transactionCount),
      trend: trends.trxTrend,
      icon: "receipt",
    },
    {
      label: "Produk Terjual",
      value: String(todayMetrics.itemsSold),
      trend: trends.itemTrend,
      icon: "product",
    },
    {
      label: "Stok Menipis",
      value: `${lowStockProducts.length} produk`,
      icon: "filter",
      isLowStock: true,
    },
  ];

  return (
    <>
      <PageHeader
        title="Dasbor"
        subtitle="Ringkasan usaha Anda hari ini"
        actions={
          <Button primary icon="cashier" onClick={() => navigate("/kasir")}>
            Buka Kasir
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[130px]" />
            ))}
          </div>
          <div className="grid grid-cols-[1.75fr_.95fr] gap-5">
            <Skeleton className="h-[260px]" />
            <Skeleton className="h-[260px]" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
            {statCards.map((stat) => (
              <article className="card p-4" key={stat.label}>
                <div className="flex items-start justify-between">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-full ${
                      stat.isLowStock
                        ? "bg-[#FEF3C7] text-[#F59E0B]"
                        : "bg-[#FEE2E2] text-[#DC2626]"
                    }`}
                  >
                    <Icon name={stat.icon} size={17} />
                  </div>
                  <Icon name="more" size={16} className="text-[#9CA3AF]" />
                </div>
                <p className="mt-3 text-[10px] font-medium text-[#6B7280]">{stat.label}</p>
                <p className="mt-1 text-[20px] font-bold tracking-[-.5px]">{stat.value}</p>
                {stat.isLowStock ? (
                  <button
                    type="button"
                    onClick={() => navigate("/produk?status=Stok+Menipis")}
                    className="mt-1.5 text-[9px] font-semibold text-[#F59E0B] hover:underline"
                  >
                    Lihat produk →
                  </button>
                ) : (
                  stat.trend && (
                    <p
                      className={`mt-1.5 text-[9px] font-semibold ${
                        stat.trend.isPositive ? "text-[#16A34A]" : "text-[#DC2626]"
                      }`}
                    >
                      {stat.trend.isPositive ? "↗" : "↘"} {stat.trend.text}
                    </p>
                  )
                )}
              </article>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-[1.75fr_.95fr] gap-5 max-lg:grid-cols-1">
            <article className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[14px] font-bold">Penjualan</h2>
                  <p className="mt-1 text-[9px] text-[#9CA3AF]">
                    Pendapatan kotor berdasarkan transaksi selesai
                  </p>
                </div>
                <div className="flex rounded-lg bg-[#F9FAFB] p-1">
                  {(["Hari Ini", "7 Hari", "30 Hari"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setChartRange(tab)}
                      className={`rounded-md px-2.5 py-1.5 text-[8px] font-semibold transition-colors ${
                        chartRange === tab ? "bg-white text-[#DC2626] shadow-sm" : "text-[#6B7280]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dasborAreaFill" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#dasborAreaFill)"
                      activeDot={{ r: 4, fill: "#DC2626" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[14px] font-bold">Produk Terlaris</h2>
                <span className="text-[8px] text-[#9CA3AF]">7 hari terakhir</span>
              </div>
              {topProducts.length === 0 ? (
                <EmptyState icon="product" tone="neutral" title="Belum ada penjualan" />
              ) : (
                <div className="space-y-3.5">
                  {topProducts.map((item, index) => (
                    <div
                      key={item.name}
                      className="grid grid-cols-[20px_1fr_50px] items-center gap-2"
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full text-[8px] font-bold ${
                          index === 0 ? "bg-[#DC2626] text-white" : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <div className="mb-1.5 flex justify-between text-[9px] font-semibold">
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#FEE2E2]">
                          <div
                            className="h-full rounded-full bg-[#DC2626]"
                            style={{
                              width: `${Math.round((item.units / maxTopUnits) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-right text-[8px] text-[#6B7280]">
                        {item.units} unit
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>

          <div className="mt-5 grid grid-cols-[1.75fr_.95fr] gap-5 max-lg:grid-cols-1">
            <article className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="text-[14px] font-bold">Transaksi Terakhir</h2>
                <button
                  type="button"
                  onClick={() => navigate("/riwayat")}
                  className="text-[9px] font-semibold text-[#DC2626] hover:underline"
                >
                  Lihat semua →
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-[#F9FAFB] text-[8px] uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    {["No. Transaksi", "Waktu", "Metode", "Total"].map((h) => (
                      <th key={h} className="px-5 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((trx) => (
                    <tr
                      key={trx.id}
                      onClick={() => navigate("/riwayat")}
                      className="cursor-pointer border-t border-[#F3F4F6] text-[9px] hover:bg-[#FFF7F7]"
                    >
                      <td className="px-5 py-2.5 font-semibold text-[#DC2626]">
                        {trx.invoiceNumber}
                      </td>
                      <td>{formatTime(trx.createdAt)}</td>
                      <td>
                        <span
                          className={`rounded-full px-2 py-1 font-semibold ${
                            trx.paymentMethod === "QRIS"
                              ? "bg-[#FEE2E2] text-[#B91C1C]"
                              : "bg-[#F3F4F6] text-[#4B5563]"
                          }`}
                        >
                          {trx.paymentMethod}
                        </span>
                      </td>
                      <td className="font-bold">{formatRupiah(trx.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-bold">Stok Menipis</h2>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#FEF3C7] text-[9px] font-bold text-[#F59E0B]">
                  {lowStockProducts.length}
                </span>
              </div>
              {lowStockProducts.length === 0 ? (
                <EmptyState icon="check" tone="neutral" title="Semua stok aman" />
              ) : (
                <div className="divide-y divide-[#F3F4F6]">
                  {lowStockProducts.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-3">
                      <ProductPhoto
                        pos={item.pos}
                        imageUrl={item.imageUrl}
                        alt={item.name}
                        className="h-9 w-9 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[9px] font-semibold">{item.name}</p>
                        <p
                          className={`mt-1 text-[8px] font-semibold ${
                            item.stock === 0 ? "text-[#DC2626]" : "text-[#F59E0B]"
                          }`}
                        >
                          {item.stock === 0 ? "Habis" : `${item.stock} tersisa`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRestockProduct(item);
                          setAddQty("10");
                        }}
                        className="rounded-lg border border-[#FCA5A5] px-2.5 py-1.5 text-[8px] font-semibold text-[#DC2626] hover:bg-[#FEE2E2]"
                      >
                        Tambah Stok
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
        </>
      )}

      <Modal
        open={Boolean(restockProduct)}
        onClose={() => setRestockProduct(null)}
        title="Tambah Stok Produk"
        widthClass="w-[380px]"
      >
        {restockProduct && (
          <form onSubmit={handleRestockSubmit} className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] p-3">
              <ProductPhoto
                pos={restockProduct.pos}
                imageUrl={restockProduct.imageUrl}
                alt={restockProduct.name}
                className="h-10 w-10 rounded-lg"
              />
              <div>
                <p className="text-[12px] font-bold">{restockProduct.name}</p>
                <p className="text-[10px] text-[#6B7280]">
                  Stok saat ini: <b>{restockProduct.stock}</b>
                </p>
              </div>
            </div>

            <Input
              label="Jumlah Tambahan Stok"
              type="number"
              min={1}
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => setRestockProduct(null)}
                disabled={savingStock}
              >
                Batal
              </Button>
              <Button type="submit" primary disabled={savingStock}>
                {savingStock ? "Menyimpan..." : "Simpan Stok"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
