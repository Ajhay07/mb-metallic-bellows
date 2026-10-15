"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, LoadingState, ErrorState, EmptyState } from "@/components/States";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { formatDateShort } from "@/lib/format";
import { useRole } from "@/lib/client/RoleContext";
import { roleHasPermission } from "@/lib/auth/roles";
import type { PurchaseRequisition } from "@/lib/types";

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { role } = useRole();

  useEffect(() => {
    fetch("/api/requisitions")
      .then((r) => r.json())
      .then((d) => setRequisitions(d.requisitions))
      .catch(() => setError("Could not load requisitions."));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!requisitions) return <LoadingState label="Loading requisitions…" />;

  return (
    <div>
      <PageHeader
        breadcrumb={["Procurement", "Requisitions"]}
        title="Purchase Requisitions"
        description="Draft → Pending Approval → Approved → Converted (or Rejected / Cancelled). Transitions are validated server-side."
        actions={roleHasPermission(role, "pr.create") ? <Link href="/procurement/requisitions/new" className="btn-primary">New Requisition</Link> : undefined}
      />
      {requisitions.length === 0 ? (
        <EmptyState title="No requisitions yet" />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th>PR Number</th><th>Title</th><th>Requested By</th><th>Priority</th><th>Status</th><th>Request Date</th><th>Lines</th></tr>
            </thead>
            <tbody>
              {requisitions.map((pr) => (
                <tr key={pr.id}>
                  <td><Link href={`/procurement/requisitions/${pr.id}`} className="font-medium text-steel-700 hover:underline">{pr.prNumber}</Link></td>
                  <td>{pr.title}{pr.sourceRuleId && <span className="ml-2 badge border-steel-300 bg-steel-50 text-steel-700">Auto-drafted</span>}</td>
                  <td className="text-xs">{pr.requestedBy}<br /><span className="text-graphite-400">{pr.requestedByRole}</span></td>
                  <td><PriorityBadge priority={pr.priority} /></td>
                  <td><StatusBadge status={pr.status} /></td>
                  <td className="text-xs">{formatDateShort(pr.requestDate)}</td>
                  <td>{pr.lines.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
