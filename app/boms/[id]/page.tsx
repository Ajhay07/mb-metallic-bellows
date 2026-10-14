"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import { StatusBadge } from "@/components/Badges";
import { formatDateShort } from "@/lib/format";
import type { BOM, BOMLine, Material, ProductionOrder } from "@/lib/types";

interface Detail {
  bom: BOM;
  lines: (BOMLine & { material?: Material })[];
  productionOrders: ProductionOrder[];
}

export default function BomDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/boms/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("BOM not found."));
  }, [params.id]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading BOM…" />;

  const { bom, lines, productionOrders } = data;

  return (
    <div>
      <PageHeader
        title={`${bom.productCode} — ${bom.productName}`}
        description={`${bom.description} · Revision ${bom.revision}`}
        actions={<Link href="/boms" className="btn-secondary">Back to BOMs</Link>}
      />
      <div className="panel overflow-x-auto p-4">
        <h2 className="mb-2 text-sm font-semibold text-graphite-800">Components</h2>
        <table className="table-base">
          <thead><tr><th>Material</th><th>Qty / Unit</th><th>Scrap %</th><th>Stage</th></tr></thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td>{l.material ? <Link href={`/materials/${l.material.id}`} className="text-steel-700 hover:underline">{l.material.code} — {l.material.name}</Link> : l.materialId}</td>
                <td>{l.qtyPerUnit} {l.uom}</td>
                <td>{l.scrapPercent}%</td>
                <td>{l.stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 panel overflow-x-auto p-4">
        <h2 className="mb-2 text-sm font-semibold text-graphite-800">Production Orders Using This BOM</h2>
        {productionOrders.length === 0 ? (
          <p className="text-sm text-graphite-400">No production orders currently reference this BOM.</p>
        ) : (
          <table className="table-base">
            <thead><tr><th>Work Order</th><th>Customer</th><th>Qty</th><th>Status</th><th>Planned Start</th></tr></thead>
            <tbody>
              {productionOrders.map((wo) => (
                <tr key={wo.id}>
                  <td><Link href={`/production/${wo.id}`} className="text-steel-700 hover:underline">{wo.woNumber}</Link></td>
                  <td>{wo.customer}</td>
                  <td>{wo.qty}</td>
                  <td><StatusBadge status={wo.status} /></td>
                  <td>{formatDateShort(wo.plannedStart)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
