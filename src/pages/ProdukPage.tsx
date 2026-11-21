import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { Pill, type PillTone } from "@/components/Pill";
import { ProductDrawer } from "@/components/ProductDrawer";
import { ProductPhoto } from "@/components/ProductPhoto";
import { Skeleton } from "@/components/Skeleton";
import type { ProductInput } from "@/services/productService";
import { useProductStore } from "@/store/useProductStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useToastStore } from "@/store/useToastStore";
import type { Product } from "@/types";
import { formatRupiah } from "@/utils/format";

type StockFilter = "Semua" | "Tersedia" | "Stok Menipis" | "Habis";
type ViewMode = "list" | "grid";

const PAGE_SIZE = 8;

function StockStatusPill({ stock, threshold }: { stock: number; threshold: number }) {
  const status = stock === 0 ? "Habis" : stock <= threshold ? "Menipis" : "Tersedia";
  const tone: PillTone =
    status === "Tersedia" ? "success" : status === "Menipis" ? "warning" : "danger";
  return <Pill tone={tone}>{status}</Pill>;
}

export function ProdukPage() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status");
  const validStatuses: StockFilter[] = ["Semua", "Tersedia", "Stok Menipis", "Habis"];
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState<StockFilter>(
    validStatuses.includes(initialStatus as StockFilter) ? (initialStatus as StockFilter) : "Semua",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    products,
    categories,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProducts,
  } = useProductStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "Admin";
  const { settings, fetchSettings } = useSettingsStore();
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (products.length === 0) {
      void fetchProducts();
    }
    if (!settings) {
      void fetchSettings();
    }
  }, [products.length, fetchProducts, settings, fetchSettings]);

  const lowStockThreshold = settings?.lowStockThreshold ?? 5;

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold).length,
    [products, lowStockThreshold],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "Semua" && p.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === "Tersedia" && p.stock <= lowStockThreshold) {
        return false;
      }
      if (statusFilter === "Stok Menipis" && (p.stock <= 0 || p.stock > lowStockThreshold)) {
        return false;
      }
      if (statusFilter === "Habis" && p.stock !== 0) {
        return false;
      }
      if (q) {
        return p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, categoryFilter, statusFilter, search, lowStockThreshold]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, categoryFilter, statusFilter]);

  const allOnPageSelected =
    paginated.length > 0 && paginated.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      const pageIds = new Set(paginated.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...paginated.map((p) => p.id)]);
      setSelectedIds(Array.from(merged));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setDrawerOpen(true);
  };

  const handleSaveProduct = async (input: ProductInput, editingId?: string) => {
    try {
      if (editingId) {
        await updateProduct(editingId, input);
        showToast("Produk berhasil diperbarui.", "success");
      } else {
        await createProduct(input);
        showToast("Produk berhasil disimpan.", "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menyimpan produk.", "error");
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await deleteProduct(deletingProduct.id);
      setSelectedIds((prev) => prev.filter((id) => id !== deletingProduct.id));
      showToast(`Produk "${deletingProduct.name}" dihapus.`, "success");
      setDeletingProduct(null);
    } catch {
      showToast("Gagal menghapus produk.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    try {
      const count = selectedIds.length;
      await deleteProducts(selectedIds);
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      showToast(`${count} produk berhasil dihapus.`, "success");
    } catch {
      showToast("Gagal menghapus produk terpilih.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Produk"
        subtitle={
          isAdmin
            ? "Kelola daftar produk dan stok"
            : "Daftar produk dan informasi stok (hanya baca)"
        }
        actions={
          isAdmin ? (
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  variant="danger-outline"
                  icon="trash"
                  onClick={() => setConfirmBulkDelete(true)}
                >
                  Hapus Terpilih ({selectedIds.length})
                </Button>
              )}
              <Button primary icon="plus" onClick={handleOpenAdd}>
                Tambah Produk
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex h-10 w-[300px] items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 focus-within:border-[#DC2626]">
          <Icon name="search" size={16} className="text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[11px] outline-none"
            placeholder="Cari nama produk atau barcode..."
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-[#9CA3AF] hover:text-[#111827]"
              aria-label="Hapus pencarian"
            >
              <Icon name="close" size={13} />
            </button>
          )}
        </label>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[11px] text-[#4B5563] outline-none focus:border-[#DC2626]"
        >
          <option value="Semua">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex rounded-xl border border-[#E5E7EB] bg-white p-1">
          {(["Semua", "Tersedia", "Stok Menipis", "Habis"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                statusFilter === s
                  ? "bg-[#FEE2E2] text-[#DC2626]"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setViewMode((v) => (v === "list" ? "grid" : "list"))}
          title={viewMode === "list" ? "Tampilan Grid" : "Tampilan Tabel"}
          aria-label="Ubah tampilan daftar atau grid"
          className={`ml-auto grid h-10 w-10 place-items-center rounded-xl border bg-white ${
            viewMode === "grid"
              ? "border-[#DC2626] text-[#DC2626]"
              : "border-[#E5E7EB] text-[#4B5563]"
          }`}
        >
          <Icon name="dashboard" size={16} />
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[11px]">
          <span className="flex items-center gap-2 font-medium text-[#92400E]">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
            {lowStockCount} produk stoknya hampir habis
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter("Stok Menipis")}
            className="font-bold text-[#B45309] hover:underline"
          >
            Lihat
          </button>
        </div>
      )}

      {loading && products.length === 0 ? (
        <div className="card space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10">
          <EmptyState
            icon="product"
            tone="neutral"
            title="Produk tidak ditemukan"
            description="Tidak ada produk yang cocok dengan filter atau pencarian Anda."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("Semua");
                  setStatusFilter("Semua");
                }}
              >
                Reset Filter
              </Button>
            }
          />
        </div>
      ) : viewMode === "grid" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-3">
            {paginated.map((p) => (
              <article key={p.id} className="card overflow-hidden">
                <div className="relative">
                  <ProductPhoto
                    pos={p.pos}
                    imageUrl={p.imageUrl}
                    alt={p.name}
                    className="h-[120px] w-full"
                  />
                  <div className="absolute left-2.5 top-2.5">
                    <StockStatusPill stock={p.stock} threshold={lowStockThreshold} />
                  </div>
                </div>
                <div className="p-3.5">
                  <p className="text-[9px] text-[#6B7280]">{p.category}</p>
                  <h3 className="mt-0.5 truncate text-[12px] font-bold">{p.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-bold">{formatRupiah(p.price)}</p>
                      <p className="text-[9px] text-[#6B7280]">Stok: {p.stock}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          aria-label={`Edit ${p.name}`}
                          className="grid h-8 w-8 place-items-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]"
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProduct(p)}
                          aria-label={`Hapus ${p.name}`}
                          className="grid h-8 w-8 place-items-center rounded-lg text-[#DC2626] hover:bg-[#FEE2E2]"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="card flex items-center justify-between px-5 py-3 text-[10px] text-[#6B7280]">
            <span>
              Menampilkan {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)} dari{" "}
              {filtered.length} produk
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
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#F9FAFB] text-[9px] font-semibold uppercase tracking-wide text-[#6B7280]">
              <tr>
                {isAdmin && (
                  <th className="w-12 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAll}
                      aria-label="Pilih semua produk di halaman ini"
                    />
                  </th>
                )}
                <th className={!isAdmin ? "pl-5 py-3" : ""}>Foto + Nama Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
                {isAdmin && <th className="pr-5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.id} className="border-t border-[#F3F4F6] text-[11px]">
                  {isAdmin && (
                    <td className="px-5 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        aria-label={`Pilih ${p.name}`}
                      />
                    </td>
                  )}
                  <td className={!isAdmin ? "pl-5 py-2.5" : ""}>
                    <div className="flex items-center gap-3">
                      <ProductPhoto
                        pos={p.pos}
                        imageUrl={p.imageUrl}
                        alt={p.name}
                        className="h-10 w-10 rounded-lg"
                      />
                      <div>
                        <b>{p.name}</b>
                        {!p.active && (
                          <span className="ml-2 rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[9px] font-medium text-[#6B7280]">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-[#6B7280]">{p.category}</td>
                  <td className="font-semibold">{formatRupiah(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <StockStatusPill stock={p.stock} threshold={lowStockThreshold} />
                  </td>
                  {isAdmin && (
                    <td className="pr-5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          aria-label={`Edit ${p.name}`}
                          className="grid h-8 w-8 place-items-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]"
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProduct(p)}
                          aria-label={`Hapus ${p.name}`}
                          className="grid h-8 w-8 place-items-center rounded-lg text-[#DC2626] hover:bg-[#FEE2E2]"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-[#E5E7EB] px-5 py-3 text-[10px] text-[#6B7280]">
            <span>
              Menampilkan {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)} dari{" "}
              {filtered.length} produk
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

      <ProductDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        editingProduct={editingProduct}
        categories={categories}
        existingProducts={products}
        onSave={handleSaveProduct}
      />

      <ConfirmDialog
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Hapus produk ini?"
        description={`Produk "${deletingProduct?.name ?? ""}" yang dihapus tidak bisa dikembalikan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        loading={deleting}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={() => void handleConfirmBulkDelete()}
        title={`Hapus ${selectedIds.length} produk terpilih?`}
        description="Semua produk yang dipilih akan dihapus permanen."
        confirmLabel="Hapus Semua"
        cancelLabel="Batal"
        loading={deleting}
      />
    </>
  );
}
