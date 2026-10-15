"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, LoadingState, ErrorState, EmptyState } from "@/components/States";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { formatDateShort } from "@/lib/format";
import type { ProductionOrder } from "@/lib/types";

interface Row extends ProductionOrder {
  bom: { id: string; productName: string; productCode: string } | null;
  readiness: { ready: boolean; blockingCount: number };
  overdue: boolean;
}

function ProductionInner() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const [orders, setOrders] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/production").then((r) => r.json()).then((d) => setOrders(d.orders)).catch(() => setError("Could not load production orders."));
  }, []);

  const rows = useMemo(() => {
    if (!orders) return [];
    if (filter === "atRisk") return orders.filter((o) => !o.readiness.ready || o.status === "On Hold");
    return orders;
  }, [orders, filter]);

  if (error) return <ErrorState message={error} />;
  if (!orders) return <LoadingState label="Loading production orders…" />;

  return (
    <div>
      <PageHeader breadcrumb={["Production"]} title="Production Orders" description="Routing: Material Prep → Cutting → Forming → Welding → Assembly → Dimensional Inspection → Leak Test → Final QA → Packing → Completed." />
      {filter === "atRisk" && <div className="mb-3 badge border-amber-300 bg-amber-50 text-amber-800">Showing: at-risk orders (not ready or on hold)</div>}
      {rows.length === 0 ? (
        <EmptyState title="No production orders match this view" />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Work Order</th><th>Product</th><th>Customer</th><th>Qty</th><th>Priority</th><th>Stage</th><th>Status</th><th>Readiness</th><th>Planned Start</th><th>Planned End</th></tr></thead>
            <tbody>
              {rows.map((wo) => (
                <tr key={wo.id}>
                  <td><Link href={`/production/${wo.id}`} className="font-medium text-steel-700 hover:underline">{wo.woNumber}</Link></td>
                  <td className="text-xs">{wo.bom?.productCode}</td>
                  <td>{wo.customer}</td>
                  <td>{wo.qty}</td>
                  <td><PriorityBadge priority={wo.priority} /></td>
                  <td>{wo.currentStage}</td>
                  <td><StatusBadge status={wo.status} /></td>
                  <td>{wo.readiness.ready ? <span className="badge border-emerald-300 bg-emerald-50 text-emerald-700">Ready</span> : <span className="badge border-red-300 bg-red-50 text-red-700">Blocked ({wo.readiness.blockingCount})</span>}</td>
                  <td className={`text-xs ${wo.overdue ? "font-medium text-red-600" : ""}`}>{formatDateShort(wo.plannedStart)}</td>
                  <td className="text-xs">{formatDateShort(wo.plannedEnd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProductionPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProductionInner />
    </Suspense>
  );
}
