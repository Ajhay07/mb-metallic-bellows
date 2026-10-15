"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Factory,
  FileSpreadsheet,
  Boxes,
  AlertOctagon,
  Truck,
  AlertTriangle,
  ClipboardCheck,
  Hourglass,
  Gauge,
  Target,
  ShieldAlert,
  PlayCircle,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { LoadingState, ErrorState, PageHeader } from "@/components/States";
import { SeverityBadge, StatusBadge, PriorityBadge } from "@/components/Badges";
import { BellowsMotif } from "@/components/Logo";
import { formatDateShort, relativeTime } from "@/lib/format";
import type { ExceptionItem, ExceptionSeverity, ProductionOrder } from "@/lib/types";

const SEVERITY_ACCENT: Record<ExceptionSeverity, string> = {
  Critical: "border-l-red-500",
  High: "border-l-amber-500",
  Medium: "border-l-steel-400",
  Low: "border-l-graphite-300",
};

/** Orange-accent panel section header used throughout the Command Centre. */
function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "View All",
  dark,
}: {
  title: string;
  subtitle?: string;
  href: string;
  linkLabel?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-stretch gap-2.5">
        <span className="w-[3px] shrink-0 bg-orange-500" />
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-graphite-900">{title}</h2>
          {subtitle && <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">{subtitle}</p>}
        </div>
      </div>
      <Link href={href} className={dark ? "btn-dark shrink-0 text-xs" : "shrink-0 text-xs font-semibold text-steel-700 hover:underline"}>
        {linkLabel}
        {dark && <ArrowRight className="h-3.5 w-3.5" />}
      </Link>
    </div>
  );
}

function DemoStatusPanel() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="panel relative mb-6 flex flex-wrap items-center justify-between gap-3 overflow-hidden p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-orange-50 text-orange-600">
          <CalendarClock className="h-4 w-4" />
        </span>
        <div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-graphite-900">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[color:var(--success)]" aria-hidden="true" />
            <span className="uppercase">MB Metallic Bellows Pvt. Ltd.</span> <span className="font-normal text-[color:var(--muted-foreground)]">— Operations Management System</span>
          </div>
          <div className="text-xs text-[color:var(--muted-foreground)]">
            {now ? now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : " "}
            {now && ` · ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST`}
          </div>
        </div>
      </div>
      <span className="badge border-amber-300 bg-amber-50 text-amber-800">Demo Data Mode — not connected to a live ERP</span>
      <BellowsMotif className="pointer-events-none absolute -right-6 -top-8 h-32 w-64 text-graphite-200/70" />
    </div>
  );
}

interface SupplierDelivery {
  poId: string;
  poNumber: string;
  supplierName: string;
  status: string;
  expectedDeliveryDate: string;
  overdue: boolean;
  daysOverdue: number;
}

interface CriticalShortageLine {
  materialId: string;
  materialCode: string;
  materialName: string;
  uom: string;
  netRequirement: number;
  requiredByDate: string | null;
  affectedOrders: string[];
}

interface DashboardData {
  kpis: Record<string, number>;
  exceptionQueue: ExceptionItem[];
  schedule: ProductionOrder[];
  lastAutomationRun: { runAt: string; totalNew: number; totalUpdated: number } | null;
  supplierDeliveries: SupplierDelivery[];
  criticalShortageLines: CriticalShortageLine[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Could not load the Operations Command Centre."));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading Command Centre…" />;

  const k = data.kpis;

  return (
    <div>
      <div className="flex flex-wrap items-stretch justify-between gap-4">
        <PageHeader
          breadcrumb={["Command Centre"]}
          title="Operations Command Centre"
          description="Live snapshot from production, procurement and inventory operations — every figure below is derived from current data, not hardcoded."
        />
        {/* Industrial imagery region. No sourced product photography exists in this
            repo, so this reuses the geometric bellows-corrugation motif (see
            components/Logo.tsx) at a larger, desaturated scale rather than
            fabricating or fetching stock imagery. */}
        <div className="relative hidden h-[88px] w-64 shrink-0 overflow-hidden rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--border-strong)] lg:block">
          <BellowsMotif className="absolute inset-0 h-full w-full text-white/15" />
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--border-strong)] via-transparent to-transparent" />
        </div>
      </div>

      <DemoStatusPanel />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Active Production Orders" value={k.activeProductionOrders} href="/production" icon={Factory} />
        <KpiCard label="Open Purchase Orders" value={k.openPOs} href="/procurement/purchase-orders" icon={FileSpreadsheet} />
        <KpiCard label="Below Reorder Point" value={k.materialsBelowReorderPoint} href="/materials?filter=belowReorder" icon={Boxes} tone={k.materialsBelowReorderPoint > 0 ? "warning" : "neutral"} />
        <KpiCard label="Critical Shortages" value={k.criticalShortages} href="/mrp?filter=shortage" icon={AlertOctagon} tone={k.criticalShortages > 0 ? "critical" : "neutral"} />
        <KpiCard label="Overdue Supplier Deliveries" value={k.overdueSupplierDeliveries} href="/procurement/purchase-orders?filter=overdue" icon={Truck} tone={k.overdueSupplierDeliveries > 0 ? "critical" : "neutral"} />
        <KpiCard label="Production Orders At Risk" value={k.productionOrdersAtRisk} href="/production?filter=atRisk" icon={AlertTriangle} tone={k.productionOrdersAtRisk > 0 ? "warning" : "neutral"} />
        <KpiCard label="Pending GRN Inspection" value={k.pendingInspection} href="/materials?filter=pendingInspection" icon={ClipboardCheck} tone={k.pendingInspection > 0 ? "warning" : "neutral"} />
        <KpiCard label="Pending Approvals" value={k.pendingApprovals} href="/exceptions?category=Procurement" icon={Hourglass} tone={k.pendingApprovals > 0 ? "warning" : "neutral"} />
        <KpiCard label="On-Time Delivery Rate" value={k.onTimeDeliveryRatePct} suffix="%" href="/reports/supplier-performance" icon={Gauge} tone={k.onTimeDeliveryRatePct >= 90 ? "good" : k.onTimeDeliveryRatePct >= 75 ? "warning" : "critical"} />
        <KpiCard label="Schedule Attainment" value={k.scheduleAttainmentPct} suffix="%" href="/reports/production-status" icon={Target} tone={k.scheduleAttainmentPct >= 90 ? "good" : k.scheduleAttainmentPct >= 75 ? "warning" : "critical"} />
        <KpiCard label="Open Exceptions" value={k.openExceptions} href="/exceptions" icon={ShieldAlert} tone={k.openExceptions > 0 ? "warning" : "neutral"} />
        <KpiCard label="Critical Exceptions" value={k.criticalExceptions} href="/exceptions?severity=Critical" icon={ShieldAlert} tone={k.criticalExceptions > 0 ? "critical" : "neutral"} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-10">
        <div className="panel p-4 xl:col-span-7">
          <SectionHeader title="Production Schedule" subtitle="Next 10 orders by planned start" href="/production" dark />
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Work Order</th>
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Priority</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Planned Start</th>
                  <th>Planned End</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.schedule.map((wo) => (
                  <tr key={wo.id}>
                    <td><Link href={`/production/${wo.id}`} className="font-semibold text-steel-700 hover:underline">{wo.woNumber}</Link></td>
                    <td>{wo.customer}</td>
                    <td className="tabular-nums">{wo.qty}</td>
                    <td><PriorityBadge priority={wo.priority} /></td>
                    <td>{wo.currentStage}</td>
                    <td><StatusBadge status={wo.status} /></td>
                    <td className="tabular-nums">{formatDateShort(wo.plannedStart)}</td>
                    <td className="tabular-nums">{formatDateShort(wo.plannedEnd)}</td>
                    <td>
                      <Link href={`/production/${wo.id}`} className="text-graphite-400 hover:text-orange-600" aria-label={`Open ${wo.woNumber}`}>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden xl:col-span-3">
          <div className="flex items-center justify-between gap-2 border-b border-[color:var(--border)] bg-orange-500 px-4 py-2.5">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-white">Prioritized Action Queue</h2>
            <Link href="/exceptions" className="shrink-0 text-xs font-semibold text-white/90 hover:underline">Full Inbox</Link>
          </div>
          <div className="p-4">
            <p className="mb-3 text-[11px] text-[color:var(--muted-foreground)]">Ranked by severity, then deadline proximity, then age — the same transparent rule used throughout the Exceptions Inbox.</p>
            <div className="space-y-2">
              {data.exceptionQueue.length === 0 && <p className="py-6 text-center text-sm text-graphite-400">No open exceptions.</p>}
              {data.exceptionQueue.map((e, i) => (
                <Link
                  key={e.id}
                  href={e.affectedEntity.href}
                  className={`flex gap-2.5 rounded border border-l-[3px] border-[color:var(--border)] bg-[color:var(--surface-secondary)] p-2.5 transition-colors hover:border-graphite-400 hover:bg-white ${SEVERITY_ACCENT[e.severity]}`}
                >
                  <span className="shrink-0 font-mono text-[10px] font-bold tabular-nums text-graphite-400">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-graphite-900">{e.title}</span>
                      <SeverityBadge severity={e.severity} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-[color:var(--muted-foreground)]">{e.recommendedAction}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-graphite-400">
                      <span>{e.category} · Owner: {e.owner}</span>
                      {e.deadline && <span>Due {formatDateShort(e.deadline)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <SectionHeader title="Critical Shortages" subtitle="MRP net requirement > 0" href="/mrp" linkLabel="Open MRP" />
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th>Material</th><th>Net Shortfall</th><th>Required By</th><th>Affects</th></tr>
              </thead>
              <tbody>
                {data.criticalShortageLines.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-graphite-400">No material shortages right now.</td></tr>
                )}
                {data.criticalShortageLines.map((l) => (
                  <tr key={l.materialId}>
                    <td><Link href={`/materials/${l.materialId}`} className="font-medium text-steel-700 hover:underline">{l.materialCode}</Link></td>
                    <td className="font-medium text-red-600">{l.netRequirement} {l.uom}</td>
                    <td>{formatDateShort(l.requiredByDate)}</td>
                    <td className="text-xs">{l.affectedOrders.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4">
          <SectionHeader title="Supplier Delivery Tracker" subtitle="Open POs by nearest due date" href="/procurement/purchase-orders" linkLabel="All POs" />
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th>PO</th><th>Supplier</th><th>Status</th><th>Expected</th><th>Overdue</th></tr>
              </thead>
              <tbody>
                {data.supplierDeliveries.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-graphite-400">No open deliveries.</td></tr>
                )}
                {data.supplierDeliveries.map((d) => (
                  <tr key={d.poId}>
                    <td><Link href={`/procurement/purchase-orders/${d.poId}`} className="font-medium text-steel-700 hover:underline">{d.poNumber}</Link></td>
                    <td>{d.supplierName}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>{formatDateShort(d.expectedDeliveryDate)}</td>
                    <td>{d.overdue ? <span className="font-medium text-red-600">{d.daysOverdue}d overdue</span> : <span className="text-graphite-400">On schedule</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-4 panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 text-sm text-graphite-600">
          <PlayCircle className="h-4 w-4 text-steel-600" />
          Automation Centre last ran {data.lastAutomationRun ? relativeTime(data.lastAutomationRun.runAt) : "never"}
          {data.lastAutomationRun && ` — ${data.lastAutomationRun.totalNew} new, ${data.lastAutomationRun.totalUpdated} updated exceptions.`}
        </div>
        <Link href="/automation" className="btn-secondary">Open Automation Centre</Link>
      </div>
    </div>
  );
}
