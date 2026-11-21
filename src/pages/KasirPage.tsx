import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { PaymentModal } from "@/components/PaymentModal";
import { PaymentSuccessModal } from "@/components/PaymentSuccessModal";
import { PrintReceipt } from "@/components/PrintReceipt";
import { ProductPhoto } from "@/components/ProductPhoto";
import { ScanCodeModal } from "@/components/ScanCodeModal";
import { Skeleton } from "@/components/Skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useProductStore } from "@/store/useProductStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useToastStore } from "@/store/useToastStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import type { Product, Transaction } from "@/types";
import { formatRupiah } from "@/utils/format";

export function KasirPage() {
  const [category, setCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const user = useAuthStore((s) => s.user);
  const { products, categories, loading, fetchProducts, decrementStock } = useProductStore();
  const { settings, fetchSettings } = useSettingsStore();
  const createTransaction = useTransactionStore((s) => s.createTransaction);
  const showToast = useToastStore((s) => s.showToast);

  const {
    items: cart,
    paymentMethod,
    note,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    setPaymentMethod,
    setNote,
  } = useCartStore();

  useEffect(() => {
    if (products.length === 0) {
      void fetchProducts();
    }
    if (!settings) {
      void fetchSettings();
    }
  }, [products.length, fetchProducts, settings, fetchSettings]);

  // Shortcut "/" focuses search
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (isTyping || paymentModalOpen || confirmClearOpen) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paymentModalOpen, confirmClearOpen]);

  const lowStockThreshold = settings?.lowStockThreshold ?? 5;
  const taxRate = settings?.taxEnabled ? settings.taxRate : 0;

  const enabledPaymentMethods = [
    (settings?.paymentMethods.tunai ?? true) && "Tunai",
    (settings?.paymentMethods.qris ?? true) && "QRIS",
    (settings?.paymentMethods.transfer ?? true) && "Transfer",
  ].filter(Boolean) as ("Tunai" | "QRIS" | "Transfer")[];
  const availablePaymentMethods: ("Tunai" | "QRIS" | "Transfer")[] =
    enabledPaymentMethods.length > 0 ? enabledPaymentMethods : ["Tunai"];

  useEffect(() => {
    if (!availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0]);
    }
  }, [availablePaymentMethods, paymentMethod, setPaymentMethod]);

  const activeProducts = products.filter((p) => p.active);
  const query = search.trim().toLowerCase();
  const filtered = activeProducts.filter((p) => {
    const matchesCategory = category === "Semua" || p.category === category;
    if (!matchesCategory) return false;
    if (!query) return true;
    return p.name.toLowerCase().includes(query) || p.barcode.toLowerCase().includes(query);
  });

  const handleAddProduct = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`${product.name} sedang habis.`, "error");
      return;
    }
    const existing = cart.find((i) => i.product.id === product.id);
    const currentQty = existing?.qty ?? 0;
    if (currentQty >= product.stock) {
      showToast(`Stok ${product.name} tidak mencukupi.`, "warning");
      return;
    }
    addItem(product);
    if (product.stock - (currentQty + 1) > 0 && product.stock <= lowStockThreshold) {
      showToast(`Stok hampir habis (${product.name}: sisa ${product.stock})`, "warning");
    }
  };

  const handleChangeQty = (productId: string, delta: number) => {
    if (delta > 0) {
      const item = cart.find((i) => i.product.id === productId);
      const liveProduct = products.find((p) => p.id === productId) ?? item?.product;
      if (item && liveProduct && item.qty >= liveProduct.stock) {
        showToast(`Maksimal stok ${liveProduct.name} (${liveProduct.stock}) tercapai.`, "warning");
        return;
      }
    }
    updateQty(productId, delta);
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !query) return;
    const exactMatch = activeProducts.find(
      (p) => p.barcode.toLowerCase() === query || p.name.toLowerCase() === query,
    );
    if (exactMatch) {
      e.preventDefault();
      handleAddProduct(exactMatch);
      setSearch("");
    }
  };

  const handleCodeDetected = (code: string) => {
    const normalized = code.trim().toLowerCase();
    const matched = activeProducts.find(
      (p) =>
        p.barcode.toLowerCase() === normalized ||
        p.id.toLowerCase() === normalized ||
        p.name.toLowerCase() === normalized,
    );
    if (matched) {
      handleAddProduct(matched);
      showToast(`${matched.name} ditambahkan ke keranjang.`, "success");
      setScanModalOpen(false);
    } else {
      showToast(`Produk dengan kode "${code}" tidak ditemukan.`, "error");
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const tax = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + tax;

  const handleConfirmPayment = async (amountPaid: number) => {
    if (cart.length === 0) return;
    setProcessingPayment(true);
    try {
      const change = Math.max(0, amountPaid - total);
      const trx = await createTransaction({
        items: cart.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          price: i.product.price,
          costPrice: i.product.costPrice,
          qty: i.qty,
          subtotal: i.product.price * i.qty,
        })),
        subtotal,
        tax,
        total,
        paymentMethod,
        status: "Selesai",
        cashier: user?.name ?? "John Doe",
        amountPaid,
        change,
        note: note.trim() || undefined,
      });

      await decrementStock(cart.map((i) => ({ productId: i.product.id, qty: i.qty })));

      clearCart();
      setShowNoteInput(false);
      setPaymentModalOpen(false);
      setCompletedTransaction(trx);
      showToast(`Pembayaran ${trx.invoiceNumber} berhasil.`, "success");
      if (settings?.printer.autoPrint) {
        setTimeout(() => window.print(), 200);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Pembayaran gagal, coba lagi.", "error");
    } finally {
      setProcessingPayment(false);
    }
  };

  const categoryTabs = ["Semua", ...categories.map((c) => c.name)];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Kasir" subtitle="Pilih produk dan selesaikan transaksi pelanggan" />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex h-11 min-w-[280px] flex-1 items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,.03)] focus-within:border-[#DC2626]">
          <Icon name="search" className="text-[#9CA3AF]" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#9CA3AF]"
            placeholder="Cari produk atau scan barcode... (tekan /)"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Hapus pencarian"
              className="text-[#9CA3AF] hover:text-[#111827]"
            >
              <Icon name="close" size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setScanModalOpen(true)}
            aria-label="Pindai barcode atau QR code"
            title="Pindai barcode / QR code"
            className="rounded-lg p-1 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#DC2626]"
          >
            <Icon name="barcode" />
          </button>
        </label>
        <div className="flex flex-wrap gap-2">
          {categoryTabs.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`h-10 rounded-xl px-4 text-[11px] font-semibold transition-colors ${
                category === c
                  ? "bg-[#DC2626] text-white"
                  : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.7fr)_minmax(340px,.9fr)] gap-5 max-xl:grid-cols-[minmax(0,1fr)_340px] max-lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-h-0 overflow-auto pr-1">
          <div className="grid grid-cols-4 gap-4 pb-1 max-xl:grid-cols-3 max-lg:grid-cols-2">
            {loading && products.length === 0 ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="card overflow-hidden p-3">
                  <Skeleton className="h-[110px] w-full" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon="search"
                  tone="neutral"
                  title="Produk tidak ditemukan"
                  description="Coba kata kunci lain atau ubah filter kategori."
                />
              </div>
            ) : (
              filtered.map((p) => {
                const isOut = p.stock <= 0;
                const isLow = !isOut && p.stock <= lowStockThreshold;
                return (
                  <article
                    key={p.id}
                    className={`card group overflow-hidden ${isOut ? "opacity-80" : ""}`}
                  >
                    <div className="relative">
                      <ProductPhoto
                        pos={p.pos}
                        imageUrl={p.imageUrl}
                        alt={p.name}
                        className={`h-[126px] w-full ${isOut ? "grayscale opacity-40" : ""}`}
                      />
                      {isOut && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[9px] font-bold text-[#6B7280]">
                          Habis
                        </span>
                      )}
                      {isLow && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[9px] font-bold text-[#B45309]">
                          Sisa {p.stock}
                        </span>
                      )}
                    </div>
                    <div className="flex items-end justify-between p-3.5">
                      <div className="min-w-0 pr-2">
                        <h3 className="truncate text-[12px] font-semibold">{p.name}</h3>
                        <p className="mt-1.5 text-[14px] font-bold">{formatRupiah(p.price)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={isOut}
                        onClick={() => handleAddProduct(p)}
                        aria-label={`Tambah ${p.name}`}
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white transition-colors ${
                          isOut
                            ? "cursor-not-allowed bg-[#D1D5DB]"
                            : "bg-[#DC2626] hover:bg-[#B91C1C]"
                        }`}
                      >
                        <Icon name="plus" size={17} />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <article className="card flex min-h-0 flex-col p-5">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h2 className="text-[17px] font-bold">Pesanan Saat Ini</h2>
              <p className="mt-1 text-[10px] text-[#9CA3AF]">
                {cart.reduce((n, i) => n + i.qty, 0)} item
              </p>
            </div>
            <Icon name="receipt" className="text-[#DC2626]" />
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {cart.length === 0 ? (
              <EmptyState
                icon="cart"
                title="Keranjang masih kosong"
                description="Pilih produk di sebelah kiri untuk mulai berjualan"
              />
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="grid grid-cols-[40px_1fr_72px_66px_18px] items-center gap-2 border-b border-[#F3F4F6] py-3"
                >
                  <ProductPhoto
                    pos={item.product.pos}
                    imageUrl={item.product.imageUrl}
                    alt={item.product.name}
                    className="h-10 w-10 rounded-lg"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold">{item.product.name}</p>
                    <p className="text-[9px] text-[#9CA3AF]">{formatRupiah(item.product.price)}</p>
                  </div>
                  <div className="flex h-7 items-center justify-between rounded-lg border border-[#E5E7EB] px-1">
                    <button
                      type="button"
                      onClick={() => handleChangeQty(item.product.id, -1)}
                      aria-label={`Kurangi ${item.product.name}`}
                    >
                      −
                    </button>
                    <span className="text-[10px] font-semibold">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => handleChangeQty(item.product.id, 1)}
                      aria-label={`Tambah ${item.product.name}`}
                      className="text-[#DC2626]"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-right text-[10px] font-bold">
                    {formatRupiah(item.product.price * item.qty)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                    className="text-[#9CA3AF] hover:text-[#DC2626]"
                    aria-label={`Hapus ${item.product.name}`}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="my-3">
            {showNoteInput ? (
              <div className="flex items-center gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan pesanan (misal: es sedikit)..."
                  className="h-8 flex-1 rounded-lg border border-[#E5E7EB] px-2.5 text-[10px] outline-none focus:border-[#DC2626]"
                />
                <button
                  type="button"
                  onClick={() => setShowNoteInput(false)}
                  className="text-[10px] font-semibold text-[#DC2626]"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNoteInput(true)}
                className="flex items-center gap-2 text-[10px] font-semibold text-[#6B7280] hover:text-[#111827]"
              >
                <Icon name="edit" size={14} />
                {note ? `Catatan: ${note}` : "Tambah Catatan"}
              </button>
            )}
          </div>

          <div className="space-y-2 border-t border-dashed border-[#D1D5DB] pt-3 text-[11px]">
            <div className="flex justify-between text-[#6B7280]">
              <span>Subtotal</span>
              <b className="text-[#374151]">{formatRupiah(subtotal)}</b>
            </div>
            <div className="flex justify-between text-[#6B7280]">
              <span>PPN ({taxRate}%)</span>
              <b className="text-[#374151]">{formatRupiah(tax)}</b>
            </div>
            <div className="flex justify-between pt-1 text-[16px] font-bold">
              <span>Total</span>
              <span>{formatRupiah(total)}</span>
            </div>
          </div>

          <p className="mb-2 mt-4 text-[10px] font-semibold text-[#6B7280]">Metode Pembayaran</p>
          <div
            className={`grid gap-2 ${
              availablePaymentMethods.length === 1
                ? "grid-cols-1"
                : availablePaymentMethods.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
            }`}
          >
            {availablePaymentMethods.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPaymentMethod(p)}
                className={`h-9 rounded-lg text-[10px] font-semibold ${
                  paymentMethod === p
                    ? "border border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]"
                    : "border border-[#E5E7EB] text-[#6B7280]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-[120px_1fr] gap-2">
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setConfirmClearOpen(true)}
              className="h-12 rounded-xl bg-[#F3F4F6] text-[10px] font-semibold text-[#4B5563] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hapus Keranjang
            </button>
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setPaymentModalOpen(true)}
              className="h-12 rounded-xl bg-[#DC2626] text-[13px] font-bold text-white shadow-[0_5px_14px_rgba(220,38,38,.24)] hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:shadow-none"
            >
              Bayar {formatRupiah(total)}
            </button>
          </div>
        </article>
      </div>

      <ConfirmDialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearCart();
          setShowNoteInput(false);
          setConfirmClearOpen(false);
          showToast("Keranjang dikosongkan.", "info");
        }}
        title="Kosongkan keranjang?"
        description="Semua produk di keranjang akan dihapus."
        confirmLabel="Ya, Kosongkan"
        cancelLabel="Batal"
        icon="cart"
      />

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        total={total}
        method={paymentMethod}
        onMethodChange={setPaymentMethod}
        settings={settings}
        processing={processingPayment}
        onConfirm={handleConfirmPayment}
      />

      <PaymentSuccessModal
        transaction={completedTransaction}
        onNewTransaction={() => setCompletedTransaction(null)}
        onPrint={() => window.print()}
      />

      <PrintReceipt transaction={completedTransaction} settings={settings} />

      <ScanCodeModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onDetected={handleCodeDetected}
      />
    </div>
  );
}
