"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import { StatusBadge } from "@/components/Badges";
import { formatNumber, formatDateShort } from "@/lib/format";
import type { Material, Supplier, SupplierMaterialLink, PurchaseOrder } from "@/lib/types";

interface SupplierDetail {
  supplier: Supplier;
  performance: {
    totalOrders: number; evaluableOrders: number; onTimeCount: number; lateCount: number;
    onTimeDeliveryPct: number; recentOnTimeDeliveryPct: number; openOverdueCount: number;
    rejectionRatePct: number; totalUnitsReceived: number; totalUnitsRejected: number;
    records: { po: PurchaseOrder; expectedDate: string; resolvedDate: string | null; onTime: boolean | null; daysLateOrOverdue: number; stillOpen: boolean }[];
  };
  risk: { score: number; band: string; inputs: { label: string; value: string; contribution: number; weightExplanation: string }[] };
  purchaseOrders: PurchaseOrder[];
  materials: (SupplierMaterialLink & { material?: Material })[];
}

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<SupplierDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/suppliers/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Supplier not found."));
  }, [params.id]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading supplier profile…" />;

  const { supplier, performance, risk, materials } = data;

  return (
    <div>
      <PageHeader
        title={supplier.name}
        description={`${supplier.location} · Contact: ${supplier.contactPerson} (${supplier.email}, ${supplier.phone}) · Active since ${formatDateShort(supplier.activeSince)}`}
        actions={<Link href="/suppliers" className="btn-secondary">Back to directory</Link>}
      />

      {supplier.notes && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">{supplier.notes}</div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="On-time (all-time)" value={`${performance.onTimeDeliveryPct}%`} />
        <Stat label="On-time (last 3)" value={`${performance.recentOnTimeDeliveryPct}%`} warn={performance.recentOnTimeDeliveryPct < performance.onTimeDeliveryPct} />
        <Stat label="Rejection rate" value={`${performance.rejectionRatePct}%`} />
        <Stat label="Currently overdue" value={`${performance.openOverdueCount}`} warn={performance.openOverdueCount > 0} />
      </div>

      <div className="mt-4 panel p-4">
        <h2 className="mb-1 text-sm font-semibold text-graphite-800">Demo Risk Score: {risk.score} / 100 — {risk.band} risk</h2>
        <p className="mb-3 text-xs text-graphite-500">
          This is an illustrative, fully transparent demo score — not a real credit or compliance risk product. Every input below is computed from this supplier&rsquo;s actual purchase order history.
        </p>
        <table className="table-base">
          <thead><tr><th>Input</th><th>Value</th><th>Contribution</th><th>Formula</th></tr></thead>
          <tbody>
            {risk.inputs.map((i) => (
              <tr key={i.label}>
                <td>{i.label}</td>
                <td className="font-medium">{i.value}</td>
                <td>+{i.contribution}</td>
                <td className="text-xs text-graphite-500">{i.weightExplanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="mb-2 text-sm font-semibold text-graphite-800">Materials Supplied</h2>
          <table className="table-base">
            <thead><tr><th>Material</th><th>Lead Time</th><th>Last Price</th></tr></thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.materialId}>
                  <td>{m.material ? <Link href={`/materials/${m.materialId}`} className="text-steel-700 hover:underline">{m.material.code}</Link> : m.materialId}</td>
                  <td>{m.leadTimeDays} days</td>
                  <td>₹{formatNumber(m.lastPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel p-4">
          <h2 className="mb-2 text-sm font-semibold text-graphite-800">On-Time Delivery Trend (oldest → newest)</h2>
          <div className="flex flex-wrap gap-1.5">
            {performance.records.filter((r) => r.onTime !== null).map((r, i) => (
              <span
                key={i}
                title={`${r.po.poNumber}: ${r.onTime ? "on time" : `${r.daysLateOrOverdue}d late`}`}
                className={`flex h-8 w-8 items-center justify-center rounded text-[10px] font-semibold ${r.onTime ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
              >
                {r.onTime ? "✓" : r.daysLateOrOverdue}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-graphite-500">Each box is one resolved/overdue purchase order, oldest to newest. Green = on time; red shows days late or currently overdue.</p>
        </div>
      </div>

      <div className="mt-4 panel overflow-x-auto p-4">
        <h2 className="mb-2 text-sm font-semibold text-graphite-800">Purchase Order History</h2>
        <table className="table-base">
          <thead><tr><th>PO</th><th>Order Date</th><th>Expected</th><th>Status</th><th>Resolution</th></tr></thead>
          <tbody>
            {performance.records.map((r) => (
              <tr key={r.po.id}>
                <td><Link href={`/procurement/purchase-orders/${r.po.id}`} className="text-steel-700 hover:underline">{r.po.poNumber}</Link></td>
                <td className="text-xs">{formatDateShort(r.po.orderDate)}</td>
                <td className="text-xs">{formatDateShort(r.expectedDate)}</td>
                <td><StatusBadge status={r.po.status} /></td>
                <td className="text-xs">
                  {r.stillOpen ? (r.onTime === false ? <span className="font-medium text-red-600">{r.daysLateOrOverdue}d overdue, still open</span> : "Not yet due") : r.onTime ? <span className="text-emerald-700">On time</span> : <span className="text-red-600">{r.daysLateOrOverdue}d late</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="panel p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-graphite-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${warn ? "text-amber-600" : "text-graphite-900"}`}>{value}</div>
    </div>
  );
}
