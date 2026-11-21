import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefix?: string;
  error?: string;
  rightElement?: ReactNode;
}

export function Input({ label, prefix, error, rightElement, className = "", ...rest }: InputProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-[11px] font-semibold text-[#374151]">{label}</span>
      )}
      <div
        className={`flex h-11 items-center rounded-xl border bg-white px-3 transition-colors ${
          error ? "border-[#DC2626]" : "border-[#E5E7EB] focus-within:border-[#DC2626]"
        }`}
      >
        {prefix && (
          <span className="mr-2 border-r border-[#E5E7EB] pr-2 text-[11px] font-semibold text-[#6B7280]">
            {prefix}
          </span>
        )}
        <input
          className={`min-w-0 flex-1 bg-transparent text-[11px] text-[#111827] outline-none placeholder:text-[#9CA3AF] ${className}`}
          {...rest}
        />
        {rightElement && <span className="ml-2 flex items-center">{rightElement}</span>}
      </div>
      {error && <p className="mt-1.5 text-[10px] font-medium text-[#DC2626]">{error}</p>}
    </label>
  );
}
