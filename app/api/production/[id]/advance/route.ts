import { NextResponse } from "next/server";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import { advanceStage } from "@/lib/domain/production";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const perm = requirePermission("production.manage");
  if (!perm.ok) return perm.response;
  const body = await req.json().catch(() => ({}));
  const result = advanceStage(params.id, perm.actor.user, body.note);
  if (!result.ok) return badRequest(result.error ?? "Could not advance stage");
  return NextResponse.json({ ok: true, order: result.order });
}
