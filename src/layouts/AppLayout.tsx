import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon, type IconName } from "@/components/Icon";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";

const navItems: {
  to: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
}[] = [
  { to: "/kasir", label: "Kasir", icon: "cashier" },
  { to: "/dasbor", label: "Dasbor", icon: "dashboard", adminOnly: true },
  { to: "/produk", label: "Produk", icon: "product" },
  { to: "/riwayat", label: "Riwayat", icon: "history" },
  { to: "/laporan", label: "Laporan", icon: "report", adminOnly: true },
  { to: "/pengaturan", label: "Pengaturan", icon: "settings", adminOnly: true },
];

export function AppLayout() {
  const { user, logout, loading } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = async () => {
    await logout();
    setConfirmLogout(false);
    showToast("Anda telah keluar dari akun.", "info");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <aside className="fixed inset-y-0 left-0 z-10 flex w-[240px] flex-col bg-[#DC2626] p-5 text-white transition-all max-xl:w-[80px] max-xl:items-center max-xl:px-3">
        <div className="mb-8 flex items-center gap-3 px-2 max-xl:justify-center max-xl:px-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
            <Icon name="cashier" size={23} />
          </div>
          <span className="text-[21px] font-bold tracking-[-.5px] max-xl:hidden">POS Mart</span>
        </div>

        <nav className="space-y-1.5 max-xl:w-full" aria-label="Navigasi utama">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === "Admin")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold transition-colors max-xl:justify-center max-xl:px-0 ${
                    isActive
                      ? "bg-white text-[#DC2626] shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon name={item.icon} />
                <span className="max-xl:hidden">{item.label}</span>
              </NavLink>
            ))}
        </nav>

        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          title="Keluar"
          className="mt-auto flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-left transition-colors hover:bg-white/15 max-xl:justify-center max-xl:p-2"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FEE2E2] text-[12px] font-bold text-[#B91C1C] max-xl:h-9 max-xl:w-9 max-xl:text-[11px]">
            {user?.initials ?? "JD"}
          </div>
          <div className="min-w-0 flex-1 max-xl:hidden">
            <p className="truncate text-[12px] font-semibold">{user?.name ?? "John Doe"}</p>
            <p className="mt-0.5 text-[10px] text-white/65">{user?.role ?? "Admin"}</p>
          </div>
          <Icon name="logout" size={16} className="text-white/75 max-xl:hidden" />
        </button>
      </aside>

      <main className="ml-[240px] h-screen min-w-[1000px] overflow-auto p-6 max-xl:ml-[80px] max-xl:min-w-0 max-xl:p-5">
        <Outlet />
      </main>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Keluar dari POS Mart?"
        description="Sesi Anda akan diakhiri dan Anda perlu masuk kembali untuk mengakses kasir."
        confirmLabel="Keluar"
        cancelLabel="Batal"
        icon="logout"
        loading={loading}
      />
    </div>
  );
}
