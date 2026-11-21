const MONTHS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * Format angka menjadi format Rupiah tanpa desimal (contoh: Rp 35.000).
 */
export function formatRupiah(value: number): string {
  const rounded = Math.round(Number.isFinite(value) ? value : 0);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded).toLocaleString("id-ID");
  return `${sign}Rp ${abs}`;
}

/**
 * Format tanggal menjadi format Indonesia singkat (contoh: 21 Nov 2026).
 */
export function formatDate(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  const day = date.getDate();
  const month = MONTHS_ID[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format waktu menjadi HH:MM (contoh: 14:32).
 */
export function formatTime(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "--:--";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Format tanggal dan waktu (contoh: 21 Nov 2026, 14:32).
 */
export function formatDateTime(input: string | Date): string {
  return `${formatDate(input)}, ${formatTime(input)}`;
}
