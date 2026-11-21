import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger-outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  primary?: boolean;
  icon?: IconName;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
  secondary: "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]",
  outline: "border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F9FAFB]",
  "danger-outline": "border border-[#DC2626] bg-white text-[#DC2626] hover:bg-[#FEF2F2]",
};

export function Button({
  children,
  variant,
  primary = false,
  icon,
  className = "",
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const resolvedVariant: ButtonVariant = variant ?? (primary ? "primary" : "outline");

  return (
    <button
      type={type}
      disabled={disabled}
      className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:border-transparent ${variantClasses[resolvedVariant]} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}
