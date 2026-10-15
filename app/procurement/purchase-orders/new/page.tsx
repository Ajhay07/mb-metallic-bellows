"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import type { Material, Supplier } from "@/lib/types";

interface Line {
  materialId: string;
  qty: string;
  unitPrice: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [lines, setLines] = useState<Line[]>([{ materialId: "", qty: "", unitPrice: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/materials").then((r) => r.json()), fetch("/api/suppliers").then((r) => r.json())]).then(([m, s]) => {
      setMaterials(m.materials);
      setSuppliers(s.suppliers);
    });
  }, []);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    setError(null);
    if (!supplierId) return setError("Select a supplier.");
    if (!expectedDate) return setError("Provide an expected delivery date.");
    const payloadLines = lines.filter((l) => l.materialId && Number(l.qty) > 0).map((l) => ({ materialId: l.materialId, qty: Number(l.qty), unitPrice: l.unitPrice ? Number(l.unitPrice) : undefined }));
    if (payloadLines.length === 0) return setError("Add at least one valid line item.");

    setBusy(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, expectedDeliveryDate: new Date(expectedDate).toISOString(), lines: payloadLines }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not create purchase order");
      router.push(`/procurement/purchase-orders/${d.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create purchase order");
    } finally {
      setBusy(false);
    }
  }

  if (!materials) return <LoadingState label="Loading form…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader breadcrumb={["Procurement", "Purchase Orders", "New"]} title="New Purchase Order" description="Created as Draft — route it through Pending Approval → Approved → Ordered from the detail page." actions={<Link href="/procurement/purchase-orders" className="btn-secondary">Cancel</Link>} />
      <div className="panel space-y-4 p-5">
        {error && <ErrorState message={error} />}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite-600">Supplier</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input">
              <option value="">Select supplier…</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite-600">Expected Delivery Date</label>
            <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="input" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-graphite-600">Line Items</label>
          <div className="space-y-2">
            {lines.map((line, i) => {
              const material = materials.find((m) => m.id === line.materialId);
              return (
                <div key={i} className="flex items-center gap-2">
                  <select value={line.materialId} onChange={(e) => updateLine(i, { materialId: e.target.value, unitPrice: String(materials.find((m) => m.id === e.target.value)?.unitCost ?? "") })} className="input flex-1">
                    <option value="">Select material…</option>
                    {materials.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                  </select>
                  <input value={line.qty} onChange={(e) => updateLine(i, { qty: e.target.value })} placeholder="Qty" className="input w-24" />
                  <span className="w-10 text-xs text-graphite-500">{material?.uom ?? ""}</span>
                  <input value={line.unitPrice} onChange={(e) => updateLine(i, { unitPrice: e.target.value })} placeholder="Unit ₹" className="input w-28" />
                  <button onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))} className="text-graphite-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              );
            })}
          </div>
          <button onClick={() => setLines((prev) => [...prev, { materialId: "", qty: "", unitPrice: "" }])} className="btn-secondary mt-2 text-xs"><Plus className="h-3.5 w-3.5" /> Add line</button>
        </div>
        <div className="flex justify-end gap-2 border-t border-graphite-100 pt-4">
          <button onClick={submit} disabled={busy} className="btn-primary">Create Draft PO</button>
        </div>
      </div>
    </div>
  );
}
