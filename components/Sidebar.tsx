"use client";
import { useState } from "react";
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
import { Logo } from "./Logo";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  matchPrefix?: string;
}

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
    <aside className="hidden w-64 shrink-0 flex-col border-r border-graphite-200 bg-white md:flex">
      <div className="flex h-16 items-center border-b border-graphite-200 px-4">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map((item) => {
          const active = item.matchPrefix ? pathname.startsWith(item.matchPrefix) : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-steel-50 text-steel-700" : "text-graphite-600 hover:bg-graphite-100 hover:text-graphite-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-graphite-200 p-3">
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
