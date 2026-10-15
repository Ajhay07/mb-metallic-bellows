"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import { Plus, Trash2 } from "lucide-react";
import type { Material } from "@/lib/types";

interface Line {
  materialId: string;
  qty: string;
}

export default function NewRequisitionPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [justification, setJustification] = useState("");
  const [lines, setLines] = useState<Line[]>([{ materialId: "", qty: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((d) => setMaterials(d.materials));
  }, []);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    setError(null);
    if (!title.trim()) return setError("Provide a title.");
    const payloadLines = lines.filter((l) => l.materialId && Number(l.qty) > 0).map((l) => ({ materialId: l.materialId, qty: Number(l.qty) }));
    if (payloadLines.length === 0) return setError("Add at least one valid line item.");

    setBusy(true);
    try {
      const res = await fetch("/api/requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority, justification, lines: payloadLines }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not create requisition");
      router.push(`/procurement/requisitions/${d.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create requisition");
    } finally {
      setBusy(false);
    }
  }

  if (!materials) return <LoadingState label="Loading form…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader breadcrumb={["Procurement", "Requisitions", "New"]} title="New Purchase Requisition" description="Created as Draft. Submit for approval once ready." actions={<Link href="/procurement/requisitions" className="btn-secondary">Cancel</Link>} />
      <div className="panel space-y-4 p-5">
        {error && <ErrorState message={error} />}
        <div>
          <label className="mb-1 block text-xs font-medium text-graphite-600">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. SS316 Coil top-up for WO-1003/1004" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-graphite-600">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
            {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-graphite-600">Justification</label>
          <textarea value={justification} onChange={(e) => setJustification(e.target.value)} className="input" rows={3} placeholder="Why is this needed?" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-graphite-600">Line Items</label>
          <div className="space-y-2">
            {lines.map((line, i) => {
              const material = materials.find((m) => m.id === line.materialId);
              return (
                <div key={i} className="flex items-center gap-2">
                  <select value={line.materialId} onChange={(e) => updateLine(i, { materialId: e.target.value })} className="input flex-1">
                    <option value="">Select material…</option>
                    {materials.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                  </select>
                  <input value={line.qty} onChange={(e) => updateLine(i, { qty: e.target.value })} placeholder="Qty" className="input w-28" />
                  <span className="w-12 text-xs text-graphite-500">{material?.uom ?? ""}</span>
                  <button onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))} className="text-graphite-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              );
            })}
          </div>
          <button onClick={() => setLines((prev) => [...prev, { materialId: "", qty: "" }])} className="btn-secondary mt-2 text-xs"><Plus className="h-3.5 w-3.5" /> Add line</button>
        </div>
        <div className="flex justify-end gap-2 border-t border-graphite-100 pt-4">
          <button onClick={submit} disabled={busy} className="btn-primary">Create Draft Requisition</button>
        </div>
      </div>
    </div>
  );
}
