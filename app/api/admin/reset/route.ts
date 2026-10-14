import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api/helpers";
import { resetStore } from "@/lib/data/store";
import { reseedAutomationAfterReset } from "@/lib/automation/bootstrap";

// Demo-only convenience: re-seeds the in-memory store back to lib/data/seed.ts
// and regenerates the same automation run a fresh server boot would produce.
// This is NOT a database reset — there is nothing persisted to reset. It
// exists so a demo presenter can get back to a clean starting point without
// restarting the Node process. Administrator-only, and irreversible for
// anything created or changed in the current session.
export async function POST() {
  const perm = requirePermission("demo.reset");
  if (!perm.ok) return perm.response;

  resetStore();
  reseedAutomationAfterReset();

  return NextResponse.json({ ok: true, resetAt: new Date().toISOString() });
}
