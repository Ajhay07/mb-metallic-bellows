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
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { LoadingState, ErrorState, PageHeader } from "@/components/States";
import { SeverityBadge, StatusBadge, PriorityBadge } from "@/components/Badges";
import { formatDateShort, relativeTime } from "@/lib/format";
import type { ExceptionItem, ProductionOrder } from "@/lib/types";

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
      <PageHeader
        title="Operations Command Centre"
        description="Live snapshot computed from the demo dataset — every figure below is derived from current materials, purchase orders, production orders and exceptions, not hardcoded."
      />

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

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-graphite-800">Production Schedule (next 10 orders by planned start)</h2>
            <Link href="/production" className="text-xs font-medium text-steel-700 hover:underline">View all →</Link>
          </div>
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
                </tr>
              </thead>
              <tbody>
                {data.schedule.map((wo) => (
                  <tr key={wo.id}>
                    <td><Link href={`/production/${wo.id}`} className="font-medium text-steel-700 hover:underline">{wo.woNumber}</Link></td>
                    <td>{wo.customer}</td>
                    <td>{wo.qty}</td>
                    <td><PriorityBadge priority={wo.priority} /></td>
                    <td>{wo.currentStage}</td>
                    <td><StatusBadge status={wo.status} /></td>
                    <td>{formatDateShort(wo.plannedStart)}</td>
                    <td>{formatDateShort(wo.plannedEnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-graphite-800">Prioritized Action Queue</h2>
            <Link href="/exceptions" className="text-xs font-medium text-steel-700 hover:underline">Full inbox →</Link>
          </div>
          <p className="mb-3 text-xs text-graphite-500">Ranked by severity, then deadline proximity, then age — the same transparent rule used throughout the Exceptions Inbox.</p>
          <div className="space-y-2">
            {data.exceptionQueue.length === 0 && <p className="py-6 text-center text-sm text-graphite-400">No open exceptions.</p>}
            {data.exceptionQueue.map((e) => (
              <Link key={e.id} href={e.affectedEntity.href} className="block rounded-md border border-graphite-200 p-2.5 hover:border-steel-300 hover:bg-steel-50/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-graphite-900">{e.title}</span>
                  <SeverityBadge severity={e.severity} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-graphite-500">{e.recommendedAction}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-graphite-400">
                  <span>{e.category} · Owner: {e.owner}</span>
                  {e.deadline && <span>Due {formatDateShort(e.deadline)}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-graphite-800">Critical Shortages (MRP net requirement &gt; 0)</h2>
            <Link href="/mrp" className="text-xs font-medium text-steel-700 hover:underline">Open MRP →</Link>
          </div>
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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-graphite-800">Supplier Delivery Tracker (open POs by nearest due date)</h2>
            <Link href="/procurement/purchase-orders" className="text-xs font-medium text-steel-700 hover:underline">All POs →</Link>
          </div>
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
