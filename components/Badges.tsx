import type { ExceptionSeverity, ExceptionStatus } from "@/lib/types";

const SEVERITY_STYLES: Record<ExceptionSeverity, string> = {
  Critical: "border-red-300 bg-red-50 text-red-700",
  High: "border-amber-300 bg-amber-50 text-amber-800",
  Medium: "border-steel-300 bg-steel-50 text-steel-700",
  Low: "border-graphite-300 bg-graphite-100 text-graphite-600",
};

export function SeverityBadge({ severity }: { severity: ExceptionSeverity }) {
  return <span className={`badge ${SEVERITY_STYLES[severity]}`}>{severity}</span>;
}

const EXC_STATUS_STYLES: Record<ExceptionStatus, string> = {
  Open: "border-red-300 bg-red-50 text-red-700",
  Acknowledged: "border-amber-300 bg-amber-50 text-amber-800",
  Resolved: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Dismissed: "border-graphite-300 bg-graphite-100 text-graphite-500",
};

export function ExceptionStatusBadge({ status }: { status: ExceptionStatus }) {
  return <span className={`badge ${EXC_STATUS_STYLES[status]}`}>{status}</span>;
}

const GENERIC_STATUS_STYLES: Record<string, string> = {
  Draft: "border-graphite-300 bg-graphite-100 text-graphite-600",
  "Pending Approval": "border-amber-300 bg-amber-50 text-amber-800",
  Approved: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Rejected: "border-red-300 bg-red-50 text-red-700",
  Cancelled: "border-graphite-300 bg-graphite-100 text-graphite-500",
  Converted: "border-steel-300 bg-steel-50 text-steel-700",
  Ordered: "border-steel-300 bg-steel-50 text-steel-700",
  "Partially Received": "border-amber-300 bg-amber-50 text-amber-800",
  Received: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Closed: "border-graphite-400 bg-graphite-100 text-graphite-600",
  "Not Started": "border-graphite-300 bg-graphite-100 text-graphite-600",
  "In Progress": "border-steel-300 bg-steel-50 text-steel-700",
  "On Hold": "border-amber-300 bg-amber-50 text-amber-800",
  Completed: "border-emerald-300 bg-emerald-50 text-emerald-700",
  available: "border-emerald-300 bg-emerald-50 text-emerald-700",
  quarantined: "border-amber-300 bg-amber-50 text-amber-800",
  rejected: "border-red-300 bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${GENERIC_STATUS_STYLES[status] ?? "border-graphite-300 bg-graphite-100 text-graphite-600"}`}>{status}</span>;
}

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "border-red-300 bg-red-50 text-red-700",
  High: "border-amber-300 bg-amber-50 text-amber-800",
  Medium: "border-steel-300 bg-steel-50 text-steel-700",
  Low: "border-graphite-300 bg-graphite-100 text-graphite-600",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`badge ${PRIORITY_STYLES[priority] ?? ""}`}>{priority}</span>;
}
