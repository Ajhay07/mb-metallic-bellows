import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { computeSupplierPerformance, computeSupplierRiskScore } from "@/lib/domain/supplier";
import { toCsv } from "@/lib/domain/csv";

export async function GET(req: Request) {
  const rows = store.suppliers.map((s) => {
    const perf = computeSupplierPerformance(s.id);
    const risk = computeSupplierRiskScore(s.id);
    return {
      supplierCode: s.code,
      supplierName: s.name,
      totalOrders: perf.totalOrders,
      onTimeDeliveryPct: perf.onTimeDeliveryPct,
      recentOnTimeDeliveryPct: perf.recentOnTimeDeliveryPct,
      rejectionRatePct: perf.rejectionRatePct,
      openOverdueOrders: perf.openOverdueCount,
      riskScore: risk.score,
      riskBand: risk.band,
    };
  });

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=supplier-performance-report.csv" } });
  }
  return NextResponse.json({ rows });
}
