import { NextResponse } from "next/server";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import { transitionRequisition } from "@/lib/domain/workflow";
import type { PRStatus } from "@/lib/types";

const APPROVAL_TARGETS: PRStatus[] = ["Approved", "Rejected"];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const to = body.to as PRStatus;
  if (!to) return badRequest("Provide a target status 'to'.");

  const permission = APPROVAL_TARGETS.includes(to) ? "pr.approve" : "pr.create";
  const perm = requirePermission(permission);
  if (!perm.ok) return perm.response;

  const result = transitionRequisition(params.id, to, perm.actor, body.comment);
  if (!result.ok) return badRequest(result.error ?? "Transition failed");
  return NextResponse.json({ ok: true, requisition: result.entity });
}
