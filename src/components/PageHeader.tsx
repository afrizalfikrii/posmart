import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-center justify-between">
      <div>
        <h1 className="text-[24px] font-bold tracking-[-.6px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[12px] text-[#6B7280]">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </header>
  );
}
