import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { notFound } from "@/lib/api/helpers";
import { PO_TRANSITIONS } from "@/lib/domain/workflow";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const po = store.purchaseOrders.find((p) => p.id === params.id);
  if (!po) return notFound("Purchase order not found");
  const supplier = store.suppliers.find((s) => s.id === po.supplierId);
  const lines = po.lines.map((l) => ({ ...l, material: store.materials.find((m) => m.id === l.materialId) }));
  const overdue = ["Ordered", "Partially Received"].includes(po.status) && new Date(po.expectedDeliveryDate).getTime() < Date.now();
  const lots = store.stockLots.filter((l) => l.sourcePoId === po.id);
  return NextResponse.json({ purchaseOrder: po, supplier, lines, overdue, lots, allowedTransitions: PO_TRANSITIONS[po.status] ?? [] });
}
