import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { computeSupplierPerformance, computeSupplierRiskScore, getSupplierPOs } from "@/lib/domain/supplier";
import { notFound } from "@/lib/api/helpers";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supplier = store.suppliers.find((s) => s.id === params.id);
  if (!supplier) return notFound("Supplier not found");
  const performance = computeSupplierPerformance(params.id);
  const risk = computeSupplierRiskScore(params.id);
  const purchaseOrders = getSupplierPOs(params.id);
  const materials = supplier.materialsSupplied.map((link) => ({
    ...link,
    material: store.materials.find((m) => m.id === link.materialId),
  }));
  const supplierWithLiveStats = { ...supplier, onTimeDeliveryPct: performance.onTimeDeliveryPct, rejectionRatePct: performance.rejectionRatePct, totalOrders: performance.totalOrders };
  return NextResponse.json({ supplier: supplierWithLiveStats, performance, risk, purchaseOrders, materials });
}
