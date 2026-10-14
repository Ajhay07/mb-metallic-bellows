import { NextResponse } from "next/server";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import { convertRequisitionToPO } from "@/lib/domain/workflow";
import { store } from "@/lib/data/store";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const perm = requirePermission("po.create");
  if (!perm.ok) return perm.response;

  const body = await req.json().catch(() => ({}));
  const supplierId = String(body.supplierId ?? "");
  const expectedDeliveryDate = String(body.expectedDeliveryDate ?? "");
  const unitPrices = (body.unitPrices ?? {}) as Record<string, number>;

  if (!store.suppliers.find((s) => s.id === supplierId)) return badRequest("Select a valid supplier.");
  if (!expectedDeliveryDate) return badRequest("Provide an expected delivery date.");

  const result = convertRequisitionToPO(params.id, supplierId, unitPrices, expectedDeliveryDate, perm.actor);
  if (!result.ok) return badRequest(result.error ?? "Conversion failed");
  return NextResponse.json({ ok: true, purchaseOrder: result.entity });
}
