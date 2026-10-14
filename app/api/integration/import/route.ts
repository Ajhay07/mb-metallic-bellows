import { NextResponse } from "next/server";
import { requirePermission, badRequest } from "@/lib/api/helpers";
import { validateMaterialsImport, commitMaterialsImport } from "@/lib/domain/importer";

export async function POST(req: Request) {
  const perm = requirePermission("import.run");
  if (!perm.ok) return perm.response;

  const body = await req.json().catch(() => ({}));
  const mode = body.mode === "commit" ? "commit" : "preview";
  const csvText = String(body.csvText ?? "");
  const fileName = String(body.fileName ?? "upload.csv");

  if (!csvText.trim()) return badRequest("Provide CSV content to import.");

  if (mode === "preview") {
    const result = validateMaterialsImport(csvText);
    return NextResponse.json({ ok: true, mode, ...result });
  }

  const result = commitMaterialsImport(csvText, perm.actor.user, fileName);
  return NextResponse.json({ ok: true, mode, ...result });
}
