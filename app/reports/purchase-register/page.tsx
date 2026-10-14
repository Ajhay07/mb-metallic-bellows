"use client";
import { ReportView } from "@/components/ReportView";

export default function PurchaseRegisterReportPage() {
  return (
    <ReportView
      title="Purchase Register"
      description="Every purchase order line across all suppliers, with ordered/received/accepted/rejected quantities and line value."
      apiUrl="/api/reports/purchase-register"
      columns={[
        { key: "poNumber", label: "PO Number" },
        { key: "supplier", label: "Supplier" },
        { key: "materialCode", label: "Material" },
        { key: "materialName", label: "Description" },
        { key: "orderedQty", label: "Ordered", align: "right" },
        { key: "uom", label: "UoM" },
        { key: "unitPrice", label: "Unit ₹", align: "right" },
        { key: "lineValue", label: "Line Value ₹", align: "right" },
        { key: "receivedQty", label: "Received", align: "right" },
        { key: "acceptedQty", label: "Accepted", align: "right" },
        { key: "rejectedQty", label: "Rejected", align: "right" },
        { key: "status", label: "Status" },
        { key: "orderDate", label: "Order Date" },
        { key: "expectedDeliveryDate", label: "Expected" },
      ]}
    />
  );
}
