// Date helpers used to build the demo dataset relative to "today", so that overdue
// purchase orders, approaching deadlines, etc. stay meaningful no matter when the
// demo server is started.

const DAY_MS = 24 * 60 * 60 * 1000;

export const NOW = new Date();

export function daysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * DAY_MS).toISOString();
}

export function daysAgo(days: number): string {
  return daysFromNow(-days);
}

export function isoDate(d: Date): string {
  return d.toISOString();
}

export function diffDaysFromNow(iso: string): number {
  const d = new Date(iso).getTime();
  return Math.round((d - NOW.getTime()) / DAY_MS);
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
