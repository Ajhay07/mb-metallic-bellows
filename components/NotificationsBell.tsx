"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { SeverityBadge } from "./Badges";
import type { ExceptionItem } from "@/lib/types";

export function NotificationsBell() {
  const [items, setItems] = useState<ExceptionItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exceptions")
      .then((r) => r.json())
      .then((data) => {
        const open = (data.exceptions ?? []).filter((e: ExceptionItem) => e.status === "Open" || e.status === "Acknowledged");
        setItems(open.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  const count = items.length;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-md border border-graphite-300 bg-[color:var(--surface-raised)] p-2 text-graphite-600 shadow-panel transition-shadow hover:bg-graphite-50 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel-500 focus-visible:ring-offset-1" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        {!loading && count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">{count}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-96 overflow-hidden rounded-md border border-graphite-200 bg-[color:var(--surface-raised)] shadow-lg">
            <div className="border-b border-graphite-100 px-3 py-2 text-sm font-semibold text-graphite-800">Open exceptions</div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && <div className="px-3 py-4 text-sm text-graphite-500">No open exceptions right now.</div>}
              {items.map((e) => (
                <Link key={e.id} href="/exceptions" onClick={() => setOpen(false)} className="flex flex-col gap-1 border-b border-graphite-100 px-3 py-2 last:border-0 hover:bg-graphite-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-graphite-900">{e.title}</span>
                    <SeverityBadge severity={e.severity} />
                  </div>
                  <span className="text-xs text-graphite-500">{e.category} · {e.owner}</span>
                </Link>
              ))}
            </div>
            <Link href="/exceptions" onClick={() => setOpen(false)} className="block border-t border-graphite-100 px-3 py-2 text-center text-sm font-medium text-steel-700 hover:bg-graphite-50">
              View all exceptions
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
