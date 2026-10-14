import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { notFound } from "@/lib/api/helpers";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const bom = store.boms.find((b) => b.id === params.id);
  if (!bom) return notFound("BOM not found");
  const lines = bom.lines.map((l) => ({ ...l, material: store.materials.find((m) => m.id === l.materialId) }));
  const productionOrders = store.productionOrders.filter((o) => o.bomId === bom.id);
  return NextResponse.json({ bom, lines, productionOrders });
}
