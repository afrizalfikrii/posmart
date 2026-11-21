import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { Drawer } from "@/components/Drawer";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/Input";
import { ScanCodeModal } from "@/components/ScanCodeModal";
import { Toggle } from "@/components/Toggle";
import type { ProductInput } from "@/services/productService";
import type { Category, Product } from "@/types";

interface ProductDrawerProps {
  open: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  categories: Category[];
  existingProducts: Product[];
  onSave: (input: ProductInput, editingId?: string) => Promise<void>;
}

interface FormErrors {
  name?: string;
  price?: string;
  stock?: string;
  barcode?: string;
}

export function ProductDrawer({
  open,
  onClose,
  editingProduct,
  categories,
  existingProducts,
  onSave,
}: ProductDrawerProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Kopi");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [barcode, setBarcode] = useState("");
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setPhotoError(null);

    if (editingProduct) {
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      setPrice(String(editingProduct.price));
      setCostPrice(String(editingProduct.costPrice));
      setStock(String(editingProduct.stock));
      setBarcode(editingProduct.barcode);
      setActive(editingProduct.active);
      setImageUrl(editingProduct.imageUrl);
    } else {
      setName("");
      setCategory(categories[0]?.name ?? "Kopi");
      setPrice("");
      setCostPrice("");
      setStock("0");
      setBarcode("");
      setActive(true);
      setImageUrl(undefined);
    }
  }, [open, editingProduct, categories]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Ukuran foto maksimal 2 MB.");
      return;
    }
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const parsedPrice = Number.parseInt(price.replace(/\D/g, ""), 10) || 0;
  const parsedCost = Number.parseInt(costPrice.replace(/\D/g, ""), 10) || 0;
  const parsedStock = Number.parseInt(stock, 10);
  const costWarning =
    parsedCost > 0 && parsedPrice > 0 && parsedCost > parsedPrice
      ? "Harga modal lebih tinggi dari harga jual"
      : null;

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedBarcode = barcode.trim();

    if (!trimmedName) {
      nextErrors.name = "Nama produk wajib diisi";
    }

    if (parsedPrice <= 0) {
      nextErrors.price = "Harga jual harus lebih dari 0";
    }

    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      nextErrors.stock = "Stok tidak boleh kurang dari 0";
    }

    if (trimmedBarcode) {
      const duplicate = existingProducts.find(
        (p) => p.barcode.trim() === trimmedBarcode && p.id !== editingProduct?.id,
      );
      if (duplicate) {
        nextErrors.barcode = `Barcode sudah digunakan oleh ${duplicate.name}`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload: ProductInput = {
        name: name.trim(),
        category,
        price: parsedPrice,
        costPrice: parsedCost,
        stock: Number.isNaN(parsedStock) ? 0 : parsedStock,
        barcode: barcode.trim() || `8991001${String(Date.now()).slice(-6)}`,
        active,
        pos: editingProduct?.pos ?? "0% 0%",
        imageUrl,
      };
      await onSave(payload, editingProduct?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editingProduct ? "Edit Produk" : "Tambah Produk"}
      subtitle={
        editingProduct ? "Perbarui informasi dan stok produk" : "Lengkapi informasi produk baru"
      }
      footer={
        <div className="grid grid-cols-[120px_1fr] gap-3">
          <Button variant="secondary" className="h-11" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            type="submit"
            form="product-drawer-form"
            primary
            className="h-11"
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan Produk"}
          </Button>
        </div>
      }
    >
      <form id="product-drawer-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="grid h-[120px] cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] text-center hover:border-[#DC2626]">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            {imageUrl ? (
              <div className="relative h-full w-full">
                <img src={imageUrl} alt="Pratinjau produk" className="h-full w-full object-cover" />
                <span className="absolute bottom-2 right-2 rounded-lg bg-[#111827]/75 px-2.5 py-1 text-[9px] font-semibold text-white">
                  Ganti Foto
                </span>
              </div>
            ) : (
              <div className="text-[#6B7280]">
                <span className="mx-auto grid h-8 w-8 place-items-center">
                  <Icon name="upload" />
                </span>
                <b className="mt-1 block text-[10px]">Unggah Foto</b>
                <span className="mt-1 block text-[8px] text-[#9CA3AF]">
                  PNG atau JPG, maks. 2 MB
                </span>
              </div>
            )}
          </label>
          {photoError && (
            <p className="mt-1.5 text-[10px] font-medium text-[#DC2626]">{photoError}</p>
          )}
        </div>

        <Input
          label="Nama Produk"
          placeholder="Masukkan nama produk"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={errors.name}
        />

        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold text-[#374151]">Kategori</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-[11px] text-[#111827] outline-none focus:border-[#DC2626]"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Harga Jual"
            prefix="Rp"
            inputMode="numeric"
            placeholder="0"
            value={parsedPrice > 0 ? parsedPrice.toLocaleString("id-ID") : ""}
            onChange={(e) => {
              setPrice(e.target.value.replace(/\D/g, ""));
              if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
            }}
            error={errors.price}
          />
          <div>
            <Input
              label="Harga Modal"
              prefix="Rp"
              inputMode="numeric"
              placeholder="0"
              value={parsedCost > 0 ? parsedCost.toLocaleString("id-ID") : ""}
              onChange={(e) => setCostPrice(e.target.value.replace(/\D/g, ""))}
            />
            {costWarning && (
              <p className="mt-1.5 text-[10px] font-medium text-[#D97706]">{costWarning}</p>
            )}
          </div>
        </div>

        <Input
          label="Stok"
          type="number"
          min={0}
          placeholder="0"
          value={stock}
          onChange={(e) => {
            setStock(e.target.value);
            if (errors.stock) setErrors((prev) => ({ ...prev, stock: undefined }));
          }}
          error={errors.stock}
        />

        <Input
          label="Barcode"
          placeholder="Pindai atau masukkan barcode"
          value={barcode}
          onChange={(e) => {
            setBarcode(e.target.value);
            if (errors.barcode) setErrors((prev) => ({ ...prev, barcode: undefined }));
          }}
          error={errors.barcode}
          rightElement={
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              aria-label="Pindai barcode atau QR code"
              title="Pindai barcode / QR code"
              className="rounded-md p-1 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#DC2626]"
            >
              <Icon name="barcode" size={17} />
            </button>
          }
        />

        <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4">
          <div>
            <p className="text-[11px] font-semibold">Produk aktif</p>
            <p className="mt-1 text-[9px] text-[#9CA3AF]">Produk dapat dipilih di halaman kasir</p>
          </div>
          <Toggle on={active} onChange={setActive} ariaLabel="Toggle produk aktif" />
        </div>
      </form>
      <ScanCodeModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDetected={(code) => {
          setBarcode(code);
          if (errors.barcode) setErrors((prev) => ({ ...prev, barcode: undefined }));
          setScanOpen(false);
        }}
      />
    </Drawer>
  );
}
