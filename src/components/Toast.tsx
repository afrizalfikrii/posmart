import { useToastStore } from "@/store/useToastStore";
import type { ToastType } from "@/types";
import { Icon, type IconName } from "./Icon";

const toastStyles: Record<ToastType, { icon: IconName; color: string; bg: string }> = {
  success: { icon: "check", color: "#16A34A", bg: "#F0FDF4" },
  error: { icon: "close", color: "#DC2626", bg: "#FEF2F2" },
  warning: { icon: "alert", color: "#F59E0B", bg: "#FFFBEB" },
  info: { icon: "receipt", color: "#2563EB", bg: "#EFF6FF" },
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[60] flex flex-col items-end space-y-2"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        return (
          <div
            key={toast.id}
            className="flex w-[350px] max-w-[90vw] items-center gap-3 rounded-xl border border-[#E5E7EB] p-3 shadow-sm"
            style={{ background: style.bg }}
          >
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white"
              style={{ background: style.color }}
            >
              <Icon name={style.icon} size={14} />
            </span>
            <b className="flex-1 text-[11px] font-semibold text-[#111827]">{toast.message}</b>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Tutup notifikasi"
              className="text-[#6B7280] hover:text-[#111827]"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
