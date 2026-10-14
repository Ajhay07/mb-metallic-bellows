import { NextResponse } from "next/server";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import { quarantineLot } from "@/lib/domain/workflow";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const perm = requirePermission("inspection.record");
  if (!perm.ok) return perm.response;
  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason ?? "").trim();
  if (!reason) return badRequest("Provide a 'reason' for the quarantine hold.");
  const result = quarantineLot(params.id, reason, perm.actor);
  if (!result.ok) return badRequest(result.error ?? "Could not quarantine lot");
  return NextResponse.json({ ok: true });
}
