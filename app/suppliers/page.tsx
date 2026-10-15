"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import { formatNumber } from "@/lib/format";
import type { Supplier } from "@/lib/types";

interface SupplierRow extends Supplier {
  riskScore: number;
  riskBand: string;
}

const RISK_STYLES: Record<string, string> = {
  Low: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Moderate: "border-steel-300 bg-steel-50 text-steel-700",
  Elevated: "border-amber-300 bg-amber-50 text-amber-800",
  High: "border-red-300 bg-red-50 text-red-700",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers))
      .catch(() => setError("Could not load suppliers."));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!suppliers) return <LoadingState label="Loading supplier directory…" />;

  return (
    <div>
      <PageHeader breadcrumb={["Suppliers"]} title="Supplier Directory" description="On-time %, rejection rate and the demo risk score are all computed live from purchase order history — see each supplier's profile for the full calculation." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((s) => (
          <Link key={s.id} href={`/suppliers/${s.id}`} className="panel flex flex-col gap-3 p-4 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-graphite-900">{s.name}</div>
                <div className="text-xs text-graphite-500">{s.code} · {s.location}</div>
              </div>
              <span className={`badge ${RISK_STYLES[s.riskBand]}`}>{s.riskBand} risk ({s.riskScore})</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-base font-semibold text-graphite-900">{s.onTimeDeliveryPct}%</div>
                <div className="text-graphite-500">On-time</div>
              </div>
              <div>
                <div className="text-base font-semibold text-graphite-900">{s.rejectionRatePct}%</div>
                <div className="text-graphite-500">Rejection</div>
              </div>
              <div>
                <div className="text-base font-semibold text-graphite-900">{s.totalOrders}</div>
                <div className="text-graphite-500">Orders</div>
              </div>
            </div>
            <div className="border-t border-graphite-100 pt-2 text-xs text-graphite-500">Supplies: {s.materialsSupplied.length} material(s) · Lead time {formatNumber(s.materialsSupplied[0]?.leadTimeDays ?? 0)}+ days</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
