import { NextResponse } from "next/server";
import { getActor } from "@/lib/auth/session";
import { roleHasPermission, type Permission } from "@/lib/auth/roles";

export function requirePermission(permission: Permission) {
  const actor = getActor();
  if (!roleHasPermission(actor.role, permission)) {
    return { ok: false as const, response: NextResponse.json({ error: `Role "${actor.role}" does not have permission "${permission}" in this demo's permission matrix.` }, { status: 403 }) };
  }
  return { ok: true as const, actor };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
