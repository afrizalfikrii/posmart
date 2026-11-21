import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/Input";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";

export function LoginPage() {
  const { session, login, loading, error, clearError } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("admin@posymart.id");
  const [pin, setPin] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  if (session) {
    return <Navigate to="/kasir" replace />;
  }

  const from = (location.state as { from?: string } | null)?.from || "/kasir";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    clearError();

    if (!identifier.trim() || !pin.trim()) {
      setFieldError("Email / No. HP dan PIN wajib diisi.");
      return;
    }

    const ok = await login({ identifier, pin, rememberMe });
    if (ok) {
      showToast("Berhasil masuk ke POS Mart.", "success");
      navigate(from, { replace: true });
    }
  };

  const displayError = fieldError || error;

  return (
    <div className="grid min-h-screen w-full grid-cols-2 bg-white text-[#111827]">
      <div className="relative flex flex-col bg-[#DC2626] p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
            <Icon name="bag" size={25} />
          </div>
          <span className="text-[22px] font-bold">POS Mart</span>
        </div>

        <div className="my-auto">
          <h2 className="max-w-[420px] text-[36px] font-bold leading-tight tracking-[-1px]">
            Jualan jadi lebih mudah
          </h2>
          <p className="mt-4 max-w-[390px] text-[14px] leading-6 text-white/75">
            Kelola transaksi, produk, dan laporan usaha Anda dalam satu aplikasi sederhana.
          </p>
          <svg className="mt-12 w-[78%] max-w-[440px]" viewBox="0 0 500 260" fill="none">
            <path d="M82 97h330v132H82z" fill="#fff" opacity=".12" />
            <path d="M62 97h370L390 42H104L62 97Z" fill="#fff" opacity=".22" />
            <path
              d="M92 97v24c0 18 29 18 29 0V97m0 0v24c0 18 29 18 29 0V97m0 0v24c0 18 29 18 29 0V97m0 0v24c0 18 29 18 29 0V97"
              stroke="white"
              strokeWidth="5"
              opacity=".85"
            />
            <rect x="127" y="151" width="92" height="78" rx="4" fill="white" opacity=".85" />
            <rect x="258" y="144" width="112" height="52" rx="4" fill="white" opacity=".25" />
            <circle cx="398" cy="207" r="22" fill="white" opacity=".8" />
            <path d="M398 196v22m-11-11h22" stroke="#DC2626" strokeWidth="4" />
          </svg>
        </div>

        <p className="text-[11px] text-white/60">Solusi kasir sederhana untuk UMKM Indonesia</p>
      </div>

      <div className="grid place-items-center p-12">
        <form className="w-full max-w-[390px]" onSubmit={handleSubmit}>
          <h1 className="text-[27px] font-bold tracking-[-.7px]">Masuk ke POS Mart</h1>
          <p className="mt-2 text-[12px] text-[#6B7280]">
            Selamat datang kembali. Silakan masukkan akun Anda.
          </p>

          {displayError && (
            <div
              role="alert"
              className="mt-5 flex items-center gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-3 text-[11px] font-medium text-[#B91C1C]"
            >
              <Icon name="alert" size={16} className="shrink-0 text-[#DC2626]" />
              <span>{displayError}</span>
            </div>
          )}

          <div className="mt-6 space-y-5">
            <Input
              label="Email atau No. HP"
              placeholder="contoh@email.com"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (displayError) {
                  setFieldError(null);
                  clearError();
                }
              }}
              autoComplete="username"
            />
            <Input
              label="PIN / Kata Sandi"
              type={showPin ? "text" : "password"}
              placeholder="Masukkan PIN atau kata sandi"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (displayError) {
                  setFieldError(null);
                  clearError();
                }
              }}
              autoComplete="current-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPin((s) => !s)}
                  aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                  className="text-[#9CA3AF] hover:text-[#4B5563]"
                >
                  <Icon name={showPin ? "eyeOff" : "eye"} size={17} />
                </button>
              }
            />
          </div>

          <div className="my-5 flex items-center justify-between text-[11px]">
            <label className="flex cursor-pointer items-center gap-2 text-[#6B7280]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-[#DC2626]"
              />
              Ingat saya
            </label>
            <button
              type="button"
              onClick={() => showToast("Gunakan akun demo: admin@posymart.id / 123456", "info")}
              className="font-semibold text-[#DC2626] hover:underline"
            >
              Lupa PIN?
            </button>
          </div>

          <Button type="submit" primary disabled={loading} className="h-11 w-full text-[12px]">
            {loading ? "Memeriksa akun..." : "Masuk"}
          </Button>

          <p className="mt-5 rounded-xl bg-[#F9FAFB] px-3.5 py-2.5 text-center text-[10px] text-[#6B7280]">
            Akun demo: <b className="text-[#111827]">admin@posymart.id</b> / PIN{" "}
            <b className="text-[#111827]">123456</b>
          </p>
        </form>
      </div>
    </div>
  );
}
