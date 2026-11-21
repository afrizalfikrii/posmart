import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { Pill } from "@/components/Pill";
import { PrintReceipt } from "@/components/PrintReceipt";
import { Skeleton } from "@/components/Skeleton";
import { Toggle } from "@/components/Toggle";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useToastStore } from "@/store/useToastStore";
import type { Employee, StoreSettings, Transaction, UserRole } from "@/types";
import { formatRupiah } from "@/utils/format";

type SettingsTab = "Profil Toko" | "Pajak & Struk" | "Metode Pembayaran" | "Printer" | "Karyawan";

const TABS: SettingsTab[] = [
  "Profil Toko",
  "Pajak & Struk",
  "Metode Pembayaran",
  "Printer",
  "Karyawan",
];

function ReceiptPreview({ draft }: { draft: StoreSettings }) {
  const subtotal = 33000;
  const taxRate = draft.taxEnabled ? draft.taxRate : 0;
  const tax = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + tax;

  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold text-[#6B7280]">Pratinjau Langsung</p>
      <div className="card p-5 text-center">
        {draft.logoUrl ? (
          <img
            src={draft.logoUrl}
            alt={draft.storeName}
            className="mx-auto h-10 w-10 rounded-xl object-contain"
          />
        ) : (
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#FEE2E2] text-[#DC2626]">
            <Icon name="cashier" />
          </div>
        )}
        <h3 className="mt-3 text-[15px] font-bold">{draft.storeName || "POS Mart"}</h3>
        <p className="mt-1 text-[8px] text-[#6B7280]">{draft.address}</p>
        <p className="text-[8px] text-[#9CA3AF]">Telp: {draft.phone}</p>
        <div className="my-4 border-t border-dashed" />
        <div className="space-y-2 text-left text-[9px]">
          <div className="flex justify-between">
            <span>Kopi Susu × 1</span>
            <span>{formatRupiah(18000)}</span>
          </div>
          <div className="flex justify-between">
            <span>Roti Bakar × 1</span>
            <span>{formatRupiah(15000)}</span>
          </div>
        </div>
        <div className="my-4 border-t border-dashed" />
        <div className="space-y-2 text-[9px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          {draft.showTaxOnReceipt && taxRate > 0 && (
            <div className="flex justify-between">
              <span>PPN ({taxRate}%)</span>
              <span>{formatRupiah(tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-[13px] font-bold">
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>
        </div>
        <p className="mt-5 text-[8px] text-[#9CA3AF]">
          {draft.receiptFooter || "Terima kasih telah berbelanja"}
        </p>
      </div>
    </div>
  );
}

export function PengaturanPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Profil Toko");
  const [pendingTab, setPendingTab] = useState<SettingsTab | null>(null);
  const [draft, setDraft] = useState<StoreSettings | null>(null);
  const [testReceipt, setTestReceipt] = useState<Transaction | null>(null);

  // Employee modal state
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [deletingEmp, setDeletingEmp] = useState<Employee | null>(null);
  const [empName, setEmpName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empRole, setEmpRole] = useState<UserRole>("Kasir");
  const [empPin, setEmpPin] = useState("123456");
  const [empError, setEmpError] = useState<string | null>(null);

  const { settings, loading, saving, fetchSettings, saveSettings } = useSettingsStore();
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (!settings) {
      void fetchSettings();
    }
  }, [settings, fetchSettings]);

  useEffect(() => {
    if (settings && !draft) {
      setDraft(structuredClone(settings));
    }
  }, [settings, draft]);

  const isDirty = useMemo(() => {
    if (!settings || !draft) return false;
    return JSON.stringify(settings) !== JSON.stringify(draft);
  }, [settings, draft]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const handleTabClick = (tab: SettingsTab) => {
    if (tab === activeTab) return;
    if (isDirty) {
      setPendingTab(tab);
    } else {
      setActiveTab(tab);
    }
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !draft) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran logo maksimal 2 MB.", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraft({ ...draft, logoUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.storeName.trim()) {
      showToast("Nama toko wajib diisi.", "error");
      return;
    }
    try {
      const saved = await saveSettings(draft);
      setDraft(structuredClone(saved));
      showToast("Pengaturan berhasil disimpan.", "success");
    } catch {
      showToast("Gagal menyimpan pengaturan.", "error");
    }
  };

  const handleReset = () => {
    if (!settings) return;
    setDraft(structuredClone(settings));
    showToast("Perubahan dibatalkan.", "info");
  };

  const handleTestPrint = () => {
    const sample: Transaction = {
      id: "test-print",
      invoiceNumber: "#TES-0001",
      createdAt: new Date().toISOString(),
      items: [
        {
          productId: "prod-01",
          name: "Kopi Susu",
          price: 18000,
          costPrice: 8500,
          qty: 1,
          subtotal: 18000,
        },
        {
          productId: "prod-04",
          name: "Roti Bakar",
          price: 15000,
          costPrice: 7500,
          qty: 1,
          subtotal: 15000,
        },
      ],
      subtotal: 33000,
      tax: Math.round(33000 * ((draft?.taxEnabled ? draft.taxRate : 0) / 100)),
      total: 33000 + Math.round(33000 * ((draft?.taxEnabled ? draft.taxRate : 0) / 100)),
      paymentMethod: "Tunai",
      status: "Selesai",
      cashier: "Tes Printer",
      amountPaid: 50000,
      change: 13370,
    };
    setTestReceipt(sample);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const openAddEmployee = () => {
    setEditingEmp(null);
    setEmpName("");
    setEmpEmail("");
    setEmpPhone("");
    setEmpRole("Kasir");
    setEmpPin("123456");
    setEmpError(null);
    setEmpModalOpen(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpName(emp.name);
    setEmpEmail(emp.email);
    setEmpPhone(emp.phone);
    setEmpRole(emp.role);
    setEmpPin(emp.pin ?? "123456");
    setEmpError(null);
    setEmpModalOpen(true);
  };

  const handleSaveEmployee = (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!empName.trim() || !empEmail.trim() || !empPin.trim()) {
      setEmpError("Nama, email, dan PIN wajib diisi.");
      return;
    }

    if (editingEmp) {
      const updated = draft.employees.map((item) =>
        item.id === editingEmp.id
          ? {
              ...item,
              name: empName.trim(),
              email: empEmail.trim(),
              phone: empPhone.trim() || "-",
              role: empRole,
              pin: empPin.trim(),
            }
          : item,
      );
      setDraft({ ...draft, employees: updated });
    } else {
      const created: Employee = {
        id: `user-${Date.now()}`,
        name: empName.trim(),
        email: empEmail.trim(),
        phone: empPhone.trim() || "-",
        role: empRole,
        pin: empPin.trim(),
        active: true,
      };
      setDraft({ ...draft, employees: [...draft.employees, created] });
    }

    setEmpModalOpen(false);
    showToast(
      editingEmp
        ? "Data karyawan diperbarui. Klik Simpan Perubahan untuk menerapkan."
        : "Karyawan ditambahkan. Klik Simpan Perubahan untuk menerapkan.",
      "info",
    );
  };

  const handleDeleteEmployee = () => {
    if (!draft || !deletingEmp) return;
    setDraft({
      ...draft,
      employees: draft.employees.filter((e) => e.id !== deletingEmp.id),
    });
    setDeletingEmp(null);
    showToast("Karyawan dihapus dari daftar. Klik Simpan Perubahan untuk menerapkan.", "info");
  };

  if (loading && !draft) {
    return (
      <>
        <PageHeader title="Pengaturan" subtitle="Atur informasi dan preferensi toko" />
        <div className="grid grid-cols-[200px_1fr_280px] gap-5">
          <Skeleton className="h-[240px]" />
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[340px]" />
        </div>
      </>
    );
  }

  if (!draft) return null;

  return (
    <>
      <PageHeader title="Pengaturan" subtitle="Atur informasi dan preferensi toko" />

      <div className="grid grid-cols-[200px_1fr_280px] gap-5 max-xl:grid-cols-[180px_1fr] max-lg:grid-cols-1">
        <nav className="card h-fit p-2" aria-label="Menu pengaturan">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTabClick(t)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[11px] font-semibold transition-colors ${
                activeTab === t
                  ? "bg-[#FEE2E2] text-[#DC2626]"
                  : "text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              {t}
              {activeTab === t && <Icon name="chevron" size={14} />}
            </button>
          ))}
        </nav>

        <div className="card p-6">
          {activeTab === "Profil Toko" && (
            <>
              <h2 className="text-[16px] font-bold">Profil Toko</h2>
              <p className="mt-1 text-[10px] text-[#9CA3AF]">
                Informasi ini akan tampil pada struk pelanggan.
              </p>
              <div className="my-5 flex items-center gap-4">
                {draft.logoUrl ? (
                  <img
                    src={draft.logoUrl}
                    alt="Logo toko"
                    className="h-16 w-16 rounded-xl border border-[#E5E7EB] object-contain p-1"
                  />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] text-[#DC2626]">
                    <Icon name="cashier" size={26} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-4 text-[11px] font-semibold text-[#4B5563] hover:bg-[#F9FAFB]">
                      Unggah Logo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                    {draft.logoUrl && (
                      <Button
                        variant="secondary"
                        onClick={() => setDraft({ ...draft, logoUrl: undefined })}
                      >
                        Hapus
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-[9px] text-[#9CA3AF]">PNG atau JPG, maks. 2 MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nama Toko"
                  value={draft.storeName}
                  onChange={(e) => setDraft({ ...draft, storeName: e.target.value })}
                />
                <Input
                  label="Nomor Telepon"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
                <div className="col-span-2">
                  <Input
                    label="Alamat"
                    value={draft.address}
                    onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    label="Jam Operasional"
                    value={draft.operationalHours}
                    onChange={(e) => setDraft({ ...draft, operationalHours: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === "Pajak & Struk" && (
            <>
              <h2 className="text-[16px] font-bold">Pajak & Struk</h2>
              <p className="mt-1 text-[10px] text-[#9CA3AF]">
                Atur tarif PPN, batas stok menipis, dan tampilan struk.
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4">
                  <div>
                    <p className="text-[11px] font-semibold">Aktifkan PPN</p>
                    <p className="mt-1 text-[9px] text-[#9CA3AF]">
                      Hitung PPN otomatis pada setiap transaksi di kasir.
                    </p>
                  </div>
                  <Toggle
                    on={draft.taxEnabled}
                    onChange={(val) => setDraft({ ...draft, taxEnabled: val })}
                    ariaLabel="Aktifkan PPN"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Persentase PPN (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={String(draft.taxRate)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        taxRate: Math.max(0, Number.parseInt(e.target.value || "0", 10)),
                      })
                    }
                  />
                  <Input
                    label="Batas Stok Menipis"
                    type="number"
                    min={1}
                    value={String(draft.lowStockThreshold)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        lowStockThreshold: Math.max(1, Number.parseInt(e.target.value || "1", 10)),
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4">
                  <div>
                    <p className="text-[11px] font-semibold">Tampilkan PPN di struk</p>
                    <p className="mt-1 text-[9px] text-[#9CA3AF]">
                      Rincian PPN akan dicetak pada struk pelanggan.
                    </p>
                  </div>
                  <Toggle
                    on={draft.showTaxOnReceipt}
                    onChange={(val) => setDraft({ ...draft, showTaxOnReceipt: val })}
                    ariaLabel="Tampilkan PPN di struk"
                  />
                </div>

                <Input
                  label="Teks Footer Struk"
                  value={draft.receiptFooter}
                  onChange={(e) => setDraft({ ...draft, receiptFooter: e.target.value })}
                />
              </div>
            </>
          )}

          {activeTab === "Metode Pembayaran" && (
            <>
              <h2 className="text-[16px] font-bold">Metode Pembayaran</h2>
              <p className="mt-1 text-[10px] text-[#9CA3AF]">
                Metode yang dinonaktifkan tidak akan tampil di kasir.
              </p>

              <div className="mt-5 space-y-4">
                {(
                  [
                    ["tunai", "Tunai", "Pembayaran uang tunai di kasir."],
                    ["qris", "QRIS", "Pembayaran QR dinamis/statis."],
                    ["transfer", "Transfer Bank", "Transfer ke rekening toko."],
                  ] as const
                ).map(([key, title, desc]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4"
                  >
                    <div>
                      <p className="text-[11px] font-semibold">{title}</p>
                      <p className="mt-1 text-[9px] text-[#9CA3AF]">{desc}</p>
                    </div>
                    <Toggle
                      on={draft.paymentMethods[key]}
                      onChange={(val) =>
                        setDraft({
                          ...draft,
                          paymentMethods: {
                            ...draft.paymentMethods,
                            [key]: val,
                          },
                        })
                      }
                      ariaLabel={`Aktifkan ${title}`}
                    />
                  </div>
                ))}

                <Input
                  label="Nama Merchant QRIS"
                  value={draft.paymentMethods.qrisMerchantName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      paymentMethods: {
                        ...draft.paymentMethods,
                        qrisMerchantName: e.target.value,
                      },
                    })
                  }
                />

                <Input
                  label="Informasi Rekening Bank (Transfer)"
                  value={draft.paymentMethods.bankAccount}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      paymentMethods: {
                        ...draft.paymentMethods,
                        bankAccount: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </>
          )}

          {activeTab === "Printer" && (
            <>
              <h2 className="text-[16px] font-bold">Pengaturan Printer</h2>
              <p className="mt-1 text-[10px] text-[#9CA3AF]">
                Konfigurasi ukuran kertas thermal dan cetak otomatis.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <span className="mb-2 block text-[11px] font-semibold text-[#374151]">
                    Ukuran Kertas Struk
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {(["58mm", "80mm"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            printer: { ...draft.printer, paperSize: size },
                          })
                        }
                        className={`h-11 rounded-xl border text-[11px] font-semibold ${
                          draft.printer.paperSize === size
                            ? "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]"
                            : "border-[#E5E7EB] text-[#6B7280]"
                        }`}
                      >
                        Thermal {size}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Nama Printer"
                  value={draft.printer.printerName}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      printer: {
                        ...draft.printer,
                        printerName: e.target.value,
                      },
                    })
                  }
                />

                <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] p-4">
                  <div>
                    <p className="text-[11px] font-semibold">Cetak otomatis setelah bayar</p>
                    <p className="mt-1 text-[9px] text-[#9CA3AF]">
                      Buka dialog cetak secara otomatis saat pembayaran selesai.
                    </p>
                  </div>
                  <Toggle
                    on={draft.printer.autoPrint}
                    onChange={(val) =>
                      setDraft({
                        ...draft,
                        printer: { ...draft.printer, autoPrint: val },
                      })
                    }
                    ariaLabel="Cetak otomatis setelah bayar"
                  />
                </div>

                <Button icon="print" onClick={handleTestPrint}>
                  Tes Cetak
                </Button>
              </div>
            </>
          )}

          {activeTab === "Karyawan" && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-bold">Daftar Karyawan</h2>
                  <p className="mt-1 text-[10px] text-[#9CA3AF]">
                    Kelola akun Admin dan Kasir yang dapat masuk ke POS Mart.
                  </p>
                </div>
                <Button primary icon="plus" onClick={openAddEmployee}>
                  Tambah Karyawan
                </Button>
              </div>

              <div className="mt-5 divide-y divide-[#F3F4F6] rounded-xl border border-[#E5E7EB]">
                {draft.employees.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <b className="text-[12px]">{emp.name}</b>
                        <Pill tone={emp.role === "Admin" ? "danger" : "neutral"}>{emp.role}</Pill>
                      </div>
                      <p className="mt-1 text-[10px] text-[#6B7280]">
                        {emp.email} • {emp.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditEmployee(emp)}
                        aria-label={`Edit ${emp.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]"
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={draft.employees.length <= 1}
                        onClick={() => setDeletingEmp(emp)}
                        aria-label={`Hapus ${emp.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#DC2626] hover:bg-[#FEE2E2] disabled:opacity-40"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-[#E5E7EB] pt-5">
            <span className="text-[10px] text-[#F59E0B]">
              {isDirty ? "Ada perubahan yang belum disimpan" : ""}
            </span>
            <div className="flex gap-2">
              <Button disabled={!isDirty || saving} onClick={handleReset}>
                Batal
              </Button>
              <Button primary disabled={!isDirty || saving} onClick={handleSave}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-xl:hidden">
          <ReceiptPreview draft={draft} />
        </div>
      </div>

      <Modal
        open={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        title={editingEmp ? "Edit Karyawan" : "Tambah Karyawan"}
        widthClass="w-[440px]"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          {empError && (
            <p className="rounded-xl bg-[#FEF2F2] px-3 py-2 text-[10px] font-medium text-[#DC2626]">
              {empError}
            </p>
          )}
          <Input
            label="Nama Lengkap"
            value={empName}
            onChange={(e) => setEmpName(e.target.value)}
            placeholder="Contoh: Siti Aminah"
          />
          <Input
            label="Email"
            type="email"
            value={empEmail}
            onChange={(e) => setEmpEmail(e.target.value)}
            placeholder="kasir@posymart.id"
          />
          <Input
            label="Nomor HP"
            value={empPhone}
            onChange={(e) => setEmpPhone(e.target.value)}
            placeholder="0812..."
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold text-[#374151]">Peran</span>
              <select
                value={empRole}
                onChange={(e) => setEmpRole(e.target.value as UserRole)}
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-[11px] outline-none focus:border-[#DC2626]"
              >
                <option value="Kasir">Kasir</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            <Input
              label="PIN Masuk"
              value={empPin}
              onChange={(e) => setEmpPin(e.target.value)}
              placeholder="123456"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEmpModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" primary>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingEmp)}
        onClose={() => setDeletingEmp(null)}
        onConfirm={handleDeleteEmployee}
        title="Hapus karyawan ini?"
        description={`Karyawan "${deletingEmp?.name ?? ""}" tidak lagi dapat masuk ke aplikasi.`}
        confirmLabel="Hapus"
      />

      <ConfirmDialog
        open={Boolean(pendingTab)}
        onClose={() => setPendingTab(null)}
        onConfirm={() => {
          if (pendingTab) setActiveTab(pendingTab);
          setPendingTab(null);
        }}
        title="Perubahan belum disimpan"
        description="Anda memiliki perubahan yang belum disimpan. Tetap pindah tab?"
        confirmLabel="Pindah Tab"
        cancelLabel="Tetap di Sini"
      />

      <PrintReceipt transaction={testReceipt} settings={draft} />
    </>
  );
}
