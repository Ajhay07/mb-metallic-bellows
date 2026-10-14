// DEMO-ONLY session handling. There is no real authentication: the "current
// role" is just a cookie, readable and settable by anyone, purely to let the
// UI and the API route handlers demonstrate role-based behavior.
import { cookies } from "next/headers";
import { DEMO_USERS, ROLE_COOKIE, USER_COOKIE, isValidRole } from "./roles";
import type { Role } from "@/lib/types";

export function getCurrentRole(): Role {
  const value = cookies().get(ROLE_COOKIE)?.value;
  return isValidRole(value) ? value : "Administrator";
}

export function getCurrentUser(): string {
  const role = getCurrentRole();
  const custom = cookies().get(USER_COOKIE)?.value;
  return custom || DEMO_USERS[role];
}

export function getActor(): { user: string; role: Role } {
  return { user: getCurrentUser(), role: getCurrentRole() };
}
