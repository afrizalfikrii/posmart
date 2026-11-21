import type { ReactNode } from "react";

export type PillTone = "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<PillTone, string> = {
  success: "bg-[#DCFCE7] text-[#15803D]",
  warning: "bg-[#FEF3C7] text-[#B45309]",
  danger: "bg-[#FEE2E2] text-[#B91C1C]",
  neutral: "bg-[#F3F4F6] text-[#6B7280]",
};

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-semibold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
