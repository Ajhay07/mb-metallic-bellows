import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results: { type: string; id: string; label: string; sublabel: string; href: string }[] = [];

  for (const m of store.materials) {
    if (m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)) {
      results.push({ type: "Material", id: m.id, label: m.code, sublabel: m.name, href: `/materials/${m.id}` });
    }
  }
  for (const s of store.suppliers) {
    if (s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) {
      results.push({ type: "Supplier", id: s.id, label: s.name, sublabel: s.location, href: `/suppliers/${s.id}` });
    }
  }
  for (const pr of store.requisitions) {
    if (pr.prNumber.toLowerCase().includes(q) || pr.title.toLowerCase().includes(q)) {
      results.push({ type: "Requisition", id: pr.id, label: pr.prNumber, sublabel: pr.title, href: `/procurement/requisitions/${pr.id}` });
    }
  }
  for (const po of store.purchaseOrders) {
    if (po.poNumber.toLowerCase().includes(q)) {
      const supplier = store.suppliers.find((s) => s.id === po.supplierId);
      results.push({ type: "Purchase Order", id: po.id, label: po.poNumber, sublabel: supplier?.name ?? "", href: `/procurement/purchase-orders/${po.id}` });
    }
  }
  for (const wo of store.productionOrders) {
    if (wo.woNumber.toLowerCase().includes(q) || wo.customer.toLowerCase().includes(q) || wo.salesOrderRef.toLowerCase().includes(q)) {
      results.push({ type: "Production Order", id: wo.id, label: wo.woNumber, sublabel: wo.customer, href: `/production/${wo.id}` });
    }
  }

  return NextResponse.json({ results: results.slice(0, 20) });
}
