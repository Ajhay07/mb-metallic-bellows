// Stock availability math. This is the single source of truth for "how much of
// material X can be allocated right now" — every other module (production
// readiness, MRP, dashboard KPIs, exceptions) calls through these functions
// instead of re-deriving the numbers, so figures never disagree with each other.
import { store } from "@/lib/data/store";
import type { Material, StockLot, PurchaseOrder } from "@/lib/types";

export interface MaterialStockSummary {
  material: Material;
  onHand: number; // physically in the store (available + quarantined lots)
  quarantinedQty: number;
  pendingInspectionQty: number;
  reservedQty: number;
  availableQty: number; // onHand - reservedQty - quarantinedQty - pendingInspectionQty, floored at 0
  incomingQty: number; // sum of outstanding qty on open purchase orders
  belowReorderPoint: boolean;
  belowSafetyStock: boolean;
  openIncomingPOs: { po: PurchaseOrder; outstandingQty: number; overdue: boolean; daysOverdue: number }[];
}

export function getLotsForMaterial(materialId: string): StockLot[] {
  return store.stockLots.filter((l) => l.materialId === materialId);
}

export function getOpenPurchaseOrderLinesForMaterial(materialId: string) {
  const openStatuses = ["Ordered", "Partially Received"];
  const results: { po: PurchaseOrder; outstandingQty: number; overdue: boolean; daysOverdue: number }[] = [];
  for (const po of store.purchaseOrders) {
    if (!openStatuses.includes(po.status)) continue;
    for (const line of po.lines) {
      if (line.materialId !== materialId) continue;
      const outstanding = line.orderedQty - line.receivedQty;
      if (outstanding <= 0) continue;
      const expected = new Date(po.expectedDeliveryDate).getTime();
      const overdue = expected < Date.now();
      const daysOverdue = overdue ? Math.floor((Date.now() - expected) / 86400000) : 0;
      results.push({ po, outstandingQty: outstanding, overdue, daysOverdue });
    }
  }
  return results;
}

export function computeMaterialStock(materialId: string): MaterialStockSummary {
  const material = store.materials.find((m) => m.id === materialId);
  if (!material) throw new Error(`Unknown material ${materialId}`);
  const lots = getLotsForMaterial(materialId);
  const onHand = lots.filter((l) => l.status !== "rejected").reduce((sum, l) => sum + l.qty, 0);
  const quarantinedQty = lots.filter((l) => l.status === "quarantined").reduce((sum, l) => sum + l.qty, 0);
  // A lot that has physically arrived but has not yet cleared incoming inspection
  // (inspectionStatus "pending") is not free to allocate to production, even though
  // its LotStatus is "available" (it isn't quarantined or rejected either — it's
  // simply not inspected yet). Hold it out of availableQty until QA records a result.
  const pendingInspectionQty = lots
    .filter((l) => l.status === "available" && l.inspectionStatus === "pending")
    .reduce((sum, l) => sum + l.qty, 0);
  const reservedQty = material.reservedQty;
  const availableQty = Math.max(0, onHand - reservedQty - quarantinedQty - pendingInspectionQty);
  const openIncomingPOs = getOpenPurchaseOrderLinesForMaterial(materialId);
  const incomingQty = openIncomingPOs.reduce((sum, p) => sum + p.outstandingQty, 0);

  return {
    material,
    onHand,
    quarantinedQty,
    pendingInspectionQty,
    reservedQty,
    availableQty,
    incomingQty,
    belowReorderPoint: onHand + incomingQty < material.reorderPoint,
    belowSafetyStock: availableQty < material.safetyStock,
    openIncomingPOs,
  };
}

export function computeAllMaterialStock(): MaterialStockSummary[] {
  return store.materials.map((m) => computeMaterialStock(m.id));
}

export function recordMovement(entry: {
  materialId: string;
  lotId?: string;
  type: "receipt" | "issue" | "return" | "quarantine" | "release" | "reject" | "adjustment";
  qty: number;
  reference: string;
  performedBy: string;
  note?: string;
}) {
  store.stockMovements.push({
    id: `MOV-${String(store.stockMovements.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString(),
    ...entry,
  });
}

export function getMovementsForMaterial(materialId: string) {
  return store.stockMovements
    .filter((m) => m.materialId === materialId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
