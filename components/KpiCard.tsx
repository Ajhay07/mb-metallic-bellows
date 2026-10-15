import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  href,
  icon: Icon,
  tone = "neutral",
  suffix,
}: {
  label: string;
  value: string | number;
  href?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "critical" | "warning" | "good" | "info";
  suffix?: string;
}) {
  const toneStyles: Record<string, string> = {
    neutral: "text-graphite-900",
    critical: "text-red-600",
    warning: "text-amber-600",
    good: "text-emerald-600",
    info: "text-steel-700",
  };
  const chipStyles: Record<string, string> = {
    neutral: "bg-orange-50 text-orange-600",
    critical: "bg-red-50 text-red-600",
    warning: "bg-amber-50 text-amber-600",
    good: "bg-emerald-50 text-emerald-600",
    info: "bg-steel-50 text-steel-600",
  };

  const content = (
    <div className="group relative flex h-full flex-col justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-raised)] p-3.5 shadow-panel transition-shadow hover:shadow-hover">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted-foreground)]">{label}</span>
        {Icon && (
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${chipStyles[tone]}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className={`text-2xl font-extrabold leading-none tabular-nums ${toneStyles[tone]}`}>
        {value}
        {suffix && <span className="ml-1 text-sm font-medium text-[color:var(--muted-foreground)]">{suffix}</span>}
      </div>
      {href && (
        <ArrowUpRight className="absolute right-2 top-2 h-3 w-3 text-graphite-300 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }
  return content;
}
