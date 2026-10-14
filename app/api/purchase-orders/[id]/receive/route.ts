import { NextResponse } from "next/server";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import { receiveGoods } from "@/lib/domain/workflow";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const perm = requirePermission("po.receive");
  if (!perm.ok) return perm.response;

  const body = await req.json().catch(() => ({}));
  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (lines.length === 0) return badRequest("Provide at least one line to receive.");

  const result = receiveGoods(params.id, lines, perm.actor);
  if (!result.ok) return badRequest(result.error ?? "Receipt failed");
  return NextResponse.json({ ok: true, purchaseOrder: result.entity });
}
