"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import { StatusBadge } from "@/components/Badges";
import { formatDateShort, formatDateTimeShort, formatNumber } from "@/lib/format";
import { useRole } from "@/lib/client/RoleContext";
import { roleHasPermission } from "@/lib/auth/roles";
import type { Material, POLine, POStatus, PurchaseOrder, StockLot, Supplier } from "@/lib/types";

interface Detail {
  purchaseOrder: PurchaseOrder;
  supplier?: Supplier;
  lines: (POLine & { material?: Material })[];
  overdue: boolean;
  lots: StockLot[];
  allowedTransitions: POStatus[];
}

export default function PurchaseOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { role } = useRole();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({});
  const [lotNumbers, setLotNumbers] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    fetch(`/api/purchase-orders/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Purchase order not found."));
  }, [params.id]);

  useEffect(() => load(), [load]);

  async function transition(to: POStatus) {
    setActionError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, comment: comment || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setComment("");
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Transition failed");
    } finally {
      setBusy(false);
    }
  }

  async function receiveGoods() {
    setActionError(null);
    if (!data) return;
    const payload = data.lines
      .filter((l) => Number(receiveQtys[l.id]) > 0)
      .map((l) => ({ poLineId: l.id, qty: Number(receiveQtys[l.id]), lotNumber: lotNumbers[l.id] || `${data.purchaseOrder.poNumber}-${l.material?.code ?? l.materialId}` }));
    if (payload.length === 0) return setActionError("Enter a quantity to receive on at least one line.");
    setBusy(true);
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: payload }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setReceiveQtys({});
      setLotNumbers({});
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Receipt failed");
    } finally {
      setBusy(false);
    }
  }

  async function inspect(lotId: string, result: "passed" | "failed") {
    const remarks = result === "failed" ? prompt("Reason for rejection:") ?? undefined : undefined;
    const res = await fetch(`/api/purchase-orders/${params.id}/inspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lotId, result, remarks }),
    });
    if (res.ok) load();
    else alert((await res.json()).error);
  }

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading purchase order…" />;

  const { purchaseOrder: po, supplier, lines, overdue, lots, allowedTransitions } = data;
  const canApprove = roleHasPermission(role, "po.approve");
  const canEdit = roleHasPermission(role, "po.create");
  const canReceive = roleHasPermission(role, "po.receive");
  const canInspect = roleHasPermission(role, "inspection.record");
  const totalValue = lines.reduce((s, l) => s + l.orderedQty * l.unitPrice, 0);

  return (
    <div>
      <PageHeader
        breadcrumb={["Procurement", "Purchase Orders", po.poNumber]}
        title={po.poNumber}
        description={`${supplier?.name ?? po.supplierId} · Order date ${formatDateShort(po.orderDate)} · Expected ${formatDateShort(po.expectedDeliveryDate)}${overdue ? " (OVERDUE)" : ""}`}
        actions={<Link href="/procurement/purchase-orders" className="btn-secondary">Back to purchase orders</Link>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel p-4 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <StatusBadge status={po.status} />
            {overdue && <span className="badge border-red-300 bg-red-50 text-red-700">Overdue delivery</span>}
            <span className="text-sm text-graphite-500">Total value: ₹{formatNumber(totalValue)}</span>
          </div>
          <table className="table-base">
            <thead><tr><th>Material</th><th>Ordered</th><th>Received</th><th>Accepted</th><th>Rejected</th><th>Unit Price</th></tr></thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.material ? <Link href={`/materials/${l.material.id}`} className="text-steel-700 hover:underline">{l.material.code}</Link> : l.materialId}</td>
                  <td>{formatNumber(l.orderedQty)} {l.uom}</td>
                  <td>{formatNumber(l.receivedQty)}</td>
                  <td>{formatNumber(l.acceptedQty)}</td>
                  <td className={l.rejectedQty > 0 ? "font-medium text-red-600" : ""}>{formatNumber(l.rejectedQty)}</td>
                  <td>₹{formatNumber(l.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {["Ordered", "Partially Received"].includes(po.status) && canReceive && (
            <div className="mt-4 border-t border-graphite-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-graphite-800">Receive Goods (create GRN)</h3>
              <div className="space-y-2">
                {lines.filter((l) => l.receivedQty < l.orderedQty).map((l) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <span className="w-40 text-sm">{l.material?.code}</span>
                    <input value={receiveQtys[l.id] ?? ""} onChange={(e) => setReceiveQtys((p) => ({ ...p, [l.id]: e.target.value }))} placeholder={`Qty (max ${l.orderedQty - l.receivedQty})`} className="input w-40" />
                    <input value={lotNumbers[l.id] ?? ""} onChange={(e) => setLotNumbers((p) => ({ ...p, [l.id]: e.target.value }))} placeholder="Lot number (optional)" className="input flex-1" />
                  </div>
                ))}
              </div>
              <button onClick={receiveGoods} disabled={busy} className="btn-primary mt-2">Post Goods Receipt</button>
            </div>
          )}

          {lots.length > 0 && (
            <div className="mt-4 border-t border-graphite-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-graphite-800">Received Lots &amp; Inspection</h3>
              <table className="table-base">
                <thead><tr><th>Lot</th><th>Qty</th><th>Status</th><th>Inspection</th><th>Actions</th></tr></thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.id}>
                      <td>{lot.lotNumber}</td>
                      <td>{formatNumber(lot.qty)}</td>
                      <td><StatusBadge status={lot.status} /></td>
                      <td>{lot.inspectionStatus}{lot.remarks && <div className="text-xs text-graphite-500">{lot.remarks}</div>}</td>
                      <td>
                        {canInspect && lot.inspectionStatus === "pending" && (
                          <div className="flex gap-1">
                            <button onClick={() => inspect(lot.id, "passed")} className="btn-primary px-2 py-1 text-xs">Pass</button>
                            <button onClick={() => inspect(lot.id, "failed")} className="btn-danger px-2 py-1 text-xs">Fail</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 border-t border-graphite-100 pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-500">Audit History</h3>
            <ul className="space-y-2">
              {po.history.map((h) => (
                <li key={h.id} className="text-sm">
                  <span className="font-medium text-graphite-900">{h.action}</span> — {h.byUser} ({h.byRole}) · <span className="text-xs text-graphite-400">{formatDateTimeShort(h.date)}</span>
                  {h.comment && <p className="text-xs text-graphite-500">{h.comment}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="mb-2 text-sm font-semibold text-graphite-800">Actions</h2>
          {actionError && <div className="mb-2"><ErrorState message={actionError} /></div>}
          {allowedTransitions.length === 0 && <p className="text-sm text-graphite-500">No further status transitions — this is a terminal state ({po.status}).</p>}
          <div className="space-y-2">
            {allowedTransitions.includes("Pending Approval") && canEdit && <button disabled={busy} onClick={() => transition("Pending Approval")} className="btn-primary w-full">Submit for Approval</button>}
            {allowedTransitions.includes("Approved") && canApprove && <button disabled={busy} onClick={() => transition("Approved")} className="btn-primary w-full">Approve</button>}
            {allowedTransitions.includes("Rejected") && canApprove && <button disabled={busy} onClick={() => transition("Rejected")} className="btn-danger w-full">Reject</button>}
            {allowedTransitions.includes("Ordered") && canEdit && <button disabled={busy} onClick={() => transition("Ordered")} className="btn-primary w-full">Send to Supplier (Mark Ordered)</button>}
            {allowedTransitions.includes("Closed") && canApprove && <button disabled={busy} onClick={() => transition("Closed")} className="btn-primary w-full">Close PO</button>}
            {allowedTransitions.includes("Cancelled") && canEdit && <button disabled={busy} onClick={() => transition("Cancelled")} className="btn-secondary w-full">Cancel</button>}
            {(allowedTransitions.includes("Pending Approval") || allowedTransitions.includes("Rejected")) && (
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment" className="input" />
            )}
          </div>
          {supplier && (
            <div className="mt-4 border-t border-graphite-100 pt-3 text-sm">
              <Link href={`/suppliers/${supplier.id}`} className="font-medium text-steel-700 hover:underline">{supplier.name}</Link>
              <p className="text-xs text-graphite-500">{supplier.location}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
