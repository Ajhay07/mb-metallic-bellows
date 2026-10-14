import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { computeProductionReadiness, isOverdue } from "@/lib/domain/production";

export async function GET() {
  const orders = store.productionOrders.map((wo) => {
    const bom = store.boms.find((b) => b.id === wo.bomId);
    const readiness = computeProductionReadiness(wo);
    return { ...wo, bom: bom ? { id: bom.id, productName: bom.productName, productCode: bom.productCode } : null, readiness: { ready: readiness.ready, blockingCount: readiness.blockingLines.length }, overdue: isOverdue(wo) };
  });
  return NextResponse.json({ orders: orders.sort((a, b) => new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime()) });
}
