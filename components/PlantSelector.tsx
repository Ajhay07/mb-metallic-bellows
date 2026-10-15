"use client";
import { useState } from "react";
import { ChevronDown, Factory } from "lucide-react";

// MB Metallic Bellows currently operates a single facility, so this is a
// single-option selector rather than a fabricated multi-plant switcher —
// it still gives the header the plant-context affordance real multi-site
// deployments of this system would need.
const PLANT = { name: "Oragadam Plant", detail: "SIPCOT Industrial Growth Centre, Tamil Nadu" };

export function PlantSelector() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-3 py-1.5 text-sm font-medium text-graphite-800 shadow-panel transition-shadow hover:bg-graphite-50 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
      >
        <Factory className="h-4 w-4 text-orange-600" />
        <span className="max-w-[9rem] truncate">{PLANT.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-graphite-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-64 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-raised)] p-2 shadow-lg">
            <div className="mb-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-graphite-400">Plant</div>
            <div className="rounded px-2 py-1.5 bg-orange-50">
              <div className="text-sm font-medium text-graphite-900">{PLANT.name}</div>
              <div className="text-xs text-[color:var(--muted-foreground)]">{PLANT.detail}</div>
            </div>
            <div className="mt-1 px-2 py-1 text-[11px] text-graphite-400">Single-site demo — multi-plant switching isn&apos;t modeled yet.</div>
          </div>
        </>
      )}
    </div>
  );
}
