import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { toCsv } from "@/lib/domain/csv";
import { isOverdue } from "@/lib/domain/production";

export async function GET(req: Request) {
  const rows = store.productionOrders.map((wo) => {
    const bom = store.boms.find((b) => b.id === wo.bomId);
    return {
      woNumber: wo.woNumber,
      product: bom?.productName ?? wo.bomId,
      customer: wo.customer,
      salesOrderRef: wo.salesOrderRef,
      qty: wo.qty,
      priority: wo.priority,
      status: wo.status,
      currentStage: wo.currentStage,
      plannedStart: wo.plannedStart.slice(0, 10),
      plannedEnd: wo.plannedEnd.slice(0, 10),
      actualStart: wo.actualStart ? wo.actualStart.slice(0, 10) : "",
      actualEnd: wo.actualEnd ? wo.actualEnd.slice(0, 10) : "",
      overdue: isOverdue(wo) ? "Yes" : "No",
      delayReason: wo.delayReason ?? "",
    };
  });

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=production-status-report.csv" } });
  }
  return NextResponse.json({ rows });
}
