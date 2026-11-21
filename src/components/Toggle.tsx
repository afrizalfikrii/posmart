export function Toggle({
  on = true,
  onChange,
  ariaLabel,
}: {
  on?: boolean;
  onChange?: (next: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange?.(!on)}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        on ? "bg-[#DC2626]" : "bg-[#D1D5DB]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
          on ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
