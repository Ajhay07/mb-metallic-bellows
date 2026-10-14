import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { computeMaterialStock, getLotsForMaterial, getMovementsForMaterial } from "@/lib/domain/stock";
import { getMRPLineForMaterial } from "@/lib/domain/mrp";
import { notFound } from "@/lib/api/helpers";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const material = store.materials.find((m) => m.id === params.id);
  if (!material) return notFound("Material not found");
  const stock = computeMaterialStock(params.id);
  const lots = getLotsForMaterial(params.id);
  const movements = getMovementsForMaterial(params.id);
  const mrpLine = getMRPLineForMaterial(params.id);
  const supplier = store.suppliers.find((s) => s.id === material.primarySupplierId);
  return NextResponse.json({ material, stock, lots, movements, mrpLine, supplier });
}
