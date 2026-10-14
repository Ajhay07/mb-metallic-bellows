import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { toCsv } from "@/lib/domain/csv";

export async function GET(req: Request) {
  const rows = store.purchaseOrders.flatMap((po) => {
    const supplier = store.suppliers.find((s) => s.id === po.supplierId);
    return po.lines.map((line) => {
      const material = store.materials.find((m) => m.id === line.materialId);
      return {
        poNumber: po.poNumber,
        supplier: supplier?.name ?? po.supplierId,
        materialCode: material?.code ?? line.materialId,
        materialName: material?.name ?? "",
        orderedQty: line.orderedQty,
        uom: line.uom,
        unitPrice: line.unitPrice,
        lineValue: Math.round(line.orderedQty * line.unitPrice),
        receivedQty: line.receivedQty,
        acceptedQty: line.acceptedQty,
        rejectedQty: line.rejectedQty,
        status: po.status,
        orderDate: po.orderDate.slice(0, 10),
        expectedDeliveryDate: po.expectedDeliveryDate.slice(0, 10),
      };
    });
  });

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=purchase-register.csv" } });
  }
  return NextResponse.json({ rows });
}
