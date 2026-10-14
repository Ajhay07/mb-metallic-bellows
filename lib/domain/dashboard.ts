import { store } from "@/lib/data/store";
import { computeAllMaterialStock } from "./stock";
import { runMRP } from "./mrp";
import { computeProductionReadiness, scheduleAttainmentPct, isOverdue } from "./production";

export function computeDashboard() {
  const allStock = computeAllMaterialStock();
  const mrp = runMRP();

  const activeProductionOrders = store.productionOrders.filter((o) => o.status === "In Progress" || o.status === "Not Started" || o.status === "On Hold");
  const openPOStatuses = ["Draft", "Pending Approval", "Approved", "Ordered", "Partially Received", "Received"];
  const openPOs = store.purchaseOrders.filter((po) => openPOStatuses.includes(po.status));
  const belowReorder = allStock.filter((s) => s.belowReorderPoint);
  const criticalShortages = mrp.filter((l) => l.isShortage);
  const overdueDeliveries = store.purchaseOrders.filter((po) => ["Ordered", "Partially Received"].includes(po.status) && new Date(po.expectedDeliveryDate).getTime() < Date.now());

  const atRiskOrders = store.productionOrders
    .filter((o) => o.status === "Not Started" || o.status === "On Hold")
    .filter((o) => !computeProductionReadiness(o).ready || o.status === "On Hold");

  const overdueOrders = store.productionOrders.filter((o) => isOverdue(o));

  const pendingInspection = store.stockLots.filter((l) => l.inspectionStatus === "pending" && l.status !== "rejected");

  const pendingApprovalPRs = store.requisitions.filter((p) => p.status === "Pending Approval");
  const pendingApprovalPOs = store.purchaseOrders.filter((p) => p.status === "Pending Approval");

  // On-time delivery rate across all evaluable (closed/received) purchase orders.
  let evaluable = 0;
  let onTime = 0;
  for (const po of store.purchaseOrders) {
    if (!["Closed", "Received"].includes(po.status) || po.grns.length === 0) continue;
    evaluable++;
    const lastGrn = po.grns[po.grns.length - 1];
    if (new Date(lastGrn.date) <= new Date(po.expectedDeliveryDate)) onTime++;
  }
  const onTimeDeliveryRatePct = evaluable ? Math.round((onTime / evaluable) * 1000) / 10 : 100;

  const openExceptions = store.exceptions.filter((e) => e.status === "Open" || e.status === "Acknowledged");

  const supplierDeliveries = store.purchaseOrders
    .filter((po) => ["Ordered", "Partially Received"].includes(po.status))
    .map((po) => {
      const supplier = store.suppliers.find((s) => s.id === po.supplierId);
      const overdue = new Date(po.expectedDeliveryDate).getTime() < Date.now();
      const daysOverdue = overdue ? Math.floor((Date.now() - new Date(po.expectedDeliveryDate).getTime()) / 86400000) : 0;
      return {
        poId: po.id,
        poNumber: po.poNumber,
        supplierName: supplier?.name ?? po.supplierId,
        status: po.status,
        expectedDeliveryDate: po.expectedDeliveryDate,
        overdue,
        daysOverdue,
      };
    })
    .sort((a, b) => new Date(a.expectedDeliveryDate).getTime() - new Date(b.expectedDeliveryDate).getTime())
    .slice(0, 8);

  return {
    kpis: {
      activeProductionOrders: activeProductionOrders.length,
      openPOs: openPOs.length,
      materialsBelowReorderPoint: belowReorder.length,
      criticalShortages: criticalShortages.length,
      overdueSupplierDeliveries: overdueDeliveries.length,
      productionOrdersAtRisk: atRiskOrders.length,
      overdueProductionOrders: overdueOrders.length,
      pendingInspection: pendingInspection.length,
      pendingApprovals: pendingApprovalPRs.length + pendingApprovalPOs.length,
      onTimeDeliveryRatePct,
      scheduleAttainmentPct: scheduleAttainmentPct(),
      openExceptions: openExceptions.length,
      criticalExceptions: openExceptions.filter((e) => e.severity === "Critical").length,
    },
    belowReorderMaterialIds: belowReorder.map((s) => s.material.id),
    criticalShortageMaterialIds: criticalShortages.map((l) => l.materialId),
    overdueDeliveryPoIds: overdueDeliveries.map((p) => p.id),
    atRiskOrderIds: atRiskOrders.map((o) => o.id),
    overdueOrderIds: overdueOrders.map((o) => o.id),
    pendingInspectionLotIds: pendingInspection.map((l) => l.id),
    supplierDeliveries,
    criticalShortageLines: criticalShortages.slice(0, 6).map((l) => ({
      materialId: l.materialId,
      materialCode: l.materialCode,
      materialName: l.materialName,
      uom: l.uom,
      netRequirement: l.netRequirement,
      requiredByDate: l.requiredByDate,
      affectedOrders: Array.from(new Set(l.demands.map((d) => d.productionOrder.woNumber))),
    })),
  };
}
