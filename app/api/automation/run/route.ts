import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api/helpers";
import { runAllRules } from "@/lib/automation/rules";
import "@/lib/automation/bootstrap";

export async function POST() {
  const perm = requirePermission("automation.run");
  if (!perm.ok) return perm.response;
  const record = runAllRules(perm.actor.user);
  return NextResponse.json({ ok: true, run: record });
}
