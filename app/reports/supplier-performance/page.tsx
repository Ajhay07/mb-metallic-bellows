"use client";
import { ReportView } from "@/components/ReportView";

export default function SupplierPerformanceReportPage() {
  return (
    <ReportView
      title="Supplier Performance Report"
      description="On-time delivery %, rejection rate, currently overdue orders and the demo risk score, computed from each supplier's purchase order history."
      apiUrl="/api/reports/supplier-performance"
      columns={[
        { key: "supplierCode", label: "Code" },
        { key: "supplierName", label: "Supplier" },
        { key: "totalOrders", label: "Total Orders", align: "right" },
        { key: "onTimeDeliveryPct", label: "On-Time % (all-time)", align: "right" },
        { key: "recentOnTimeDeliveryPct", label: "On-Time % (last 3)", align: "right" },
        { key: "rejectionRatePct", label: "Rejection %", align: "right" },
        { key: "openOverdueOrders", label: "Open Overdue", align: "right" },
        { key: "riskScore", label: "Risk Score", align: "right" },
        { key: "riskBand", label: "Risk Band" },
      ]}
    />
  );
}
