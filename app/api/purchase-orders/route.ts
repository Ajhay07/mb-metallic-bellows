import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import { nextId } from "@/lib/data/store";
import type { POLine } from "@/lib/types";

export async function GET() {
  const purchaseOrders = [...store.purchaseOrders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  return NextResponse.json({ purchaseOrders });
}

export async function POST(req: Request) {
  const perm = requirePermission("po.create");
  if (!perm.ok) return perm.response;

  const body = await req.json().catch(() => ({}));
  const supplierId = String(body.supplierId ?? "");
  const expectedDeliveryDate = String(body.expectedDeliveryDate ?? "");
  const rawLines = Array.isArray(body.lines) ? body.lines : [];

  if (!store.suppliers.find((s) => s.id === supplierId)) return badRequest("Select a valid supplier.");
  if (!expectedDeliveryDate) return badRequest("Provide an expected delivery date.");
  if (rawLines.length === 0) return badRequest("Add at least one line item.");

  const lines: POLine[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i];
    const material = store.materials.find((m) => m.id === l.materialId);
    if (!material) return badRequest(`Line ${i + 1}: unknown material`);
    const qty = Number(l.qty);
    const price = Number(l.unitPrice ?? material.unitCost);
    if (!Number.isFinite(qty) || qty <= 0) return badRequest(`Line ${i + 1}: qty must be positive`);
    lines.push({ id: `POL-NEW-${Date.now()}-${i}`, materialId: material.id, orderedQty: qty, uom: material.uom, unitPrice: price, receivedQty: 0, acceptedQty: 0, rejectedQty: 0 });
  }

  const id = nextId("PO");
  store.purchaseOrders.push({
    id,
    poNumber: id,
    supplierId,
    status: "Draft",
    orderDate: new Date().toISOString(),
    expectedDeliveryDate,
    lines,
    grns: [],
    history: [{ id: `AUD-${Date.now()}`, date: new Date().toISOString(), byUser: perm.actor.user, byRole: perm.actor.role, action: "PO Created" }],
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
