"use client";
import { Fragment, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, LoadingState, ErrorState, EmptyState } from "@/components/States";
import { SeverityBadge, ExceptionStatusBadge } from "@/components/Badges";
import { formatDateShort, formatDateTimeShort } from "@/lib/format";
import { useRole } from "@/lib/client/RoleContext";
import { roleHasPermission } from "@/lib/auth/roles";
import type { ExceptionItem, ExceptionStatus } from "@/lib/types";

const CATEGORIES = ["Procurement", "Inventory", "Production", "Supplier", "Quality"];
const SEVERITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES: ExceptionStatus[] = ["Open", "Acknowledged", "Resolved", "Dismissed"];

function ExceptionsInner() {
  const searchParams = useSearchParams();
  const { role } = useRole();
  const [exceptions, setExceptions] = useState<ExceptionItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [severity, setSeverity] = useState(searchParams.get("severity") ?? "");
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    fetch("/api/exceptions").then((r) => r.json()).then((d) => setExceptions(d.exceptions)).catch(() => setError("Could not load exceptions."));
  }, []);
  useEffect(() => load(), [load]);

  const visible = useMemo(() => {
    if (!exceptions) return [];
    return exceptions.filter((e) => (!category || e.category === category) && (!severity || e.severity === severity) && (!status || e.status === status));
  }, [exceptions, category, severity, status]);

  async function changeStatus(id: string, newStatus: ExceptionStatus) {
    let reason: string | undefined;
    if (newStatus === "Dismissed") {
      reason = prompt("Reason for dismissing this exception:") ?? undefined;
      if (!reason) return;
    }
    const res = await fetch(`/api/exceptions/${id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus, reason }) });
    if (res.ok) load();
    else alert((await res.json()).error);
  }

  if (error) return <ErrorState message={error} />;
  if (!exceptions) return <LoadingState label="Loading exceptions inbox…" />;

  const canManage = roleHasPermission(role, "exceptions.manage");

  return (
    <div>
      <PageHeader title="Exceptions Inbox" description="Unified queue across procurement, inventory, production, supplier and quality issues — ranked by severity, then deadline proximity, then age." />
      <div className="mb-4 flex flex-wrap gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input w-44">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input w-40">
          <option value="">All severities</option>
          {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-40">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No exceptions match this view" description="Try clearing filters, or run the Automation Centre checks to populate the inbox." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="table-base">
            <thead><tr><th></th><th>Title</th><th>Category</th><th>Severity</th><th>Owner</th><th>Status</th><th>Deadline</th><th>Updated</th></tr></thead>
            <tbody>
              {visible.map((e) => (
                <Fragment key={e.id}>
                  <tr className="cursor-pointer" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                    <td className="text-xs text-steel-700">{expanded === e.id ? "▾" : "▸"}</td>
                    <td className="font-medium text-graphite-900">{e.title}</td>
                    <td className="text-xs">{e.category}</td>
                    <td><SeverityBadge severity={e.severity} /></td>
                    <td className="text-xs">{e.owner}</td>
                    <td><ExceptionStatusBadge status={e.status} /></td>
                    <td className="text-xs">{formatDateShort(e.deadline)}</td>
                    <td className="text-xs">{formatDateTimeShort(e.updatedAt)}</td>
                  </tr>
                  {expanded === e.id && (
                    <tr>
                      <td colSpan={8} className="bg-graphite-50 p-4">
                        <p className="mb-2 text-sm text-graphite-700">{e.description}</p>
                        <p className="mb-2 text-sm"><strong>Recommended action:</strong> {e.recommendedAction}</p>
                        <p className="mb-3 text-sm"><Link href={e.affectedEntity.href} className="font-medium text-steel-700 hover:underline">Open affected record: {e.affectedEntity.label} →</Link></p>
                        {e.statusReason && <p className="mb-3 text-xs text-graphite-500"><strong>Status note:</strong> {e.statusReason}</p>}

                        {canManage && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {e.status !== "Acknowledged" && e.status !== "Resolved" && e.status !== "Dismissed" && (
                              <button onClick={() => changeStatus(e.id, "Acknowledged")} className="btn-secondary text-xs">Acknowledge</button>
                            )}
                            {e.status !== "Resolved" && <button onClick={() => changeStatus(e.id, "Resolved")} className="btn-primary text-xs">Mark Resolved</button>}
                            {e.status !== "Dismissed" && <button onClick={() => changeStatus(e.id, "Dismissed")} className="btn-danger text-xs">Dismiss…</button>}
                            {e.status !== "Open" && <button onClick={() => changeStatus(e.id, "Open")} className="btn-secondary text-xs">Reopen</button>}
                          </div>
                        )}

                        <div className="border-t border-graphite-200 pt-2">
                          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-graphite-500">History</h4>
                          <ul className="space-y-1 text-xs text-graphite-600">
                            {e.history.map((h) => (
                              <li key={h.id}>{h.action} — {h.byUser} ({h.byRole}) · {formatDateTimeShort(h.date)}{h.comment ? ` — ${h.comment}` : ""}</li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ExceptionsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ExceptionsInner />
    </Suspense>
  );
}
