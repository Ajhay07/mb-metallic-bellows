import { NextResponse } from "next/server";
import { computeAllMaterialStock } from "@/lib/domain/stock";

export async function GET() {
  const stock = computeAllMaterialStock();
  return NextResponse.json({
    materials: stock.map((s) => ({
      ...s.material,
      onHand: s.onHand,
      quarantinedQty: s.quarantinedQty,
      availableQty: s.availableQty,
      incomingQty: s.incomingQty,
      belowReorderPoint: s.belowReorderPoint,
      belowSafetyStock: s.belowSafetyStock,
    })),
  });
}
