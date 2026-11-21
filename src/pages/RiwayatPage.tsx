import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Drawer } from "@/components/Drawer";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { Pill, type PillTone } from "@/components/Pill";
import { PrintReceipt } from "@/components/PrintReceipt";
import { Skeleton } from "@/components/Skeleton";
import { useProductStore } from "@/store/useProductStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useToastStore } from "@/store/useToastStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import type { PaymentMethod, Transaction, TransactionStatus } from "@/types";
import { formatDate, formatDateTime, formatRupiah, formatTime } from "@/utils/format";

type DatePreset = "Hari Ini" | "Kemarin" | "7 Hari" | "Bulan Ini" | "Kustom";
const PAGE_SIZE = 10;

function statusTone(status: TransactionStatus): PillTone {
  if (status === "Selesai") return "success";
  if (status === "Diretur") return "warning";
  return "neutral";
}

function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function RiwayatPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>("Bulan Ini");
  const [customStart, setCustomStart] = useState(() => toInputDate(new Date()));
  const [customEnd, setCustomEnd] = useState(() => toInputDate(new Date()));
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"Semua" | PaymentMethod>("Semua");
  const [page, setPage] = useState(1);

  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
  const [returningTrx, setReturningTrx] = useState<Transaction | null>(null);
  const [returningLoading, setReturningLoading] = useState(false);

  const { transactions, loading, fetchTransactions, updateTransactionStatus } =
    useTransactionStore();
  const incrementStock = useProductStore((s) => s.incrementStock);
  const { settings, fetchSettings } = useSettingsStore();
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (transactions.length === 0) {
      void fetchTransactions();
    }
    if (!settings) {
      void fetchSettings();
    }
  }, [transactions.length, fetchTransactions, settings, fetchSettings]);

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const q = search.trim().toLowerCase();

    return transactions.filter((t) => {
      const created = new Date(t.createdAt);

      if (datePreset === "Hari Ini") {
        if (created < todayStart || created > todayEnd) return false;
      } else if (datePreset === "Kemarin") {
        const yStart = new Date(todayStart);
        yStart.setDate(yStart.getDate() - 1);
        const yEnd = new Date(todayStart.getTime() - 1);
        if (created < yStart || created > yEnd) return false;
      } else if (datePreset === "7 Hari") {
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 6);
        if (created < weekStart || created > todayEnd) return false;
      } else if (datePreset === "Bulan Ini") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (created < monthStart || created > todayEnd) return false;
      } else if (datePreset === "Kustom") {
        if (customStart) {
          const s = new Date(`${customStart}T00:00:00`);
          if (created < s) return false;
        }
        if (customEnd) {
          const e = new Date(`${customEnd}T23:59:59.999`);
          if (created > e) return false;
        }
      }

      if (methodFilter !== "Semua" && t.paymentMethod !== methodFilter) {
        return false;
      }

      if (q && !t.invoiceNumber.toLowerCase().includes(q)) {
        return false;
      }

      return true;
    });
  }, [transactions, datePreset, customStart, customEnd, methodFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [datePreset, customStart, customEnd, methodFilter, search]);

  const summary = useMemo(() => {
    const completed = filtered.filter((t) => t.status === "Selesai");
    const revenue = completed.reduce((sum, t) => sum + t.total, 0);
    const avg = completed.length > 0 ? Math.round(revenue / completed.length) : 0;
    return {
      totalCount: filtered.length,
      revenue,
      average: avg,
    };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const handleConfirmRetur = async () => {
    if (!returningTrx || returningTrx.status !== "Selesai") return;
    setReturningLoading(true);
    try {
      const updated = await updateTransactionStatus(returningTrx.id, "Diretur");
      await incrementStock(
        returningTrx.items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
        })),
      );
      if (selectedTrx?.id === updated.id) {
        setSelectedTrx(updated);
      }
      showToast(
        `Transaksi ${returningTrx.invoiceNumber} diretur dan stok dikembalikan.`,
        "success",
      );
      setReturningTrx(null);
    } catch {
      showToast("Gagal memproses retur transaksi.", "error");
    } finally {
      setReturningLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      showToast("Tidak ada transaksi untuk diekspor.", "warning");
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
      "Status",
    ];
    const escapeCell = (val: string | number) => {
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filtered.map((t) => [
      t.invoiceNumber,
      formatDate(t.createdAt),
      formatTime(t.createdAt),
      t.cashier,
      t.paymentMethod,
      t.subtotal,
      t.tax,
      t.total,
      t.status,
    ]);

    const csv =
      "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `posymart-riwayat-${toInputDate(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Data transaksi berhasil diekspor ke CSV.", "success");
  };

  return (
    <>
      <PageHeader title="Riwayat Transaksi" subtitle="Pantau dan kelola seluruh transaksi" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-[#E5E7EB] bg-white p-1">
          {(["Hari Ini", "Kemarin", "7 Hari", "Bulan Ini", "Kustom"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDatePreset(d)}
              className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition-colors ${
                datePreset === d ? "bg-[#DC2626] text-white" : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {datePreset === "Kustom" && (
          <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-[10px]">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="outline-none"
            />
            <span className="text-[#9CA3AF]">–</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="outline-none"
            />
          </div>
        )}

        <label className="flex h-10 w-[220px] items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 focus-within:border-[#DC2626]">
          <Icon name="search" size={15} className="text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-[10px] outline-none"
            placeholder="Cari no. transaksi..."
          />
        </label>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as "Semua" | PaymentMethod)}
          className="h-10 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[10px] text-[#4B5563] outline-none focus:border-[#DC2626]"
        >
          <option value="Semua">Semua metode</option>
          <option value="Tunai">Tunai</option>
          <option value="QRIS">QRIS</option>
          <option value="Transfer">Transfer</option>
        </select>

        <Button icon="download" className="ml-auto" onClick={handleExportCsv}>
          Ekspor
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-[10px] text-[#6B7280]">Total Transaksi</p>
          <p className="mt-1 text-[20px] font-bold">{summary.totalCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] text-[#6B7280]">Total Pendapatan</p>
          <p className="mt-1 text-[20px] font-bold">{formatRupiah(summary.revenue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] text-[#6B7280]">Rata-rata per Transaksi</p>
          <p className="mt-1 text-[20px] font-bold">{formatRupiah(summary.average)}</p>
        </div>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="card space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-11 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10">
          <EmptyState
            icon="history"
            tone="neutral"
            title="Belum ada transaksi"
            description="Transaksi yang sesuai dengan filter akan tampil di sini."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] text-[9px] uppercase text-[#6B7280]">
              <tr>
                {["No. Transaksi", "Waktu", "Kasir", "Metode", "Total", "Status", "Aksi"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.map((t) => {
                const isSelected = selectedTrx?.id === t.id;
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTrx(t)}
                    className={`cursor-pointer border-t border-[#F3F4F6] text-[10px] transition-colors hover:bg-[#FFF7F7] ${
                      isSelected ? "bg-[#FFF7F7]" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-[#DC2626]">{t.invoiceNumber}</td>
                    <td>{formatDateTime(t.createdAt)}</td>
                    <td>{t.cashier}</td>
                    <td>
                      <Pill tone="neutral">{t.paymentMethod}</Pill>
                    </td>
                    <td className="font-semibold">{formatRupiah(t.total)}</td>
                    <td>
                      <Pill tone={statusTone(t.status)}>{t.status}</Pill>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedTrx(t)}
                          className="font-semibold text-[#DC2626] hover:underline"
                        >
                          Lihat Struk
                        </button>
                        {t.status === "Selesai" && (
                          <button
                            type="button"
                            onClick={() => setReturningTrx(t)}
                            className="text-[#6B7280] hover:text-[#DC2626]"
                          >
                            Retur
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-[#E5E7EB] px-5 py-3 text-[10px] text-[#6B7280]">
            <span>
              Menampilkan {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)} dari{" "}
              {filtered.length} transaksi
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`rounded-lg px-3 py-1.5 ${
                    n === safePage ? "bg-[#DC2626] text-white" : "border"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}

      <Drawer
        open={Boolean(selectedTrx)}
        onClose={() => setSelectedTrx(null)}
        title="Detail Struk"
        subtitle={
          selectedTrx
            ? `${selectedTrx.invoiceNumber} • ${formatDateTime(selectedTrx.createdAt)}`
            : undefined
        }
        footer={
          selectedTrx && (
            <div className="grid grid-cols-2 gap-3">
              <Button icon="print" className="h-11" onClick={() => window.print()}>
                Cetak Struk
              </Button>
              <Button
                variant="danger-outline"
                className="h-11"
                disabled={selectedTrx.status !== "Selesai"}
                onClick={() => setReturningTrx(selectedTrx)}
              >
                {selectedTrx.status === "Diretur"
                  ? "Sudah Diretur"
                  : selectedTrx.status === "Dibatalkan"
                    ? "Dibatalkan"
                    : "Retur Transaksi"}
              </Button>
            </div>
          )
        }
      >
        {selectedTrx && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold">{settings?.storeName ?? "POS Mart"}</h3>
                <p className="mt-0.5 text-[10px] text-[#6B7280]">
                  {settings?.address ?? "Jl. Melati No. 24, Jakarta"}
                </p>
              </div>
              <Pill tone={statusTone(selectedTrx.status)}>{selectedTrx.status}</Pill>
            </div>

            <div className="border-y border-dashed border-[#D1D5DB] py-3 text-[10px] text-[#6B7280]">
              <div className="flex justify-between">
                <span>No. Transaksi</span>
                <b className="text-[#111827]">{selectedTrx.invoiceNumber}</b>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Waktu</span>
                <span>{formatDateTime(selectedTrx.createdAt)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Kasir</span>
                <span>{selectedTrx.cashier}</span>
              </div>
            </div>

            <div className="space-y-3 py-4 text-[11px]">
              {selectedTrx.items.map((item) => (
                <div key={`${item.productId}-${item.name}`} className="flex justify-between">
                  <span>
                    {item.qty}× {item.name}
                  </span>
                  <b>{formatRupiah(item.subtotal)}</b>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-dashed border-[#D1D5DB] pt-3 text-[11px]">
              <div className="flex justify-between text-[#6B7280]">
                <span>Subtotal</span>
                <span>{formatRupiah(selectedTrx.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>PPN</span>
                <span>{formatRupiah(selectedTrx.tax)}</span>
              </div>
              <div className="flex justify-between pt-1 text-[15px] font-bold">
                <span>Total</span>
                <span>{formatRupiah(selectedTrx.total)}</span>
              </div>
              <div className="flex justify-between pt-2 text-[#6B7280]">
                <span>Metode</span>
                <b className="text-[#111827]">{selectedTrx.paymentMethod}</b>
              </div>
              {selectedTrx.paymentMethod === "Tunai" && (
                <>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Uang Diterima</span>
                    <span>{formatRupiah(selectedTrx.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Kembalian</span>
                    <span className="font-semibold text-[#16A34A]">
                      {formatRupiah(selectedTrx.change)}
                    </span>
                  </div>
                </>
              )}
              {selectedTrx.note && (
                <div className="rounded-lg bg-[#F9FAFB] p-2.5 text-[10px] text-[#4B5563]">
                  Catatan: {selectedTrx.note}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(returningTrx)}
        onClose={() => setReturningTrx(null)}
        onConfirm={() => void handleConfirmRetur()}
        title="Retur transaksi ini?"
        description={`Status transaksi ${returningTrx?.invoiceNumber ?? ""} akan diubah menjadi Diretur dan stok produk akan dikembalikan.`}
        confirmLabel="Ya, Retur"
        cancelLabel="Batal"
        loading={returningLoading}
      />

      <PrintReceipt transaction={selectedTrx} settings={settings} />
    </>
  );
}
