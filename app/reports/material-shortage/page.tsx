"use client";
import { ReportView } from "@/components/ReportView";

export default function MaterialShortageReportPage() {
  return (
    <ReportView
      title="Material Shortage Report"
      description="Materials with a net MRP shortfall (gross requirement greater than available stock plus confirmed incoming) across all open production orders."
      apiUrl="/api/reports/material-shortage"
      columns={[
        { key: "materialCode", label: "Material" },
        { key: "materialName", label: "Description" },
        { key: "grossRequirement", label: "Gross Req.", align: "right" },
        { key: "availableQty", label: "Available", align: "right" },
        { key: "incomingQty", label: "Incoming", align: "right" },
        { key: "netRequirement", label: "Net Shortfall", align: "right" },
        { key: "suggestedPurchaseQty", label: "Suggested Qty", align: "right" },
        { key: "requiredByDate", label: "Required By" },
        { key: "affectedProductionOrders", label: "Affected Orders" },
      ]}
    />
  );
}
