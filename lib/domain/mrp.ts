// Material Requirements Planning (MRP) netting.
//
// Gross requirement  = Σ over open production orders using this material in their
//                       BOM of (order qty × BOM qty-per-unit × (1 + scrap%))
// Net requirement     = max(0, gross requirement − available stock − confirmed
//                       incoming (outstanding qty on open purchase orders))
// Suggested order qty = net requirement rounded up to the nearest 5 units, so the
//                       figure is never fabricated — it is always derivable from
//                       the two numbers above.
import { store } from "@/lib/data/store";
import { computeMaterialStock } from "./stock";
import { PRODUCTION_ROUTING } from "@/lib/types";
import type { BOMLine, ProductionOrder, ProductionStage } from "@/lib/types";

const OPEN_PRODUCTION_STATUSES: ProductionOrder["status"][] = ["Not Started", "In Progress", "On Hold"];

// For an order already underway, any BOM line whose consuming stage has
// already been completed is treated as already issued/consumed — it should
// not be demanded again in MRP. Only lines at the current stage or a stage
// still ahead are counted as open demand.
function isStageStillOutstanding(wo: ProductionOrder, bomLineStage: string): boolean {
  const currentIdx = PRODUCTION_ROUTING.indexOf(wo.currentStage);
  const lineIdx = PRODUCTION_ROUTING.indexOf(bomLineStage as ProductionStage);
  if (currentIdx === -1 || lineIdx === -1) return true;
  return lineIdx >= currentIdx;
}

export interface MRPOrderDemand {
  productionOrder: ProductionOrder;
  bomLine: BOMLine;
  grossQty: number;
  requiredByDate: string;
}

export interface MRPLine {
  materialId: string;
  materialCode: string;
  materialName: string;
  uom: string;
  grossRequirement: number;
  availableQty: number;
  incomingQty: number;
  netRequirement: number;
  suggestedPurchaseQty: number;
  requiredByDate: string | null;
  isShortage: boolean;
  demands: MRPOrderDemand[];
}

function roundUpTo(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

export function runMRP(): MRPLine[] {
  const lines: MRPLine[] = [];

  for (const material of store.materials) {
    const demands: MRPOrderDemand[] = [];

    for (const wo of store.productionOrders) {
      if (!OPEN_PRODUCTION_STATUSES.includes(wo.status)) continue;
      const bom = store.boms.find((b) => b.id === wo.bomId);
      if (!bom) continue;
      for (const bl of bom.lines) {
        if (bl.materialId !== material.id) continue;
        if (!isStageStillOutstanding(wo, bl.stage)) continue;
        const gross = wo.qty * bl.qtyPerUnit * (1 + bl.scrapPercent / 100);
        demands.push({ productionOrder: wo, bomLine: bl, grossQty: Math.round(gross * 100) / 100, requiredByDate: wo.plannedStart });
      }
    }

    if (demands.length === 0) continue;

    const grossRequirement = Math.round(demands.reduce((s, d) => s + d.grossQty, 0) * 100) / 100;
    const stock = computeMaterialStock(material.id);
    const netRequirement = Math.max(0, Math.round((grossRequirement - stock.availableQty - stock.incomingQty) * 100) / 100);
    const suggestedPurchaseQty = netRequirement > 0 ? roundUpTo(netRequirement, 5) : 0;
    const requiredByDate = demands
      .map((d) => d.requiredByDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

    lines.push({
      materialId: material.id,
      materialCode: material.code,
      materialName: material.name,
      uom: material.uom,
      grossRequirement,
      availableQty: stock.availableQty,
      incomingQty: stock.incomingQty,
      netRequirement,
      suggestedPurchaseQty,
      requiredByDate,
      isShortage: netRequirement > 0,
      demands,
    });
  }

  return lines.sort((a, b) => Number(b.isShortage) - Number(a.isShortage) || b.netRequirement - a.netRequirement);
}

export function getMRPLineForMaterial(materialId: string): MRPLine | undefined {
  return runMRP().find((l) => l.materialId === materialId);
}
