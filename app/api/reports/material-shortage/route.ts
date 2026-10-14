import { NextResponse } from "next/server";
import { runMRP } from "@/lib/domain/mrp";
import { toCsv } from "@/lib/domain/csv";

export async function GET(req: Request) {
  const rows = runMRP()
    .filter((l) => l.isShortage)
    .map((l) => ({
      materialCode: l.materialCode,
      materialName: l.materialName,
      uom: l.uom,
      grossRequirement: l.grossRequirement,
      availableQty: l.availableQty,
      incomingQty: l.incomingQty,
      netRequirement: l.netRequirement,
      suggestedPurchaseQty: l.suggestedPurchaseQty,
      requiredByDate: l.requiredByDate ? l.requiredByDate.slice(0, 10) : "",
      affectedProductionOrders: Array.from(new Set(l.demands.map((d) => d.productionOrder.woNumber))).join("; "),
    }));

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=material-shortage-report.csv" } });
  }
  return NextResponse.json({ rows });
}
