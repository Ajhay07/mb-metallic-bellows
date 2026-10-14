import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ROLE_COOKIE, ROLES, DEMO_USERS, isValidRole } from "@/lib/auth/roles";
import { getCurrentRole, getCurrentUser } from "@/lib/auth/session";
import type { Role } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ role: getCurrentRole(), user: getCurrentUser(), roles: ROLES, users: DEMO_USERS });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!isValidRole(body.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  const role = body.role as Role;
  cookies().set(ROLE_COOKIE, role, { path: "/", sameSite: "lax" });
  return NextResponse.json({ role, user: DEMO_USERS[role] });
}
