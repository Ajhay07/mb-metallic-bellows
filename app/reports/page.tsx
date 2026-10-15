import Link from "next/link";
import { FileSpreadsheet, AlertTriangle, Factory, Truck } from "lucide-react";
import { PageHeader } from "@/components/States";

const REPORTS = [
  { href: "/reports/purchase-register", title: "Purchase Register", description: "Every purchase order line: supplier, material, quantities, price, line value and status.", icon: FileSpreadsheet },
  { href: "/reports/material-shortage", title: "Material Shortage Report", description: "Materials with a net MRP shortfall: gross/available/incoming/net, suggested purchase qty and affected production orders.", icon: AlertTriangle },
  { href: "/reports/production-status", title: "Production Status Report", description: "Every production order's stage, status, planned vs. actual dates, and delay reason.", icon: Factory },
  { href: "/reports/supplier-performance", title: "Supplier Performance Report", description: "On-time delivery %, rejection rate, open overdue orders and the demo risk score per supplier.", icon: Truck },
];

export default function ReportsIndexPage() {
  return (
    <div>
      <PageHeader breadcrumb={["Reports"]} title="Reports" description="Real tables derived from the live dataset — every report supports CSV export and a print-friendly view. No invented figures." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href} className="panel flex items-start gap-3 p-4 hover:shadow-md">
            <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-steel-600" />
            <div>
              <div className="font-semibold text-graphite-900">{r.title}</div>
              <p className="mt-1 text-sm text-graphite-500">{r.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
