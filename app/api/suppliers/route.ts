import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { computeSupplierPerformance, computeSupplierRiskScore } from "@/lib/domain/supplier";

export async function GET() {
  const suppliers = store.suppliers.map((s) => {
    const perf = computeSupplierPerformance(s.id);
    const risk = computeSupplierRiskScore(s.id);
    return { ...s, onTimeDeliveryPct: perf.onTimeDeliveryPct, rejectionRatePct: perf.rejectionRatePct, totalOrders: perf.totalOrders, riskScore: risk.score, riskBand: risk.band };
  });
  return NextResponse.json({ suppliers });
}
