import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { notFound } from "@/lib/api/helpers";
import { PR_TRANSITIONS } from "@/lib/domain/workflow";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const pr = store.requisitions.find((p) => p.id === params.id);
  if (!pr) return notFound("Requisition not found");
  const lines = pr.lines.map((l) => ({ ...l, material: store.materials.find((m) => m.id === l.materialId) }));
  const linkedPo = pr.linkedPoId ? store.purchaseOrders.find((p) => p.id === pr.linkedPoId) : null;
  return NextResponse.json({ requisition: pr, lines, linkedPo, allowedTransitions: PR_TRANSITIONS[pr.status] ?? [] });
}
