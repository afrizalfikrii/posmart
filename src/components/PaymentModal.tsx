import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import type { PaymentMethod, StoreSettings } from "@/types";
import { formatRupiah } from "@/utils/format";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  settings: StoreSettings | null;
  processing: boolean;
  onConfirm: (amountPaid: number) => Promise<void>;
}

export function PaymentModal({
  open,
  onClose,
  total,
  method,
  onMethodChange,
  settings,
  processing,
  onConfirm,
}: PaymentModalProps) {
  const [cashInput, setCashInput] = useState(String(total));
  const [secondsLeft, setSecondsLeft] = useState(300);

  const enabledMethods = [
    (settings?.paymentMethods.tunai ?? true) && "Tunai",
    (settings?.paymentMethods.qris ?? true) && "QRIS",
    (settings?.paymentMethods.transfer ?? true) && "Transfer",
  ].filter(Boolean) as PaymentMethod[];

  const availableMethods: PaymentMethod[] = enabledMethods.length > 0 ? enabledMethods : ["Tunai"];
  const fallbackMethod = availableMethods.find((m) => m !== "QRIS") ?? availableMethods[0];

  useEffect(() => {
    if (open) {
      setCashInput(String(total));
      setSecondsLeft(300);
    }
  }, [open, total]);

  useEffect(() => {
    if (!open || method !== "QRIS") return;
    setSecondsLeft(300);
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [open, method]);

  const parsedCash = Number.parseInt(cashInput.replace(/\D/g, ""), 10) || 0;
  const change = parsedCash - total;
  const isCashSufficient = parsedCash >= total;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  const handleNumericChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setCashInput(digits);
  };

  if (method === "QRIS") {
    const qrisPayload = `POSMART|QRIS|${settings?.paymentMethods.qrisMerchantName ?? "POS MART"}|TOTAL=${total}`;
    return (
      <Modal open={open} onClose={onClose} widthClass="w-[500px]" hideCloseButton>
        <div className="text-center">
          <h2 className="text-[21px] font-bold">Bayar dengan QRIS</h2>
          <p className="mt-1 text-[10px] text-[#6B7280]">
            Pindai kode QR menggunakan aplikasi pembayaran
          </p>

          <div className="mx-auto mt-5 w-fit rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <QRCodeSVG value={qrisPayload} size={172} level="M" />
          </div>

          <p className="mt-4 text-[10px] text-[#6B7280]">Total pembayaran</p>
          <p className="mt-1 text-[24px] font-bold">{formatRupiah(total)}</p>

          <div
            className={`mx-auto mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-semibold ${
              secondsLeft > 0 ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#FEE2E2] text-[#B91C1C]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                secondsLeft > 0 ? "bg-[#F59E0B]" : "bg-[#DC2626]"
              }`}
            />
            {secondsLeft > 0 ? "Menunggu pembayaran..." : "Waktu QRIS habis"}
          </div>

          <p className="mt-2 text-[9px] text-[#9CA3AF]">
            Berlaku {mins}:{secs}
          </p>

          <div className="mt-4">
            <Button
              primary
              className="h-11 w-full text-[12px]"
              disabled={processing || secondsLeft === 0}
              onClick={() => void onConfirm(total)}
            >
              {processing ? "Memproses..." : "Simulasi Pembayaran Diterima"}
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              className="h-11"
              disabled={processing}
              onClick={() => onMethodChange(fallbackMethod)}
            >
              Ganti Metode
            </Button>
            <Button
              variant="danger-outline"
              className="h-11"
              disabled={processing}
              onClick={onClose}
            >
              Batalkan
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Pembayaran" widthClass="w-[560px]">
      <div className="rounded-xl bg-[#F9FAFB] p-4">
        <p className="text-[11px] text-[#6B7280]">Total Tagihan</p>
        <p className="mt-1 text-[31px] font-bold tracking-[-1px]">{formatRupiah(total)}</p>
      </div>

      <p className="mb-2 mt-5 text-[11px] font-semibold">Metode Pembayaran</p>
      <div
        className={`grid gap-3 ${
          availableMethods.length === 1
            ? "grid-cols-1"
            : availableMethods.length === 2
              ? "grid-cols-2"
              : "grid-cols-3"
        }`}
      >
        {availableMethods.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onMethodChange(m)}
            className={`h-[64px] rounded-xl border text-[11px] font-semibold transition-colors ${
              method === m
                ? "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]"
                : "border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {method === "Tunai" ? (
        <>
          <div className="mt-4">
            <Input
              label="Uang Diterima"
              prefix="Rp"
              inputMode="numeric"
              placeholder="0"
              value={parsedCash > 0 ? parsedCash.toLocaleString("id-ID") : ""}
              onChange={(e) => handleNumericChange(e.target.value)}
              error={!isCashSufficient ? "Uang diterima kurang dari total tagihan." : undefined}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: "Uang Pas", value: total },
              { label: formatRupiah(50000), value: 50000 },
              { label: formatRupiah(100000), value: 100000 },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setCashInput(String(chip.value))}
                className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[9px] font-semibold text-[#6B7280] hover:border-[#DC2626] hover:text-[#DC2626]"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div
            className={`my-4 flex items-center justify-between rounded-xl p-3 ${
              isCashSufficient ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"
            }`}
          >
            <span
              className={`text-[11px] ${isCashSufficient ? "text-[#166534]" : "text-[#B91C1C]"}`}
            >
              {isCashSufficient ? "Kembalian" : "Kurang"}
            </span>
            <b className={`text-[18px] ${isCashSufficient ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
              {formatRupiah(Math.abs(change))}
            </b>
          </div>
        </>
      ) : (
        <div className="my-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
            Rekening Tujuan Transfer
          </p>
          <p className="mt-1.5 text-[14px] font-bold text-[#111827]">
            {settings?.paymentMethods.bankAccount ?? "BCA 1234567890 a.n. POS Mart UMKM"}
          </p>
          <p className="mt-1 text-[10px] text-[#6B7280]">
            Pastikan nominal transfer sesuai dengan total tagihan sebelum konfirmasi.
          </p>
        </div>
      )}

      <div className="grid grid-cols-[120px_1fr] gap-3">
        <Button variant="secondary" className="h-11" disabled={processing} onClick={onClose}>
          Batal
        </Button>
        <Button
          primary
          className="h-11 text-[12px]"
          disabled={processing || (method === "Tunai" && !isCashSufficient)}
          onClick={() => void onConfirm(method === "Tunai" ? parsedCash : total)}
        >
          {processing ? "Memproses..." : "Konfirmasi Pembayaran"}
        </Button>
      </div>
    </Modal>
  );
}
