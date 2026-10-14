"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import type { BOM } from "@/lib/types";

export default function BomsPage() {
  const [boms, setBoms] = useState<BOM[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/boms").then((r) => r.json()).then((d) => setBoms(d.boms)).catch(() => setError("Could not load BOMs."));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!boms) return <LoadingState label="Loading bills of material…" />;

  return (
    <div>
      <PageHeader title="Bills of Material" description="Each finished bellows product's components, quantity-per-unit, scrap allowance and the production stage that consumes them." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {boms.map((b) => (
          <Link key={b.id} href={`/boms/${b.id}`} className="panel p-4 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-graphite-900">{b.productCode}</div>
                <div className="text-sm text-graphite-600">{b.productName}</div>
              </div>
              <span className="badge border-graphite-300 bg-graphite-100 text-graphite-600">Rev {b.revision}</span>
            </div>
            <p className="mt-2 text-xs text-graphite-500">{b.description}</p>
            <p className="mt-2 text-xs font-medium text-graphite-600">{b.lines.length} component lines</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
