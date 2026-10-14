import { NextResponse } from "next/server";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import { holdOrder, resumeOrder } from "@/lib/domain/production";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const perm = requirePermission("production.manage");
  if (!perm.ok) return perm.response;
  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason ?? "").trim();
  if (!reason) return badRequest("Provide a 'reason' for the hold.");
  const result = holdOrder(params.id, reason);
  if (!result.ok) return badRequest(result.error ?? "Could not hold order");
  return NextResponse.json({ ok: true, order: result.order });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const perm = requirePermission("production.manage");
  if (!perm.ok) return perm.response;
  const result = resumeOrder(params.id);
  if (!result.ok) return badRequest(result.error ?? "Could not resume order");
  return NextResponse.json({ ok: true, order: result.order });
}
