import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Drawer({ open, onClose, title, subtitle, children, footer }: DrawerProps) {
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement as HTMLElement | null;
    const aside = asideRef.current;

    const focusables = aside?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables && focusables.length > 0) {
      focusables[0].focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && aside) {
        const nodes = Array.from(aside.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousActive?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111827]/25"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <aside
        ref={asideRef}
        className="fixed inset-y-0 right-0 flex w-[480px] max-w-[95vw] flex-col bg-white shadow-[-8px_0_30px_rgba(0,0,0,.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-5">
          <div>
            <h2 className="text-[19px] font-bold">{title}</h2>
            {subtitle && <p className="mt-1 text-[10px] text-[#6B7280]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1 text-[#9CA3AF] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
        {footer && <div className="border-t border-[#E5E7EB] bg-white p-5">{footer}</div>}
      </aside>
    </div>
  );
}
