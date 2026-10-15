"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { formatDateShort, formatDateTimeShort, formatNumber } from "@/lib/format";
import { useRole } from "@/lib/client/RoleContext";
import { roleHasPermission } from "@/lib/auth/roles";
import type { Material, PRStatus, PurchaseRequisition, Supplier } from "@/lib/types";

interface Detail {
  requisition: PurchaseRequisition;
  lines: (PurchaseRequisition["lines"][number] & { material?: Material })[];
  linkedPo: { id: string; poNumber: string } | null;
  allowedTransitions: PRStatus[];
}

export default function RequisitionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { role } = useRole();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [showConvert, setShowConvert] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/requisitions/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Requisition not found."));
  }, [params.id]);

  useEffect(() => load(), [load]);
  useEffect(() => {
    fetch("/api/suppliers").then((r) => r.json()).then((d) => setSuppliers(d.suppliers));
  }, []);

  async function transition(to: PRStatus) {
    setActionError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/requisitions/${params.id}/transition`, {
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

  async function convert() {
    setActionError(null);
    if (!supplierId || !expectedDate) return setActionError("Select a supplier and expected delivery date.");
    setBusy(true);
    try {
      const res = await fetch(`/api/requisitions/${params.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, expectedDeliveryDate: new Date(expectedDate).toISOString(), unitPrices: {} }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      router.push(`/procurement/purchase-orders/${d.purchaseOrder.id}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading requisition…" />;

  const { requisition: pr, lines, linkedPo, allowedTransitions } = data;
  const canApprove = roleHasPermission(role, "pr.approve");
  const canEdit = roleHasPermission(role, "pr.create");

  return (
    <div>
      <PageHeader
        breadcrumb={["Procurement", "Requisitions", pr.prNumber]}
        title={pr.prNumber}
        description={pr.title}
        actions={<Link href="/procurement/requisitions" className="btn-secondary">Back to requisitions</Link>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel p-4 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <StatusBadge status={pr.status} /><PriorityBadge priority={pr.priority} />
            {pr.sourceRuleId && <span className="badge border-steel-300 bg-steel-50 text-steel-700">Auto-drafted by Automation Centre</span>}
          </div>
          <p className="mb-4 text-sm text-graphite-700">{pr.justification}</p>
          <table className="table-base">
            <thead><tr><th>Material</th><th>Qty</th><th>Needed By</th></tr></thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.material ? <Link href={`/materials/${l.material.id}`} className="text-steel-700 hover:underline">{l.material.code} — {l.material.name}</Link> : l.materialId}</td>
                  <td>{formatNumber(l.qty)} {l.uom}</td>
                  <td>{formatDateShort(l.neededByDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {linkedPo && (
            <div className="mt-4 rounded-md border border-steel-200 bg-steel-50 px-3 py-2 text-sm">
              Converted to <Link href={`/procurement/purchase-orders/${linkedPo.id}`} className="font-medium text-steel-700 hover:underline">{linkedPo.poNumber}</Link>
            </div>
          )}

          <div className="mt-4 border-t border-graphite-100 pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-500">Audit History</h3>
            <ul className="space-y-2">
              {pr.history.map((h) => (
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
          {allowedTransitions.length === 0 && !showConvert && <p className="text-sm text-graphite-500">No further transitions available — this is a terminal state ({pr.status}).</p>}

          <div className="space-y-2">
            {allowedTransitions.includes("Pending Approval") && canEdit && (
              <button disabled={busy} onClick={() => transition("Pending Approval")} className="btn-primary w-full">Submit for Approval</button>
            )}
            {allowedTransitions.includes("Approved") && canApprove && (
              <button disabled={busy} onClick={() => transition("Approved")} className="btn-primary w-full">Approve</button>
            )}
            {allowedTransitions.includes("Rejected") && canApprove && (
              <button disabled={busy} onClick={() => transition("Rejected")} className="btn-danger w-full">Reject</button>
            )}
            {allowedTransitions.includes("Cancelled") && canEdit && (
              <button disabled={busy} onClick={() => transition("Cancelled")} className="btn-secondary w-full">Cancel</button>
            )}
            {(allowedTransitions.includes("Pending Approval") || allowedTransitions.includes("Rejected")) && (
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment" className="input" />
            )}

            {pr.status === "Approved" && roleHasPermission(role, "po.create") && (
              <div className="border-t border-graphite-100 pt-3">
                {!showConvert ? (
                  <button onClick={() => setShowConvert(true)} className="btn-primary w-full">Convert to Purchase Order</button>
                ) : (
                  <div className="space-y-2">
                    <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input">
                      <option value="">Select supplier…</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="input" />
                    <button disabled={busy} onClick={convert} className="btn-primary w-full">Confirm Conversion</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
