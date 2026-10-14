import { NextResponse } from "next/server";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import { transitionPO } from "@/lib/domain/workflow";
import type { POStatus } from "@/lib/types";

const APPROVAL_TARGETS: POStatus[] = ["Approved", "Rejected"];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const to = body.to as POStatus;
  if (!to) return badRequest("Provide a target status 'to'.");

  const permission = APPROVAL_TARGETS.includes(to) ? "po.approve" : "po.create";
  const perm = requirePermission(permission);
  if (!perm.ok) return perm.response;

  const result = transitionPO(params.id, to, perm.actor, body.comment);
  if (!result.ok) return badRequest(result.error ?? "Transition failed");
  return NextResponse.json({ ok: true, purchaseOrder: result.entity });
}
