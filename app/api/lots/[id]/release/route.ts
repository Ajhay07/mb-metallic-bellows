import { NextResponse } from "next/server";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import { releaseLot } from "@/lib/domain/workflow";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const perm = requirePermission("inspection.record");
  if (!perm.ok) return perm.response;
  const result = releaseLot(params.id, perm.actor);
  if (!result.ok) return badRequest(result.error ?? "Could not release lot");
  return NextResponse.json({ ok: true });
}
