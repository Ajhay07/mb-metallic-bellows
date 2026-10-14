import Link from "next/link";
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
  tone?: "neutral" | "critical" | "warning" | "good";
  suffix?: string;
}) {
  const toneStyles: Record<string, string> = {
    neutral: "text-graphite-900",
    critical: "text-red-600",
    warning: "text-amber-600",
    good: "text-emerald-600",
  };

  const content = (
    <div className="panel flex h-full flex-col justify-between gap-3 p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-graphite-500">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-graphite-400" />}
      </div>
      <div className={`text-2xl font-semibold ${toneStyles[tone]}`}>
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-graphite-400">{suffix}</span>}
      </div>
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
