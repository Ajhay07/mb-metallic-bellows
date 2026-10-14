import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { requirePermission, badRequest, notFound } from "@/lib/api/helpers";
import type { ExceptionStatus } from "@/lib/types";

const VALID: ExceptionStatus[] = ["Open", "Acknowledged", "Resolved", "Dismissed"];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const perm = requirePermission("exceptions.manage");
  if (!perm.ok) return perm.response;

  const exc = store.exceptions.find((e) => e.id === params.id);
  if (!exc) return notFound("Exception not found");

  const body = await req.json().catch(() => ({}));
  const status = body.status as ExceptionStatus;
  if (!VALID.includes(status)) return badRequest("Invalid status.");
  if ((status === "Dismissed") && !String(body.reason ?? "").trim()) {
    return badRequest("Provide a reason when dismissing an exception.");
  }

  exc.status = status;
  exc.statusReason = status === "Dismissed" ? body.reason : undefined;
  exc.updatedAt = new Date().toISOString();
  exc.history.push({
    id: `AUD-${Date.now()}`,
    date: new Date().toISOString(),
    byUser: perm.actor.user,
    byRole: perm.actor.role,
    action: `Status changed to ${status}`,
    comment: body.reason,
  });

  return NextResponse.json({ ok: true, exception: exc });
}
