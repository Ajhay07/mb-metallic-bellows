import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { notFound } from "@/lib/api/helpers";
import { computeProductionReadiness, isOverdue, nextStage } from "@/lib/domain/production";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const wo = store.productionOrders.find((o) => o.id === params.id);
  if (!wo) return notFound("Production order not found");
  const bom = store.boms.find((b) => b.id === wo.bomId);
  const readiness = computeProductionReadiness(wo);
  return NextResponse.json({ order: wo, bom, readiness, overdue: isOverdue(wo), nextStage: nextStage(wo.currentStage) });
}
