import { useNavigate } from "react-router";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] p-6 text-center text-[#111827]">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#FEE2E2] text-[#DC2626]">
        <Icon name="alert" size={30} />
      </div>
      <p className="mt-5 text-[12px] font-bold uppercase tracking-[.12em] text-[#DC2626]">
        404 — Halaman Tidak Ditemukan
      </p>
      <h1 className="mt-2 text-[26px] font-bold tracking-[-.5px]">
        Ups, halaman ini tidak tersedia
      </h1>
      <p className="mt-2 max-w-[380px] text-[12px] text-[#6B7280]">
        Alamat yang Anda buka mungkin salah atau sudah dipindahkan. Silakan kembali ke halaman
        kasir.
      </p>
      <div className="mt-6">
        <Button primary icon="cashier" onClick={() => navigate("/kasir")}>
          Kembali ke Kasir
        </Button>
      </div>
    </div>
  );
}
