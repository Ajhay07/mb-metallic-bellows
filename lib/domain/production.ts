// Production order readiness and stage routing.
import { store } from "@/lib/data/store";
import { computeMaterialStock } from "./stock";
import { PRODUCTION_ROUTING } from "@/lib/types";
import type { BOM, ProductionOrder, ProductionStage } from "@/lib/types";

export interface MaterialReadinessLine {
  materialId: string;
  materialCode: string;
  materialName: string;
  uom: string;
  requiredQty: number;
  availableQty: number;
  quarantinedQty: number;
  shortfall: number;
  blocked: boolean;
  reason?: string;
}

export interface ProductionReadiness {
  ready: boolean;
  lines: MaterialReadinessLine[];
  blockingLines: MaterialReadinessLine[];
}

export function getBOMForOrder(wo: ProductionOrder): BOM | undefined {
  return store.boms.find((b) => b.id === wo.bomId);
}

// A BOM line whose consuming stage is already behind the order's current
// stage is treated as already issued/consumed material, not outstanding
// demand — so an order mid-way through its routing isn't flagged as
// "short" against components it pulled from the store days ago.
function isStageStillOutstanding(wo: ProductionOrder, bomLineStage: string): boolean {
  const currentIdx = PRODUCTION_ROUTING.indexOf(wo.currentStage);
  const lineIdx = PRODUCTION_ROUTING.indexOf(bomLineStage as ProductionStage);
  if (currentIdx === -1 || lineIdx === -1) return true;
  return lineIdx >= currentIdx;
}

// Per-order readiness check: required quantity for THIS order's remaining
// (not-yet-consumed) BOM lines is compared against current material
// availability. This is intentionally a simpler, per-order gate than the
// cross-order MRP netting in lib/domain/mrp.ts — see README "Demo
// simplifications" for why the two can show different pictures when several
// orders compete for the same scarce material.
export function computeProductionReadiness(wo: ProductionOrder): ProductionReadiness {
  const bom = getBOMForOrder(wo);
  if (!bom) return { ready: false, lines: [], blockingLines: [] };

  const outstandingLines = bom.lines.filter((bl) => isStageStillOutstanding(wo, bl.stage));
  const lines: MaterialReadinessLine[] = outstandingLines.map((bl) => {
    const stock = computeMaterialStock(bl.materialId);
    const requiredQty = Math.round(wo.qty * bl.qtyPerUnit * (1 + bl.scrapPercent / 100) * 100) / 100;
    const shortfall = Math.max(0, Math.round((requiredQty - stock.availableQty) * 100) / 100);
    const blocked = shortfall > 0;
    return {
      materialId: bl.materialId,
      materialCode: stock.material.code,
      materialName: stock.material.name,
      uom: stock.material.uom,
      requiredQty,
      availableQty: stock.availableQty,
      quarantinedQty: stock.quarantinedQty,
      shortfall,
      blocked,
      reason: blocked ? `Short by ${shortfall} ${stock.material.uom}` : undefined,
    };
  });

  const blockingLines = lines.filter((l) => l.blocked);
  return { ready: blockingLines.length === 0, lines, blockingLines };
}

export function nextStage(stage: ProductionStage): ProductionStage | null {
  const idx = PRODUCTION_ROUTING.indexOf(stage);
  if (idx === -1 || idx === PRODUCTION_ROUTING.length - 1) return null;
  return PRODUCTION_ROUTING[idx + 1];
}

export interface StageAdvanceResult {
  ok: boolean;
  error?: string;
  order?: ProductionOrder;
}

export function advanceStage(woId: string, actor: string, note?: string): StageAdvanceResult {
  const wo = store.productionOrders.find((o) => o.id === woId);
  if (!wo) return { ok: false, error: "Production order not found" };
  if (wo.status === "Completed" || wo.status === "Cancelled") {
    return { ok: false, error: `Cannot advance a ${wo.status} production order` };
  }

  if (wo.status === "Not Started") {
    const readiness = computeProductionReadiness(wo);
    if (!readiness.ready) {
      return {
        ok: false,
        error: `Blocked: material not ready (${readiness.blockingLines.map((l) => `${l.materialCode} short by ${l.shortfall} ${l.uom}`).join(", ")})`,
      };
    }
    wo.status = "In Progress";
    wo.actualStart = new Date().toISOString();
    wo.stageHistory.push({ stage: wo.currentStage, enteredAt: wo.actualStart, note });
    return { ok: true, order: wo };
  }

  const current = wo.stageHistory[wo.stageHistory.length - 1];
  if (current && !current.exitedAt) current.exitedAt = new Date().toISOString();

  const next = nextStage(wo.currentStage);
  if (!next) return { ok: false, error: "Already at final stage" };

  wo.currentStage = next;
  wo.stageHistory.push({ stage: next, enteredAt: new Date().toISOString(), note });

  if (next === "Completed") {
    wo.status = "Completed";
    wo.actualEnd = new Date().toISOString();
  }

  return { ok: true, order: wo };
}

export function holdOrder(woId: string, reason: string): StageAdvanceResult {
  const wo = store.productionOrders.find((o) => o.id === woId);
  if (!wo) return { ok: false, error: "Production order not found" };
  if (wo.status === "Completed" || wo.status === "Cancelled") return { ok: false, error: `Cannot hold a ${wo.status} order` };
  wo.status = "On Hold";
  wo.delayReason = reason;
  return { ok: true, order: wo };
}

export function resumeOrder(woId: string): StageAdvanceResult {
  const wo = store.productionOrders.find((o) => o.id === woId);
  if (!wo) return { ok: false, error: "Production order not found" };
  if (wo.status !== "On Hold") return { ok: false, error: "Order is not on hold" };
  wo.status = wo.actualStart ? "In Progress" : "Not Started";
  wo.delayReason = undefined;
  return { ok: true, order: wo };
}

export function isOverdue(wo: ProductionOrder): boolean {
  if (wo.status === "Completed" || wo.status === "Cancelled") return false;
  return new Date(wo.plannedEnd).getTime() < Date.now();
}

export function scheduleAttainmentPct(): number {
  const completed = store.productionOrders.filter((o) => o.status === "Completed");
  if (completed.length === 0) return 100;
  const onTime = completed.filter((o) => o.actualEnd && new Date(o.actualEnd) <= new Date(o.plannedEnd));
  return Math.round((onTime.length / completed.length) * 1000) / 10;
}
