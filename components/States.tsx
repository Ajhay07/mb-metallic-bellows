import Link from "next/link";
import { Loader2, AlertTriangle, Inbox, ChevronRight } from "lucide-react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-graphite-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-graphite-500">
      <Inbox className="h-8 w-8 text-graphite-300" />
      <p className="text-sm font-medium text-graphite-700">{title}</p>
      {description && <p className="max-w-sm text-xs text-graphite-500">{description}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Trail of section labels shown above the title, e.g. ["Operations", "Materials & Inventory"]. */
  breadcrumb?: string[];
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <nav className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--muted-foreground)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-graphite-700">Operations</Link>
          {breadcrumb?.map((crumb) => (
            <span key={crumb} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 shrink-0 text-graphite-300" />
              <span>{crumb}</span>
            </span>
          ))}
        </nav>
        <div className="mb-2 mt-1.5 flex items-center gap-1" aria-hidden="true">
          <span className="h-[3px] w-6 bg-[color:var(--border-strong)]" />
          <span className="h-[3px] w-3 bg-orange-500" />
        </div>
        <h1 className="text-xl font-extrabold uppercase tracking-tight text-graphite-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-[color:var(--muted-foreground)]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
