"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, LoadingState, ErrorState, EmptyState } from "@/components/States";
import { StatusBadge } from "@/components/Badges";
import { formatDateShort } from "@/lib/format";
import { useRole } from "@/lib/client/RoleContext";
import { roleHasPermission } from "@/lib/auth/roles";
import type { PurchaseOrder, Supplier } from "@/lib/types";

interface POWithSupplier extends PurchaseOrder {
  supplierName?: string;
}

function PurchaseOrdersInner() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const { role } = useRole();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/purchase-orders").then((r) => r.json()), fetch("/api/suppliers").then((r) => r.json())])
      .then(([po, sup]) => {
        setPurchaseOrders(po.purchaseOrders);
        setSuppliers(sup.suppliers);
      })
      .catch(() => setError("Could not load purchase orders."));
  }, []);

  const rows: POWithSupplier[] = useMemo(() => {
    if (!purchaseOrders) return [];
    let list = purchaseOrders.map((po) => ({ ...po, supplierName: suppliers.find((s) => s.id === po.supplierId)?.name }));
    if (filter === "overdue") {
      list = list.filter((po) => ["Ordered", "Partially Received"].includes(po.status) && new Date(po.expectedDeliveryDate).getTime() < Date.now());
    }
    return list;
  }, [purchaseOrders, suppliers, filter]);

  if (error) return <ErrorState message={error} />;
  if (!purchaseOrders) return <LoadingState label="Loading purchase orders…" />;

  return (
    <div>
      <PageHeader
        breadcrumb={["Procurement", "Purchase Orders"]}
        title="Purchase Orders"
        description="Draft → Pending Approval → Approved → Ordered → Partially Received / Received → Closed (or Rejected / Cancelled)."
        actions={roleHasPermission(role, "po.create") ? <Link href="/procurement/purchase-orders/new" className="btn-primary">New Purchase Order</Link> : undefined}
      />
      {filter === "overdue" && <div className="mb-3 badge border-red-300 bg-red-50 text-red-700">Showing: overdue deliveries only</div>}
      {rows.length === 0 ? (
        <EmptyState title="No purchase orders match this view" />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>PO Number</th><th>Supplier</th><th>Status</th><th>Order Date</th><th>Expected Delivery</th><th>Lines</th><th>Overdue</th></tr></thead>
            <tbody>
              {rows.map((po) => {
                const overdue = ["Ordered", "Partially Received"].includes(po.status) && new Date(po.expectedDeliveryDate).getTime() < Date.now();
                return (
                  <tr key={po.id}>
                    <td><Link href={`/procurement/purchase-orders/${po.id}`} className="font-medium text-steel-700 hover:underline">{po.poNumber}</Link></td>
                    <td>{po.supplierName}</td>
                    <td><StatusBadge status={po.status} /></td>
                    <td className="text-xs">{formatDateShort(po.orderDate)}</td>
                    <td className="text-xs">{formatDateShort(po.expectedDeliveryDate)}</td>
                    <td>{po.lines.length}</td>
                    <td>{overdue ? <span className="font-medium text-red-600">Overdue</span> : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PurchaseOrdersInner />
    </Suspense>
  );
}
