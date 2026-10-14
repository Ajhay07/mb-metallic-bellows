import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { requirePermission, badRequest, notFound } from "@/lib/api/helpers";
import { recordMovement } from "@/lib/domain/stock";

// Simplified cycle-count / stock adjustment endpoint. Applies a signed delta
// qty to the first available lot (creating one if none exists) and logs an
// "adjustment" ledger entry. Negative stock is never allowed.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const perm = requirePermission("inventory.adjust");
  if (!perm.ok) return perm.response;

  const material = store.materials.find((m) => m.id === params.id);
  if (!material) return notFound("Material not found");

  const body = await req.json().catch(() => ({}));
  const delta = Number(body.delta);
  const reason = String(body.reason ?? "").trim();
  if (!Number.isFinite(delta) || delta === 0) return badRequest("Provide a non-zero numeric 'delta'.");
  if (!reason) return badRequest("Provide a 'reason' for the adjustment.");

  let lot = store.stockLots.find((l) => l.materialId === material.id && l.status === "available");
  if (!lot) {
    if (delta < 0) return badRequest("No available lot to reduce.");
    lot = {
      id: `LOT-ADJ-${Date.now()}`,
      materialId: material.id,
      lotNumber: `ADJ-${Date.now()}`,
      qty: 0,
      originalQty: 0,
      warehouse: material.warehouse,
      bin: material.bin,
      status: "available",
      inspectionStatus: "not_required",
      receivedDate: new Date().toISOString(),
    };
    store.stockLots.push(lot);
  }

  const newQty = lot.qty + delta;
  if (newQty < 0) return badRequest(`Adjustment would take lot ${lot.lotNumber} below zero (currently ${lot.qty}).`);

  lot.qty = newQty;
  lot.originalQty = Math.max(lot.originalQty, newQty);
  recordMovement({ materialId: material.id, lotId: lot.id, type: "adjustment", qty: delta, reference: "Manual Adjustment", performedBy: perm.actor.user, note: reason });

  return NextResponse.json({ ok: true });
}
