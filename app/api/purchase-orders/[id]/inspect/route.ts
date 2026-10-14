import { NextResponse } from "next/server";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import { recordInspection } from "@/lib/domain/workflow";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const perm = requirePermission("inspection.record");
  if (!perm.ok) return perm.response;

  const body = await req.json().catch(() => ({}));
  const lotId = String(body.lotId ?? "");
  const result = body.result === "failed" ? "failed" : body.result === "passed" ? "passed" : null;
  if (!lotId || !result) return badRequest("Provide 'lotId' and result ('passed' | 'failed').");

  const outcome = recordInspection(lotId, result, perm.actor.user, body.remarks);
  if (!outcome.ok) return badRequest(outcome.error ?? "Inspection failed to record");
  return NextResponse.json({ ok: true, poId: params.id });
}
