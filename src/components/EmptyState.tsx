import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function EmptyState({
  icon = "cart",
  title,
  description,
  tone = "red",
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  tone?: "red" | "neutral";
  action?: ReactNode;
}) {
  const badgeClass = tone === "red" ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#F3F4F6] text-[#9CA3AF]";

  return (
    <div className="grid h-full place-items-center py-8 text-center">
      <div>
        <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${badgeClass}`}>
          <Icon name={icon} size={20} />
        </div>
        <h3 className="mt-3 text-[13px] font-bold text-[#111827]">{title}</h3>
        {description && (
          <p className="mx-auto mt-1.5 max-w-[220px] text-[10px] leading-4 text-[#6B7280]">
            {description}
          </p>
        )}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
