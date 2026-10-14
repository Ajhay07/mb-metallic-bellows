"use client";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Logo } from "./Logo";
import { useRole } from "@/lib/client/RoleContext";
import { ROLE_DESCRIPTIONS } from "@/lib/auth/roles";
import type { Role } from "@/lib/types";

const SESSION_FLAG = "mb_entry_seen";

// A minimal, clearly-labelled demo entry screen so the app doesn't silently
// drop every visitor into the dashboard as a full-access Administrator with
// no "who are you" moment. This is still demo-only role selection, not real
// authentication (see RoleSwitcher / lib/auth/session.ts) — it just makes
// that explicit and gives the demo a proper front door. Shown once per
// browser tab session; the in-app role switcher remains the way to change
// roles afterwards.
export function EntryScreen() {
  const { role, roles, setRole, loading } = useRole();
  const [dismissed, setDismissed] = useState(true); // default true until we can check sessionStorage
  const [entering, setEntering] = useState<Role | null>(null);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(SESSION_FLAG)) setDismissed(false);
    } catch {
      // Private browsing / blocked storage: fall back to not gating at all.
      setDismissed(true);
    }
  }, []);

  function enter(mark = true) {
    try {
      if (mark) sessionStorage.setItem(SESSION_FLAG, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (dismissed || loading) return null;

  async function choose(r: Role) {
    setEntering(r);
    await setRole(r);
    enter();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-950/70 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-graphite-200 bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-graphite-200 px-6 py-5">
          <Logo />
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            DEMO DATA MODE
          </span>
        </div>
        <div className="px-6 py-5">
          <h1 className="text-lg font-semibold text-graphite-900">Operations Management System — Demo</h1>
          <p className="mt-1.5 text-sm text-graphite-600">
            This is a synthetic-data demo for MB Metallic Bellows Pvt. Ltd. There is no real login here — choose a
            role to continue, and every screen and API call will enforce exactly what that role is permitted to do.
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-md border border-graphite-200 bg-graphite-50 p-3 text-xs text-graphite-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-steel-600" />
            <span>
              Nothing you do here touches a real system. Data lives only in server memory for this demo session and
              resets whenever the server restarts — see the README for details.
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => choose(r)}
                disabled={entering !== null}
                className={`flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition-colors disabled:cursor-wait disabled:opacity-60 ${
                  r === role ? "border-steel-400 bg-steel-50" : "border-graphite-200 hover:border-steel-300 hover:bg-steel-50/40"
                }`}
              >
                <span className="text-sm font-medium text-graphite-900">{entering === r ? "Entering…" : r}</span>
                <span className="text-xs text-graphite-500">{ROLE_DESCRIPTIONS[r]}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-graphite-100 pt-4">
            <p className="text-[11px] text-graphite-400">You can switch roles anytime from the user menu, top-right.</p>
            <button onClick={() => enter()} className="btn-secondary text-xs">
              Continue as {role}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
