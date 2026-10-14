"use client";
import { ReportView } from "@/components/ReportView";

export default function ProductionStatusReportPage() {
  return (
    <ReportView
      title="Production Status Report"
      description="Every production order's product, stage, status, planned vs. actual dates and delay reason."
      apiUrl="/api/reports/production-status"
      columns={[
        { key: "woNumber", label: "Work Order" },
        { key: "product", label: "Product" },
        { key: "customer", label: "Customer" },
        { key: "salesOrderRef", label: "Sales Order" },
        { key: "qty", label: "Qty", align: "right" },
        { key: "priority", label: "Priority" },
        { key: "status", label: "Status" },
        { key: "currentStage", label: "Stage" },
        { key: "plannedStart", label: "Planned Start" },
        { key: "plannedEnd", label: "Planned End" },
        { key: "actualStart", label: "Actual Start" },
        { key: "actualEnd", label: "Actual End" },
        { key: "overdue", label: "Overdue" },
        { key: "delayReason", label: "Delay Reason" },
      ]}
    />
  );
}
