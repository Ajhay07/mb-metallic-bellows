"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/client/RoleContext";
import { roleHasPermission } from "@/lib/auth/roles";
import {
  LayoutDashboard,
  Boxes,
  Truck,
  ClipboardList,
  FileSpreadsheet,
  ListTree,
  Factory,
  AlertTriangle,
  Bot,
  BarChart3,
  Plug,
  RotateCcw,
} from "lucide-react";
import { Logo, BellowsMotif } from "./Logo";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  matchPrefix?: string;
}

// Note: the reference also lists "Quality Control" and "Settings" as nav
// entries. Neither exists as a route in this app — QC lives inside the
// Purchase Order inspection workflow and the Materials lot table, and there
// is no settings module. Adding nav links to pages that don't exist would
// violate "preserve existing functionality," so they're left out rather
// than faked.
const NAV: NavItem[] = [
  { label: "Command Centre", href: "/", icon: LayoutDashboard },
  { label: "Materials & Inventory", href: "/materials", icon: Boxes },
  { label: "Suppliers", href: "/suppliers", icon: Truck },
  { label: "Requisitions", href: "/procurement/requisitions", icon: ClipboardList, matchPrefix: "/procurement/requisitions" },
  { label: "Purchase Orders", href: "/procurement/purchase-orders", icon: FileSpreadsheet, matchPrefix: "/procurement/purchase-orders" },
  { label: "Bills of Material", href: "/boms", icon: ListTree },
  { label: "MRP", href: "/mrp", icon: ListTree },
  { label: "Production", href: "/production", icon: Factory },
  { label: "Exceptions Inbox", href: "/exceptions", icon: AlertTriangle },
  { label: "Automation Centre", href: "/automation", icon: Bot },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "ERP Integration", href: "/integration", icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();
  const canReset = roleHasPermission(role, "demo.reset");
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [openExceptions, setOpenExceptions] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/exceptions")
      .then((r) => r.json())
      .then((data) => {
        const open = (data.exceptions ?? []).filter((e: { status: string }) => e.status === "Open" || e.status === "Acknowledged");
        setOpenExceptions(open.length);
      })
      .catch(() => setOpenExceptions(null));
  }, []);

  async function resetDemoData() {
    if (!confirm("Reset all demo data back to the original seed? Everything created or changed this session (requisitions, POs, production progress, exceptions) will be lost. This cannot be undone.")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Reset failed.");
        return;
      }
      setResetDone(true);
      // Full reload so every open page re-fetches fresh seed data instead of
      // showing stale client state from before the reset.
      window.location.reload();
    } finally {
      setResetting(false);
    }
  }

  return (
    <aside className="hidden w-[264px] shrink-0 flex-col border-r border-[color:var(--border)] bg-[color:var(--surface-raised)] md:flex">
      <div className="border-b border-[color:var(--border)] px-4 py-3.5">
        <Logo />
        <div className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
          Precision Bellows &amp; Expansion Joints
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map((item, i) => {
          const active = item.matchPrefix ? pathname.startsWith(item.matchPrefix) : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2.5 rounded-md py-2 pl-2.5 pr-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-[color:var(--border-strong)] text-white before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-orange-500 before:content-['']"
                  : "text-graphite-600 hover:bg-graphite-100 hover:text-graphite-900"
              }`}
            >
              <span className={`font-mono text-[10px] tabular-nums ${active ? "text-orange-400" : "text-graphite-400"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${active ? "bg-orange-500 text-white" : "text-graphite-400"}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.href === "/exceptions" && !!openExceptions && (
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${active ? "bg-white text-graphite-900" : "bg-red-100 text-red-700"}`}>
                  {openExceptions}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="relative mx-3 mb-3 overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--border-strong)]">
        <BellowsMotif className="absolute -bottom-8 left-1/2 h-32 w-[300px] -translate-x-1/2 text-white/10" />
        <div className="relative px-3.5 py-4">
          <div className="text-[13px] font-extrabold uppercase leading-tight tracking-wide text-white">
            Engineered for
            <br />
            Zero-Leak Precision
          </div>
          <div className="mt-1.5 h-[3px] w-8 bg-orange-500" />
          <div className="mt-2 text-[10px] font-medium uppercase tracking-wider text-white/50">SIPCOT · Oragadam, Tamil Nadu</div>
        </div>
      </div>

      <div className="border-t border-[color:var(--border)] p-3">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800">
          <span className="font-semibold">DEMO DATA MODE</span> — synthetic dataset, no live ERP connection. In-memory
          only: a server restart already resets it.
        </div>
        {canReset && (
          <button
            onClick={resetDemoData}
            disabled={resetting}
            className="btn-secondary mt-2 w-full justify-center text-xs"
            title="Re-seed the in-memory demo dataset, discarding everything changed this session"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {resetting ? "Resetting…" : resetDone ? "Reset — reloading…" : "Reset Demo Data"}
          </button>
        )}
      </div>
    </aside>
  );
}
