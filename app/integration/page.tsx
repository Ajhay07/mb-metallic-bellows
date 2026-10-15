"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import { StatusBadge } from "@/components/Badges";
import { formatDateTimeShort } from "@/lib/format";
import { useRole } from "@/lib/client/RoleContext";
import { roleHasPermission } from "@/lib/auth/roles";
import { UploadCloud, Plug, CheckCircle2 } from "lucide-react";
import type { ImportBatch } from "@/lib/types";

const SAMPLE_CSV = `code,reorderPoint,safetyStock,unitCost,leadTimeDays
SS304-SHEET-2MM,550,160,218,12
SS316-COIL-0.3MM,850,320,315,17
FASTENER-SET-M12,160,45,190,10
BOGUS-CODE-999,100,20,50,5`;

interface IntegrationData {
  connectionStatus: string;
  erpSystem: string;
  lastImportAt: string | null;
  importBatches: ImportBatch[];
  plannedCapabilities: string[];
}

interface PreviewRow {
  rowNumber: number;
  raw: Record<string, string>;
  errors: string[];
}

export default function IntegrationPage() {
  const { role } = useRole();
  const [data, setData] = useState<IntegrationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("upload.csv");
  const [preview, setPreview] = useState<{ rows: PreviewRow[]; validCount: number; errorCount: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [committed, setCommitted] = useState<{ applied: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch("/api/integration").then((r) => r.json()).then(setData).catch(() => setError("Could not load integration status."));
  }, []);
  useEffect(() => load(), [load]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ""));
      setPreview(null);
      setCommitted(null);
    };
    reader.readAsText(file);
  }

  function loadSample() {
    setCsvText(SAMPLE_CSV);
    setFileName("sample_material_update.csv");
    setPreview(null);
    setCommitted(null);
  }

  async function runPreview() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/integration/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "preview", csvText, fileName }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setPreview(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/integration/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "commit", csvText, fileName }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setCommitted({ applied: d.applied });
      setCsvText("");
      setPreview(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading ERP Integration Centre…" />;

  const canImport = roleHasPermission(role, "import.run");

  return (
    <div>
      <PageHeader breadcrumb={["ERP Integration"]} title="ERP Integration Centre" description="This demo runs entirely on a synthetic in-memory dataset. Nothing here is connected to a live ERP system." />

      <div className="panel mb-4 flex flex-wrap items-center gap-4 p-4">
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          <Plug className="h-4 w-4" /> {data.connectionStatus}
        </div>
        <div className="text-sm text-graphite-600">Source system: {data.erpSystem}</div>
        <div className="text-sm text-graphite-600">Last import: {data.lastImportAt ? formatDateTimeShort(data.lastImportAt) : "never"}</div>
      </div>

      <div className="panel mb-4 p-4">
        <h2 className="mb-1 text-sm font-semibold text-graphite-800">CSV Import — Material Master Update</h2>
        <p className="mb-3 text-xs text-graphite-500">
          A real, working (if intentionally simple) importer: it updates reorder point, safety stock, unit cost and lead time for <em>existing</em> material codes. Required columns: code, reorderPoint, safetyStock, unitCost, leadTimeDays.
        </p>
        {!canImport && <p className="mb-3 text-sm text-graphite-500">Role &ldquo;{role}&rdquo; cannot run imports. Switch to Procurement Manager, Store/Inventory Manager, or Administrator.</p>}
        {canImport && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary"><UploadCloud className="h-4 w-4" /> Choose CSV file</button>
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
              <button onClick={loadSample} className="btn-secondary">Load sample CSV</button>
              {fileName && csvText && <span className="text-xs text-graphite-500">{fileName}</span>}
            </div>
            {csvText && (
              <textarea value={csvText} onChange={(e) => { setCsvText(e.target.value); setPreview(null); setCommitted(null); }} rows={6} className="input font-mono text-xs" />
            )}
            {csvText && (
              <div className="flex gap-2">
                <button onClick={runPreview} disabled={busy} className="btn-secondary">Preview &amp; Validate</button>
                {preview && preview.errorCount < preview.rows.length && <button onClick={commit} disabled={busy} className="btn-primary">Commit Import</button>}
              </div>
            )}
            {error && <ErrorState message={error} />}
            {committed && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Import committed — {committed.applied} material(s) updated.
              </div>
            )}
            {preview && (
              <div className="overflow-x-auto rounded-md border border-graphite-200">
                <table className="table-base">
                  <thead><tr><th>Row</th><th>Code</th><th>Reorder Pt</th><th>Safety</th><th>Unit Cost</th><th>Lead Time</th><th>Errors</th></tr></thead>
                  <tbody>
                    {preview.rows.map((r) => (
                      <tr key={r.rowNumber} className={r.errors.length > 0 ? "bg-red-50/60" : ""}>
                        <td>{r.rowNumber}</td>
                        <td>{r.raw.code}</td>
                        <td>{r.raw.reorderPoint}</td>
                        <td>{r.raw.safetyStock}</td>
                        <td>{r.raw.unitCost}</td>
                        <td>{r.raw.leadTimeDays}</td>
                        <td className="text-xs text-red-600">{r.errors.join("; ") || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-graphite-200 bg-graphite-50 px-3 py-2 text-xs text-graphite-600">{preview.validCount} valid, {preview.errorCount} with errors, out of {preview.rows.length} rows.</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="panel mb-4 overflow-x-auto p-4">
        <h2 className="mb-2 text-sm font-semibold text-graphite-800">Import History</h2>
        <table className="table-base">
          <thead><tr><th>File</th><th>Type</th><th>Imported By</th><th>Date</th><th>Rows</th><th>Status</th></tr></thead>
          <tbody>
            {data.importBatches.map((b) => (
              <tr key={b.id}>
                <td>{b.fileName}</td>
                <td>{b.recordType}</td>
                <td>{b.importedBy}</td>
                <td className="text-xs">{formatDateTimeShort(b.importedAt)}</td>
                <td>{b.validRows}/{b.rowCount} valid</td>
                <td><StatusBadge status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel p-4">
        <h2 className="mb-2 text-sm font-semibold text-graphite-800">Planned — Not Implemented in This Demo</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-graphite-600">
          {data.plannedCapabilities.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>
    </div>
  );
}
