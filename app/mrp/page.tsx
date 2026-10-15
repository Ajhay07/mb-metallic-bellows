"use client";
import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, LoadingState, ErrorState, EmptyState } from "@/components/States";
import { formatDateShort, formatNumber } from "@/lib/format";
import { useRole } from "@/lib/client/RoleContext";
import { roleHasPermission } from "@/lib/auth/roles";

interface MRPLine {
  materialId: string;
  materialCode: string;
  materialName: string;
  uom: string;
  grossRequirement: number;
  availableQty: number;
  incomingQty: number;
  netRequirement: number;
  suggestedPurchaseQty: number;
  requiredByDate: string | null;
  isShortage: boolean;
  demands: { productionOrder: { id: string; woNumber: string; qty: number; plannedStart: string }; bomLine: { materialId: string; qtyPerUnit: number; scrapPercent: number }; grossQty: number }[];
}

function MrpInner() {
  const searchParams = useSearchParams();
  const highlightMaterial = searchParams.get("material");
  const showShortageOnly = searchParams.get("filter") === "shortage";
  const { role } = useRole();
  const [lines, setLines] = useState<MRPLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(highlightMaterial);

  useEffect(() => {
    fetch("/api/mrp").then((r) => r.json()).then((d) => setLines(d.lines)).catch(() => setError("Could not run MRP."));
  }, []);

  const visible = useMemo(() => {
    if (!lines) return [];
    return showShortageOnly ? lines.filter((l) => l.isShortage) : lines;
  }, [lines, showShortageOnly]);

  if (error) return <ErrorState message={error} />;
  if (!lines) return <LoadingState label="Running MRP netting…" />;

  return (
    <div>
      <PageHeader
        breadcrumb={["MRP"]}
        title="Material Requirements Planning (MRP)"
        description="Gross requirement = Σ (order qty × BOM qty-per-unit × (1 + scrap%)) across open production orders. Net requirement = max(0, gross − available − confirmed incoming). Suggested purchase qty rounds the net requirement up to the nearest 5 units."
      />
      {showShortageOnly && <div className="mb-3 badge border-red-300 bg-red-50 text-red-700">Showing: shortages only (net requirement &gt; 0)</div>}
      {visible.length === 0 ? (
        <EmptyState title="No open demand" description="No material currently has open production demand, or no shortages exist in the current filter." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th></th><th>Material</th><th>Gross Req.</th><th>Available</th><th>Incoming</th><th>Net Req.</th><th>Suggested Qty</th><th>Required By</th></tr>
            </thead>
            <tbody>
              {visible.map((l) => (
                <Fragment key={l.materialId}>
                  <tr className={l.isShortage ? "bg-red-50/40" : ""}>
                    <td>
                      <button onClick={() => setExpanded(expanded === l.materialId ? null : l.materialId)} className="text-xs text-steel-700 hover:underline">
                        {expanded === l.materialId ? "Hide" : "Drill down"}
                      </button>
                    </td>
                    <td><Link href={`/materials/${l.materialId}`} className="font-medium text-steel-700 hover:underline">{l.materialCode}</Link><div className="text-xs text-graphite-500">{l.materialName}</div></td>
                    <td>{formatNumber(l.grossRequirement)} {l.uom}</td>
                    <td>{formatNumber(l.availableQty)} {l.uom}</td>
                    <td>{formatNumber(l.incomingQty)} {l.uom}</td>
                    <td className={l.isShortage ? "font-semibold text-red-600" : "text-emerald-700"}>{formatNumber(l.netRequirement)} {l.uom}</td>
                    <td>{l.isShortage ? `${formatNumber(l.suggestedPurchaseQty)} ${l.uom}` : "-"}</td>
                    <td className="text-xs">{formatDateShort(l.requiredByDate)}</td>
                  </tr>
                  {expanded === l.materialId && (
                    <tr>
                      <td colSpan={8} className="bg-graphite-50 p-3">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-500">Demand breakdown (shortage → BOM → production order → stock)</div>
                        <table className="table-base">
                          <thead><tr><th>Production Order</th><th>Order Qty</th><th>Qty/Unit × (1+scrap)</th><th>Gross Qty</th><th>Planned Start</th></tr></thead>
                          <tbody>
                            {l.demands.map((d, i) => (
                              <tr key={i}>
                                <td><Link href={`/production/${d.productionOrder.id}`} className="text-steel-700 hover:underline">{d.productionOrder.woNumber}</Link></td>
                                <td>{d.productionOrder.qty}</td>
                                <td>{d.bomLine.qtyPerUnit} × {(1 + d.bomLine.scrapPercent / 100).toFixed(2)}</td>
                                <td>{formatNumber(d.grossQty)}</td>
                                <td>{formatDateShort(d.productionOrder.plannedStart)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {l.isShortage && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <span>Suggested purchase quantity: <strong>{formatNumber(l.suggestedPurchaseQty)} {l.uom}</strong></span>
                            {roleHasPermission(role, "pr.create") && (
                              <Link href="/procurement/requisitions/new" className="btn-secondary text-xs">Raise Requisition</Link>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MrpPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MrpInner />
    </Suspense>
  );
}
