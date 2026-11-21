export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-[#E5E7EB]/70 ${className}`} aria-hidden="true" />
  );
}
