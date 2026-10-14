import { NextResponse } from "next/server";
import { store, nextId } from "@/lib/data/store";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import type { RequisitionLine } from "@/lib/types";

export async function GET() {
  const requisitions = [...store.requisitions].sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  return NextResponse.json({ requisitions });
}

export async function POST(req: Request) {
  const perm = requirePermission("pr.create");
  if (!perm.ok) return perm.response;

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const justification = String(body.justification ?? "").trim();
  const priority = body.priority ?? "Medium";
  const rawLines = Array.isArray(body.lines) ? body.lines : [];

  if (!title) return badRequest("Provide a title.");
  if (rawLines.length === 0) return badRequest("Add at least one line item.");

  const lines: RequisitionLine[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i];
    const material = store.materials.find((m) => m.id === l.materialId);
    if (!material) return badRequest(`Line ${i + 1}: unknown material ${l.materialId}`);
    const qty = Number(l.qty);
    if (!Number.isFinite(qty) || qty <= 0) return badRequest(`Line ${i + 1}: qty must be a positive number`);
    lines.push({ id: `PRL-${Date.now()}-${i}`, materialId: material.id, qty, uom: material.uom, neededByDate: l.neededByDate ?? new Date(Date.now() + material.leadTimeDays * 86400000).toISOString() });
  }

  const id = nextId("PR");
  store.requisitions.push({
    id,
    prNumber: id,
    title,
    requestedBy: perm.actor.user,
    requestedByRole: perm.actor.role,
    requestDate: new Date().toISOString(),
    status: "Draft",
    priority,
    lines,
    history: [{ id: `AUD-${Date.now()}`, date: new Date().toISOString(), byUser: perm.actor.user, byRole: perm.actor.role, action: "Created" }],
    justification: justification || "No justification provided.",
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
