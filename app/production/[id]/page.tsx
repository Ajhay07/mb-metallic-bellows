"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { formatDateShort, formatDateTimeShort } from "@/lib/format";
import { useRole } from "@/lib/client/RoleContext";
import { roleHasPermission } from "@/lib/auth/roles";
import { PRODUCTION_ROUTING } from "@/lib/types";
import type { BOM, ProductionOrder, ProductionStage } from "@/lib/types";

interface ReadinessLine {
  materialId: string; materialCode: string; materialName: string; uom: string;
  requiredQty: number; availableQty: number; quarantinedQty: number; shortfall: number; blocked: boolean; reason?: string;
}

interface Detail {
  order: ProductionOrder;
  bom: BOM;
  readiness: { ready: boolean; lines: ReadinessLine[]; blockingLines: ReadinessLine[] };
  overdue: boolean;
  nextStage: ProductionStage | null;
}

export default function ProductionDetailPage() {
  const params = useParams<{ id: string }>();
  const { role } = useRole();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/production/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Production order not found."));
  }, [params.id]);

  useEffect(() => load(), [load]);

  async function advance() {
    setActionError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/production/${params.id}/advance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not advance stage");
    } finally {
      setBusy(false);
    }
  }

  async function hold() {
    const reason = prompt("Reason for placing this order on hold:");
    if (!reason) return;
    const res = await fetch(`/api/production/${params.id}/hold`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    if (res.ok) load();
    else setActionError((await res.json()).error);
  }

  async function resume() {
    const res = await fetch(`/api/production/${params.id}/hold`, { method: "DELETE" });
    if (res.ok) load();
    else setActionError((await res.json()).error);
  }

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading production order…" />;

  const { order: wo, bom, readiness, overdue, nextStage } = data;
  const canManage = roleHasPermission(role, "production.manage");

  return (
    <div>
      <PageHeader
        breadcrumb={["Production", wo.woNumber]}
        title={wo.woNumber}
        description={`${bom.productCode} — ${bom.productName} · Customer: ${wo.customer} (${wo.salesOrderRef})`}
        actions={<Link href="/production" className="btn-secondary">Back to production</Link>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={wo.status} /><PriorityBadge priority={wo.priority} />
        {overdue && <span className="badge border-red-300 bg-red-50 text-red-700">Overdue</span>}
        {readiness.ready ? <span className="badge border-emerald-300 bg-emerald-50 text-emerald-700">Material Ready</span> : <span className="badge border-red-300 bg-red-50 text-red-700">Blocked: {readiness.blockingLines.length} material(s) short</span>}
      </div>

      {wo.delayReason && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"><strong>Delay reason:</strong> {wo.delayReason}</div>}
      {actionError && <div className="mb-4"><ErrorState message={actionError} /></div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel p-4 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-graphite-800">Production Routing</h2>
          <div className="flex flex-wrap gap-1.5">
            {PRODUCTION_ROUTING.map((stage) => {
              const idx = PRODUCTION_ROUTING.indexOf(wo.currentStage);
              const stageIdx = PRODUCTION_ROUTING.indexOf(stage);
              const state = stageIdx < idx || wo.status === "Completed" ? "done" : stageIdx === idx ? "current" : "pending";
              return (
                <span key={stage} className={`rounded px-2 py-1 text-xs font-medium ${state === "done" ? "bg-emerald-100 text-emerald-700" : state === "current" ? "bg-steel-600 text-white" : "bg-graphite-100 text-graphite-500"}`}>
                  {stage}
                </span>
              );
            })}
          </div>

          <div className="mt-4 border-t border-graphite-100 pt-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-500">Stage History</h3>
            <ul className="space-y-1 text-sm">
              {wo.stageHistory.length === 0 && <li className="text-graphite-400">Not started yet.</li>}
              {wo.stageHistory.map((h, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{h.stage}</span>
                  <span className="text-xs text-graphite-500">{formatDateTimeShort(h.enteredAt)} {h.exitedAt ? `→ ${formatDateTimeShort(h.exitedAt)}` : "(current)"}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 border-t border-graphite-100 pt-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-500">Material Readiness (full order requirement vs. current stock)</h3>
            <table className="table-base">
              <thead><tr><th>Material</th><th>Required</th><th>Available</th><th>Quarantined</th><th>Status</th></tr></thead>
              <tbody>
                {readiness.lines.map((l) => (
                  <tr key={l.materialId} className={l.blocked ? "bg-red-50/40" : ""}>
                    <td><Link href={`/materials/${l.materialId}`} className="text-steel-700 hover:underline">{l.materialCode}</Link></td>
                    <td>{l.requiredQty} {l.uom}</td>
                    <td>{l.availableQty} {l.uom}</td>
                    <td>{l.quarantinedQty > 0 ? <span className="text-amber-700">{l.quarantinedQty} {l.uom}</span> : "-"}</td>
                    <td>{l.blocked ? <span className="font-medium text-red-600">{l.reason}</span> : <span className="text-emerald-700">OK</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="mb-2 text-sm font-semibold text-graphite-800">Actions</h2>
          {!canManage && <p className="text-sm text-graphite-500">Your current demo role (&ldquo;{role}&rdquo;) cannot manage production. Switch to Production Planner or Administrator.</p>}
          {canManage && (
            <div className="space-y-2">
              {wo.status !== "Completed" && wo.status !== "Cancelled" && wo.status !== "On Hold" && (
                <button disabled={busy || !readiness.ready} onClick={advance} className="btn-primary w-full">
                  {wo.status === "Not Started" ? "Start Production" : `Advance to: ${nextStage ?? "—"}`}
                </button>
              )}
              {wo.status !== "On Hold" && !readiness.ready && (
                <p className="text-xs text-red-600">
                  {wo.status === "Not Started" ? "Cannot start" : "Cannot advance"} — blocked by the material shortfall(s) above. The gate re-checks on every stage, not just at start.
                </p>
              )}
              {wo.status === "On Hold" ? (
                <button disabled={busy} onClick={resume} className="btn-primary w-full">Resume</button>
              ) : wo.status !== "Completed" && wo.status !== "Cancelled" ? (
                <button disabled={busy} onClick={hold} className="btn-secondary w-full">Place On Hold</button>
              ) : null}
            </div>
          )}
          <div className="mt-4 border-t border-graphite-100 pt-3 text-sm">
            <dl className="space-y-1">
              <div className="flex justify-between"><dt className="text-graphite-500">Qty</dt><dd>{wo.qty}</dd></div>
              <div className="flex justify-between"><dt className="text-graphite-500">Planned Start</dt><dd>{formatDateShort(wo.plannedStart)}</dd></div>
              <div className="flex justify-between"><dt className="text-graphite-500">Planned End</dt><dd>{formatDateShort(wo.plannedEnd)}</dd></div>
              <div className="flex justify-between"><dt className="text-graphite-500">Actual Start</dt><dd>{formatDateShort(wo.actualStart)}</dd></div>
              <div className="flex justify-between"><dt className="text-graphite-500">Actual End</dt><dd>{formatDateShort(wo.actualEnd)}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
