"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, LoadingState, ErrorState, EmptyState } from "@/components/States";
import { formatNumber } from "@/lib/format";
import type { Material } from "@/lib/types";

interface MaterialRow extends Material {
  onHand: number;
  quarantinedQty: number;
  availableQty: number;
  incomingQty: number;
  belowReorderPoint: boolean;
  belowSafetyStock: boolean;
}

function MaterialsInner() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const [materials, setMaterials] = useState<MaterialRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((d) => setMaterials(d.materials))
      .catch(() => setError("Could not load materials."));
  }, []);

  const filtered = useMemo(() => {
    if (!materials) return [];
    let rows = materials;
    if (filter === "belowReorder") rows = rows.filter((m) => m.belowReorderPoint);
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((m) => m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
    }
    return rows;
  }, [materials, filter, query]);

  if (error) return <ErrorState message={error} />;
  if (!materials) return <LoadingState label="Loading material master…" />;

  return (
    <div>
      <PageHeader
        title="Materials & Inventory"
        description="Material master with live stock math: available = on-hand − reserved − quarantined. Incoming is the outstanding quantity on open purchase orders."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by code, name or category…" className="input max-w-xs" />
        {filter === "belowReorder" && <span className="badge border-amber-300 bg-amber-50 text-amber-800">Showing: below reorder point</span>}
        {filter === "pendingInspection" && <span className="badge border-amber-300 bg-amber-50 text-amber-800">Showing: pending inspection — see each material&rsquo;s lots</span>}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No materials match this view" description="Try clearing the filter or search." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>UoM</th>
                <th>On Hand</th>
                <th>Reserved</th>
                <th>Quarantined</th>
                <th>Available</th>
                <th>Incoming</th>
                <th>Reorder Pt</th>
                <th>Safety Stock</th>
                <th>Location</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td><Link href={`/materials/${m.id}`} className="font-medium text-steel-700 hover:underline">{m.code}</Link></td>
                  <td>{m.name}</td>
                  <td className="text-xs text-graphite-500">{m.category}</td>
                  <td>{m.uom}</td>
                  <td>{formatNumber(m.onHand)}</td>
                  <td>{formatNumber(m.reservedQty)}</td>
                  <td className={m.quarantinedQty > 0 ? "font-medium text-amber-700" : ""}>{formatNumber(m.quarantinedQty)}</td>
                  <td className="font-medium">{formatNumber(m.availableQty)}</td>
                  <td>{formatNumber(m.incomingQty)}</td>
                  <td>{formatNumber(m.reorderPoint)}</td>
                  <td>{formatNumber(m.safetyStock)}</td>
                  <td className="text-xs">{m.warehouse} / {m.bin}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {m.belowReorderPoint && <span className="badge border-red-300 bg-red-50 text-red-700">Below Reorder</span>}
                      {m.quarantinedQty > 0 && <span className="badge border-amber-300 bg-amber-50 text-amber-800">Quarantine Hold</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MaterialsInner />
    </Suspense>
  );
}
