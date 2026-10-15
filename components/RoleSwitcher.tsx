"use client";
import { useState } from "react";
import { ChevronDown, UserCircle2 } from "lucide-react";
import { useRole } from "@/lib/client/RoleContext";
import { ROLE_DESCRIPTIONS } from "@/lib/auth/roles";
import type { Role } from "@/lib/types";

export function RoleSwitcher() {
  const { role, user, roles, setRole, loading } = useRole();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-graphite-300 bg-[color:var(--surface-raised)] px-3 py-1.5 text-sm font-medium text-graphite-800 shadow-panel transition-shadow hover:bg-graphite-50 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel-500 focus-visible:ring-offset-1"
      >
        <UserCircle2 className="h-4 w-4 text-graphite-400" />
        <span className="hidden sm:inline">{loading ? "Loading…" : `${user} · ${role}`}</span>
        <span className="sm:hidden">{role}</span>
        <ChevronDown className="h-3.5 w-3.5 text-graphite-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-80 rounded-md border border-graphite-200 bg-[color:var(--surface-raised)] p-2 shadow-lg">
            <div className="mb-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-graphite-400">Demo role switcher — not real authentication</div>
            {roles.map((r: Role) => (
              <button
                key={r}
                onClick={async () => {
                  await setRole(r);
                  setOpen(false);
                }}
                className={`flex w-full flex-col items-start gap-0.5 rounded px-2 py-1.5 text-left text-sm hover:bg-graphite-50 ${r === role ? "bg-steel-50" : ""}`}
              >
                <span className="font-medium text-graphite-900">{r}</span>
                <span className="text-xs text-graphite-500">{ROLE_DESCRIPTIONS[r]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
