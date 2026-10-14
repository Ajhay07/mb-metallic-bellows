"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import { StatusBadge } from "@/components/Badges";
import { formatNumber, formatDateShort, formatDateTimeShort } from "@/lib/format";
import { useRole } from "@/lib/client/RoleContext";
import { roleHasPermission } from "@/lib/auth/roles";
import type { Material, StockLot, StockMovement, Supplier } from "@/lib/types";

interface MaterialDetail {
  material: Material;
  stock: { onHand: number; quarantinedQty: number; reservedQty: number; availableQty: number; incomingQty: number; belowReorderPoint: boolean; belowSafetyStock: boolean; openIncomingPOs: { po: { id: string; poNumber: string }; outstandingQty: number; overdue: boolean; daysOverdue: number }[] };
  lots: StockLot[];
  movements: StockMovement[];
  mrpLine: { netRequirement: number; grossRequirement: number; isShortage: boolean; requiredByDate: string | null } | null;
  supplier: Supplier | null;
}

export default function MaterialDetailPage() {
  const params = useParams<{ id: string }>();
  const { role } = useRole();
  const [data, setData] = useState<MaterialDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/materials/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Material not found."));
  }, [params.id]);

  useEffect(() => load(), [load]);

  async function submitAdjustment() {
    setActionError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/materials/${params.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: Number(adjustDelta), reason: adjustReason }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Adjustment failed");
      setAdjustDelta("");
      setAdjustReason("");
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Adjustment failed");
    } finally {
      setBusy(false);
    }
  }

  async function quarantine(lotId: string) {
    const reason = prompt("Reason for quarantine hold:");
    if (!reason) return;
    const res = await fetch(`/api/lots/${lotId}/quarantine`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    if (res.ok) load();
    else alert((await res.json()).error);
  }

  async function release(lotId: string) {
    const res = await fetch(`/api/lots/${lotId}/release`, { method: "POST" });
    if (res.ok) load();
    else alert((await res.json()).error);
  }

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading material…" />;

  const { material, stock, lots, movements, mrpLine, supplier } = data;
  const canAdjust = roleHasPermission(role, "inventory.adjust");
  const canInspect = roleHasPermission(role, "inspection.record");

  return (
    <div>
      <PageHeader
        title={`${material.code} — ${material.name}`}
        description={`${material.category} · ${material.grade ?? ""}`}
        actions={<Link href="/materials" className="btn-secondary">Back to materials</Link>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="On Hand" value={`${formatNumber(stock.onHand)} ${material.uom}`} />
        <Stat label="Reserved" value={`${formatNumber(stock.reservedQty)} ${material.uom}`} />
        <Stat label="Quarantined" value={`${formatNumber(stock.quarantinedQty)} ${material.uom}`} warn={stock.quarantinedQty > 0} />
        <Stat label="Available" value={`${formatNumber(stock.availableQty)} ${material.uom}`} />
        <Stat label="Incoming" value={`${formatNumber(stock.incomingQty)} ${material.uom}`} />
        <Stat label="Reorder Point / Safety" value={`${material.reorderPoint} / ${material.safetyStock}`} warn={stock.belowReorderPoint} />
      </div>

      {mrpLine && mrpLine.isShortage && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>MRP net shortfall: {formatNumber(mrpLine.netRequirement)} {material.uom}.</strong> Gross requirement {formatNumber(mrpLine.grossRequirement)} {material.uom}, required by {formatDateShort(mrpLine.requiredByDate)}.{" "}
          <Link href="/mrp" className="font-medium underline">View in MRP →</Link>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="mb-2 text-sm font-semibold text-graphite-800">Location &amp; Supply</h2>
          <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
            <dt className="text-graphite-500">Warehouse / Bin</dt><dd>{material.warehouse} / {material.bin}</dd>
            <dt className="text-graphite-500">Primary Supplier</dt><dd>{supplier ? <Link href={`/suppliers/${supplier.id}`} className="text-steel-700 hover:underline">{supplier.name}</Link> : "-"}</dd>
            <dt className="text-graphite-500">Lead Time</dt><dd>{material.leadTimeDays} days</dd>
            <dt className="text-graphite-500">Unit Cost</dt><dd>₹{formatNumber(material.unitCost)}</dd>
          </dl>
          {stock.openIncomingPOs.length > 0 && (
            <div className="mt-3 border-t border-graphite-100 pt-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-graphite-500">Open Incoming Purchase Orders</h3>
              <ul className="space-y-1 text-sm">
                {stock.openIncomingPOs.map((p) => (
                  <li key={p.po.id} className="flex items-center justify-between">
                    <Link href={`/procurement/purchase-orders/${p.po.id}`} className="text-steel-700 hover:underline">{p.po.poNumber}</Link>
                    <span>{formatNumber(p.outstandingQty)} {material.uom}{p.overdue && <span className="ml-2 font-medium text-red-600">{p.daysOverdue}d overdue</span>}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {material.notes && <p className="mt-3 border-t border-graphite-100 pt-3 text-xs text-graphite-500">{material.notes}</p>}
        </div>

        <div className="panel p-4">
          <h2 className="mb-2 text-sm font-semibold text-graphite-800">Stock Adjustment (cycle count correction)</h2>
          {canAdjust ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input value={adjustDelta} onChange={(e) => setAdjustDelta(e.target.value)} placeholder="± quantity (e.g. -18 or 10)" className="input" />
              </div>
              <input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Reason (required)" className="input" />
              {actionError && <ErrorState message={actionError} />}
              <button onClick={submitAdjustment} disabled={busy || !adjustDelta} className="btn-primary">Post Adjustment</button>
              <p className="text-xs text-graphite-400">Adjustments are logged to the stock ledger below and can never take a lot below zero.</p>
            </div>
          ) : (
            <p className="text-sm text-graphite-500">Your current demo role (&ldquo;{role}&rdquo;) does not have permission to post inventory adjustments. Switch to Store/Inventory Manager or Administrator.</p>
          )}
        </div>
      </div>

      <div className="mt-4 panel overflow-x-auto p-4">
        <h2 className="mb-2 text-sm font-semibold text-graphite-800">Lots / Batches</h2>
        <table className="table-base">
          <thead>
            <tr><th>Lot</th><th>Qty</th><th>Status</th><th>Inspection</th><th>Warehouse/Bin</th><th>Received</th><th>Remarks</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
              <tr key={lot.id}>
                <td className="font-medium">{lot.lotNumber}</td>
                <td>{formatNumber(lot.qty)} {material.uom}</td>
                <td><StatusBadge status={lot.status} /></td>
                <td>{lot.inspectionStatus}</td>
                <td className="text-xs">{lot.warehouse}/{lot.bin}</td>
                <td className="text-xs">{formatDateShort(lot.receivedDate)}</td>
                <td className="max-w-xs text-xs text-graphite-500">{lot.remarks ?? "-"}</td>
                <td>
                  {canInspect && lot.status === "available" && (
                    <button onClick={() => quarantine(lot.id)} className="btn-secondary px-2 py-1 text-xs">Quarantine</button>
                  )}
                  {canInspect && lot.status === "quarantined" && (
                    <button onClick={() => release(lot.id)} className="btn-primary px-2 py-1 text-xs">Release</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 panel overflow-x-auto p-4">
        <h2 className="mb-2 text-sm font-semibold text-graphite-800">Stock Movement Ledger</h2>
        {movements.length === 0 ? (
          <p className="py-4 text-sm text-graphite-400">No movements logged yet in this session beyond the opening lots above.</p>
        ) : (
          <table className="table-base">
            <thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Reference</th><th>By</th><th>Note</th></tr></thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="text-xs">{formatDateTimeShort(m.date)}</td>
                  <td className="capitalize">{m.type}</td>
                  <td className={m.qty < 0 ? "text-red-600" : "text-emerald-700"}>{m.qty > 0 ? "+" : ""}{formatNumber(m.qty)}</td>
                  <td>{m.reference}</td>
                  <td>{m.performedBy}</td>
                  <td className="text-xs text-graphite-500">{m.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
